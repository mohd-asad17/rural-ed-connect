import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, BookOpen, Users, Flame } from "lucide-react";
import { format, subDays } from "date-fns";

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [activityDates, setActivityDates] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (role === "educator") {
        const { data: courses } = await supabase.from("courses").select("id").eq("educator_id", user.id);
        const courseCount = courses?.length || 0;
        let studentCount = 0;
        if (courses && courses.length > 0) {
          const { count } = await supabase.from("enrollments").select("student_id", { count: "exact", head: true }).in("course_id", courses.map(c => c.id));
          studentCount = count || 0;
        }
        setStats({ courses: courseCount, students: studentCount });
      } else {
        const { count: enrolled } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", user.id);
        const { count: completed } = await supabase.from("content_progress").select("id", { count: "exact", head: true }).eq("student_id", user.id);
        setStats({ enrolled: enrolled || 0, completed: completed || 0 });
      }

      const { data: activity } = await supabase.from("activity_log").select("activity_date").eq("user_id", user.id).gte("activity_date", format(subDays(new Date(), 365), "yyyy-MM-dd"));
      setActivityDates((activity || []).map(a => a.activity_date));
    };
    load();
  }, [user, role]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    let avatarUrl = profile?.avatar_url;
    if (avatarFile) {
      const path = `${user.id}/avatar-${Date.now()}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, avatarFile);
      if (!uploadErr) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      bio,
      avatar_url: avatarUrl,
    }).eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      refreshProfile();
    }
  };

  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  const last90Days = Array.from({ length: 91 }, (_, i) => format(subDays(new Date(), 90 - i), "yyyy-MM-dd"));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold">Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer">
                <Camera className="h-3 w-3" />
                <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div>
              <p className="text-lg font-display font-bold">{fullName || "User"}</p>
              <p className="text-sm text-muted-foreground capitalize">{role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {role === "educator" ? (
          <>
            <Card><CardContent className="p-4 flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary" /><div><p className="text-xl font-bold">{stats.courses || 0}</p><p className="text-sm text-muted-foreground">Courses</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-secondary" /><div><p className="text-xl font-bold">{stats.students || 0}</p><p className="text-sm text-muted-foreground">Students</p></div></CardContent></Card>
          </>
        ) : (
          <>
            <Card><CardContent className="p-4 flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary" /><div><p className="text-xl font-bold">{stats.enrolled || 0}</p><p className="text-sm text-muted-foreground">Enrolled</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Flame className="h-5 w-5 text-secondary" /><div><p className="text-xl font-bold">{stats.completed || 0}</p><p className="text-sm text-muted-foreground">Completed</p></div></CardContent></Card>
          </>
        )}
      </div>

      {/* Activity heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {last90Days.map(date => (
              <div key={date} title={date} className={`streak-cell ${activityDates.includes(date) ? "streak-active" : "streak-inactive"}`} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
