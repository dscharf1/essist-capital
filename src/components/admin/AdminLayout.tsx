import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Menu } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/admin":                    "Dashboard",
  "/admin/approvals":          "Applications",
  "/admin/clients":            "Clients",
  "/admin/audit-log":          "Audit Log",
  "/admin/contact-messages":   "Messages",
  "/admin/notifications":      "Notifications",
  "/admin/documents":          "Documents",
};

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Admin";

  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 fixed inset-y-0 left-0 z-30 shadow-xl">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 flex flex-col shadow-2xl">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0d1f1e]"
              style={{ background: "linear-gradient(135deg,#0d9488,#2dd4bf)" }}>
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
