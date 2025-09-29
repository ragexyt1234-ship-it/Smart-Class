import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

export const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { profile, loading: profileLoading } = useProfile(user);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout profile={profile}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard profile={profile} />} />
        <Route path="/students" element={<div>Students Page - Coming Soon</div>} />
        <Route path="/tests" element={<div>Tests Page - Coming Soon</div>} />
        <Route path="/attendance" element={<div>Attendance Page - Coming Soon</div>} />
        <Route path="/events" element={<div>Events Page - Coming Soon</div>} />
        <Route path="/qr-scan" element={<div>QR Scan Page - Coming Soon</div>} />
        <Route path="/admin" element={<div>Admin Panel - Coming Soon</div>} />
      </Routes>
    </DashboardLayout>
  );
};
