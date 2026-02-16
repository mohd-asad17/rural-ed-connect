import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, Video, Flame, Megaphone, HelpCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format, subDays, parseISO } from "date-fns";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(id, title, description, category)")
        .eq("student_id", user.id);

      const courseList = (enrollments || []).map((e: any) => e.courses).filter(Boolean);
      setEnrolledCourses(courseList);

      if (courseList.length > 0) {
        const courseIds = courseList.map((c: any) => c.id);

        // Parallel data fetching
        const [classesRes, assignmentsRes, submissionsRes, announcementsRes, progressRes] = await Promise.all([
          supabase.from("scheduled_classes").select("*, courses(title)").in("course_id", courseIds)
            .gte("scheduled_at", new Date().toISOString()).eq("status", "scheduled").order("scheduled_at").limit(5),
          supabase.from("assignments").select("*, courses(title)").in("course_id", courseIds),
          supabase.from("submissions").select("assignment_id").eq("student_id", user.id),
          supabase.from("announcements").select("*, courses(title)").order("created_at", { ascending: false }).limit(3),
          supabase.from("content_progress").select("content_id, content(section_id, sections(course_id))").eq("student_id", user.id),
        ]);

        setUpcomingClasses(classesRes.data || []);
        setAnnouncements(announcementsRes.data || []);

        const submittedIds = new Set((submissionsRes.data || []).map(s => s.assignment_id));
        setPendingAssignments((assignmentsRes.data || []).filter(a => !submittedIds.has(a.id)));

        // Calculate course progress
        const progressByCourse: Record<string, number> = {};
        (progressRes.data || []).forEach((p: any) => {
          const cid = p.content?.sections?.course_id;
          if (cid) progressByCourse[cid] = (progressByCourse[cid] || 0) + 1;
        });

        // Get total content per course
        for (const cid of courseIds) {
          const { data: sections } = await supabase.from("sections").select("id, content(id)").eq("course_id", cid);
          const totalContent = (sections || []).reduce((sum: number, s: any) => sum + (s.content?.length || 0), 0);
          const completed = progressByCourse[cid] || 0;
          setCourseProgress(prev => ({ ...prev, [cid]: totalContent > 0 ? Math.round((completed / totalContent) * 100) : 0 }));
        }
      }

      // Streak
      const { data: activity } = await supabase
        .from("activity_log").select("activity_date").eq("user_id", user.id)
        .gte("activity_date", format(subDays(new Date(), 365), "yyyy-MM-dd"))
        .order("activity_date", { ascending: false });

      const dates = (activity || []).map(a => a.activity_date);
      setActivityDates(dates);

      let currentStreak = 0;
      let checkDate = new Date();
      for (let i = 0; i < 365; i++) {
        const dateStr = format(checkDate, "yyyy-MM-dd");
        if (dates.includes(dateStr)) { currentStreak++; checkDate = subDays(checkDate, 1); }
        else if (i === 0) { checkDate = subDays(checkDate, 1); continue; }
        else break;
      }
      setStreak(currentStreak);
    };
    load();
  }, [user]);

  const last90Days = Array.from({ length: 91 }, (_, i) => format(subDays(new Date(), 90 - i), "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground">Track your learning progress</p>
      </div>

      {/* Streak + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Flame className="h-5 w-5 text-secondary" />
            <CardTitle className="font-display text-lg">Daily Streak: {streak} days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {last90Days.map(date => (
                <div key={date} title={date} className={`streak-cell ${activityDates.includes(date) ? "streak-active" : "streak-inactive"}`} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">{enrolledCourses.length}</p>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-2xl font-display font-bold">{pendingAssignments.length}</p>
                <p className="text-sm text-muted-foreground">Pending Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2"><Megaphone className="h-5 w-5 text-secondary" />Recent Announcements</CardTitle>
              <Link to="/announcements" className="text-sm text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-foreground">{a.title}</p>
                  {a.courses?.title && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{a.courses.title}</span>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{a.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Enrolled Courses with progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">My Courses</CardTitle>
            <Link to="/courses" className="text-sm text-primary hover:underline">Browse courses</Link>
          </div>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You haven't enrolled in any courses yet.</p>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((course: any) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Progress value={courseProgress[course.id] || 0} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{courseProgress[course.id] || 0}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display">Upcoming Classes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((cls: any) => (
              <div key={cls.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <div className="bg-warning/10 p-2 rounded-lg">
                  <Video className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{cls.title}</p>
                  <p className="text-sm text-muted-foreground">{cls.courses?.title} · {format(parseISO(cls.scheduled_at), "MMM d, h:mm a")}</p>
                </div>
                <Link to={`/classroom/${cls.id}`}>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Join</span>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display">Pending Assignments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.map((a: any) => (
              <Link key={a.id} to={`/assignments/${a.id}`} className="block">
                <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="bg-destructive/10 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.courses?.title} · {a.due_date ? `Due ${format(parseISO(a.due_date), "MMM d")}` : "No due date"}
                    </p>
                  </div>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">{a.assignment_type}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
