import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, Video, Plus, Upload, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function EducatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, assignments: 0, classes: 0 });
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [coursesRes, assignmentsRes, classesRes] = await Promise.all([
        supabase.from("courses").select("id, title, description, category, created_at").eq("educator_id", user.id),
        supabase.from("assignments").select("id, course_id"),
        supabase.from("scheduled_classes").select("id"),
      ]);
      const myCourses = coursesRes.data || [];
      setCourses(myCourses);

      // Count unique enrolled students
      let studentCount = 0;
      if (myCourses.length > 0) {
        const { count } = await supabase
          .from("enrollments")
          .select("student_id", { count: "exact", head: true })
          .in("course_id", myCourses.map(c => c.id));
        studentCount = count || 0;
      }

      setStats({
        courses: myCourses.length,
        students: studentCount,
        assignments: (assignmentsRes.data || []).length,
        classes: (classesRes.data || []).length,
      });
    };
    load();
  }, [user]);

  const statCards = [
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-primary" },
    { label: "Students", value: stats.students, icon: Users, color: "text-secondary" },
    { label: "Assignments", value: stats.assignments, icon: FileText, color: "text-success" },
    { label: "Scheduled Classes", value: stats.classes, icon: Video, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Educator Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and track student progress</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/courses/create">
          <Button><Plus className="h-4 w-4 mr-2" />Create Course</Button>
        </Link>
        <Link to="/assignments/create">
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Create Assignment</Button>
        </Link>
        <Link to="/classes/schedule">
          <Button variant="outline"><Calendar className="h-4 w-4 mr-2" />Schedule Class</Button>
        </Link>
      </div>

      {/* Courses list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No courses yet. Create your first course!</p>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <Link key={course.id} to={`/courses/${course.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{course.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{course.description || "No description"}</p>
                    </div>
                    {course.category && (
                      <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{course.category}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
