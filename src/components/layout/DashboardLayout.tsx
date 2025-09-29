import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  FileText, 
  Calendar, 
  QrCode, 
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Profile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

export const DashboardLayout = ({ children, profile }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-student text-student-foreground';
      case 'teacher': return 'bg-teacher text-teacher-foreground';
      case 'admin': return 'bg-admin text-admin-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: GraduationCap },
    ];

    const studentItems = [
      { name: 'My Attendance', href: '/attendance', icon: UserCheck },
      { name: 'My Tests', href: '/tests', icon: FileText },
      { name: 'Events', href: '/events', icon: Calendar },
      { name: 'QR Scan', href: '/qr-scan', icon: QrCode },
    ];

    const teacherItems = [
      { name: 'Students', href: '/students', icon: Users },
      { name: 'Tests', href: '/tests', icon: FileText },
      { name: 'Attendance', href: '/attendance', icon: UserCheck },
      { name: 'Events', href: '/events', icon: Calendar },
    ];

    const adminItems = [
      { name: 'Students', href: '/students', icon: Users },
      { name: 'Tests', href: '/tests', icon: FileText },
      { name: 'Attendance', href: '/attendance', icon: UserCheck },
      { name: 'Events', href: '/events', icon: Calendar },
      { name: 'Admin Panel', href: '/admin', icon: Settings },
    ];

    switch (profile.role) {
      case 'student':
        return [...baseItems, ...studentItems];
      case 'teacher':
        return [...baseItems, ...teacherItems];
      case 'admin':
        return [...baseItems, ...adminItems];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 transform bg-card border-r transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRoleColor(profile.role)}`}>
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Smart Class</h2>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="p-4 border-b">
            <div className="text-sm font-medium">{profile.name}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
              {profile.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
