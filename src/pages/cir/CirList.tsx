import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Filter, Download, X, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";

interface CirRecord {
  id: string;
  cir_number: string;
  status: string;
  initiator_name: string;
  form_data: any;
  created_at: string;
}

export default function CirList() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Sync filter if URL changes (e.g. clicking a dashboard link while already on the list)
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
  }, [searchParams]);
  const [records, setRecords] = useState<CirRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data, error } = await supabase
          .from("cir_records")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRecords(data || []);
      } catch (e) {
        console.error("Error fetching CIR records:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const statuses = ["ALL", "DRAFT", "SUBMITTED", "CHECKED", "APPROVED", "REJECTED", "RETURNED"];

  const filteredRecords = useMemo(() => {
    return records.filter(cir => {
      const desc = cir.form_data?.partDescription || cir.form_data?.formData?.partDescription || "";
      const customer = cir.form_data?.customerName || cir.form_data?.formData?.customerName || "";
      const category = cir.form_data?.partCategory || cir.form_data?.formData?.partCategory || "";

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches = cir.cir_number.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q) ||
          customer.toLowerCase().includes(q) ||
          category.toLowerCase().includes(q) ||
          (cir.initiator_name || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== "ALL" && cir.status !== statusFilter) return false;
      return true;
    });
  }, [records, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'RETURNED': return 'bg-amber-100 text-amber-800';
      case 'CHECKED': return 'bg-indigo-100 text-indigo-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    const headers = "CIS No.,Part Description,Customer,Category,Date,Status,Initiator";
    const rows = filteredRecords.map(r => {
      const desc = r.form_data?.partDescription || r.form_data?.formData?.partDescription || "";
      const customer = r.form_data?.customerName || r.form_data?.formData?.customerName || "";
      const category = r.form_data?.partCategory || r.form_data?.formData?.partCategory || "";
      const date = r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "";
      return [r.cir_number.replace('CIR', 'CIS'), '"' + desc + '"', '"' + customer + '"', category, date, r.status, r.initiator_name || ""].join(",");
    });
    const csv = headers + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cir-records-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Customer Input Requirements
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            A list of all CIS records available to your role ({user?.role.replace("_", " ")}).
          </p>
        </div>
        <div className="mt-4 flex sm:ml-16 sm:mt-0 space-x-3">
          {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Download className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
              Export
            </button>
          )}

          {(user?.role === "INITIATOR" || user?.role === "SUPER_ADMIN") && (
            <Link
              to="/cir/new"
              className="inline-flex items-center rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              New CIS
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 shadow sm:rounded-lg gap-4">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            placeholder="Search CIS No., Description, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={"inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset " +
              (statusFilter !== "ALL" ? "bg-accent/10 text-accent ring-accent/30" : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50")}
          >
            <Filter className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            {statusFilter !== "ALL" ? statusFilter : "Filters"}
            {statusFilter !== "ALL" && (
              <button onClick={(e) => { e.stopPropagation(); setStatusFilter("ALL"); }} className="ml-2">
                <X className="h-3 w-3" />
              </button>
            )}
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div className="bg-white p-4 shadow sm:rounded-lg flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">Status:</span>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setShowFilterPanel(false); }}
              className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " +
                (statusFilter === s ? "bg-accent text-white border-accent" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")}
            >
              {s === "ALL" ? "All Statuses" : s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">CIS No.</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Part Description</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading records...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        {records.length === 0 ? "No CIS records yet. Click \"+ New CIS\" to create one." : "No CIS records match your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((cir) => {
                      const desc = cir.form_data?.partDescription || cir.form_data?.formData?.partDescription || "—";
                      const customer = cir.form_data?.customerName || cir.form_data?.formData?.customerName || "—";
                      const category = cir.form_data?.partCategory || cir.form_data?.formData?.partCategory || "—";
                      const date = cir.created_at ? new Date(cir.created_at).toISOString().slice(0, 10) : "—";
                      return (
                        <tr key={cir.id} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{cir.cir_number.replace('CIR', 'CIS')}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{desc}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{category}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{date}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={"inline-flex items-center rounded-full px-2 py-1 text-xs font-medium " + getStatusColor(cir.status)}>
                              {cir.status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {(cir.status === 'DRAFT' || cir.status === 'RETURNED') && (
                              <Link to={`/cir/${cir.cir_number}/edit`} className="text-amber-600 hover:text-amber-900 mr-4 font-semibold">
                                Edit
                              </Link>
                            )}
                            <Link to={"/cir/" + cir.cir_number} className="text-primary hover:text-accent font-semibold">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-right">
        Showing {filteredRecords.length} of {records.length} records
      </div>
    </div>
  );
}
