import { Settings as SettingsIcon, Bell, Lock, Building2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Settings() {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Form state
  const [companyName, setCompanyName] = useState("EMMFORCE");
  const [supportEmail, setSupportEmail] = useState("support@emmforce.com");
  const [autoSaveInterval, setAutoSaveInterval] = useState(60);
  const [notifSubmit, setNotifSubmit] = useState(true);
  const [notifApprove, setNotifApprove] = useState(true);
  const [notifReject, setNotifReject] = useState(true);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          id: "general",
          company_name: companyName,
          support_email: supportEmail,
          auto_save_interval: autoSaveInterval,
          notifications: { submit: notifSubmit, approve: notifApprove, reject: notifReject },
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (e) {
      console.error("Error saving settings", e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
            <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
            System Settings
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Configure application variables, email notifications, and overall portal preferences.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex space-x-3">
          <button
            onClick={handleSave}
            type="button"
            disabled={saveStatus === "saving"}
            className={"inline-flex justify-center items-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm " +
              (saveStatus === "saved" ? "bg-green-600 text-white" :
               saveStatus === "error" ? "bg-red-600 text-white" :
               "bg-accent text-white hover:bg-accent/90")}
          >
            {saveStatus === "saving" ? "Saving..." :
             saveStatus === "saved" ? "✓ Saved!" :
             saveStatus === "error" ? "Error — Retry" :
             "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">

          {/* General Info */}
          <li className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-4 w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Company Information</h3>
                <p className="mt-1 text-sm text-gray-500">Company details used in PDFs, emails, and branding.</p>
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 pl-1 w-full max-w-2xl">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 sm:text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Support Email</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 sm:text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Notifications */}
          <li className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Email Notifications</h3>
                <p className="mt-1 text-sm text-gray-500">Enable or disable workflow email triggers.</p>
                <div className="mt-4 space-y-4 pl-1">
                  <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                        id="notif-submit"
                        type="checkbox"
                        checked={notifSubmit}
                        onChange={() => setNotifSubmit(!notifSubmit)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="notif-submit" className="font-medium text-gray-900">CIR Submissions</label>
                      <p className="text-gray-500">Notify Checkers when a new draft is submitted.</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                        id="notif-approve"
                        type="checkbox"
                        checked={notifApprove}
                        onChange={() => setNotifApprove(!notifApprove)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="notif-approve" className="font-medium text-gray-900">Final Approvals</label>
                      <p className="text-gray-500">Send PDF & approval notification to Engineering and the Initiator.</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                        id="notif-reject"
                        type="checkbox"
                        checked={notifReject}
                        onChange={() => setNotifReject(!notifReject)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="notif-reject" className="font-medium text-gray-900">Rejections / Returns</label>
                      <p className="text-gray-500">Notify Initiator when CIR is returned or rejected with comments.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Security */}
          <li className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Security & Session</h3>
                <p className="mt-1 text-sm text-gray-500">Configure strict access controls and auto-save behavior.</p>
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 pl-1 max-w-sm">
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Auto-Save Interval (Seconds)</label>
                    <input
                      type="number"
                      value={autoSaveInterval}
                      onChange={(e) => setAutoSaveInterval(parseInt(e.target.value) || 60)}
                      min={10}
                      max={600}
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 sm:text-sm focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-gray-400">CIR drafts will auto-save at this interval. Minimum 10s.</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
