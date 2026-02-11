import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";

export default function Assignments() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (role === "educator") {
        const { data: courses } = await supabase.from("courses").select("id").eq("educator_id", user.id);
        if (courses && courses.length > 0) {
          const { data } = await supabase.from("assignments").select("*, courses(title)").in("course_id", courses.map(c => c.id)).order("created_at", { ascending: false });
          setAssignments(data || []);
        }
      } else {
        const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
        if (enrollments && enrollments.length > 0) {
          const { data } = await supabase.from("assignments").select("*, courses(title)").in("course_id", enrollments.map(e => e.course_id)).order("created_at", { ascending: false });
          setAssignments(data || []);
        }
        const { data: subs } = await supabase.from("submissions").select("assignment_id, status, marks").eq("student_id", user.id);
        setSubmissions(subs || []);
      }
    };
    load();
  }, [user, role]);

  const getSubmissionStatus = (assignmentId: string) => {
    const sub = submissions.find(s => s.assignment_id === assignmentId);
    if (!sub) return "pending";
    return sub.status;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "graded": return <CheckCircle className="h-4 w-4 text-success" />;
      case "submitted": return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Assignments</h1>
        {role === "educator" && (
          <Link to="/assignments/create">
            <Button><Plus className="h-4 w-4 mr-2" />Create Assignment</Button>
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const status = role === "student" ? getSubmissionStatus(a.id) : null;
            return (
              <Link key={a.id} to={`/assignments/${a.id}`}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.courses?.title} · {a.assignment_type.toUpperCase()}</p>
                    </div>
                    {a.due_date && <span className="text-xs text-muted-foreground">Due {format(parseISO(a.due_date), "MMM d")}</span>}
                    {status && (
                      <div className="flex items-center gap-1">
                        {statusIcon(status)}
                        <span className="text-xs capitalize text-muted-foreground">{status}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
