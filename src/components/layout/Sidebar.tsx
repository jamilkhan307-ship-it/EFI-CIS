import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Shield,
  Activity
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export default function Sidebar() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "INITIATOR", "CHECKER", "APPROVER", "ENGINEERING"] },
    { name: "CIS Records", href: "/cir", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "INITIATOR", "CHECKER", "APPROVER", "ENGINEERING"] },
    { name: "User Management", href: "/admin/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Master Data", href: "/admin/master", icon: Database, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Form Builder", href: "/admin/form-builder", icon: Settings2, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Section Access", href: "/admin/section-access", icon: Shield, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
  ];

  const filteredNav = navigation.filter(item => user && item.roles.includes(user.role));

  return (
    <div className={cn(
      "flex flex-col bg-primary text-white transition-all duration-300 relative",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10 px-4">
        {collapsed ? (
          <span className="text-xl font-bold tracking-tight text-accent">CIS</span>
        ) : (
          <span className="text-xl font-bold tracking-tight">
            <span className="text-accent">CIS</span>
            <span className="text-white"> Portal</span>
          </span>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-md hover:bg-accent/90 focus:outline-none"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNav.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                isActive
                  ? "bg-white/10 text-white"
                  : "text-primary-foreground/70 hover:bg-white/5 hover:text-white",
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : ""
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  isActive ? "text-accent" : "text-primary-foreground/50 group-hover:text-white",
                  "flex-shrink-0 h-5 w-5",
                  !collapsed && "mr-3"
                )}
                aria-hidden="true"
              />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-primary-foreground/10 p-4">
        <button
          onClick={() => signOut()}
          className={cn(
            "flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-white/5 hover:text-destructive-foreground transition-colors",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("flex-shrink-0 h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
}
