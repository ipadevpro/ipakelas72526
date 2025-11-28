import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Users, Star, Crown, Sword, Sparkles, Map, Compass, Castle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, hasSessionCredentials, refreshSessionCredentials } from '@/lib/api';
import { 
  calculateLevelFromPoints, 
  calculateXPToNextLevel, 
  processLeaderboardData, 
  getCurrentUserStats 
} from '@/lib/gamification';

interface StudentStats {
  points: number;
  level: number;
  badges: string[];
  rank: number;
  totalStudents: number;
  attendance: number;
  averageGrade: number;
  completedAssignments: number;
}

interface LeaderboardEntry {
  username: string;
  fullName: string;
  points: number;
  level: number;
  badges: number;
}

interface RPGStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  expToNext: number;
  attack: number;
  defense: number;
  intelligence: number;
  wisdom: number;
}

interface AssignmentGrade {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription?: string;
  dueDate?: string;
  maxPoints: number;
  score: number;
  feedback?: string;
  submittedAt?: string;
  status: 'completed' | 'late' | 'missing';
}

// Helper function to process assignment grades
const processAssignmentGrades = (
  assignments: any[], 
  grades: any[], 
  username: string
): AssignmentGrade[] => {
  const assignmentGrades: AssignmentGrade[] = [];
  
  // Get user's grades
  const userGrades = grades.filter((grade: any) => grade.studentUsername === username);
  
  // Process each assignment
  assignments.forEach((assignment: any) => {
    // Find grade for this assignment
    const grade = userGrades.find((g: any) => 
      g.assignmentId === assignment.id || 
      g.assignment === assignment.title ||
      g.assignmentTitle === assignment.title
    );
    
    if (grade) {
      // Parse score from various possible fields
      const score = parseFloat(grade.points) || parseFloat(grade.value) || parseFloat(grade.score) || 0;
      const maxPoints = parseFloat(assignment.maxPoints) || parseFloat(assignment.points) || 100;
      
      // Determine status based on score and due date
      let status: 'completed' | 'late' | 'missing' = 'completed';
      if (assignment.dueDate && grade.submittedAt) {
        const dueDate = new Date(assignment.dueDate);
        const submittedDate = new Date(grade.submittedAt);
        if (submittedDate > dueDate) {
          status = 'late';
        }
      }
      
      assignmentGrades.push({
        assignmentId: assignment.id || assignment.assignmentId || '',
        assignmentTitle: assignment.title || assignment.name || 'Tugas',
        assignmentDescription: assignment.description,
        dueDate: assignment.dueDate,
        maxPoints: maxPoints,
        score: score,
        feedback: grade.feedback,
        submittedAt: grade.submittedAt,
        status: status
      });
    }
  });
  
  // Sort by submission date (newest first) or by assignment title
  return assignmentGrades.sort((a, b) => {
    if (a.submittedAt && b.submittedAt) {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
    return a.assignmentTitle.localeCompare(b.assignmentTitle);
  });
};

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStats>({
    points: 0,
    level: 1,
    badges: [],
    rank: 0,
    totalStudents: 0,
    attendance: 0,
    averageGrade: 0,
    completedAssignments: 0
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showClassLeaderboard, setShowClassLeaderboard] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([]);
  const [showProgressMap, setShowProgressMap] = useState(false);
  const [showClassmates, setShowClassmates] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'progress' | 'leaderboard' | 'badges'>('home');
  
  useEffect(() => {
    // Add delay to ensure session is properly initialized
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Get user info from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('User data not found. Please login again.');
        return;
      }
      
      const user = JSON.parse(userData);
      setUserInfo(user);
      
      // Check session credentials first
      if (!hasSessionCredentials()) {
        refreshSessionCredentials();
        
        // Wait a bit for session to refresh
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!hasSessionCredentials()) {
          setError('Session expired. Please login again.');
          return;
        }
      }
      
      // Load all data sequentially to better handle errors
      const gamificationResult = await apiRequest('getGamification', {});
      const badgesResult = await apiRequest('getBadges', {});
      const studentsResult = await apiRequest('getStudentsFromSheet', {});
      const attendanceResult = await apiRequest('getAttendance', {});
      const gradesResult = await apiRequest('getGrades', {});
      const assignmentsResult = await apiRequest('getAssignments', {});
      
      // Set available badges
      if (badgesResult.success && badgesResult.badges) {
        setAvailableBadges(badgesResult.badges);
      } else {
        setAvailableBadges([]);
      }
      
      // Process gamification and student data
      if (gamificationResult.success && studentsResult.success) {
        const gamificationData = gamificationResult.data || [];
        const studentsData = studentsResult.students || [];
        const attendanceData = attendanceResult.success ? attendanceResult.attendance || [] : [];
        const gradesData = gradesResult.success ? gradesResult.grades || [] : [];
        const assignmentsData = assignmentsResult.success ? assignmentsResult.assignments || [] : [];
        

        
        // Find current user's gamification data
        const currentUserData = gamificationData.find(
          (entry: any) => entry.studentUsername === user.username
        );
        
        // Calculate real attendance percentage
        const userAttendanceRecords = attendanceData.filter((record: any) => record.studentUsername === user.username);
        const totalAttendanceRecords = userAttendanceRecords.length;
        const presentRecords = userAttendanceRecords.filter((record: any) => record.status === 'present' || record.status === 'hadir').length;
        const realAttendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;
        
        // Calculate real average grade with better filtering
        const userGrades = gradesData.filter((grade: any) => {
          const isUserGrade = grade.studentUsername === user.username;
          const hasValidPoints = grade.points !== null && grade.points !== undefined && grade.points !== '' ||
                                grade.value !== null && grade.value !== undefined && grade.value !== '' ||
                                grade.score !== null && grade.score !== undefined && grade.score !== '';
          return isUserGrade && hasValidPoints;
        });
        
        const validGrades = userGrades.map((grade: any) => {
          const points = parseFloat(grade.points) || parseFloat(grade.value) || parseFloat(grade.score) || 0;
          return points;
        }).filter((points: number) => !isNaN(points) && points >= 0);
        
        const totalGradePoints = validGrades.reduce((sum: number, points: number) => sum + points, 0);
        const realAverageGrade = validGrades.length > 0 ? Math.round((totalGradePoints / validGrades.length) * 100) / 100 : 0;
        
        // Calculate real completed assignments - check multiple data sources
        const userAssignmentGrades = gradesData.filter((grade: any) => grade.studentUsername === user.username);
        const uniqueAssignments = new Set();
        
        userAssignmentGrades.forEach((grade: any) => {
          if (grade.assignmentId) uniqueAssignments.add(grade.assignmentId);
          if (grade.assignment) uniqueAssignments.add(grade.assignment);
          if (grade.assignmentTitle) uniqueAssignments.add(grade.assignmentTitle);
        });
        
        const realCompletedAssignments = Math.max(uniqueAssignments.size, userAssignmentGrades.length);
        
        // Process assignment grades for detailed view
        const processedAssignmentGrades = processAssignmentGrades(
          assignmentsData, 
          gradesData, 
          user.username
        );
        setAssignmentGrades(processedAssignmentGrades);

        // Load classmates data
        if (user.classId && studentsData.length > 0) {
          const classmatesData = studentsData
            .filter((student: any) => student.classId === user.classId && student.username !== user.username)
            .map((student: any) => {
              const studentGameData = gamificationData.find((g: any) => g.studentUsername === student.username);
              return {
                ...student,
                points: studentGameData?.points || 0,
                level: studentGameData?.level || 1,
                badges: studentGameData?.badges || []
              };
            })
            .sort((a: any, b: any) => b.points - a.points);
          
          setClassmates(classmatesData);
        }

        

        
        // Use unified gamification processing
        const leaderboardData = processLeaderboardData(gamificationData, studentsData);
        setLeaderboard(leaderboardData.slice(0, 10));
        
        // Process class-based leaderboard if user has classId
        if (user.classId) {
          // Filter gamification data for current user's class
          const classGamificationData = gamificationData.filter((entry: any) => {
            // Find student data to get their classId
            const student = studentsData.find((s: any) => s.username === entry.studentUsername);
            return student && student.classId === user.classId;
          });
          
          // Filter students data for current user's class
          const classStudentsData = studentsData.filter((student: any) => 
            student.classId === user.classId
          );
          
          const classLeaderboardData = processLeaderboardData(classGamificationData, classStudentsData);
          setClassLeaderboard(classLeaderboardData.slice(0, 10));
          
          console.log(`🏫 Class leaderboard loaded: ${classLeaderboardData.length} students in class ${user.classId}`);
        } else {
          console.log('⚠️ User has no classId, class leaderboard not available');
          setClassLeaderboard([]);
        }
        
        // Get current user's gamification stats with unified logic
        const currentUserGameStats = getCurrentUserStats(gamificationData, user.username);
        
        const userStats = {
          points: currentUserGameStats?.points || 0,
          level: currentUserGameStats?.level || 1,
          badges: currentUserGameStats?.badges || [],
          rank: currentUserGameStats?.rank || (leaderboardData.length + 1),
          totalStudents: studentsData.length,
          attendance: realAttendanceRate,
          averageGrade: realAverageGrade,
          completedAssignments: realCompletedAssignments
        };
        
        setStats(userStats);
        
      } else {
        console.error('❌ Failed to load data:', { gamificationResult, studentsResult });
        setError('Failed to load dashboard data. Some information may be unavailable.');
        
        // Set default stats if no data available, but try to get what we can
        const attendanceData = attendanceResult.success ? attendanceResult.attendance || [] : [];
        const gradesData = gradesResult.success ? gradesResult.grades || [] : [];
        
        if (attendanceData.length > 0 || gradesData.length > 0) {
          // Try to calculate basic stats even without full gamification data
          const userAttendanceRecords = attendanceData.filter((record: any) => record.studentUsername === user.username);
          const totalAttendanceRecords = userAttendanceRecords.length;
          const presentRecords = userAttendanceRecords.filter((record: any) => record.status === 'present' || record.status === 'hadir').length;
          const fallbackAttendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;
          
          const userGrades = gradesData.filter((grade: any) => {
            const isUserGrade = grade.studentUsername === user.username;
            const hasValidPoints = grade.points !== null && grade.points !== undefined && grade.points !== '' ||
                                  grade.value !== null && grade.value !== undefined && grade.value !== '' ||
                                  grade.score !== null && grade.score !== undefined && grade.score !== '';
            return isUserGrade && hasValidPoints;
          });
          
          const validGrades = userGrades.map((grade: any) => {
            const points = parseFloat(grade.points) || parseFloat(grade.value) || parseFloat(grade.score) || 0;
            return points;
          }).filter((points: number) => !isNaN(points) && points >= 0);
          
          const totalGradePoints = validGrades.reduce((sum: number, points: number) => sum + points, 0);
          const fallbackAverageGrade = validGrades.length > 0 ? Math.round((totalGradePoints / validGrades.length) * 100) / 100 : 0;
          
          const fallbackCompletedAssignments = userGrades.length;
          
          setStats(prev => ({
            ...prev,
            attendance: fallbackAttendanceRate,
            averageGrade: fallbackAverageGrade,
            completedAssignments: fallbackCompletedAssignments,
            totalStudents: studentsResult.success ? (studentsResult.students?.length || 0) : 0
          }));
        } else {
          setStats(prev => ({
            ...prev,
            totalStudents: studentsResult.success ? (studentsResult.students?.length || 0) : 0
          }));
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError('An error occurred while loading your dashboard. Please try refreshing the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleProgressMap = () => {
    setShowProgressMap(true);
  };

  const handleClassmates = () => {
    setShowClassmates(true);
  };

  const handleAchievements = () => {
    setShowAchievements(true);
  };
  
  const getCharacterClass = (level: number, averageGrade: number) => {
    if (level >= 10 && averageGrade >= 90) return { name: 'Archmage', icon: '🧙‍♂️', color: 'from-purple-600 to-indigo-800' };
    if (level >= 8 && averageGrade >= 85) return { name: 'Wizard', icon: '🔮', color: 'from-blue-600 to-purple-700' };
    if (level >= 6 && averageGrade >= 80) return { name: 'Scholar', icon: '📚', color: 'from-green-600 to-blue-600' };
    if (level >= 4 && averageGrade >= 75) return { name: 'Apprentice', icon: '🎓', color: 'from-yellow-600 to-green-600' };
    if (level >= 2) return { name: 'Student', icon: '📖', color: 'from-orange-600 to-yellow-600' };
    return { name: 'Novice', icon: '🌱', color: 'from-gray-600 to-orange-600' };
  };

  const getRPGStats = (): RPGStats => {
    const baseHp = 100;
    const baseMp = 50;
    const hpMultiplier = stats.level * 20;
    const mpMultiplier = stats.level * 15;
    
    // Use unified XP calculation for progress bar
    const xpProgress = calculateXPToNextLevel(stats.points);
    
    return {
      hp: Math.min(baseHp + hpMultiplier, (baseHp + hpMultiplier) * (stats.attendance / 100)),
      maxHp: baseHp + hpMultiplier,
      mp: Math.min(baseMp + mpMultiplier, (baseMp + mpMultiplier) * (stats.averageGrade / 100)),
      maxMp: baseMp + mpMultiplier,
      exp: xpProgress.currentLevelXP,
      expToNext: xpProgress.nextLevelXP,
      attack: Math.floor(stats.completedAssignments * 2 + stats.level * 3),
      defense: Math.floor(stats.attendance / 10 + stats.level * 2),
      intelligence: Math.floor(stats.averageGrade / 5 + stats.level * 2),
      wisdom: Math.floor(stats.badges.length * 5 + stats.level)
    };
  };

  const characterClass = getCharacterClass(stats.level, stats.averageGrade);
  const rpgStats = getRPGStats();
  
  // Dynamic rank calculation based on current leaderboard view
  const getCurrentDisplayRank = () => {
    if (showClassLeaderboard && classLeaderboard.length > 0) {
      const userInClassRank = classLeaderboard.findIndex(student => student.username === userInfo?.username);
      return userInClassRank >= 0 ? userInClassRank + 1 : classLeaderboard.length + 1;
    }
    return stats.rank;
  };

  const getCurrentLeaderboardContext = () => {
    if (showClassLeaderboard && classLeaderboard.length > 0) {
      // Try to get class name from user info if available
      const className = userInfo?.className || userInfo?.class || 'Kelas';
      return `di ${className} (${classLeaderboard.length} siswa)`;
    }
    return `di Kerajaan (${stats.totalStudents} siswa)`;
  };
  
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', monospace; font-size: 8px; }
          .pixel-border { border: 3px solid #000; box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.8); }
          .pixel-button { border: 3px solid #000; box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.8); }
          .pixel-button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px rgba(0,0,0,0.8); }
        `}</style>
        <div className="min-h-screen bg-[#87CEEB] flex items-center justify-center px-4" style={{fontFamily: "'Press Start 2P', monospace"}}>
        <div className="text-center">
          <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-black bg-white pixel-border mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
          </div>
            <h2 className="text-xs text-black mb-2" style={{fontFamily: "'Press Start 2P', monospace"}}>LOADING...</h2>
            <p className="text-xs text-gray-700" style={{fontFamily: "'Press Start 2P', monospace"}}>PLEASE WAIT</p>
        </div>
      </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', monospace; font-size: 8px; }
          .pixel-border { border: 3px solid #000; box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.8); }
          .pixel-button { border: 3px solid #000; box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.8); }
          .pixel-button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px rgba(0,0,0,0.8); }
        `}</style>
        <div className="min-h-screen bg-[#FF6B6B] flex items-center justify-center p-4" style={{fontFamily: "'Press Start 2P', monospace"}}>
          <div className="text-center max-w-md bg-white pixel-border p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xs text-black mb-2">ERROR!</h2>
            <p className="text-xs text-gray-700 mb-6">{error}</p>
            <button 
            onClick={handleRefresh}
              className="bg-[#4ECDC4] text-black px-4 py-2 pixel-button text-xs"
              style={{fontFamily: "'Press Start 2P', monospace"}}
          >
              TRY AGAIN
            </button>
        </div>
      </div>
      </>
    );
  }
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; font-size: 8px; line-height: 1.6; }
        .pixel-border { border: 3px solid #000; box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.8); }
        .pixel-button { border: 3px solid #000; box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.8); transition: all 0.1s; }
        .pixel-button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px rgba(0,0,0,0.8); }
        .pixel-card { border: 3px solid #000; box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.8); background: white; }
        .pixel-progress { border: 2px solid #000; }
        .pixel-border-t { border-top: 2px solid #000; }
        .pixel-nav { border-top: 3px solid #000; box-shadow: 0px -2px 0px 0px rgba(0,0,0,0.8); }
        .pixel-nav-item { border: 2px solid #000; }
        .pixel-nav-item.active { background: #FFD700; }
        .pixel-nav-item:active { transform: translate(1px, 1px); }
      `}</style>
      <div className="min-h-screen bg-[#87CEEB] relative overflow-hidden pb-20" style={{fontFamily: "'Press Start 2P', monospace"}}>
        {/* Pixel Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-4xl">⚔️</div>
          <div className="absolute top-32 right-20 text-3xl">🛡️</div>
          <div className="absolute bottom-20 left-32 text-3xl">⚡</div>
          <div className="absolute bottom-40 right-10 text-2xl">🏆</div>
      </div>

        <div className="relative z-10 space-y-3 p-3">
          {/* Character Profile Header - Pixel Style */}
          {activeTab === 'home' && (
            <div className="pixel-card bg-[#FFD700] p-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {/* Character Avatar - Pixel */}
                  <div className="relative w-16 h-16 pixel-border bg-white flex items-center justify-center text-2xl">
                  {characterClass.icon}
                    <div className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-[6px] px-1 py-0.5 pixel-border">
                      Lv{stats.level}
                  </div>
                </div>
                
                  <div className="flex-1">
                    <h1 className="text-[10px] text-black mb-1">
                      {userInfo?.fullName || 'HERO'}
                  </h1>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-[#4ECDC4] text-black text-[6px] px-2 py-1 pixel-border">
                        {characterClass.name.toUpperCase()}
                    </span>
                      <span className="text-[6px] text-gray-700">
                        RANK #{getCurrentDisplayRank() > 0 ? getCurrentDisplayRank() : '?'}
                    </span>
                  </div>
                </div>
              </div>
              
                {/* Quick Stats - Pixel */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="pixel-card bg-white p-2 text-center">
                    <div className="text-[8px] text-black font-bold">{stats.points.toLocaleString()}</div>
                    <div className="text-[6px] text-gray-600">XP</div>
                </div>
                  <div className="pixel-card bg-white p-2 text-center">
                    <div className="text-[8px] text-black font-bold">{stats.badges.length}</div>
                    <div className="text-[6px] text-gray-600">BADGES</div>
                </div>
              </div>
            </div>
                </div>
              )}

          {/* Progress Akademik - Pixel Style */}
          {activeTab === 'home' && (
            <div className="space-y-3">
              <div className="pixel-card bg-white p-3">
                <h2 className="text-[8px] text-black mb-3">PROGRESS AKADEMIK</h2>
                
                <div className="space-y-3">
                  {/* Attendance - Pixel */}
            <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[6px] text-black font-bold">KEHADIRAN</span>
                      <span className="text-[6px] text-black font-bold">{stats.attendance}%</span>
              </div>
                    <div className="pixel-progress bg-gray-300 h-3 overflow-hidden">
                <div 
                        className="h-full bg-[#4ECDC4] transition-all duration-500"
                  style={{ width: `${stats.attendance}%` }}
                ></div>
              </div>
                    <p className="text-[5px] text-gray-600 mt-1">
                      {stats.attendance >= 80 ? 'RAJIN BANGET! 👏' : 
                       stats.attendance > 0 ? 'YUK LEBIH RAJIN! 📚' : 
                       'DATA SYNC...⏳'}
              </p>
            </div>
            
                  {/* Grade Average - Pixel */}
            <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[6px] text-black font-bold">RATA-RATA NILAI</span>
                      <span className="text-[6px] text-black font-bold">{stats.averageGrade}</span>
              </div>
                    <div className="pixel-progress bg-gray-300 h-3 overflow-hidden">
                <div 
                        className="h-full bg-[#FFD700] transition-all duration-500"
                  style={{ width: `${Math.min(stats.averageGrade, 100)}%` }}
                ></div>
              </div>
                    <p className="text-[5px] text-gray-600 mt-1">
                      {stats.averageGrade >= 80 ? 'PRESTASI KEREN! 🌟' : 
                       stats.averageGrade > 0 ? 'SEMANGAT BELAJAR! 📖' : 
                       'DATA SYNC...⏳'}
              </p>
            </div>
            
                  {/* Assignments Completed - Pixel */}
            <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[6px] text-black font-bold">TUGAS SELESAI</span>
                      <span className="text-[6px] text-black font-bold">{stats.completedAssignments}</span>
              </div>
                    <div className="pixel-progress bg-gray-300 h-3 overflow-hidden">
                <div 
                        className="h-full bg-[#FF6B6B] transition-all duration-500"
                  style={{ width: `${Math.min((stats.completedAssignments / Math.max(stats.completedAssignments, 10)) * 100, 100)}%` }}
                ></div>
              </div>
                    <p className="text-[5px] text-gray-600 mt-1">
                      {stats.completedAssignments >= 10 ? 'PRODUKTIF BANGET! 🔥' : 
                       stats.completedAssignments > 0 ? 'ADA QUEST LAIN! 💪' : 
                       'DATA SYNC...⏳'}
              </p>
            </div>
          </div>
        </div>

              {/* Assignment Grades Detail - Pixel Style */}
        {assignmentGrades.length > 0 && (
                <div className="pixel-card bg-white p-3">
                  <h2 className="text-[8px] text-black mb-3 flex items-center justify-between">
                    <span>NILAI TUGAS</span>
                    <span className="text-[6px] bg-[#4ECDC4] text-black px-2 py-1 pixel-border">
                      {assignmentGrades.length} TUGAS
              </span>
            </h2>
            
                  <div className="space-y-2">
              {assignmentGrades.map((assignment, index) => {
                const percentage = Math.round((assignment.score / assignment.maxPoints) * 100);
                const getGradeColor = (percentage: number) => {
                        if (percentage >= 90) return 'bg-[#4ECDC4]';
                        if (percentage >= 80) return 'bg-[#87CEEB]';
                        if (percentage >= 70) return 'bg-[#FFD700]';
                        if (percentage >= 60) return 'bg-[#FFA500]';
                        return 'bg-[#FF6B6B]';
                };
                
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'completed': return '✅';
                    case 'late': return '⏰';
                    case 'missing': return '❌';
                    default: return '📝';
                  }
                };
                
                const getStatusText = (status: string) => {
                  switch (status) {
                          case 'completed': return 'SELESAI';
                          case 'late': return 'TERLAMBAT';
                          case 'missing': return 'BELUM';
                          default: return 'UNKNOWN';
                  }
                };

                return (
                  <div 
                    key={assignment.assignmentId || index}
                          className="pixel-card bg-white p-2"
                  >
                          <div className="flex items-start gap-2">
                            <div className="text-lg">{getStatusIcon(assignment.status)}</div>
                      <div className="flex-1 min-w-0">
                              <h3 className="text-[6px] text-black font-bold truncate mb-1">
                              {assignment.assignmentTitle}
                            </h3>
                              <div className="flex items-center gap-2 text-[5px] text-gray-600 mb-1">
                              <span>{getStatusText(assignment.status)}</span>
                              {assignment.dueDate && (
                                  <span>DUE: {new Date(assignment.dueDate).toLocaleDateString('id-ID')}</span>
                              )}
                        </div>
                        
                        {assignment.feedback && (
                                <div className="pixel-border bg-gray-100 p-1 mb-1">
                                  <p className="text-[5px] text-gray-600 mb-0.5">FEEDBACK:</p>
                                  <p className="text-[5px] text-black">{assignment.feedback}</p>
                          </div>
                        )}
                      </div>
                      
                            <div className="text-right">
                              <div className="text-[8px] text-black font-bold mb-0.5">
                            {assignment.score}
                          </div>
                              <div className="text-[5px] text-gray-600 mb-1">
                                /{assignment.maxPoints}
                          </div>
                              <div className={`${getGradeColor(percentage)} text-white text-[5px] px-1 py-0.5 pixel-border font-bold`}>
                          {percentage >= 90 ? 'A' : 
                           percentage >= 80 ? 'B' : 
                           percentage >= 70 ? 'C' : 
                           percentage >= 60 ? 'D' : 'E'}
                        </div>
                              <div className="text-[5px] text-gray-600 mt-0.5">
                                {percentage}%
                              </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
                  {/* Assignment Summary - Pixel */}
                  <div className="mt-3 pt-3 pixel-border-t border-black">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="pixel-card bg-[#4ECDC4] p-2">
                        <div className="text-[8px] text-black font-bold">
                    {assignmentGrades.filter(a => a.status === 'completed').length}
                  </div>
                        <div className="text-[5px] text-gray-700">SELESAI</div>
                </div>
                      <div className="pixel-card bg-[#FFD700] p-2">
                        <div className="text-[8px] text-black font-bold">
                    {assignmentGrades.filter(a => a.status === 'late').length}
                  </div>
                        <div className="text-[5px] text-gray-700">TERLAMBAT</div>
                </div>
                      <div className="pixel-card bg-[#87CEEB] p-2">
                        <div className="text-[8px] text-black font-bold">
                    {Math.round(assignmentGrades.reduce((sum, a) => sum + (a.score / a.maxPoints * 100), 0) / assignmentGrades.length)}%
                  </div>
                        <div className="text-[5px] text-gray-700">RATA-RATA</div>
                </div>
                      <div className="pixel-card bg-[#FF6B6B] p-2">
                        <div className="text-[8px] text-black font-bold">
                    {assignmentGrades.reduce((sum, a) => sum + a.score, 0)}
                  </div>
                        <div className="text-[5px] text-gray-700">TOTAL POIN</div>
                </div>
              </div>
            </div>
          </div>
        )}
                      </div>
                    )}

          {/* Progress Tab - Pixel Style */}
          {activeTab === 'progress' && (
            <div className="space-y-3">
              <div className="pixel-card bg-white p-3">
                <h2 className="text-[8px] text-black mb-3">PROGRESS & ACHIEVEMENT</h2>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* XP Points - Pixel */}
                  <div className="pixel-card bg-[#FFD700] p-2">
            <div className="text-center">
                      <div className="text-[10px] text-black font-bold mb-1">
                        {stats.points.toLocaleString()}
            </div>
                      <div className="text-[6px] text-gray-700">TOTAL XP</div>
            </div>
            </div>

                  {/* Current Level - Pixel */}
                  <div className="pixel-card bg-[#4ECDC4] p-2">
            <div className="text-center">
                      <div className="text-[10px] text-black font-bold mb-1">
                        LV {stats.level}
            </div>
                      <div className="text-[6px] text-gray-700">{characterClass.name.toUpperCase()}</div>
        </div>
                  </div>
                </div>

                {/* EXP Progress Bar - Pixel */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[6px] text-black">NEXT LEVEL</span>
                    <span className="text-[6px] text-black font-bold">{rpgStats.exp}/{rpgStats.expToNext} XP</span>
                    </div>
                  <div className="pixel-progress bg-gray-300 h-4 overflow-hidden">
                    <div 
                      className="h-full bg-[#FFD700] transition-all duration-500"
                        style={{ width: `${(rpgStats.exp / rpgStats.expToNext) * 100}%` }}
                      ></div>
                    </div>
                  <div className="text-[6px] text-gray-600 mt-1 text-center">
                    {Math.round((rpgStats.exp / rpgStats.expToNext) * 100)}% COMPLETE
                  </div>
                </div>
            </div>
          </div>
        )}

          {/* Leaderboard Tab - Pixel Style */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-3">
              <div className="pixel-card bg-white p-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[8px] text-black">HALL OF FAME</h2>
                  
                  {/* Toggle between Global and Class leaderboard - Pixel */}
                  {classLeaderboard.length > 0 && (
                    <div className="flex gap-1">
                <button
                        onClick={() => setShowClassLeaderboard(false)}
                        className={`px-2 py-1 text-[6px] pixel-button ${
                          !showClassLeaderboard
                            ? 'bg-[#FFD700] text-black'
                            : 'bg-white text-black'
                        }`}
                      >
                        GLOBAL
                      </button>
                      <button
                        onClick={() => setShowClassLeaderboard(true)}
                        className={`px-2 py-1 text-[6px] pixel-button ${
                          showClassLeaderboard
                            ? 'bg-[#FFD700] text-black'
                            : 'bg-white text-black'
                        }`}
                      >
                        CLASS
                </button>
                    </div>
                  )}
              </div>
              
                {(showClassLeaderboard ? classLeaderboard : leaderboard).length > 0 ? (
                  <div className="space-y-2">
                    {(showClassLeaderboard ? classLeaderboard : leaderboard).slice(0, 8).map((student, index) => (
                      <div 
                        key={student.username}
                        className={`pixel-card p-2 ${
                          student.username === userInfo?.username 
                            ? 'bg-[#FFD700]' 
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-[8px] min-w-[1.5rem] text-center">
                            {index === 0 && '👑'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && <span className="text-[6px]">#{index + 1}</span>}
                        </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[6px] truncate ${
                              student.username === userInfo?.username ? 'text-black font-bold' : 'text-black'
                            }`}>
                              {student.fullName}
                              {student.username === userInfo?.username && (
                                <span className="ml-1 text-[5px] bg-[#FF6B6B] text-white px-1">YOU</span>
                              )}
                            </p>
                            <p className="text-[5px] text-gray-600">
                              {student.points.toLocaleString()} XP • LV{student.level}
                            </p>
                          </div>
                          <div className="text-[6px] text-black font-bold">
                            🏆{student.badges}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                  <div className="text-center py-6">
                    <p className="text-[6px] text-gray-600">NO DATA</p>
                </div>
              )}
            </div>
          </div>
        )}

          {/* Badges Tab - Pixel Style */}
            {activeTab === 'badges' && (
              <div className="space-y-3">
                <div className="pixel-card bg-white p-3">
                  <h2 className="text-[8px] text-black mb-3">BADGE COLLECTION</h2>
                  {stats.badges.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {stats.badges.map((badgeName, index) => {
                        const badge = availableBadges.find(b => b.name === badgeName);
                  return (
                    <div 
                      key={index}
                            className="pixel-card bg-[#FFD700] p-2 text-center"
                          >
                            <div className="text-2xl mb-1">{badge?.icon || '🏆'}</div>
                            <div className="text-[5px] text-black font-bold leading-tight">
                              {badgeName}
                      </div>
                            {badge?.pointValue && (
                              <div className="text-[5px] text-gray-700 mt-1">
                          +{badge.pointValue} XP
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-[6px] text-gray-600">NO BADGES YET</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Bottom Navigation Bar - Pixel Style */}
        <div className="fixed bottom-0 left-0 right-0 bg-white pixel-nav z-50">
          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`pixel-nav-item p-2 text-center ${
                activeTab === 'home' ? 'active' : 'bg-white'
              }`}
            >
              <div className="text-lg mb-1">🏠</div>
              <div className="text-[6px] text-black">HOME</div>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`pixel-nav-item p-2 text-center ${
                activeTab === 'progress' ? 'active' : 'bg-white'
              }`}
            >
              <div className="text-lg mb-1">📊</div>
              <div className="text-[6px] text-black">PROGRESS</div>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`pixel-nav-item p-2 text-center ${
                activeTab === 'leaderboard' ? 'active' : 'bg-white'
              }`}
            >
              <div className="text-lg mb-1">🏆</div>
              <div className="text-[6px] text-black">RANK</div>
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`pixel-nav-item p-2 text-center ${
                activeTab === 'badges' ? 'active' : 'bg-white'
              }`}
            >
              <div className="text-lg mb-1">🎖️</div>
              <div className="text-[6px] text-black">BADGES</div>
            </button>
    </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard; 
