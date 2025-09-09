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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-white font-bold text-lg">⚡ Lagi loading nih...</p>
          <p className="text-purple-300 text-sm mt-2">Bentar ya, data lagi di-sync ✨</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">🛡️ Waduh, ada error!</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Button 
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 border border-red-500"
          >
            <Sword className="w-4 h-4 mr-2" />
            Coba Lagi 🔄
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Fantasy Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">⭐</div>
        <div className="absolute top-32 right-20 text-4xl animate-bounce">🔮</div>
        <div className="absolute bottom-20 left-32 text-5xl animate-pulse">⚡</div>
        <div className="absolute bottom-40 right-10 text-3xl animate-bounce">🌟</div>
        <div className="absolute top-1/2 left-1/4 text-7xl animate-pulse">✨</div>
      </div>

      <div className="relative z-10 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Character Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 p-8 text-white border border-purple-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Character Avatar */}
                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${characterClass.color} flex items-center justify-center text-4xl border-4 border-white/30 shadow-2xl`}>
                  {characterClass.icon}
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    {stats.level}
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {userInfo?.fullName || 'Hero'} ⚔️
                  </h1>
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${characterClass.color} text-sm font-bold border border-white/30`}>
                      {characterClass.name}
                    </span>
                    <span className="text-purple-300">
                      Ranking #{getCurrentDisplayRank() > 0 ? getCurrentDisplayRank() : '?'} {getCurrentLeaderboardContext()}
                    </span>
                  </div>
                  <p className="text-purple-200">
                    {stats.points > 500 ? "Legend banget! Quest master sejati 🏆" : 
                     stats.points > 200 ? "Keren nih, adventurer yang promising! ⚡" :
                     "Pemula yang semangat, gas terus! 🌟"}
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4">
                <div className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <Crown className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                  <div className="text-2xl font-bold">{stats.points.toLocaleString()}</div>
                  <div className="text-xs text-purple-300">Total XP</div>
                </div>
                <div className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <Award className="w-6 h-6 mx-auto mb-1 text-orange-400" />
                  <div className="text-2xl font-bold">{stats.badges.length}</div>
                  <div className="text-xs text-purple-300">Trofi</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RPG Stats Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* XP and Level Progress */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Progress & Achievement
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* XP Points */}
              <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Total Experience</h3>
                    <p className="text-yellow-300 text-sm">XP yang udah dikumpulin</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-400 mb-2">
                    {stats.points.toLocaleString()}
                  </div>
                  <div className="text-sm text-yellow-300">Poin XP</div>
                </div>
              </div>

              {/* Current Level */}
              <div className={`bg-gradient-to-br ${characterClass.color}/20 border border-purple-500/30 rounded-xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{characterClass.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Level Sekarang</h3>
                    <p className="text-purple-300 text-sm">{characterClass.name}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.level}
                  </div>
                  <div className="text-sm text-purple-300">Level</div>
                </div>
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Progress ke Level Selanjutnya</span>
                <span className="text-yellow-400 font-bold">{rpgStats.exp}/{rpgStats.expToNext} XP</span>
              </div>
              <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${(rpgStats.exp / rpgStats.expToNext) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-400 mt-1 text-center">
                {Math.round((rpgStats.exp / rpgStats.expToNext) * 100)}% selesai
              </div>
            </div>
          </div>

          {/* Guild Rankings (Leaderboard) */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Hall of Fame 🏰
              </h2>
              
              {/* Toggle between Global and Class leaderboard */}
              {classLeaderboard.length > 0 && (
                <div className="flex bg-slate-700/50 rounded-lg p-1 border border-purple-500/30">
                  <button
                    onClick={() => setShowClassLeaderboard(false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      !showClassLeaderboard
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-purple-300 hover:text-white hover:bg-purple-700/50'
                    }`}
                  >
                    🌍 Global
                  </button>
                  <button
                    onClick={() => setShowClassLeaderboard(true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      showClassLeaderboard
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-purple-300 hover:text-white hover:bg-purple-700/50'
                    }`}
                  >
                    🏫 Kelas
                  </button>
                </div>
              )}
            </div>
            
            {(showClassLeaderboard ? classLeaderboard : leaderboard).length > 0 ? (
              <div>
                {/* Leaderboard scope indicator */}
                <div className="mb-4 text-center">
                  <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/30">
                    {showClassLeaderboard 
                      ? `🏫 Ranking Kelas (${classLeaderboard.length} siswa)`
                      : `🌍 Ranking Global (${leaderboard.length} siswa)`}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {(showClassLeaderboard ? classLeaderboard : leaderboard).slice(0, 8).map((student, index) => (
                  <div 
                    key={student.username}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-102 ${
                      student.username === userInfo?.username 
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50' 
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-2xl min-w-[2rem] text-center">
                      {index === 0 && '👑'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        student.username === userInfo?.username ? 'text-white' : 'text-slate-300'
                      }`}>
                        {student.fullName}
                        {student.username === userInfo?.username && ' (Kamu)'}
                      </p>
                      <p className="text-xs text-slate-400">{student.points.toLocaleString()} XP • Lv.{student.level}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-bold">{student.badges}</span>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Castle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400">
                  {showClassLeaderboard 
                    ? 'Hall of Fame kelas lagi kosong nih...' 
                    : 'Hall of Fame lagi kosong nih...'}
                </p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full mt-4 border-purple-500/50 text-purple-300 hover:bg-purple-600/20 hover:text-white"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <Compass className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data 🔄'}
            </Button>
          </div>
        </div>

        {/* Real Progress Overview */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Progress Akademik 📊
            {refreshing && (
              <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full animate-pulse">
                Syncing...
              </span>
            )}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Real Attendance */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Tingkat Kehadiran</span>
                <span className="text-sm font-bold text-green-400">{stats.attendance}%</span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.attendance}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.attendance >= 80 ? 'Rajin banget! Mantap 👏' : 
                 stats.attendance > 0 ? 'Yuk lebih rajin hadir! 📚' : 
                 'Data kehadiran lagi di-sync...⏳'}
              </p>
            </div>
            
            {/* Real Grade Average */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Rata-rata Nilai</span>
                <span className="text-sm font-bold text-blue-400">{stats.averageGrade}</span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.averageGrade, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.averageGrade >= 80 ? 'Prestasi keren! 🌟' : 
                 stats.averageGrade > 0 ? 'Semangat belajar terus! 📖' : 
                 'Data nilai lagi di-sync...⏳'}
              </p>
            </div>
            
            {/* Real Assignments Completed */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Tugas Selesai</span>
                <span className="text-sm font-bold text-purple-400">{stats.completedAssignments}</span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.completedAssignments / Math.max(stats.completedAssignments, 10)) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.completedAssignments >= 10 ? 'Produktif banget! 🔥' : 
                 stats.completedAssignments > 0 ? 'Ada quest lain menunggu! 💪' : 
                 'Data tugas lagi di-sync...⏳'}
              </p>
            </div>
          </div>
        </div>

        {/* Assignment Grades Detail */}
        {assignmentGrades.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-400" />
              Nilai Tugas 📝
              <span className="ml-auto text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                {assignmentGrades.length} Tugas
              </span>
            </h2>
            
            <div className="grid gap-4">
              {assignmentGrades.map((assignment, index) => {
                const percentage = Math.round((assignment.score / assignment.maxPoints) * 100);
                const getGradeColor = (percentage: number) => {
                  if (percentage >= 90) return 'from-green-500 to-emerald-500';
                  if (percentage >= 80) return 'from-blue-500 to-cyan-500';
                  if (percentage >= 70) return 'from-yellow-500 to-orange-500';
                  if (percentage >= 60) return 'from-orange-500 to-red-500';
                  return 'from-red-500 to-pink-500';
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
                    case 'completed': return 'Selesai';
                    case 'late': return 'Terlambat';
                    case 'missing': return 'Belum Dikerjakan';
                    default: return 'Unknown';
                  }
                };

                return (
                  <div 
                    key={assignment.assignmentId || index}
                    className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-300 hover:border-purple-500/50"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Assignment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">{getStatusIcon(assignment.status)}</div>
                          <div>
                            <h3 className="text-lg font-bold text-white truncate">
                              {assignment.assignmentTitle}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>{getStatusText(assignment.status)}</span>
                              {assignment.dueDate && (
                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString('id-ID')}</span>
                              )}
                              {assignment.submittedAt && (
                                <span>Dikerjakan: {new Date(assignment.submittedAt).toLocaleDateString('id-ID')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {assignment.assignmentDescription && (
                          <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                            {assignment.assignmentDescription}
                          </p>
                        )}
                        
                        {assignment.feedback && (
                          <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-slate-400 mb-1">💬 Feedback:</p>
                            <p className="text-sm text-slate-300">{assignment.feedback}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Score Display */}
                      <div className="flex flex-col items-center lg:items-end gap-3">
                        <div className="text-center lg:text-right">
                          <div className="text-3xl font-bold text-white mb-1">
                            {assignment.score}
                          </div>
                          <div className="text-sm text-slate-400">
                            dari {assignment.maxPoints}
                          </div>
                        </div>
                        
                        {/* Percentage Circle */}
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="rgb(51 65 85)"
                              strokeWidth="4"
                              fill="transparent"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke={percentage >= 90 ? '#10b981' : percentage >= 80 ? '#3b82f6' : percentage >= 70 ? '#f59e0b' : percentage >= 60 ? '#f97316' : '#ef4444'}
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
                              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Grade Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getGradeColor(percentage)} text-white`}>
                          {percentage >= 90 ? 'A' : 
                           percentage >= 80 ? 'B' : 
                           percentage >= 70 ? 'C' : 
                           percentage >= 60 ? 'D' : 'E'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Assignment Summary */}
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {assignmentGrades.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-xs text-slate-400">Selesai Tepat Waktu</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-yellow-400">
                    {assignmentGrades.filter(a => a.status === 'late').length}
                  </div>
                  <div className="text-xs text-slate-400">Terlambat</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(assignmentGrades.reduce((sum, a) => sum + (a.score / a.maxPoints * 100), 0) / assignmentGrades.length)}%
                  </div>
                  <div className="text-xs text-slate-400">Rata-rata</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-400">
                    {assignmentGrades.reduce((sum, a) => sum + a.score, 0)}
                  </div>
                  <div className="text-xs text-slate-400">Total Poin</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Trophy Collection */}
        {stats.badges.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Koleksi Trofi 🏆
              <span className="ml-auto text-sm bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full border border-yellow-500/30">
                {stats.badges.length} Badge{stats.badges.length !== 1 ? 's' : ''}
              </span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {stats.badges.map((badgeName, index) => {
                const badge = availableBadges.find(b => b.name === badgeName);
                return (
                  <div 
                    key={index}
                    className="relative group bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl cursor-pointer"
                    title={badgeName}
                  >
                    <div className="text-4xl mb-3">
                      {badge?.icon || '🏆'}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 leading-tight min-h-[2.5rem] flex items-center justify-center">
                      {badgeName}
                    </h3>
                    {badge?.pointValue && (
                      <div className="text-xs text-yellow-300 font-medium">
                        +{badge.pointValue} XP
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/0 to-yellow-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-yellow-400">{stats.badges.length}</div>
                  <div className="text-xs text-slate-400">Badge Diperoleh</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-orange-400">
                    {availableBadges.reduce((total, badge) => {
                      const isEarned = stats.badges.includes(badge.name);
                      return total + (isEarned ? (badge.pointValue || 0) : 0);
                    }, 0)}
                  </div>
                  <div className="text-xs text-slate-400">XP dari Badge</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 col-span-2 md:col-span-1">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round((stats.badges.length / Math.max(availableBadges.length, 1)) * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">Koleksi Lengkap</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Koleksi Trofi 🏆
              <span className="ml-auto text-sm bg-slate-600/50 text-slate-400 px-3 py-1 rounded-full border border-slate-500/30">
                0 Badge
              </span>
            </h2>
            
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg font-medium mb-2">Belum ada badge nih</p>
              <p className="text-slate-500 text-sm mb-6">Yuk selesaikan achievement untuk dapetin trofi pertama! ⭐</p>
              
              {availableBadges.length > 0 && (
                <div>
                  <p className="text-slate-400 text-sm mb-4">Badge yang bisa didapetin:</p>
                  <div className="flex justify-center gap-2 flex-wrap max-w-md mx-auto">
                    {availableBadges.slice(0, 6).map((badge, index) => (
                      <div key={index} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title={badge.name}>
                        {badge.icon || '🏆'}
                      </div>
                    ))}
                    {availableBadges.length > 6 && (
                      <div className="text-slate-500 text-sm">+{availableBadges.length - 6} lagi</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium border border-blue-500/50"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <div className="text-center">
              <Compass className={`w-6 h-6 mx-auto mb-1 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
            </div>
          </Button>
          
          <Button className="h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium border border-green-500/50">
            <div className="text-center">
              <Map className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm">Peta Progress</span>
            </div>
          </Button>
          
          <Button className="h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium border border-purple-500/50">
            <div className="text-center">
              <Users className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm">Teman Kelas</span>
            </div>
          </Button>
          
          <Button className="h-16 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium border border-orange-500/50">
            <div className="text-center">
              <Star className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm">Achievement</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 