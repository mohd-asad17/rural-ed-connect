import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, Download } from "lucide-react";

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<any>(null);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<any>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Educator: view submissions
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const { data: a } = await supabase.from("assignments").select("*, courses(title, educator_id)").eq("id", id).single();
      setAssignment(a);

      if (a?.assignment_type === "mcq") {
        const { data: qs } = await supabase.from("mcq_questions").select("*").eq("assignment_id", id).order("sort_order");
        setMcqs(qs || []);
      }

      if (role === "student") {
        const { data: sub } = await supabase.from("submissions").select("*").eq("assignment_id", id).eq("student_id", user.id).maybeSingle();
        setSubmission(sub);
        if (sub?.answers) setAnswers(sub.answers as Record<string, string>);
      }

      if (role === "educator") {
        const { data: subs } = await supabase.from("submissions").select("*, profiles:student_id(full_name)").eq("assignment_id", id);
        setSubmissions(subs || []);
      }
    };
    load();
  }, [id, user, role]);

  const submitMCQ = async () => {
    if (!user || !id) return;
    setSubmitting(true);
    // Auto-grade
    let score = 0;
    mcqs.forEach(q => { if (answers[q.id] === q.correct_answer) score++; });
    const marks = Math.round((score / mcqs.length) * (assignment?.max_marks || 100));

    const { error } = await supabase.from("submissions").insert({
      student_id: user.id,
      assignment_id: id,
      answers,
      marks,
      status: "graded",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("activity_log").insert({ user_id: user.id, activity_type: "assignment_submitted" });
      toast({ title: `Submitted! Score: ${score}/${mcqs.length} (${marks} marks)` });
      setSubmission({ answers, marks, status: "graded" });
    }
  };

  const submitFile = async () => {
    if (!user || !id || !submissionFile) return;
    setSubmitting(true);
    const path = `${user.id}/${Date.now()}-${submissionFile.name}`;
    const { error: uploadErr } = await supabase.storage.from("submissions").upload(path, submissionFile);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);
    const { error } = await supabase.from("submissions").insert({
      student_id: user.id,
      assignment_id: id,
      file_url: urlData.publicUrl,
      status: "submitted",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("activity_log").insert({ user_id: user.id, activity_type: "assignment_submitted" });
      toast({ title: "Submitted successfully!" });
      setSubmission({ file_url: urlData.publicUrl, status: "submitted" });
    }
  };

  const gradeSubmission = async (subId: string) => {
    const { error } = await supabase.from("submissions").update({
      marks: parseInt(gradeMarks),
      feedback: gradeFeedback,
      status: "graded",
    }).eq("id", subId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Graded!" });
      setGradingId(null);
      setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, marks: parseInt(gradeMarks), feedback: gradeFeedback, status: "graded" } : s));
    }
  };

  if (!assignment) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">{assignment.title}</h1>
        <p className="text-muted-foreground">{assignment.courses?.title} · {assignment.assignment_type.toUpperCase()}</p>
        {assignment.description && <p className="mt-2 text-foreground">{assignment.description}</p>}
        {assignment.max_marks && <p className="text-sm text-muted-foreground mt-1">Max marks: {assignment.max_marks}</p>}
      </div>

      {/* Student: MCQ */}
      {role === "student" && assignment.assignment_type === "mcq" && (
        submission ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="font-display font-bold text-xl">Score: {submission.marks} / {assignment.max_marks}</p>
              <p className="text-muted-foreground">Your answers have been graded automatically</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {mcqs.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="p-4 space-y-3">
                  <p className="font-medium">Q{i + 1}. {q.question_text}</p>
                  {["a", "b", "c", "d"].map(opt => (
                    <label key={opt} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt ? "bg-primary/10 border border-primary" : "hover:bg-muted"}`}>
                      <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="accent-primary" />
                      <span className="uppercase font-medium text-sm">{opt}.</span>
                      <span>{q[`option_${opt}` as keyof typeof q]}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}
            <Button onClick={submitMCQ} disabled={submitting || Object.keys(answers).length < mcqs.length}>
              {submitting ? "Submitting..." : "Submit Answers"}
            </Button>
          </div>
        )
      )}

      {/* Student: File */}
      {role === "student" && assignment.assignment_type === "file" && (
        submission ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="font-display font-bold text-xl">
                {submission.status === "graded" ? `Score: ${submission.marks} / ${assignment.max_marks}` : "Submitted — awaiting grading"}
              </p>
              {submission.feedback && <p className="text-muted-foreground mt-2">Feedback: {submission.feedback}</p>}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-4">
              {assignment.file_url && (
                <a href={assignment.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <Download className="h-4 w-4" /> Download assignment file
                </a>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload your solution</label>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={submitFile} disabled={submitting || !submissionFile}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Educator: View submissions */}
      {role === "educator" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Submissions ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No submissions yet</p>
            ) : (
              submissions.map(sub => (
                <div key={sub.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{(sub as any).profiles?.full_name || "Student"}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${sub.status === "graded" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {sub.status}
                    </span>
                  </div>
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <FileText className="h-3 w-3" /> View submission
                    </a>
                  )}
                  {sub.marks !== null && <p className="text-sm">Marks: {sub.marks}/{assignment.max_marks}</p>}
                  {sub.feedback && <p className="text-sm text-muted-foreground">Feedback: {sub.feedback}</p>}
                  {sub.status !== "graded" && assignment.assignment_type === "file" && (
                    gradingId === sub.id ? (
                      <div className="space-y-2 pt-2">
                        <Input type="number" placeholder="Marks" value={gradeMarks} onChange={e => setGradeMarks(e.target.value)} />
                        <Textarea placeholder="Feedback" value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => gradeSubmission(sub.id)}>Save Grade</Button>
                          <Button size="sm" variant="ghost" onClick={() => setGradingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setGradingId(sub.id); setGradeMarks(""); setGradeFeedback(""); }}>Grade</Button>
                    )
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
