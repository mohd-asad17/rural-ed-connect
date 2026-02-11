import { useAuth } from "@/hooks/useAuth";
import EducatorDashboard from "./EducatorDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return role === "educator" ? <EducatorDashboard /> : <StudentDashboard />;
}
