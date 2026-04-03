import { useState, useEffect } from "react";
import type { UserProfile } from "../../types";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";
import { Users as UsersIcon, UserPlus, Pencil, Trash2, X, Search } from "lucide-react";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "INITIATOR" | "CHECKER" | "APPROVER" | "ENGINEERING";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "INITIATOR", label: "Initiator" },
  { value: "CHECKER", label: "Checker" },
  { value: "APPROVER", label: "Approver" },
  { value: "ENGINEERING", label: "Engineering" },
];



export default function Users() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<string[]>(["IT", "Sales", "Quality", "Engineering"]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "INITIATOR" as UserRole,
    department: "Sales",
    isActive: true,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data) {
          const mapped: UserProfile[] = data.map((u: any) => ({
            uid: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department || "",
            isActive: u.is_active,
            lastLogin: u.last_login,
          }));
          setUsers(mapped);
        } else {
          setUsers([]);
        }
      } catch (e) {
        console.error("Error fetching users", e);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from("master_departments")
          .select("name")
          .eq("is_active", true)
          .order("name", { ascending: true });
        
        if (!error && data) {
          setDepartments(data.map(d => d.name));
        }
      } catch (e) {
        console.error("Error fetching departments", e);
      }
    };

    fetchUsers();
    fetchDepartments();
  }, []);

  // Filter
  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "INITIATOR", department: "Sales", isActive: true });
    setShowModal(true);
  };

  const openEdit = (u: UserProfile) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role as UserRole, department: u.department, isActive: u.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Name and Email are required.");
      return;
    }

    if (editingUser) {
      // Update existing
      const updated: UserProfile = { ...editingUser, ...formData };
      setUsers(users.map(u => u.uid === editingUser.uid ? updated : u));
      try {
        await supabase
          .from("users")
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            is_active: formData.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingUser.uid);
      } catch (e) { console.error("Error updating user in Supabase", e); }
    } else {
      // Add new
      try {
        const { data, error } = await supabase
          .from("users")
          .insert({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            is_active: formData.isActive,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newUser: UserProfile = {
            uid: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            department: data.department || "",
            isActive: data.is_active,
          };
          setUsers([...users, newUser]);
        }
      } catch (e) {
        console.error("Error creating user in Supabase", e);
        // Fallback: add locally
        const newUid = "user-" + Date.now();
        const newUser: UserProfile = { uid: newUid, ...formData };
        setUsers([...users, newUser]);
      }
    }
    setShowModal(false);
  };

  const handleToggleActive = async (uid: string) => {
    const user = users.find(u => u.uid === uid);
    if (!user) return;
    const newActive = !user.isActive;
    setUsers(users.map(u => u.uid === uid ? { ...u, isActive: newActive } : u));
    try {
      await supabase.from("users").update({ is_active: newActive, updated_at: new Date().toISOString() }).eq("id", uid);
    } catch (e) { console.error("Error toggling user active status", e); }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    setUsers(users.filter(u => u.uid !== uid));
    try {
      await supabase.from("users").delete().eq("id", uid);
    } catch (e) { console.error("Error deleting user", e); }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-purple-50 text-purple-700 ring-purple-700/10";
      case "ADMIN": return "bg-blue-50 text-blue-700 ring-blue-700/10";
      case "APPROVER": return "bg-green-50 text-green-700 ring-green-700/10";
      case "CHECKER": return "bg-indigo-50 text-indigo-700 ring-indigo-700/10";
      case "ENGINEERING": return "bg-amber-50 text-amber-700 ring-amber-700/10";
      default: return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
            <UsersIcon className="mr-3 h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage users, roles, departments, and access across the EMMFORCE CIR Portal.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center rounded-md bg-accent px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-accent/90"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 shadow sm:rounded-lg">
        <div className="relative max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
            placeholder="Search by name, email, role, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Department</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">Loading users...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">No users match your search.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className={"hover:bg-gray-50 transition-colors " + (!u.isActive ? "opacity-60" : "")}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 mr-3">
                              <span className="text-sm font-medium leading-none text-white">{u.name.charAt(0)}</span>
                            </span>
                            {u.name}
                            {u.uid === currentUser?.uid && <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">You</span>}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset " + getRoleColor(u.role)}>
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{u.department}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <button
                            onClick={() => handleToggleActive(u.uid)}
                            className={"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer " +
                              (u.isActive ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100" : "bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100")}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                          <button onClick={() => openEdit(u)} className="text-primary hover:text-accent inline-flex items-center">
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </button>
                          {u.uid !== currentUser?.uid && (
                            <button onClick={() => handleDelete(u.uid)} className="text-red-500 hover:text-red-700 inline-flex items-center">
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-right">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75" onClick={() => setShowModal(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-6 pb-6 pt-5 shadow-xl sm:w-full sm:max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                      placeholder="John Doe"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                      placeholder="user@emmforce.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                  />
                  Active (can access the portal)
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setShowModal(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90">
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
