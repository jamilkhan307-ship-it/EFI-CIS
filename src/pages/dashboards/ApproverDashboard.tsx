import { useEffect, useState } from "react";
import { FileSignature, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function ApproverDashboard() {
  const [pendingApproval, setPendingApproval] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [pendingCirs, setPendingCirs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { count: p } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("status", "CHECKED");
        setPendingApproval(p || 0);
        const { count: a } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("status", "APPROVED");
        setApprovedCount(a || 0);
        const { count: r } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("status", "REJECTED");
        setRejectedCount(r || 0);
        const { data } = await supabase.from("cir_records").select("*").eq("status", "CHECKED").order("updated_at", { ascending: false }).limit(10);
        setPendingCirs(data || []);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const stats = [
    { name: "Pending My Approval", stat: pendingApproval.toString(), icon: FileSignature, color: "text-amber-500", status: "CHECKED" },
    { name: "Approved CIS Records", stat: approvedCount.toString(), icon: CheckCircle, color: "text-green-500", status: "APPROVED" },
    { name: "Rejected CIS Records", stat: rejectedCount.toString(), icon: XCircle, color: "text-red-500", status: "REJECTED" },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Link 
            key={item.name} 
            to={`/cir?status=${item.status}`}
            className="relative overflow-hidden rounded-lg bg-white p-5 shadow ring-1 ring-black/5 hover:ring-accent/50 transition-all hover:shadow-md cursor-pointer group"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color.replace('text-', 'bg-').replace('-500', '-50')} group-hover:scale-110 transition-transform`}><item.icon className={`h-6 w-6 ${item.color}`} /></div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1"><p className="text-2xl font-semibold text-gray-900">{item.stat}</p></dd>
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-base font-semibold leading-6 text-gray-900">CIS Records Pending Final Approval</h2>
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">CIS Number</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Initiator</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Decide</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingCirs.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-500">No CIS records pending approval.</td></tr>
              ) : pendingCirs.map(cir => (
                <tr key={cir.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{cir.cir_number.replace('CIR', 'CIS')}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cir.form_data?.partDescription || cir.form_data?.formData?.partDescription || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cir.initiator_name || "—"}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"><Link to={`/cir/${cir.cir_number}`} className="text-accent hover:text-orange-700">Decide</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
