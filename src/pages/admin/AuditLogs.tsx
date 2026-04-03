import { Activity, Search, Filter, Download, Loader2, RefreshCw, ShieldCheck, User, Settings2, FileText } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  user_name: string;
  user_role: string;
  details: string;
  timestamp: string;
}

const ACTION_COLORS: Record<string, string> = {
  STATUS_CHANGE: "bg-blue-100 text-blue-800",
  CREATE:        "bg-green-100 text-green-800",
  LOGIN:         "bg-gray-100 text-gray-800",
  USER_MODIFIED: "bg-amber-100 text-amber-800",
  SECTION_ACCESS:"bg-purple-100 text-purple-800",
  FORM_CONFIG:   "bg-indigo-100 text-indigo-800",
  DELETE:        "bg-red-100 text-red-800",
};

const ACTION_ICONS: Record<string, any> = {
  STATUS_CHANGE: FileText,
  CREATE:        FileText,
  LOGIN:         User,
  USER_MODIFIED: User,
  SECTION_ACCESS:ShieldCheck,
  FORM_CONFIG:   Settings2,
};

export default function AuditLogs() {
  const [searchTerm, setSearchTerm]   = useState("");
  const [dateFilter, setDateFilter]   = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [logs, setLogs]               = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs(data || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Error fetching audit logs:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        (log.entity      || "").toLowerCase().includes(q) ||
        (log.user_name   || "").toLowerCase().includes(q) ||
        (log.action      || "").toLowerCase().includes(q) ||
        (log.details     || "").toLowerCase().includes(q) ||
        (log.user_role   || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter && log.action !== actionFilter) return false;
    if (dateFilter && (!log.timestamp || !log.timestamp.startsWith(dateFilter))) return false;
    return true;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();

  const handleExportCSV = () => {
    const headers = "Timestamp,User,Role,Action,Entity,Details";
    const rows = filteredLogs.map(log =>
      [
        log.timestamp ? new Date(log.timestamp).toLocaleString() : "",
        log.user_name  || "",
        log.user_role  || "",
        log.action     || "",
        log.entity     || "",
        `"${(log.details || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const blob = new Blob(["\uFEFF" + headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl flex items-center">
            <Activity className="mr-3 h-8 w-8 text-primary" />
            System Audit Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Immutable log of all critical actions, status changes, and authentications.
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4 text-gray-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: logs.length, color: "text-gray-900" },
          { label: "Status Changes", value: logs.filter(l => l.action === "STATUS_CHANGE").length, color: "text-blue-600" },
          { label: "CIRs Created", value: logs.filter(l => l.action === "CREATE").length, color: "text-green-600" },
          { label: "Filtered Results", value: filteredLogs.length, color: "text-primary" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 shadow sm:rounded-lg">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm"
            placeholder="Search by user, entity, action, details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
          />
          {(searchTerm || actionFilter || dateFilter) && (
            <button
              onClick={() => { setSearchTerm(""); setActionFilter(""); setDateFilter(""); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Timestamp</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">User (Role)</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Entity / CIR</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading audit logs...
                    </td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center">
                      <Activity className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-500">
                        {logs.length === 0 ? "No audit logs yet." : "No logs match your filters."}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {logs.length === 0
                          ? "Logs are recorded when users take actions (Check, Approve, Reject, etc.)"
                          : "Try clearing your search or date filter."}
                      </p>
                    </td></tr>
                  ) : (
                    filteredLogs.map(log => {
                      const Icon = ACTION_ICONS[log.action] || Activity;
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-xs text-gray-500 sm:pl-6">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {(log.user_name || "?")[0].toUpperCase()}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{log.user_name || "—"}</p>
                                <p className="text-xs text-gray-400">{log.user_role || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}>
                              <Icon className="h-3 w-3" />
                              {log.action || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-primary font-medium">
                            {log.entity || "—"}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-sm">
                            <p className="truncate" title={log.details || ""}>{log.details || "—"}</p>
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
        Showing {filteredLogs.length} of {logs.length} entries
      </div>
    </div>
  );
}
