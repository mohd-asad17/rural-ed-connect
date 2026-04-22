import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronDown, ChevronRight, FileText, Video, File, Upload, Trash2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { openStorageFile } from "@/lib/storage";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSectionOpen, setAddingSectionOpen] = useState(false);
  const [contentDialog, setContentDialog] = useState<{ sectionId: string } | null>(null);
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("video");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedContent, setCompletedContent] = useState<Set<string>>(new Set());

  const isOwner = role === "educator" && course?.educator_id === user?.id;

  const loadCourse = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("courses").select("*").eq("id", id).single();
    setCourse(c);

    const { data: sects } = await supabase
      .from("sections")
      .select("*, content(*)")
      .eq("course_id", id)
      .order("sort_order");
    setSections(sects || []);

    if (user && role === "student") {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", id)
        .maybeSingle();
      setIsEnrolled(!!enrollment);

      const { data: progress } = await supabase
        .from("content_progress")
        .select("content_id")
        .eq("student_id", user.id);
      setCompletedContent(new Set((progress || []).map(p => p.content_id)));
    }
  };

  useEffect(() => { loadCourse(); }, [id, user]);

  const handleEnroll = async () => {
    if (!user || !id) return;
    const { error } = await supabase.from("enrollments").insert({ student_id: user.id, course_id: id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setIsEnrolled(true);
      // Log activity
      await supabase.from("activity_log").insert({ user_id: user.id, activity_type: "enrollment" });
      toast({ title: "Enrolled successfully!" });
    }
  };

  const addSection = async () => {
    if (!id || !newSectionTitle) return;
    const { error } = await supabase.from("sections").insert({
      course_id: id,
      title: newSectionTitle,
      sort_order: sections.length,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewSectionTitle("");
      setAddingSectionOpen(false);
      loadCourse();
    }
  };

  const uploadContent = async () => {
    if (!contentDialog || !contentTitle || !contentFile || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${contentFile.name}`;
    const { error: uploadError } = await supabase.storage.from("course-content").upload(filePath, contentFile);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error } = await supabase.from("content").insert({
      section_id: contentDialog.sectionId,
      title: contentTitle,
      content_type: contentType,
      storage_path: filePath,
    });
    setUploading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setContentDialog(null);
      setContentTitle("");
      setContentFile(null);
      loadCourse();
      toast({ title: "Content uploaded!" });
    }
  };

  const markComplete = async (contentId: string) => {
    if (!user) return;
    const { error } = await supabase.from("content_progress").insert({ student_id: user.id, content_id: contentId });
    if (!error) {
      setCompletedContent(prev => new Set(prev).add(contentId));
      await supabase.from("activity_log").insert({ user_id: user.id, activity_type: "content_completed" });
    }
  };

  const openContent = async (path: string) => {
    try {
      await openStorageFile("course-content", path);
    } catch (e: any) {
      toast({ title: "Could not open file", description: e.message, variant: "destructive" });
    }
  };

  const toggleSection = (sId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(sId) ? next.delete(sId) : next.add(sId);
      return next;
    });
  };

  const contentIcon = (type: string) => {
    switch (type) {
      case "video": case "recording": return <Video className="h-4 w-4 text-primary" />;
      case "pdf": return <FileText className="h-4 w-4 text-destructive" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!course) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
          {course.category && <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground mt-2 inline-block">{course.category}</span>}
        </div>
        {role === "student" && !isEnrolled && (
          <Button onClick={handleEnroll}>Enroll in Course</Button>
        )}
        {isEnrolled && (
          <span className="text-sm bg-success/10 text-success px-3 py-1 rounded-full font-medium">Enrolled</span>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section: any) => (
          <Card key={section.id}>
            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => toggleSection(section.id)}>
              {expandedSections.has(section.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h3 className="font-display font-semibold flex-1">{section.title}</h3>
              <span className="text-xs text-muted-foreground">{section.content?.length || 0} items</span>
              {isOwner && (
                <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setContentDialog({ sectionId: section.id }); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {expandedSections.has(section.id) && section.content && (
              <CardContent className="pt-0 space-y-2">
                {section.content.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    {contentIcon(item.content_type)}
                    <span className="flex-1 text-sm">{item.title}</span>
                    {item.storage_path && (
                      <button
                        type="button"
                        onClick={() => openContent(item.storage_path)}
                        className="text-xs text-primary hover:underline"
                      >
                        Open
                      </button>
                    )}
                    {role === "student" && isEnrolled && (
                      completedContent.has(item.id) ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => markComplete(item.id)} className="text-xs">
                          Mark done
                        </Button>
                      )
                    )}
                  </div>
                ))}
                {(!section.content || section.content.length === 0) && (
                  <p className="text-sm text-muted-foreground py-2">No content yet</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {isOwner && (
          addingSectionOpen ? (
            <div className="flex gap-2">
              <Input placeholder="Section title" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} />
              <Button onClick={addSection} disabled={!newSectionTitle}>Add</Button>
              <Button variant="ghost" onClick={() => setAddingSectionOpen(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setAddingSectionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Section
            </Button>
          )
        )}
      </div>

      {/* Upload content dialog */}
      {contentDialog && (
        <Dialog open onOpenChange={() => setContentDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Upload Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={contentTitle} onChange={e => setContentTitle(e.target.value)} placeholder="Lecture 1: Introduction" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="recording">Recording</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">File</label>
                <Input type="file" onChange={e => setContentFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={uploadContent} disabled={uploading || !contentTitle || !contentFile}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
