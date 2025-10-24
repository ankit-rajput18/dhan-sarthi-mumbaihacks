import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 sm:h-16 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between mobile-container">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden md:flex items-center space-x-2 max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search transactions..." 
                    className="pl-10 bg-background/50"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 md:hidden">
                <div className="w-6 h-6 rounded overflow-hidden">
                  <img 
                    src="/logo.jpg" 
                    alt="Dhan-Sarthi Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-semibold text-gradient">Dhan-Sarthi</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} className="sm:hidden h-8 w-8 p-0">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-0 p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}