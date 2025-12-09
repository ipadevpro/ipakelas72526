import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingCard, LoadingSkeleton } from '@/components/ui/loading';
import { AnimatedContainer, StaggeredList, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  Users, 
  BookOpen, 
  TrendUp, 
  Trophy, 
  Clock,
  Plus,
  Eye,
  ChartBar,
  Target,
  Activity,
  WarningCircle,
  CheckCircle,
  ArrowClockwise
} from 'phosphor-react';
import { classApi, studentsApi, assignmentApi, gradeApi, attendanceApi, getCurrentUser } from '@/lib/api';

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  averageGrade: number;
  todayAttendance: number;
  todayTotalRecords: number;
  pendingGrades: number;
  overdueAssignments: number;
  activeStudents: number;
}

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacherUsername: string;
  createdAt: string;
  studentCount?: number;
}

interface RealActivity {
  id: string;
  type: 'assignment' | 'grade' | 'attendance' | 'student_joined' | 'assignment_submitted';
  title: string;
  time: string;
  student?: string;
  className?: string;
  details?: any;
}

interface User {
  username: string;
  role: string;
  fullName: string;
}

interface Assignment {
  id: string;
  title: string;
  classId: string;
  className?: string;
  dueDate: string;
  status?: string;
}

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  studentUsername: string;
  status: string;
}

