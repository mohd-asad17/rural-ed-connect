import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface MCQQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

export default function CreateAssignment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignmentType, setAssignmentType] = useState("mcq");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [file, setFile] = useState<File | null>(null);
  const [mcqs, setMcqs] = useState<MCQQuestion[]>([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" }]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("courses").select("id, title").eq("educator_id", user.id).then(({ data }) => setCourses(data || []));
  }, [user]);

  const addMCQ = () => setMcqs([...mcqs, { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" }]);
  const removeMCQ = (i: number) => setMcqs(mcqs.filter((_, idx) => idx !== i));
  const updateMCQ = (i: number, field: keyof MCQQuestion, value: string) => {
    const updated = [...mcqs];
    updated[i] = { ...updated[i], [field]: value };
    setMcqs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;
    setIsLoading(true);

    let fileUrl: string | null = null;
    if (assignmentType === "file" && file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("assignment-files").upload(path, file);
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const { data } = supabase.storage.from("assignment-files").getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    const { data: assignment, error } = await supabase.from("assignments").insert({
      course_id: courseId,
      title,
      description,
      assignment_type: assignmentType,
      due_date: dueDate || null,
      max_marks: parseInt(maxMarks) || 100,
      file_url: fileUrl,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (assignmentType === "mcq" && assignment) {
      const questions = mcqs.filter(q => q.question_text).map((q, i) => ({
        assignment_id: assignment.id,
        ...q,
        sort_order: i,
      }));
      if (questions.length > 0) {
        await supabase.from("mcq_questions").insert(questions);
      }
    }

    setIsLoading(false);
    toast({ title: "Assignment created!" });
    navigate("/assignments");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-6">Create Assignment</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Assignment title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={assignmentType} onValueChange={setAssignmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>

            {assignmentType === "file" && (
              <div className="space-y-2">
                <Label>Assignment File (PDF/DOC)</Label>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            )}

            {assignmentType === "mcq" && (
              <div className="space-y-4">
                <Label>Questions</Label>
                {mcqs.map((q, i) => (
                  <Card key={i} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Question {i + 1}</span>
                      {mcqs.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeMCQ(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Input placeholder="Question text" value={q.question_text} onChange={e => updateMCQ(i, "question_text", e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Option A" value={q.option_a} onChange={e => updateMCQ(i, "option_a", e.target.value)} />
                      <Input placeholder="Option B" value={q.option_b} onChange={e => updateMCQ(i, "option_b", e.target.value)} />
                      <Input placeholder="Option C" value={q.option_c} onChange={e => updateMCQ(i, "option_c", e.target.value)} />
                      <Input placeholder="Option D" value={q.option_d} onChange={e => updateMCQ(i, "option_d", e.target.value)} />
                    </div>
                    <Select value={q.correct_answer} onValueChange={v => updateMCQ(i, "correct_answer", v)}>
                      <SelectTrigger><SelectValue placeholder="Correct answer" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">A</SelectItem>
                        <SelectItem value="b">B</SelectItem>
                        <SelectItem value="c">C</SelectItem>
                        <SelectItem value="d">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addMCQ}><Plus className="h-4 w-4 mr-2" />Add Question</Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading || !courseId}>{isLoading ? "Creating..." : "Create Assignment"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
