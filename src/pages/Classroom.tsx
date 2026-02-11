import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Mic, MicOff, VideoOff, Monitor, Users, MessageCircle, Phone, Send } from "lucide-react";

export default function Classroom() {
  const { id } = useParams<{ id: string }>();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState<{ name: string; text: string }[]>([
    { name: "System", text: "Welcome to the class! This is a mockup interface." },
  ]);

  useEffect(() => {
    if (!id) return;
    supabase.from("scheduled_classes").select("*, courses(title)").eq("id", id).single().then(({ data }) => setClassInfo(data));
  }, [id]);

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatMessages([...chatMessages, { name: "You", text: chatMsg }]);
    setChatMsg("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Video area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-foreground/5 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="text-center space-y-4">
            <div className="bg-muted rounded-full p-6 mx-auto w-fit">
              <Video className="h-16 w-16 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">{classInfo?.title || "Classroom"}</h2>
              <p className="text-muted-foreground">{classInfo?.courses?.title}</p>
              <p className="text-sm text-muted-foreground mt-2">📹 Video call mockup — WebRTC integration placeholder</p>
            </div>
          </div>
          {/* Self view mockup */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-foreground/10 rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground">You</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 py-4">
          <Button variant={micOn ? "outline" : "destructive"} size="icon" onClick={() => setMicOn(!micOn)}>
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button variant={camOn ? "outline" : "destructive"} size="icon" onClick={() => setCamOn(!camOn)}>
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon">
            <Monitor className="h-5 w-5" />
          </Button>
          <Button variant="destructive" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar: participants + chat */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <Card className="flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Participants (3)</span>
            </div>
            <div className="space-y-2">
              {["Educator (Host)", "Student 1", "Student 2"].map(name => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-medium text-primary">{name[0]}</div>
                  <span className="text-sm">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Chat</span>
            </div>
            <div className="flex-1 overflow-auto space-y-2 mb-3">
              {chatMessages.map((msg, i) => (
                <div key={i}>
                  <span className="text-xs font-medium text-primary">{msg.name}: </span>
                  <span className="text-sm text-foreground">{msg.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendChat()} />
              <Button size="icon" onClick={sendChat}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
