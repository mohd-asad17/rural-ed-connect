import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare } from "lucide-react";

export default function Feedback({ courseId }: { courseId: string }) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [existing, setExisting] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (role === "student") {
        const { data } = await supabase.from("feedback").select("*").eq("student_id", user.id).eq("course_id", courseId).maybeSingle();
        if (data) {
          setExisting(data);
          setRating(data.rating);
          setComment(data.comment || "");
        }
      }
      if (role === "educator") {
        const { data } = await supabase.from("feedback").select("*, profiles:student_id(full_name)").eq("course_id", courseId);
        setFeedbackList(data || []);
      }
    };
    load();
  }, [user, role, courseId]);

  const submit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      student_id: user.id,
      course_id: courseId,
      rating,
      comment: comment || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Feedback submitted!" });
      setExisting({ rating, comment });
    }
  };

  if (role === "educator") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Student Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackList.length === 0 ? (
            <p className="text-muted-foreground">No feedback yet</p>
          ) : (
            <div className="space-y-3">
              {feedbackList.map(fb => (
                <div key={fb.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{(fb as any).profiles?.full_name || "Student"}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= fb.rating ? "text-secondary fill-secondary" : "text-muted"}`} />)}
                    </div>
                  </div>
                  {fb.comment && <p className="text-sm text-muted-foreground">{fb.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Rate this Course</CardTitle>
      </CardHeader>
      <CardContent>
        {existing ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-2">
              {[1,2,3,4,5].map(s => <Star key={s} className={`h-6 w-6 ${s <= existing.rating ? "text-secondary fill-secondary" : "text-muted"}`} />)}
            </div>
            <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-1">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`h-8 w-8 transition-colors ${s <= rating ? "text-secondary fill-secondary" : "text-muted hover:text-secondary/50"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts (optional)..." rows={3} />
            <Button onClick={submit} disabled={submitting || rating === 0}>{submitting ? "Submitting..." : "Submit Feedback"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
