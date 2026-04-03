import { useAuthStore } from "../store/useAuthStore";
import AdminDashboard from "./dashboards/AdminDashboard";
import InitiatorDashboard from "./dashboards/InitiatorDashboard";
import CheckerDashboard from "./dashboards/CheckerDashboard";
import ApproverDashboard from "./dashboards/ApproverDashboard";
import EngineeringDashboard from "./dashboards/EngineeringDashboard";

export default function Dashboard() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-primary sm:truncate sm:text-3xl sm:tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {user.role.replace("_", " ")} Dashboard
          </p>
        </div>
      </div>

      {user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? (
        <AdminDashboard isSuperAdmin={user.role === "SUPER_ADMIN"} />
      ) : null}

      {user.role === "INITIATOR" && <InitiatorDashboard />}
      {user.role === "CHECKER" && <CheckerDashboard />}
      {user.role === "APPROVER" && <ApproverDashboard />}
      {user.role === "ENGINEERING" && <EngineeringDashboard />}
    </div>
  );
}
