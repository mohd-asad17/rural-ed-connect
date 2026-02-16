import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Plus, MessageSquare, CheckCircle, Clock, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function Doubts() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [expertResponse, setExpertResponse] = useState("");

  const load = async () => {
    if (!user) return;
    if (role === "student") {
      const { data } = await supabase
        .from("doubts")
        .select("*, courses(title)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      setDoubts(data || []);

      const { data: enrollments } = await supabase.from("enrollments").select("course_id, courses(id, title)").eq("student_id", user.id);
      setCourses((enrollments || []).map((e: any) => e.courses).filter(Boolean));
    } else {
      const { data: myCourses } = await supabase.from("courses").select("id, title").eq("educator_id", user.id);
      setCourses(myCourses || []);
      if (myCourses && myCourses.length > 0) {
        const { data } = await supabase
          .from("doubts")
          .select("*, courses(title)")
          .in("course_id", myCourses.map(c => c.id))
          .order("created_at", { ascending: false });
        setDoubts(data || []);
      }
    }
  };

  useEffect(() => { load(); }, [user, role]);

  const askDoubt = async () => {
    if (!user || !courseId || !question) return;
    setIsLoading(true);

    // Get AI response first
    let aiResponse = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
      });
      if (resp.ok && resp.body) {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) aiResponse += content;
            } catch {}
          }
        }
      }
    } catch {}

    const { error } = await supabase.from("doubts").insert({
      student_id: user.id,
      course_id: courseId,
      question,
      ai_response: aiResponse || null,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Doubt posted! AI has responded." });
      setAddOpen(false);
      setQuestion("");
      setCourseId("");
      load();
    }
  };

  const respondToDoubt = async (doubtId: string) => {
    if (!expertResponse || !user) return;
    const { error } = await supabase.from("doubts").update({
      expert_response: expertResponse,
      responded_by: user.id,
      status: "resolved",
      resolved_at: new Date().toISOString(),
    }).eq("id", doubtId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Response sent!" });
      setRespondingId(null);
      setExpertResponse("");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">
          {role === "educator" ? "Doubt Resolution" : "My Doubts"}
        </h1>
        {role === "student" && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Ask a Doubt
          </Button>
        )}
      </div>

      {doubts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {role === "student" ? "No doubts asked yet. Ask your first doubt!" : "No student doubts to review."}
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {doubts.map(d => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-secondary" />
                    <CardTitle className="font-display text-base">{d.question}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{d.courses?.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${d.status === "resolved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {d.status === "resolved" ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <Clock className="h-3 w-3 inline mr-1" />}
                      {d.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.ai_response && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">AI Response</span>
                    </div>
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{d.ai_response}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {d.expert_response && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Expert Response</span>
                    </div>
                    <p className="text-sm">{d.expert_response}</p>
                  </div>
                )}
                {role === "educator" && d.status === "open" && (
                  respondingId === d.id ? (
                    <div className="space-y-2">
                      <Textarea placeholder="Write your response..." value={expertResponse} onChange={e => setExpertResponse(e.target.value)} rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respondToDoubt(d.id)}>Send Response</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setRespondingId(d.id); setExpertResponse(""); }}>
                      <MessageSquare className="h-4 w-4 mr-2" />Respond
                    </Button>
                  )
                )}
                <p className="text-xs text-muted-foreground">{format(parseISO(d.created_at), "MMM d, yyyy h:mm a")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ask doubt dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Ask a Doubt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your Question</Label>
              <Textarea value={question} onChange={e => setQuestion(e.target.value)} rows={4} placeholder="Describe your doubt in detail..." />
            </div>
            <p className="text-xs text-muted-foreground">AI will provide an instant response. Your educator can also respond.</p>
            <Button onClick={askDoubt} disabled={isLoading || !courseId || !question}>
              {isLoading ? "Asking AI..." : "Submit Doubt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
