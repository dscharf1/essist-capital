import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-lg font-semibold hidden sm:block">Home Improvement Finance</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">AD</span>
              </div>
            </div>
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
