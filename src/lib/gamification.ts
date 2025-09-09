// Unified gamification utilities for consistent XP and level calculations

export interface GamificationData {
  classId: string;
  studentUsername: string;
  points: number;
  level: number;
  badges: string;
  achievements: string;
  updatedAt: string;
}

export interface ProcessedStudentData {
  id: string;
  name: string;
  username: string;
  class: string;
  classId: string;
  points: number;
  level: number;
  badges: number;
  achievements: string[];
}

// Level calculation based on XP points
export const calculateLevelFromPoints = (points: number): number => {
  if (points < 100) return 1;
  if (points < 300) return 2;
  if (points < 600) return 3;
  if (points < 1000) return 4;
  if (points < 1500) return 5;
  if (points < 2100) return 6;
  if (points < 2800) return 7;
  if (points < 3600) return 8;
  if (points < 4500) return 9;
  if (points < 5500) return 10;
  
  // For levels above 10, each level requires 1000 more points
  return Math.floor(10 + (points - 5500) / 1000);
};

// Calculate XP required for next level
export const calculateXPToNextLevel = (currentPoints: number): { currentLevelXP: number; nextLevelXP: number; progress: number } => {
  const currentLevel = calculateLevelFromPoints(currentPoints);
  const nextLevel = currentLevel + 1;
  
  // Calculate XP thresholds
  const getLevelThreshold = (level: number): number => {
    if (level <= 1) return 0;
    if (level === 2) return 100;
    if (level === 3) return 300;
    if (level === 4) return 600;
    if (level === 5) return 1000;
    if (level === 6) return 1500;
    if (level === 7) return 2100;
    if (level === 8) return 2800;
    if (level === 9) return 3600;
    if (level === 10) return 4500;
    if (level === 11) return 5500;
    
    // For levels above 11
    return 5500 + (level - 11) * 1000;
  };
  
  const currentLevelXP = getLevelThreshold(currentLevel);
  const nextLevelXP = getLevelThreshold(nextLevel);
  const progressXP = currentPoints - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progress = requiredXP > 0 ? (progressXP / requiredXP) * 100 : 100;
  
  return {
    currentLevelXP: progressXP,
    nextLevelXP: requiredXP,
    progress: Math.min(Math.max(progress, 0), 100)
  };
};

// Process gamification data with consistent logic
export const processGamificationData = (
  studentsFromSheet: any[], 
  gamificationData: GamificationData[]
): ProcessedStudentData[] => {
  // Deduplicate students based on classId + username to prevent duplicate keys
  const uniqueStudents = studentsFromSheet.reduce((acc: any[], student: any) => {
    const key = `${student.classId || 'no-class'}-${student.username}`;
    if (!acc.some(s => `${s.classId || 'no-class'}-${s.username}` === key)) {
      acc.push(student);
    }
    return acc;
  }, []);

  const processedStudents = uniqueStudents.map(student => {
    const gamificationRecord = gamificationData.find(
      g => g.studentUsername === student.username && g.classId === student.classId
    );
    
    // Parse points and ensure it's a number
    const points = parseInt(gamificationRecord?.points?.toString() || '0') || 0;
    
    // Calculate level from points (this ensures consistency)
    const calculatedLevel = calculateLevelFromPoints(points);
    
    // Use stored level if it exists and is higher than calculated (manual overrides)
    const storedLevel = parseInt(gamificationRecord?.level?.toString() || '1') || 1;
    const finalLevel = Math.max(calculatedLevel, storedLevel);
    
    // Parse badges from the badges field (comma-separated badge names)
    const badgeNames = gamificationRecord?.badges ? 
      gamificationRecord.badges.split(',').filter(b => b.trim()).map(b => b.trim()) : [];
    
    // Parse achievements from the achievements field
    const achievements = gamificationRecord?.achievements ? 
      gamificationRecord.achievements.split(',').filter(a => a.trim()).map(a => a.trim()) : [];
    
    return {
      id: `${student.classId || 'no-class'}-${student.username}`,
      name: student.fullName || student.username,
      username: student.username,
      class: student.class || 'Unknown Class',
      classId: student.classId,
      points: points,
      level: finalLevel,
      badges: badgeNames.length,
      achievements: [...badgeNames, ...achievements] // Combine badges and achievements for display
    };
  });

  // Check for duplicate IDs and log warning if found
  const ids = processedStudents.map(s => s.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.warn('⚠️ Duplicate student IDs detected:', duplicateIds);
  }

  return processedStudents;
};

// Process leaderboard data with consistent logic
export const processLeaderboardData = (
  gamificationData: GamificationData[], 
  studentsData: any[]
): Array<{
  username: string;
  fullName: string;
  points: number;
  level: number;
  badges: number;
}> => {
  return gamificationData
    .filter(entry => entry.studentUsername && (entry.points || entry.points === 0))
    .map(entry => {
      const student = studentsData.find((s: any) => s.username === entry.studentUsername);
      const points = parseInt(entry.points?.toString() || '0') || 0;
      const calculatedLevel = calculateLevelFromPoints(points);
      const storedLevel = parseInt(entry.level?.toString() || '1') || 1;
      const finalLevel = Math.max(calculatedLevel, storedLevel);
      
      return {
        username: entry.studentUsername,
        fullName: student?.fullName || entry.studentUsername,
        points: points,
        level: finalLevel,
        badges: entry.badges ? 
          entry.badges.split(',').filter((b: string) => b.trim()).length : 0
      };
    })
    .sort((a, b) => b.points - a.points);
};

// Get current user's gamification stats
export const getCurrentUserStats = (
  gamificationData: GamificationData[],
  username: string
): { points: number; level: number; badges: string[]; rank: number } | null => {
  const userRecord = gamificationData.find(entry => entry.studentUsername === username);
  
  if (!userRecord) {
    return {
      points: 0,
      level: 1,
      badges: [],
      rank: 0
    };
  }
  
  const points = parseInt(userRecord.points?.toString() || '0') || 0;
  const calculatedLevel = calculateLevelFromPoints(points);
  const storedLevel = parseInt(userRecord.level?.toString() || '1') || 1;
  const finalLevel = Math.max(calculatedLevel, storedLevel);
  
  const badges = userRecord.badges ? 
    userRecord.badges.split(',').filter(b => b.trim()).map(b => b.trim()) : [];
  
  // Calculate rank
  const sortedData = gamificationData
    .filter(entry => entry.points || entry.points === 0)
    .sort((a, b) => (parseInt(b.points?.toString() || '0') || 0) - (parseInt(a.points?.toString() || '0') || 0));
  
  const rank = sortedData.findIndex(entry => entry.studentUsername === username) + 1;
  
  return {
    points,
    level: finalLevel,
    badges,
    rank: rank || sortedData.length + 1
  };
};
