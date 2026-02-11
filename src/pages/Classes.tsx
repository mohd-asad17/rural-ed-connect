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
import { Video, Calendar, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";

export default function Classes() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (role === "educator") {
        const { data: myCourses } = await supabase.from("courses").select("id, title").eq("educator_id", user.id);
        setCourses(myCourses || []);
        if (myCourses && myCourses.length > 0) {
          const { data } = await supabase.from("scheduled_classes").select("*, courses(title)").in("course_id", myCourses.map(c => c.id)).order("scheduled_at", { ascending: false });
          setClasses(data || []);
        }
      } else {
        const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
        if (enrollments && enrollments.length > 0) {
          const { data } = await supabase.from("scheduled_classes").select("*, courses(title)").in("course_id", enrollments.map(e => e.course_id)).order("scheduled_at", { ascending: false });
          setClasses(data || []);
        }
      }
    };
    load();
  }, [user, role]);

  const scheduleClass = async () => {
    if (!courseId || !title || !scheduledAt) return;
    setIsLoading(true);
    const { error } = await supabase.from("scheduled_classes").insert({
      course_id: courseId,
      title,
      description,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(duration),
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Class scheduled!" });
      setScheduleOpen(false);
      setTitle(""); setDescription(""); setScheduledAt(""); setCourseId("");
      // Refresh
      const { data: myCourses } = await supabase.from("courses").select("id").eq("educator_id", user!.id);
      if (myCourses) {
        const { data } = await supabase.from("scheduled_classes").select("*, courses(title)").in("course_id", myCourses.map(c => c.id)).order("scheduled_at", { ascending: false });
        setClasses(data || []);
      }
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-primary/10 text-primary";
      case "live": return "bg-destructive/10 text-destructive";
      case "completed": return "bg-success/10 text-success";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{role === "educator" ? "Live Classes" : "Scheduled Classes"}</h1>
        {role === "educator" && (
          <Button onClick={() => setScheduleOpen(true)}><Plus className="h-4 w-4 mr-2" />Schedule Class</Button>
        )}
      </div>

      {classes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No classes scheduled.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => (
            <Link key={cls.id} to={`/classroom/${cls.id}`}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{cls.title}</p>
                    <p className="text-sm text-muted-foreground">{cls.courses?.title} · {format(parseISO(cls.scheduled_at), "MMM d, h:mm a")} · {cls.duration_minutes}min</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor(cls.status)}`}>{cls.status}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Schedule a Class</DialogTitle>
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
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Class topic" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What will be covered?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
            <Button onClick={scheduleClass} disabled={isLoading || !courseId || !title || !scheduledAt}>
              {isLoading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
