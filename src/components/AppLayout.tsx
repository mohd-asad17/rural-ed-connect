import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, FileText, Video, User, Award, Megaphone,
  LogOut, Menu, X, GraduationCap, HelpCircle, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const educatorLinks = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/courses", icon: BookOpen, label: "My Courses" },
  { to: "/assignments", icon: FileText, label: "Assignments" },
  { to: "/classes", icon: Video, label: "Live Classes" },
  { to: "/doubts", icon: HelpCircle, label: "Doubt Resolution" },
  { to: "/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/resources", icon: FolderOpen, label: "Resource Library" },
  { to: "/opportunities", icon: Award, label: "Opportunities" },
  { to: "/profile", icon: User, label: "Profile" },
];

const studentLinks = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/assignments", icon: FileText, label: "Assignments" },
  { to: "/classes", icon: Video, label: "Classes" },
  { to: "/doubts", icon: HelpCircle, label: "My Doubts" },
  { to: "/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/resources", icon: FolderOpen, label: "Resources" },
  { to: "/opportunities", icon: Award, label: "Opportunities" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = role === "educator" ? educatorLinks : studentLinks;
  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 flex items-center gap-3">
          <div className="bg-sidebar-primary p-1.5 rounded-lg">
            <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">RuralEd</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-auto">
          {links.map(link => {
            const active = location.pathname === link.to || (link.to !== "/" && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
            </div>
            <button onClick={handleSignOut} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 lg:px-6 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1" />
        </header>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
