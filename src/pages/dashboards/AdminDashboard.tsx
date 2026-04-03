import { useEffect, useState } from "react";
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard({ isSuperAdmin: _isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [totalCirs, setTotalCirs] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [approvedThisMonth, setApprovedThisMonth] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total CIRs
        const { count: total } = await supabase.from("cir_records").select("*", { count: "exact", head: true });
        setTotalCirs(total || 0);

        // Pending (SUBMITTED + CHECKED = awaiting next step)
        const { count: pending } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).in("status", ["SUBMITTED", "CHECKED", "UNDER_REVIEW"]);
        setPendingApproval(pending || 0);

        // Approved this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count: approved } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("status", "APPROVED").gte("updated_at", startOfMonth.toISOString());
        setApprovedThisMonth(approved || 0);

        // Rejected
        const { count: rej } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("status", "REJECTED");
        setRejected(rej || 0);

        // Recent CIR activity
        const { data: recentCirs } = await supabase.from("cir_records").select("cir_number, status, initiator_name, updated_at").order("updated_at", { ascending: false }).limit(5);
        setRecentActivity(recentCirs || []);

      } catch (e) {
        console.error("Error fetching dashboard stats:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { name: "Total CIS Records", stat: totalCirs.toString(), icon: FileText, color: "text-blue-500", status: "ALL" },
    { name: "Pending Approval", stat: pendingApproval.toString(), icon: Clock, color: "text-amber-500", status: "SUBMITTED" },
    { name: "Approved This Month", stat: approvedThisMonth.toString(), icon: CheckCircle, color: "text-green-500", status: "APPROVED" },
    { name: "Rejected", stat: rejected.toString(), icon: XCircle, color: "text-red-500", status: "REJECTED" },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-600';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'CHECKED': return 'bg-indigo-100 text-indigo-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Link 
            key={item.name} 
            to={item.status === "ALL" ? "/cir" : `/cir?status=${item.status}`}
            className="relative overflow-hidden rounded-lg bg-white p-5 shadow ring-1 ring-black/5 hover:ring-accent/50 transition-all hover:shadow-md cursor-pointer group"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color.replace('text-', 'bg-').replace('-500', '-50')} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-lg bg-white shadow ring-1 ring-black/5 p-6">
          <h2 className="text-base font-semibold leading-6 text-gray-900 mb-4">Status Overview</h2>
          <div className="space-y-3">
            {[
              { label: "Drafts", count: totalCirs - pendingApproval - approvedThisMonth - rejected, color: "bg-gray-400" },
              { label: "Pending", count: pendingApproval, color: "bg-amber-400" },
              { label: "Approved", count: approvedThisMonth, color: "bg-green-400" },
              { label: "Rejected", count: rejected, color: "bg-red-400" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{Math.max(0, item.count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-lg bg-white shadow ring-1 ring-black/5 p-6">
          <h2 className="text-base font-semibold leading-6 text-gray-900 mb-4">Recent Activity</h2>
          <div className="flow-root">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity yet.</p>
            ) : (
              <ul role="list" className="-mb-8">
                {recentActivity.map((event, eventIdx) => (
                  <li key={event.cir_number + eventIdx}>
                    <div className="relative pb-8">
                      {eventIdx !== recentActivity.length - 1 ? (
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={"h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white " + getStatusColor(event.status)}>
                            {event.status === "APPROVED" ? <CheckCircle className="h-4 w-4" /> : event.status === "REJECTED" ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{event.cir_number.replace('CIR', 'CIS')}</span> — {event.status.replace("_", " ")}
                              {event.initiator_name && <span> by {event.initiator_name}</span>}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            {event.updated_at ? timeAgo(event.updated_at) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
