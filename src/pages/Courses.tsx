import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Courses() {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (role === "educator") {
        const { data } = await supabase.from("courses").select("*").eq("educator_id", user!.id).order("created_at", { ascending: false });
        setCourses(data || []);
      } else {
        const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
        setCourses(data || []);
      }
    };
    if (user) load();
  }, [user, role]);

  useEffect(() => {
    const cats = [...new Set(courses.map(c => c.category).filter(Boolean))];
    setCategories(cats);
  }, [courses]);

  const filtered = courses.filter(c => {
    const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No courses found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => (
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
