import { useEffect, useState } from "react";
import { FileEdit, Send, CornerUpLeft, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";

export default function InitiatorDashboard() {
  const { user } = useAuthStore();
  const [drafts, setDrafts] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [returned, setReturned] = useState(0);
  const [approved, setApproved] = useState(0);
  const [recentCirs, setRecentCirs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { count: d } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("initiator_id", user.uid).eq("status", "DRAFT");
        setDrafts(d || 0);
        const { count: s } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("initiator_id", user.uid).eq("status", "SUBMITTED");
        setSubmitted(s || 0);
        const { count: r } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("initiator_id", user.uid).eq("status", "RETURNED");
        setReturned(r || 0);
        const { count: a } = await supabase.from("cir_records").select("*", { count: "exact", head: true }).eq("initiator_id", user.uid).eq("status", "APPROVED");
        setApproved(a || 0);
        const { data } = await supabase.from("cir_records").select("*").eq("initiator_id", user.uid).order("updated_at", { ascending: false }).limit(5);
        setRecentCirs(data || []);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetch();
  }, [user]);

  const stats = [
    { name: "My Drafts", stat: drafts.toString(), icon: FileEdit, color: "text-gray-500", status: "DRAFT" },
    { name: "Submitted", stat: submitted.toString(), icon: Send, color: "text-blue-500", status: "SUBMITTED" },
    { name: "Returned", stat: returned.toString(), icon: CornerUpLeft, color: "text-amber-500", status: "RETURNED" },
    { name: "Approved", stat: approved.toString(), icon: CheckCircle, color: "text-green-500", status: "APPROVED" },
  ];

  const getStatusColor = (status: string) => {
    switch(status) { case 'DRAFT': return 'bg-gray-100 text-gray-800'; case 'SUBMITTED': return 'bg-blue-100 text-blue-800'; case 'RETURNED': return 'bg-amber-100 text-amber-800'; case 'APPROVED': return 'bg-green-100 text-green-800'; default: return 'bg-gray-100 text-gray-800'; }
  };

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Link 
            key={item.name} 
            to={`/cir?status=${item.status}`}
            className="relative overflow-hidden rounded-lg bg-white p-5 shadow ring-1 ring-black/5 hover:ring-accent/50 transition-all hover:shadow-md cursor-pointer group"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color.replace('text-', 'bg-').replace('-500', '-50')} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1"><p className="text-2xl font-semibold text-gray-900">{item.stat}</p></dd>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-base font-semibold leading-6 text-gray-900">My Recent Submissions</h2>
            <p className="mt-2 text-sm text-gray-700">A list of all the CIS records you have recently created or modified.</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link to="/cir/new" className="block rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-accent/90">New CIS Record</Link>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">CIS Number</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">View</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentCirs.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-500">No CIS records yet. Create your first one!</td></tr>
                    ) : recentCirs.map(cir => (
                      <tr key={cir.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{cir.cir_number.replace('CIR', 'CIS')}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cir.form_data?.partDescription || cir.form_data?.formData?.partDescription || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm"><span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(cir.status)}`}>{cir.status}</span></td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {(cir.status === 'DRAFT' || cir.status === 'RETURNED') && (
                            <Link to={`/cir/${cir.cir_number}/edit`} className="text-amber-600 hover:text-amber-900 mr-4">Edit</Link>
                          )}
                          <Link to={`/cir/${cir.cir_number}`} className="text-primary hover:text-accent">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
