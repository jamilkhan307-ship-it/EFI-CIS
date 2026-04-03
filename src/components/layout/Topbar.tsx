import { useAuthStore } from "../../store/useAuthStore";
import { Bell, UserCircle, LogOut } from "lucide-react";

export default function Topbar() {
  const { user, signOut } = useAuthStore();

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1">
          {/* Add global search here if needed */}
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {/* Example notification badge */}
            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-accent"></span>
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="flex items-center gap-x-4">
            <div className="hidden lg:flex lg:items-center">
              <span className="flex flex-col items-end mr-4">
                <span className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user?.name || "User"}
                </span>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 rounded-full inline-block mt-1 mb-1">
                  {user?.role?.replace("_", " ")}
                </span>
              </span>
              <UserCircle className="h-8 w-8 text-gray-400" aria-hidden="true" />
            </div>
            {/* Sign Out Button */}
            <button
              onClick={() => {
                console.log("Sign out button clicked");
                signOut();
              }}
              className="flex items-center gap-x-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 shadow-sm hover:shadow-md"
              title="Log out of session"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
