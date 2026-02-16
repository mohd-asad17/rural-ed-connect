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
import { FolderOpen, Plus, ExternalLink, FileText, Video, BookOpen, Download, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Resources() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("document");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    setResources(data || []);
  };

  useEffect(() => { load(); }, []);

  const addResource = async () => {
    if (!user || !title) return;
    setIsLoading(true);

    let fileUrl: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("resources").upload(path, file);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const { data } = supabase.storage.from("resources").getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    const { error } = await supabase.from("resources").insert({
      educator_id: user.id,
      title,
      description,
      resource_type: resourceType,
      file_url: fileUrl,
      link: link || null,
      category: category || null,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resource added!" });
      setAddOpen(false);
      setTitle(""); setDescription(""); setLink(""); setCategory(""); setFile(null);
      load();
    }
  };

  const deleteResource = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (!error) load();
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-5 w-5 text-primary" />;
      case "document": return <FileText className="h-5 w-5 text-destructive" />;
      case "book": return <BookOpen className="h-5 w-5 text-secondary" />;
      default: return <FolderOpen className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filtered = resources.filter(r => {
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || r.resource_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Resource Library</h1>
        {role === "educator" && (
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Resource</Button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search resources..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="book">Books</SelectItem>
            <SelectItem value="link">Links</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No resources found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {typeIcon(r.resource_type)}
                    <CardTitle className="font-display text-base">{r.title}</CardTitle>
                  </div>
                  {role === "educator" && r.educator_id === user?.id && (
                    <Button variant="ghost" size="sm" onClick={() => deleteResource(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}
                <div className="flex items-center gap-2">
                  {r.category && <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{r.category}</span>}
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Download className="h-3 w-3" />Download
                    </a>
                  )}
                  {r.link && (
                    <a href={r.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />Open
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource title" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Mathematics, Science" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>File (optional)</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={addResource} disabled={isLoading || !title}>
              {isLoading ? "Adding..." : "Add Resource"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
