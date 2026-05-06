import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileCheck,
  Shield, MessageSquare, Bell, LogOut, X,
} from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { label: "Dashboard",     href: "/admin",                 icon: LayoutDashboard, exact: true },
  { label: "Applications",  href: "/admin/approvals",        icon: FileCheck },
  { label: "Clients",       href: "/admin/clients",          icon: Users },
  { label: "Audit Log",     href: "/admin/audit-log",        icon: Shield },
];

const secondary = [
  { label: "Messages",      href: "/admin/contact-messages", icon: MessageSquare },
  { label: "Notifications", href: "/admin/notifications",    icon: Bell },
];

interface Props { onClose?: () => void; }

const AdminSidebar = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleExit = async () => { await signOut(); navigate("/"); };

  const link = (item: { label: string; href: string; icon: React.ElementType; exact?: boolean }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.href}
        to={item.href}
        end={item.exact}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            isActive
              ? "bg-[#0d9488]/15 text-[#0d9488]"
              : "text-white/45 hover:text-white/80 hover:bg-white/6"
          }`
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        {item.label}
      </NavLink>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d1f1e" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <LogoIcon size={28} />
          <div>
            <p className="text-white text-sm font-bold leading-none">Essist</p>
            <p className="text-[#0d9488] text-[10px] font-semibold tracking-widest uppercase leading-none mt-0.5">Admin</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {nav.map(link)}

        <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {secondary.map(link)}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={handleExit}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Exit Admin
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
