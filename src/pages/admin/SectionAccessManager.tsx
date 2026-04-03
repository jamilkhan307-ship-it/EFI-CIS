import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import type { UserProfile, SectionAccessLevel, FormSectionConfig } from "../../types";
import { FALLBACK_FORM_CONFIG } from "../../lib/fallback-form-config";
import { Shield, Users as UsersIcon, Search, Save, RotateCcw } from "lucide-react";

export default function SectionAccessManager() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [sections] = useState<FormSectionConfig[]>(FALLBACK_FORM_CONFIG);
  const [overrides, setOverrides] = useState<Record<string, SectionAccessLevel>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;

        let fetchedUsers: UserProfile[] = [];
        if (data && data.length > 0) {
          fetchedUsers = data.map((u: any) => ({
            uid: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department || "",
            isActive: u.is_active,
          }));
        } else {
          fetchedUsers = [
            { uid: "1", name: "System Admin", email: "admin@emmforce.com", role: "SUPER_ADMIN", department: "IT", isActive: true },
            { uid: "2", name: "Rajesh Sharma", email: "rajesh@emmforce.com", role: "INITIATOR", department: "Sales", isActive: true },
            { uid: "3", name: "Priya Patel", email: "priya@emmforce.com", role: "CHECKER", department: "Quality", isActive: true },
            { uid: "4", name: "Amit Kumar", email: "amit@emmforce.com", role: "ENGINEERING", department: "Engineering", isActive: true },
            { uid: "5", name: "Deepak Verma", email: "deepak@emmforce.com", role: "APPROVER", department: "Management", isActive: true },
            { uid: "6", name: "Sunil Mehta", email: "sunil@emmforce.com", role: "INITIATOR", department: "Business Dev", isActive: true }
          ];
        }
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (e) {
        console.error("Error fetching users", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter Users
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowerQ = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u =>
        u.name.toLowerCase().includes(lowerQ) ||
        u.role.toLowerCase().includes(lowerQ) ||
        u.department.toLowerCase().includes(lowerQ)
      ));
    }
  }, [searchQuery, users]);

  // Load Overrides when a user is selected
  useEffect(() => {
    if (!selectedUser) return;

    const fetchOverrides = async () => {
      try {
        const { data, error } = await supabase
          .from("section_access_overrides")
          .select("*")
          .eq("user_id", selectedUser.uid)
          .single();

        if (!error && data) {
          setOverrides((data.overrides as Record<string, SectionAccessLevel>) || {});
        } else {
          const defaults: Record<string, SectionAccessLevel> = {};
          sections.forEach(s => { defaults[s.sectionId] = "role_default"; });
          setOverrides(defaults);
        }
      } catch (e) {
        console.error("Error fetching overrides", e);
        const defaults: Record<string, SectionAccessLevel> = {};
        sections.forEach(s => { defaults[s.sectionId] = "role_default"; });
        setOverrides(defaults);
      }
    };

    fetchOverrides();
  }, [selectedUser, sections]);

  const handleOverrideChange = (sectionId: string, level: SectionAccessLevel) => {
    setOverrides(prev => ({ ...prev, [sectionId]: level }));
  };

  const handleReset = () => {
    const defaults: Record<string, SectionAccessLevel> = {};
    sections.forEach(s => { defaults[s.sectionId] = "role_default"; });
    setOverrides(defaults);
  };

  const handleSave = async () => {
    if (!selectedUser || !currentUser) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("section_access_overrides")
        .upsert({
          user_id: selectedUser.uid,
          user_name: selectedUser.name,
          user_role: selectedUser.role,
          overrides: overrides,
          last_updated_by: currentUser.name,
          last_updated_at: new Date().toISOString()
        });
      if (error) throw error;

      // Audit log
      const actionText = "Updated section access overrides for user " + selectedUser.name + " (" + selectedUser.role + ")";
      await supabase
        .from("form_change_logs")
        .insert({
          changed_by: currentUser.name,
          action: actionText,
          previous_value: null,
          new_value: overrides
        });

      alert("Overrides saved successfully!");
    } catch (e) {
      console.error("Error saving overrides", e);
      alert("Failed to save overrides.");
    } finally {
      setIsSaving(false);
    }
  };

  const getOverrideColor = (level: SectionAccessLevel) => {
    if (level === "no_access") return "bg-red-50 border-red-300 text-red-900";
    if (level === "view_only") return "bg-blue-50 border-blue-300 text-blue-900";
    if (level === "full_access") return "bg-green-50 border-green-300 text-green-900";
    return "";
  };

  const countActiveOverrides = () => {
    return Object.values(overrides).filter(v => v !== "role_default").length;
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
            <Shield className="mr-3 h-8 w-8 text-primary" />
            Section Access Manager
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Override role-based section visibility for specific users. Grant full access, view-only, or hide sections entirely.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[70vh]">
        {/* Left Panel: User List */}
        <div className="w-full lg:w-1/3 bg-white shadow rounded-lg flex flex-col overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Search by name, role, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No users found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredUsers.map(u => {
                  const isSelected = selectedUser?.uid === u.uid;
                  const borderCls = isSelected ? "bg-blue-50 border-l-4 border-primary" : "border-l-4 border-transparent";
                  return (
                    <li
                      key={u.uid}
                      onClick={() => setSelectedUser(u)}
                      className={"p-4 cursor-pointer hover:bg-blue-50 transition-colors " + borderCls}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-500">
                          <span className="text-sm font-medium leading-none text-white">{u.name.charAt(0)}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="truncate text-xs text-gray-500">{u.role.replace("_", " ")} &bull; {u.department}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Panel: Override Grid */}
        <div className="w-full lg:w-2/3 bg-white shadow rounded-lg flex flex-col border border-gray-200">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <UsersIcon className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">Select a user from the left panel</p>
              <p className="text-sm">to manage their section access overrides.</p>
            </div>
          ) : (
            <>
              {/* User Header */}
              <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 gap-4">
                <div className="flex items-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary mr-4">
                    <span className="text-lg font-medium leading-none text-white">{selectedUser.name.charAt(0)}</span>
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-500">
                      Role: <span className="font-semibold">{selectedUser.role.replace("_", " ")}</span>
                      {" "}&bull;{" "}
                      {countActiveOverrides() > 0 ? (
                        <span className="text-amber-600 font-medium">{countActiveOverrides()} override(s) active</span>
                      ) : (
                        <span className="text-gray-400">All sections use role defaults</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset All
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Overrides"}
                  </button>
                </div>
              </div>

              {/* Section Cards */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sections.map(section => {
                    const currentLevel = overrides[section.sectionId] || "role_default";
                    const isOverridden = currentLevel !== "role_default";
                    const colorCls = isOverridden ? getOverrideColor(currentLevel) : "border-gray-300 bg-white";
                    return (
                      <div
                        key={section.sectionId}
                        className={"relative flex flex-col rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow " + colorCls}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-900">
                            Section {section.sectionId}: {section.sectionLabel}
                          </span>
                          {isOverridden && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Overridden
                            </span>
                          )}
                        </div>

                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Access Level</label>
                          <select
                            value={currentLevel}
                            onChange={(e) => handleOverrideChange(section.sectionId, e.target.value as SectionAccessLevel)}
                            className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                          >
                            <option value="role_default">🔵 Role Default</option>
                            <option value="full_access">✅ Full Access (View &amp; Edit)</option>
                            <option value="view_only">👁 View Only</option>
                            <option value="no_access">🚫 No Access (Hidden)</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