interface Grade {
  id: string;
  studentUsername: string;
  assignmentId: string;
  assignmentTitle?: string;
  points: number;
  feedback?: string;
  gradedAt: string;
  studentName?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    averageGrade: 0,
    todayAttendance: 0,
    todayTotalRecords: 0,
    pendingGrades: 0,
    overdueAssignments: 0,
    activeStudents: 0
  });
  
  const [recentClasses, setRecentClasses] = useState<ClassItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RealActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dataIssues, setDataIssues] = useState<{
    orphanedGrades: number;
    detectedAt: Date;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load basic data first (classes, students, assignments)
      const [
        classesResponse,
        studentsResponse,
        assignmentsResponse
      ] = await Promise.all([
        classApi.getAll(),
        studentsApi.getAll(),
        assignmentApi.getAll()
      ]);

      // Process Classes Data
      let classes: ClassItem[] = [];
      if (classesResponse.success) {
        classes = classesResponse.classes || [];
      }

      // Process Students Data
      let students: Student[] = [];
      if (studentsResponse.success) {
        students = studentsResponse.students || [];
      }

      // Process Assignments Data
      let assignments: Assignment[] = [];
      if (assignmentsResponse.success) {
        assignments = (assignmentsResponse.assignments || []).map((assignment: any) => ({
          ...assignment,
          className: classes.find(c => c.id === assignment.classId)?.name || 'Unknown Class',
          status: getAssignmentStatus(assignment.dueDate)
        }));
      } else {
        console.error('❌ Failed to load assignments:', assignmentsResponse);
      }

      // Now load grades and attendance with reference data available
      const [
        gradesResponse,
        attendanceResponse
      ] = await Promise.all([
        gradeApi.getAll(),
        attendanceApi.getAll()
      ]);

      // Process Grades Data with enhanced mapping
      let grades: Grade[] = [];
      if (gradesResponse.success) {
        
        grades = (gradesResponse.grades || []).map((grade: any) => {
          // Get assignment info for calculating enhanced data
          const assignment = assignments.find(a => a.id === grade.assignmentId);
          
          const processedGrade = {
            id: grade.id,
            studentUsername: grade.studentUsername,
            assignmentId: grade.assignmentId,
            assignmentTitle: assignment?.title || 'Unknown Assignment',
            points: grade.points || grade.value || 0, // Handle both API field variations
            feedback: grade.feedback || '',
            gradedAt: grade.gradedAt || grade.createdAt || new Date().toISOString(),
            studentName: grade.studentName || students.find(s => s.username === grade.studentUsername)?.fullName || grade.studentUsername
          };
          
          if (grade.assignmentId && !assignment) {
            console.warn('⚠️ Grade references unknown assignment:', {
              gradeId: grade.id,
              assignmentId: grade.assignmentId,
              availableAssignments: assignments.map(a => a.id)
            });
          }
          
          return processedGrade;
        });
      } else {
        console.error('❌ Failed to load grades:', gradesResponse);
      }

      // Process Attendance Data
      let attendanceRecords: AttendanceRecord[] = [];
      if (attendanceResponse.success) {
        attendanceRecords = attendanceResponse.attendance || [];
        console.log('📋 Loaded attendance records:', {
          total: attendanceRecords.length,
          sample: attendanceRecords.slice(0, 5).map(r => ({
            date: r.date,
            status: r.status,
            student: r.studentUsername,
            class: r.classId
          })),
          uniqueDates: [...new Set(attendanceRecords.map(r => r.date))].slice(0, 10)
        });
      } else {
        console.error('❌ Failed to load attendance:', attendanceResponse);
      }

      // Add student count to classes
      const classesWithStudentCount = classes.map(cls => ({
        ...cls,
        studentCount: students.filter(s => s.classId === cls.id).length
      }));
      setRecentClasses(classesWithStudentCount.slice(0, 4));

      // Calculate Real Statistics
      const realStats = calculateRealStats(classes, students, assignments, grades, attendanceRecords);
      setStats(realStats);

      // Check for data issues
      const orphanedGrades = grades.filter(grade => !assignments.find(a => a.id === grade.assignmentId));
      if (orphanedGrades.length > 0) {
        setDataIssues({
          orphanedGrades: orphanedGrades.length,
          detectedAt: new Date()
        });
        console.warn('🚨 Data integrity issue detected: orphaned grades found');
      } else {
        setDataIssues(null);
      }

      // Generate Real Activities
      const realActivities = generateRealActivities(assignments, grades, attendanceRecords, students, classes);
      setRecentActivities(realActivities);

      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRealStats = (
    classes: ClassItem[], 
    students: Student[], 
    assignments: Assignment[], 
    grades: Grade[], 
    attendanceRecords: AttendanceRecord[]
  ): DashboardStats => {

    // Calculate average grade using only valid grades
    const validGrades = grades.filter(grade => assignments.find(a => a.id === grade.assignmentId));
    const averageGrade = validGrades.length > 0 
      ? validGrades.reduce((sum, grade) => sum + grade.points, 0) / validGrades.length 
      : 0;

    // Calculate today's attendance with comprehensive date handling
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayLocal = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const todayDisplay = today.toLocaleDateString('id-ID');
    
    console.log('🗓️ Today date formats:', { todayStr, todayLocal, todayDisplay });
    
    const todayAttendanceRecords = attendanceRecords.filter(record => {
      // Handle different date formats
      const recordDate = record.date;
      const recordDateStr = typeof recordDate === 'string' ? recordDate.split('T')[0] : recordDate;
      const isToday = recordDateStr === todayStr || recordDateStr === todayLocal;
      
      if (isToday) {
        console.log('📅 Found today attendance:', { recordDate: recordDateStr, status: record.status, student: record.studentUsername });
      }
      
      return isToday;
    });
    
    const todayAttendance = todayAttendanceRecords.filter(record => record.status === 'present').length;
    const todayTotalRecords = todayAttendanceRecords.length;
    
    console.log('📊 Today attendance calculation:', {
      todayAttendance,
      todayTotalRecords,
      totalAttendanceRecords: attendanceRecords.length,
      todayRecords: todayAttendanceRecords.map(r => ({ date: r.date, status: r.status, student: r.studentUsername }))
    });

    // Calculate overdue assignments
    const now = new Date();
    const overdueAssignments = assignments.filter(assignment => 
      new Date(assignment.dueDate) < now && assignment.status !== 'completed'
    ).length;

    // Calculate pending grades (assignments that don't have grades for all students)
    let pendingGrades = 0;
    let detailedPendingInfo: any[] = [];
    
    // We already have validGrades from above, let's identify orphaned grades
    const orphanedGrades = grades.filter(grade => !assignments.find(a => a.id === grade.assignmentId));
    
    if (orphanedGrades.length > 0) {
      console.warn('🗑️ Found orphaned grades (referencing deleted assignments):', orphanedGrades.map(g => ({
        gradeId: g.id,
        assignmentId: g.assignmentId,
        studentUsername: g.studentUsername
      })));
    }
    
    // More accurate calculation: check each assignment to see if all students have been graded
    assignments.forEach(assignment => {
      // Get students for this assignment's class
      const classStudents = students.filter(student => student.classId === assignment.classId);
      
      // Get valid grades for this assignment (only grades that reference existing assignments)
      const assignmentGrades = validGrades.filter(grade => grade.assignmentId === assignment.id);
      
      // Get unique students who have been graded for this assignment
      const gradedStudentUsernames = new Set(assignmentGrades.map(grade => grade.studentUsername));
      
      // Count students who haven't been graded yet
      const ungradedStudents = classStudents.filter(student => 
        !gradedStudentUsernames.has(student.username)
      );
      
      const assignmentInfo = {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        classId: assignment.classId,
        totalStudentsInClass: classStudents.length,
        totalValidGradesGiven: assignmentGrades.length,
        ungradedCount: ungradedStudents.length,
        ungradedStudents: ungradedStudents.map(s => s.username),
        gradedStudents: [...gradedStudentUsernames]
      };
      
      detailedPendingInfo.push(assignmentInfo);
      
      // If there are ungraded students, this assignment has pending grades
      if (ungradedStudents.length > 0) {
        pendingGrades += ungradedStudents.length;
      }
    });
    
    // Calculate active students (students with recent activity) - improved date handling
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7); // Last 7 days
    const activeStudents = [...new Set(
      attendanceRecords
        .filter(record => {
          // Handle different date formats
          const recordDate = record.date;
          const recordDateStr = typeof recordDate === 'string' ? recordDate.split('T')[0] : recordDate;
          const recordDateObj = new Date(recordDateStr);
          return recordDateObj >= recentDate && record.status === 'present';
        })
        .map(record => record.studentUsername)
    )].length;

    console.log('📊 DETAILED Dashboard statistics:', {
      totalAssignments: assignments.length,
      totalGrades: grades.length,
      totalAttendance: attendanceRecords.length,
      finalPendingGrades: pendingGrades,
      todayAttendance: todayAttendance,
      activeStudents: activeStudents,
      detailedBreakdown: detailedPendingInfo,
      orphanedGrades: grades.filter(g => !assignments.find(a => a.id === g.assignmentId)),
      validGrades: grades.filter(g => assignments.find(a => a.id === g.assignmentId)),
      attendanceSample: attendanceRecords.slice(0, 3).map(r => ({
        date: r.date,
        status: r.status,
        student: r.studentUsername
      }))
    });

    const finalStats = {
      totalClasses: classes.length,
      totalStudents: students.length,
      totalAssignments: assignments.length,
      averageGrade: Math.round(averageGrade * 10) / 10,
      todayAttendance,
      todayTotalRecords,
      pendingGrades,
      overdueAssignments,
      activeStudents
    };
    
    console.log('📈 FINAL CALCULATED STATS:', finalStats);
    
    return finalStats;
  };

  const generateRealActivities = (
    assignments: Assignment[],
    grades: Grade[],
    attendanceRecords: AttendanceRecord[],
    students: Student[],
    classes: ClassItem[]
  ): RealActivity[] => {
    const activities: RealActivity[] = [];

    // Recent grades (last 10)
    const recentGrades = grades
      .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
      .slice(0, 5)
      .map(grade => {
        const student = students.find(s => s.username === grade.studentUsername);
        return {
          id: `grade-${grade.id}`,
          type: 'grade' as const,
          title: `Nilai ${grade.assignmentTitle} (${grade.points}/100)`,
          time: formatTimeAgo(grade.gradedAt),
          student: student?.fullName || grade.studentUsername,
          details: grade
        };
      });

    // Recent attendance (today and yesterday) with better date handling
    const recentAttendance = attendanceRecords
      .filter(record => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Handle different date formats
        const recordDate = record.date;
        const recordDateStr = typeof recordDate === 'string' ? recordDate.split('T')[0] : recordDate;
        const recordDateObj = new Date(recordDateStr);
        
        return recordDateObj >= yesterday && recordDateObj <= today;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5) // Increase to show more recent attendance
      .map(record => {
        const student = students.find(s => s.username === record.studentUsername);
        const className = classes.find(c => c.id === record.classId)?.name;
        const isToday = record.date === new Date().toISOString().split('T')[0] || 
                       record.date === new Date().toLocaleDateString('en-CA');
        
        return {
          id: `attendance-${record.id}`,
          type: 'attendance' as const,
          title: `${className} - ${getStatusText(record.status)}${isToday ? ' (Hari ini)' : ''}`,
          time: formatTimeAgo(record.date),
          student: student?.fullName || record.studentUsername,
          className,
          details: record
        };
      });

    // Recent assignments
    const recentAssignments = assignments
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 3)
      .map(assignment => ({
        id: `assignment-${assignment.id}`,
        type: 'assignment' as const,
        title: `Tugas "${assignment.title}" - ${assignment.className}`,
        time: `Deadline ${formatTimeAgo(assignment.dueDate)}`,
        className: assignment.className,
        details: assignment
      }));

    // Combine and sort by recency
    activities.push(...recentGrades, ...recentAttendance, ...recentAssignments);
    
    return activities
      .sort((a, b) => {
        // Sort by creation/modification time (most recent first)
        const timeA = a.details?.gradedAt || a.details?.date || a.details?.dueDate || '1970-01-01';
        const timeB = b.details?.gradedAt || b.details?.date || b.details?.dueDate || '1970-01-01';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      })
      .slice(0, 8); // Limit to 8 most recent activities
  };

  const getAssignmentStatus = (dueDate: string): string => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) {
      return 'overdue';
    } else if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'due_soon';
    }
    return 'active';
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'absent': return 'Tidak Hadir';
      case 'sick': return 'Sakit';
      case 'permission': return 'Izin';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Baru saja';
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else if (diffInHours < 48) {
      return 'Kemarin';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} hari lalu`;
    }
  };

  const statCards = [
    {
      title: 'Total Kelas',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'bg-blue-500',
      description: 'Kelas aktif',
      trend: `${stats.totalClasses > 0 ? '+' : ''}${stats.totalClasses} kelas`
    },
    {
      title: 'Total Siswa',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-green-500',
      description: 'Siswa terdaftar',
      trend: `${stats.activeStudents} aktif minggu ini`
    },
    {
      title: 'Tugas Aktif',
      value: stats.totalAssignments,
      icon: Target,
      color: 'bg-orange-500',
      description: 'Tugas berlangsung',
      trend: `${stats.overdueAssignments} lewat deadline`
    },
    {
      title: 'Rata-rata Nilai',
      value: stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : '-',
      icon: Trophy,
      color: 'bg-purple-500',
      description: 'Nilai keseluruhan',
      trend: stats.pendingGrades > 0 ? `${stats.pendingGrades} siswa belum dinilai` : 'Semua sudah dinilai'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment': return Target;
      case 'grade': return Trophy;
      case 'attendance': return Clock;
      case 'student_joined': return Users;
      case 'assignment_submitted': return CheckCircle;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'bg-orange-100 text-orange-600';
      case 'grade': return 'bg-green-100 text-green-600';
      case 'attendance': return 'bg-blue-100 text-blue-600';
      case 'student_joined': return 'bg-purple-100 text-purple-600';
      case 'assignment_submitted': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Navigation handler functions
  const handleCreateClass = () => {
    navigate('/guru/kelas');
  };

  const handleViewClass = (_classId: string) => {
    navigate('/guru/kelas');
  };

  const handleViewAllActivities = () => {
    navigate('/guru/kegiatan');
  };

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'Buat Tugas':
        navigate('/guru/tugas');
        break;
      case 'Input Nilai':
        navigate('/guru/nilai');
        break;
      case 'Catat Presensi':
        navigate('/guru/presensi');
        break;
      case 'Kelola Siswa':
        navigate('/guru/siswa');
        break;
      default:
        console.log('Unknown action:', actionType);
    }
  };

  const handleRefreshData = () => {
    if (!isLoading) {
      loadDashboardData();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <LoadingSkeleton rows={6} />
          </div>
          <div>
            <LoadingSkeleton rows={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen">
      {/* Welcome Section - Industrial Minimalism */}
      <AnimatedContainer variant={fadeInUp}>
        <div className="bg-industrial-white border-2 border-industrial-black p-4 sm:p-6 shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-industrial-black industrial-h1">
                Selamat Datang, {user?.fullName || 'Guru'}!
              </h1>
              <p className="text-industrial-text-secondary mt-2 text-sm sm:text-base industrial-body">
                Anda mengelola {stats.totalClasses} kelas dengan {stats.totalStudents} siswa
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-industrial-text-secondary text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Update terakhir: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <Button
                  variant="industrial-secondary"
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={isLoading}
                  className="h-7 sm:h-8 text-xs"
                >
                  <ArrowClockwise className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            <motion.div
              className="hidden sm:block self-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                <ChartBar className="w-8 h-8 sm:w-10 sm:h-10 text-industrial-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats Cards - Industrial Minimalism */}
      <StaggeredList>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((stat, index) => (
            <AnimatedContainer key={stat.title} delay={index * 0.1}>
              <Card variant="industrial" className="relative overflow-hidden hover:shadow-[0_6px_12px_rgba(0,0,0,0.2)] transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-industrial-text-secondary leading-tight">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 sm:p-2 border-2 border-industrial-black bg-industrial-black text-industrial-white flex-shrink-0`}>
                    <stat.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{stat.value}</div>
                  <p className="text-xs text-industrial-text-secondary mt-1">{stat.description}</p>
                  <div className="flex items-center mt-2">
                    <TrendUp className="w-3 h-3 text-industrial-steel mr-1 flex-shrink-0" />
                    <span className="text-xs text-industrial-text-secondary truncate">{stat.trend}</span>
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>
          ))}
        </div>
      </StaggeredList>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Classes - Industrial Minimalism */}
        <AnimatedContainer variant={slideInFromLeft} delay={0.4} className="lg:col-span-2">
          <Card variant="industrial">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 sm:p-6 border-b-2 border-industrial-black">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
                  Kelas Terbaru
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                  Kelas yang baru-baru ini Anda kelola
                </CardDescription>
              </div>
              <Button variant="industrial-primary" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto" onClick={handleCreateClass}>
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Tambah Kelas
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {recentClasses.length > 0 ? (
                  recentClasses.map((classItem, index) => (
                    <motion.div
                      key={classItem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-3 sm:p-4 bg-industrial-light border-2 border-industrial-black hover:bg-industrial-white transition-colors group"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-semibold text-industrial-black text-sm sm:text-base truncate">
                            {classItem.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2">
                            <div className="flex items-center gap-2">
                              {classItem.subject && (
                                <Badge variant="industrial-secondary" className="text-xs px-2 py-0.5">
                                  {classItem.subject}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-xs text-industrial-text-secondary">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span>{classItem.studentCount || 0} siswa</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-industrial-text-secondary line-clamp-1 sm:line-clamp-2">
                            {classItem.description || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="industrial-secondary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 w-8 h-8 sm:w-auto sm:h-auto"
                        onClick={() => handleViewClass(classItem.id)}
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-industrial-text-secondary">
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-industrial-border" />
                    <p className="text-sm sm:text-base font-semibold text-industrial-black">Belum ada kelas yang dibuat</p>
                    <p className="text-xs text-industrial-text-secondary mt-1">Mulai dengan membuat kelas pertama Anda</p>
                    <Button variant="industrial-primary" className="mt-4 h-9 sm:h-10 text-xs sm:text-sm" size="sm" onClick={handleCreateClass}>
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Buat Kelas Pertama
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Recent Activities - Industrial Minimalism */}
        <AnimatedContainer variant={fadeInUp} delay={0.6}>
          <Card variant="industrial">
            <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                Update terbaru dari kelas Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start space-x-3 p-3 bg-industrial-light border-2 border-industrial-black hover:bg-industrial-white transition-colors"
                      >
                        <div className="w-8 h-8 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-industrial-white" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs sm:text-sm font-semibold text-industrial-black leading-tight line-clamp-2">
                            {activity.title}
                          </p>
                          <div className="space-y-0.5">
                            {activity.student && (
                              <p className="text-xs text-industrial-text-secondary truncate flex items-center gap-1">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{activity.student}</span>
                              </p>
                            )}
                            {activity.className && !activity.student && (
                              <p className="text-xs text-industrial-text-secondary truncate flex items-center gap-1">
                                <BookOpen className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{activity.className}</span>
                              </p>
                            )}
                            <p className="text-xs text-industrial-text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{activity.time}</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8 text-industrial-text-secondary">
                    <Activity className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-industrial-border" />
                    <p className="text-sm sm:text-base font-semibold text-industrial-black">Belum ada aktivitas terbaru</p>
                    <p className="text-xs text-industrial-text-secondary mt-1">Aktivitas akan muncul setelah ada interaksi di kelas</p>
                  </div>
                )}
              </div>
              <Button variant="industrial-secondary" className="w-full mt-4 h-9 sm:h-10 text-xs sm:text-sm" size="sm" onClick={handleViewAllActivities}>
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Lihat Semua Aktivitas
              </Button>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>

      {/* Quick Actions - Industrial Minimalism */}
      <AnimatedContainer variant={fadeInUp} delay={0.8}>
        <Card variant="industrial">
          <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
            <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Aksi Cepat</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
              Akses cepat ke fitur yang sering digunakan • Data real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { 
                  title: 'Buat Tugas', 
                  icon: Target, 
                  color: 'bg-orange-500',
                  stat: `${stats.totalAssignments} aktif`,
                  urgent: stats.overdueAssignments > 0,
                  urgentText: `${stats.overdueAssignments} terlambat`
                },
                { 
                  title: 'Input Nilai', 
                  icon: Trophy, 
                  color: 'bg-green-500',
                  stat: `Rata-rata ${stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : '0'}`,
                  urgent: stats.pendingGrades > 0,
                  urgentText: stats.pendingGrades > 0 ? `${stats.pendingGrades} belum dinilai` : undefined
                },
                { 
                  title: 'Catat Presensi', 
                  icon: Clock, 
                  color: 'bg-blue-500',
                  stat: stats.todayTotalRecords > 0 
                    ? `${stats.todayAttendance}/${stats.todayTotalRecords} hadir`
                    : 'Belum ada presensi',
                  urgent: false,
                  urgentText: stats.todayTotalRecords === 0 ? 'Mulai catat' : undefined
                },
                { 
                  title: 'Kelola Siswa', 
                  icon: Users, 
                  color: 'bg-purple-500',
                  stat: `${stats.totalStudents} total`,
                  urgent: false,
                  urgentText: `${stats.activeStudents} aktif`
                }
              ].map((action) => (
                <motion.div
                  key={action.title}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={action.urgent ? "industrial-danger" : "industrial-secondary"}
                    className="h-24 sm:h-28 flex-col justify-between hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] transition-all duration-200 w-full relative p-3"
                    onClick={() => handleQuickAction(action.title)}
                  >
                    {action.urgent && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-industrial-red border-2 border-industrial-black animate-pulse"></div>
                    )}
                    
                    {/* Icon Section */}
                    <div className="p-2 bg-industrial-black border-2 border-industrial-black text-industrial-white flex-shrink-0">
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    
                    {/* Text Section */}
                    <div className="text-center space-y-1 flex-1 flex flex-col justify-end min-h-0">
                      <span className="text-xs font-semibold text-industrial-black leading-tight break-words hyphens-auto">
                        {action.title}
                      </span>
                      <p className="text-xs text-industrial-text-secondary leading-tight break-words">
                        {action.stat}
                      </p>
                      {action.urgent && action.urgentText && (
                        <p className="text-xs text-industrial-red font-semibold leading-tight break-words">
                          {action.urgentText}
                        </p>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
            
            {/* Summary Alerts - Industrial Minimalism */}
            <div className="mt-4 sm:mt-6 space-y-3">
              {/* Data Issues Alert */}
              {dataIssues && (
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-industrial-white border-2 border-industrial-black">
                  <WarningCircle className="w-4 h-4 text-industrial-red flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs sm:text-sm text-industrial-black font-semibold leading-tight">
                      Masalah Sinkronisasi Data Terdeteksi
                    </p>
                    <p className="text-xs text-industrial-text-secondary leading-relaxed">
                      Ditemukan <span className="font-semibold">{dataIssues.orphanedGrades} nilai</span> yang mereferensikan tugas yang sudah tidak ada. 
                      Ini bisa menyebabkan perhitungan "siswa belum dinilai" tidak akurat.
                    </p>
                    <p className="text-xs text-industrial-text-secondary leading-relaxed">
                      <strong>Solusi:</strong> Hapus nilai lama yang tidak valid di halaman Nilai, atau buat ulang tugas yang hilang.
                    </p>
                  </div>
                </div>
              )}
              
              {stats.overdueAssignments > 0 && (
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-industrial-white border-2 border-industrial-red">
                  <WarningCircle className="w-4 h-4 text-industrial-red flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-industrial-black leading-tight">
                    <span className="font-semibold">{stats.overdueAssignments} tugas</span> telah melewati deadline
                  </p>
                </div>
              )}
              
              {stats.pendingGrades > 0 && (
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-industrial-white border-2 border-industrial-black">
                  <Clock className="w-4 h-4 text-industrial-black flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-industrial-black leading-tight">
                    <span className="font-semibold">{stats.pendingGrades} siswa</span> belum dinilai pada tugas yang ada
                  </p>
                </div>
              )}
              
              {stats.totalClasses > 0 && stats.totalStudents > 0 && (
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-industrial-white border-2 border-industrial-black">
                  <CheckCircle className="w-4 h-4 text-industrial-black flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-industrial-black leading-tight">
                    Sistem berjalan normal • <span className="font-semibold">{stats.activeStudents} siswa</span> aktif minggu ini
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
};

export default Dashboard; 