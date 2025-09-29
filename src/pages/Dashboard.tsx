import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/hooks/useProfile";
import { 
  Users, 
  FileText, 
  Calendar, 
  UserCheck, 
  TrendingUp,
  BookOpen,
  Clock,
  Target,
  QrCode
} from "lucide-react";

interface DashboardProps {
  profile: Profile;
}

export const Dashboard = ({ profile }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    totalEvents: 0,
    attendanceRate: 0,
    recentTests: [],
    upcomingEvents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch different data based on role
      if (profile.role === 'student') {
        await fetchStudentData();
      } else if (profile.role === 'teacher') {
        await fetchTeacherData();
      } else if (profile.role === 'admin') {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    // Fetch student-specific data
    const [eventsResponse, attendanceResponse] = await Promise.all([
      supabase.from('events').select('*').limit(5),
      supabase.from('attendance').select('*, attendance_sessions(*)')
        .eq('student_id', profile.id)
        .limit(10)
    ]);

    setStats({
      totalStudents: 0,
      totalTests: 0,
      totalEvents: eventsResponse.data?.length || 0,
      attendanceRate: calculateAttendanceRate(attendanceResponse.data || []),
      recentTests: [],
      upcomingEvents: eventsResponse.data || []
    });
  };

  const fetchTeacherData = async () => {
    // Fetch teacher-specific data
    const [studentsResponse, testsResponse, eventsResponse] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('tests').select('*').eq('created_by', profile.user_id),
      supabase.from('events').select('*').limit(5)
    ]);

    setStats({
      totalStudents: studentsResponse.data?.length || 0,
      totalTests: testsResponse.data?.length || 0,
      totalEvents: eventsResponse.data?.length || 0,
      attendanceRate: 0,
      recentTests: testsResponse.data?.slice(0, 5) || [],
      upcomingEvents: eventsResponse.data || []
    });
  };

  const fetchAdminData = async () => {
    // Fetch admin-specific data (all data)
    const [studentsResponse, testsResponse, eventsResponse, attendanceResponse] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('tests').select('*'),
      supabase.from('events').select('*').limit(5),
      supabase.from('attendance').select('*')
    ]);

    setStats({
      totalStudents: studentsResponse.data?.length || 0,
      totalTests: testsResponse.data?.length || 0,
      totalEvents: eventsResponse.data?.length || 0,
      attendanceRate: calculateAttendanceRate(attendanceResponse.data || []),
      recentTests: testsResponse.data?.slice(0, 5) || [],
      upcomingEvents: eventsResponse.data || []
    });
  };

  const calculateAttendanceRate = (attendance: any[]) => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const getRoleSpecificCards = () => {
    switch (profile.role) {
      case 'student':
        return [
          {
            title: "My Attendance Rate",
            value: `${stats.attendanceRate}%`,
            icon: UserCheck,
            description: "Overall attendance",
            color: "text-success"
          },
          {
            title: "Upcoming Events",
            value: stats.totalEvents.toString(),
            icon: Calendar,
            description: "Events this month",
            color: "text-primary"
          }
        ];
      
      case 'teacher':
        return [
          {
            title: "Total Students",
            value: stats.totalStudents.toString(),
            icon: Users,
            description: "Across all classes",
            color: "text-student"
          },
          {
            title: "Tests Created",
            value: stats.totalTests.toString(),
            icon: FileText,
            description: "This semester",
            color: "text-teacher"
          },
          {
            title: "Upcoming Events",
            value: stats.totalEvents.toString(),
            icon: Calendar,
            description: "Events this month",
            color: "text-primary"
          }
        ];
      
      case 'admin':
        return [
          {
            title: "Total Students",
            value: stats.totalStudents.toString(),
            icon: Users,
            description: "Enrolled students",
            color: "text-student"
          },
          {
            title: "Total Tests",
            value: stats.totalTests.toString(),
            icon: FileText,
            description: "All tests",
            color: "text-teacher"
          },
          {
            title: "Overall Attendance",
            value: `${stats.attendanceRate}%`,
            icon: UserCheck,
            description: "System-wide",
            color: "text-success"
          },
          {
            title: "Active Events",
            value: stats.totalEvents.toString(),
            icon: Calendar,
            description: "Current events",
            color: "text-primary"
          }
        ];
      
      default:
        return [];
    }
  };

  const getWelcomeMessage = () => {
    const time = new Date().getHours();
    const greeting = time < 12 ? 'Good morning' : time < 18 ? 'Good afternoon' : 'Good evening';
    
    return `${greeting}, ${profile.name}!`;
  };

  const roleCards = getRoleSpecificCards();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">{getWelcomeMessage()}</h1>
        <p className="text-primary-foreground/80">
          Welcome to your {profile.role} dashboard. Here's your overview for today.
        </p>
        <Badge variant="secondary" className="mt-3 bg-primary-foreground/20 text-primary-foreground">
          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Dashboard
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roleCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.role === 'student' && (
              <>
                <div className="flex items-center p-3 bg-student/10 rounded-lg">
                  <QrCode className="mr-3 h-4 w-4 text-student" />
                  <span className="text-sm">Scan QR for attendance</span>
                </div>
                <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                  <FileText className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">View test results</span>
                </div>
              </>
            )}
            {profile.role === 'teacher' && (
              <>
                <div className="flex items-center p-3 bg-teacher/10 rounded-lg">
                  <UserCheck className="mr-3 h-4 w-4 text-teacher" />
                  <span className="text-sm">Start attendance session</span>
                </div>
                <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                  <FileText className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Create new test</span>
                </div>
              </>
            )}
            {profile.role === 'admin' && (
              <>
                <div className="flex items-center p-3 bg-admin/10 rounded-lg">
                  <Users className="mr-3 h-4 w-4 text-admin" />
                  <span className="text-sm">Manage students</span>
                </div>
                <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                  <Calendar className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Create events</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                No recent activity to display.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
