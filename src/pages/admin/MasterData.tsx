import { Database, Plus, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface MasterRecord {
  id: string;
  name: string;
  isActive: boolean;
}

// Maps tab IDs to Supabase table names
const TABLE_MAP: Record<string, string> = {
  customers: "master_customers",
  categories: "master_categories",
  packaging: "master_packaging",
  ppap: "master_ppap_levels",
  materials: "master_materials",
  departments: "master_departments",
};

export default function MasterData() {
  const [activeTab, setActiveTab] = useState("customers");
  const [data, setData] = useState<Record<string, MasterRecord[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MasterRecord | null>(null);
  const [formName, setFormName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: "customers", name: "Customers" },
    { id: "categories", name: "Part Categories" },
    { id: "packaging", name: "Packaging Types" },
    { id: "ppap", name: "PPAP Levels" },
    { id: "materials", name: "Material Standards" },
    { id: "departments", name: "Departments" },
  ];

  // Fetch all master data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const result: Record<string, MasterRecord[]> = {};
      for (const [tabId, table] of Object.entries(TABLE_MAP)) {
        try {
          const { data: rows, error } = await supabase
            .from(table)
            .select("*")
            .order("created_at", { ascending: true });
          if (error) throw error;
          result[tabId] = (rows || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            isActive: r.is_active,
          }));
        } catch (e) {
          console.error(`Error fetching ${table}:`, e);
          result[tabId] = [];
        }
      }
      setData(result);
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  const currentData = data[activeTab] || [];

  const openAdd = () => {
    setEditItem(null);
    setFormName("");
    setShowModal(true);
  };

  const openEdit = (item: MasterRecord) => {
    setEditItem(item);
    setFormName(item.name);
    setShowModal(true);
  };

  const handleSaveRecord = async () => {
    if (!formName.trim()) { alert("Name is required."); return; }

    const table = TABLE_MAP[activeTab];
    if (editItem) {
      // Update in Supabase
      const { error } = await supabase.from(table).update({ name: formName.trim() }).eq("id", editItem.id);
      if (error) { console.error("Update error:", error); alert("Failed to update."); return; }
      setData(prev => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).map(r => r.id === editItem.id ? { ...r, name: formName.trim() } : r),
      }));
    } else {
      // Insert into Supabase
      const { data: newRow, error } = await supabase.from(table).insert({ name: formName.trim(), is_active: true }).select().single();
      if (error) { console.error("Insert error:", error); alert("Failed to add."); return; }
      setData(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), { id: newRow.id, name: newRow.name, isActive: newRow.is_active }],
      }));
    }
    setShowModal(false);
    setFormName("");
    setEditItem(null);
  };

  const handleToggle = async (id: string) => {
    const table = TABLE_MAP[activeTab];
    const record = currentData.find(r => r.id === id);
    if (!record) return;
    const { error } = await supabase.from(table).update({ is_active: !record.isActive }).eq("id", id);
    if (error) { console.error("Toggle error:", error); return; }
    setData(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const table = TABLE_MAP[activeTab];
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { console.error("Delete error:", error); alert("Failed to delete."); return; }
    setData(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter(r => r.id !== id)
    }));
  };

  const tabLabel = tabs.find(t => t.id === activeTab)?.name || activeTab;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
            <Database className="mr-3 h-8 w-8 text-primary" />
            Master Data
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage system-wide configuration lists and master entities.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {tabLabel}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="sm:hidden">
          <select
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.name}</option>)}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={"whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors " +
                    (activeTab === tab.id
                      ? "border-accent text-accent"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                >
                  {tab.name}
                  <span className={"ml-2 rounded-full px-2 py-0.5 text-xs " + (activeTab === tab.id ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-600")}>
                    {(data[tab.id] || []).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-sm text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-gray-500">
                    No records found. Click "Add {tabLabel}" to create one.
                  </td>
                </tr>
              ) : (
                currentData.map((record) => (
                  <tr key={record.id} className={!record.isActive ? "opacity-60 bg-gray-50" : ""}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{record.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleToggle(record.id)}
                        className={"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer " +
                          (record.isActive ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100" : "bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100")}
                      >
                        {record.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                      <button onClick={() => openEdit(record)} className="text-primary hover:text-accent inline-flex items-center">
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700 inline-flex items-center">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75" onClick={() => setShowModal(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-6 pb-6 pt-5 shadow-xl sm:w-full sm:max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editItem ? "Edit" : "Add"} {tabLabel}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={"Enter " + tabLabel.toLowerCase() + " name..."}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveRecord(); }}
                  autoFocus
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setShowModal(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveRecord} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90">
                  {editItem ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
