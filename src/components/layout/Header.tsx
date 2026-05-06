import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Shield, LogOut, LayoutDashboard, User, ChevronDown } from "lucide-react";

const navigation = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const initials = () => {
    if (profile?.first_name && profile?.last_name)
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href.replace("/#", "/").split("#")[0]) && href !== "/#how-it-works";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(5,13,26,0.96)"
          : "rgba(5,13,26,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(13,148,136,0.12)"
          : "1px solid rgba(255,255,255,0.05)",
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <Logo size="sm" light={true} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive(item.href)
                    ? "rgba(255,255,255,1)"
                    : "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = isActive(item.href)
                    ? "rgba(255,255,255,1)"
                    : "rgba(255,255,255,0.55)")
                }
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            {!isLoading && user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/90 hover:bg-white/6 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/90 hover:bg-white/6 transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:bg-white/6 rounded-xl px-2 py-1.5 transition-all">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#0d9488] text-[#0d1f1e] text-xs font-bold">
                          {initials()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52" align="end">
                    <div className="px-2 py-2">
                      <p className="text-sm font-semibold">
                        {profile?.first_name
                          ? `${profile.first_name} ${profile.last_name || ""}`
                          : "My Account"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/apply"><User className="mr-2 h-4 w-4" />New Application</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/apply"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#0d1f1e] transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #0d9488, #2dd4bf)",
                    boxShadow: "0 0 20px rgba(13,148,136,0.3)",
                  }}
                >
                  Apply Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-white/8 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-all"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-white/8 space-y-2">
              {!isLoading && user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-all">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-all">
                      <Shield className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <button onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/8 transition-all">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium border border-white/15 text-white/70 hover:bg-white/6 transition-all">
                    Log In
                  </Link>
                  <Link to="/apply" onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-[#0d1f1e] transition-all"
                    style={{ background: "linear-gradient(135deg, #0d9488, #2dd4bf)" }}>
                    Apply Now
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
