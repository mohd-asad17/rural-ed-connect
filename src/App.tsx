import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import AIChatAssistant from "@/components/AIChatAssistant";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CreateCourse from "./pages/CreateCourse";
import CourseDetail from "./pages/CourseDetail";
import Assignments from "./pages/Assignments";
import CreateAssignment from "./pages/CreateAssignment";
import AssignmentDetail from "./pages/AssignmentDetail";
import Classes from "./pages/Classes";
import Classroom from "./pages/Classroom";
import Profile from "./pages/Profile";
import Opportunities from "./pages/Opportunities";
import Announcements from "./pages/Announcements";
import Resources from "./pages/Resources";
import Doubts from "./pages/Doubts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
    <AIChatAssistant />
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/courses" element={<ProtectedPage><Courses /></ProtectedPage>} />
            <Route path="/courses/create" element={<ProtectedPage><CreateCourse /></ProtectedPage>} />
            <Route path="/courses/:id" element={<ProtectedPage><CourseDetail /></ProtectedPage>} />
            <Route path="/assignments" element={<ProtectedPage><Assignments /></ProtectedPage>} />
            <Route path="/assignments/create" element={<ProtectedPage><CreateAssignment /></ProtectedPage>} />
            <Route path="/assignments/:id" element={<ProtectedPage><AssignmentDetail /></ProtectedPage>} />
            <Route path="/classes" element={<ProtectedPage><Classes /></ProtectedPage>} />
            <Route path="/classes/schedule" element={<ProtectedPage><Classes /></ProtectedPage>} />
            <Route path="/classroom/:id" element={<ProtectedPage><Classroom /></ProtectedPage>} />
            <Route path="/profile" element={<ProtectedPage><Profile /></ProtectedPage>} />
            <Route path="/opportunities" element={<ProtectedPage><Opportunities /></ProtectedPage>} />
            <Route path="/announcements" element={<ProtectedPage><Announcements /></ProtectedPage>} />
            <Route path="/resources" element={<ProtectedPage><Resources /></ProtectedPage>} />
            <Route path="/doubts" element={<ProtectedPage><Doubts /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
