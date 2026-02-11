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
import { Award, Plus, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Opportunities() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("scholarship");
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
    setOpportunities(data || []);
  };

  useEffect(() => { load(); }, []);

  const addOpportunity = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from("opportunities").insert({
      educator_id: user.id,
      title,
      description,
      link: link || null,
      opportunity_type: type,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Opportunity posted!" });
      setAddOpen(false);
      setTitle(""); setDescription(""); setLink("");
      load();
    }
  };

  const typeColors: Record<string, string> = {
    scholarship: "bg-primary/10 text-primary",
    competition: "bg-secondary/10 text-secondary",
    resource: "bg-success/10 text-success",
    other: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Opportunities Hub</h1>
        {role === "educator" && (
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Post Opportunity</Button>
        )}
      </div>

      {opportunities.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No opportunities posted yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map(op => (
            <Card key={op.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle className="font-display text-lg">{op.title}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${typeColors[op.opportunity_type] || typeColors.other}`}>
                    {op.opportunity_type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{op.description}</p>
                {op.link && (
                  <a href={op.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline">
                    <ExternalLink className="h-3 w-3" />Learn more
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Post Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Scholarship name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                  <SelectItem value="resource">Learning Resource</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={addOpportunity} disabled={isLoading || !title}>{isLoading ? "Posting..." : "Post"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
