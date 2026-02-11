import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Courses() {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (role === "educator") {
        const { data } = await supabase.from("courses").select("*").eq("educator_id", user!.id).order("created_at", { ascending: false });
        setCourses(data || []);
      } else {
        // Students: show all courses (they can browse and enroll)
        const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
        setCourses(data || []);
      }
    };
    if (user) load();
  }, [user, role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{role === "educator" ? "My Courses" : "Browse Courses"}</h1>
        {role === "educator" && (
          <Link to="/courses/create" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            + Create Course
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No courses found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Link key={course.id} to={`/courses/${course.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description || "No description"}</p>
                  {course.category && (
                    <span className="inline-block mt-3 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{course.category}</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
