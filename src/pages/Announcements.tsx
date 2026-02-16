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
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";

export default function Announcements() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    setAnnouncements(data || []);
  };

  useEffect(() => {
    load();
    if (role === "educator" && user) {
      supabase.from("courses").select("id, title").eq("educator_id", user.id).then(({ data }) => setCourses(data || []));
    }
  }, [user, role]);

  const addAnnouncement = async () => {
    if (!user || !title || !content) return;
    setIsLoading(true);
    const { error } = await supabase.from("announcements").insert({
      educator_id: user.id,
      title,
      content,
      course_id: courseId === "all" ? null : courseId,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Announcement posted!" });
      setAddOpen(false);
      setTitle("");
      setContent("");
      setCourseId("all");
      load();
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Announcements</h1>
        {role === "educator" && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />New Announcement
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-secondary" />
                    <CardTitle className="font-display text-lg">{a.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.courses?.title && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{a.courses.title}</span>
                    )}
                    {role === "educator" && a.educator_id === user?.id && (
                      <Button variant="ghost" size="sm" onClick={() => deleteAnnouncement(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-3">{format(parseISO(a.created_at), "MMM d, yyyy h:mm a")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write your announcement..." />
            </div>
            <Button onClick={addAnnouncement} disabled={isLoading || !title || !content}>
              {isLoading ? "Posting..." : "Post Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
