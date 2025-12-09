import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MagnifyingGlass, Medal, Trophy, Star, Lightning, Target, Users, ChartBar, Pencil, Trash, X, FloppyDisk, Gift, CheckCircle, WarningCircle, ArrowClockwise, Smiley } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gamificationApi, badgeApi, levelApi, challengeApi, apiRequest } from '@/lib/api';
import { processGamificationData, calculateLevelFromPoints } from '@/lib/gamification';
import React from 'react';

interface GamificationRecord {
  classId: string;
  studentUsername: string;
  points: number;
  level: number;
  badges: string;
  achievements: string;
  updatedAt: string;
}

interface StudentData {
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

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointValue: number;
  isActive: boolean;
  awardedCount: number;
  createdAt?: string;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  participants: number;
  completions: number;
  isActive: boolean;
}

interface Level {
  id: number;
  name: string;
  pointsRequired: number;
  benefits: string;
  color?: string;
  createdAt?: string;
}

// Enhanced Notification Component
const NotificationToast = ({ notification, onClose }: {
  notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; visible: boolean };
  onClose: () => void;
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <WarningCircle className="w-5 h-5" />;
      case 'warning': return <WarningCircle className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'bg-industrial-white border-2 border-industrial-black text-industrial-black';
      case 'error': return 'bg-industrial-white border-2 border-industrial-red text-industrial-red';
      case 'warning': return 'bg-industrial-white border-2 border-industrial-black text-industrial-black';
      default: return 'bg-industrial-white border-2 border-industrial-steel text-industrial-black';
    }
  };

  return (
    <AnimatePresence>
      {notification.visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${getColors()}`}
        >
          {getIcon()}
          <span className="text-sm font-semibold">{notification.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-industrial-light text-industrial-text-secondary hover:text-industrial-black"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced Loading Skeleton - Industrial Minimalism
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} variant="industrial">
          <CardContent className="h-24 bg-industrial-light"></CardContent>
        </Card>
      ))}
    </div>
    <Card variant="industrial">
      <CardContent className="h-64 bg-industrial-light"></CardContent>
    </Card>
  </div>
);

// Enhanced Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'default' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large' | 'xl';
}) => {
  const sizeClasses = {
    default: 'max-w-md',
    large: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-industrial-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-industrial-white border-2 border-industrial-black shadow-[0_8px_16px_rgba(0,0,0,0.3)] w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-industrial-black">
              <h3 className="text-lg font-semibold text-industrial-black industrial-h2">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-industrial-light text-industrial-text-secondary hover:text-industrial-black"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Enhanced Emoji Picker Component
const EmojiPicker = ({ selectedEmoji, onEmojiSelect, isOpen, onToggle }: {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const emojiCategories = {
    'Trophies & Awards': ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '👑', '💎'],
    'Achievement': ['⭐', '🌟', '✨', '💫', '🔥', '⚡', '💥', '🎯', '💪', '🎊'],
    'Education': ['📚', '📖', '✏️', '📝', '🎓', '🏫', '📊', '📈', '📋', '📌'],
    'Activities': ['🎨', '🎵', '🎬', '🎮', '⚽', '🏀', '🏓', '🎪', '🎭', '🎸'],
    'Special': ['🎉', '🎁', '🌈', '🦄', '🚀', '🛸', '✨', '💯', '🔮', '💝'],
    'Animals': ['🦁', '🐯', '🐻', '🦊', '🐺', '🐸', '🐵', '🦅', '🐲', '🦋'],
    'Nature': ['🌺', '🌸', '🌻', '🌹', '🌿', '🍀', '🌳', '🌴', '🌙', '☀️'],
    'Objects': ['⚔️', '🛡️', '🗡️', '🏹', '🔱', '⚖️', '🔧', '🔨', '⚙️', '🔑']
  };

  return (
    <div className="relative" data-emoji-picker>
      <Button
        type="button"
        variant="outline"
        onClick={onToggle}
        className="w-full flex items-center justify-between h-10 px-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedEmoji}</span>
          <span className="text-sm text-gray-600">Choose icon</span>
        </div>
        <Smiley className="w-4 h-4 text-gray-400" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              <div className="text-center text-xs text-gray-500 mb-3">
                💡 Click on an emoji to select it as your badge icon
              </div>
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="grid grid-cols-10 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={`${category}-${emoji}-${index}`}
                        type="button"
                        onClick={() => {
                          onEmojiSelect(emoji);
                          onToggle();
                        }}
                        className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors ${
                          selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GamifikasiPage = () => {
  // States
  const [students, setStudents] = useState<StudentData[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  
  // Pagination state for Students Tab
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [showCreateBadgeModal, setShowCreateBadgeModal] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showBadgeAssignModal, setShowBadgeAssignModal] = useState(false);
  const [showBulkPointsModal, setShowBulkPointsModal] = useState(false);
  const [showClassLeaderboardModal, setShowClassLeaderboardModal] = useState(false);
  const [showBadgeRecipientsModal, setShowBadgeRecipientsModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedBadgeForAssign, setSelectedBadgeForAssign] = useState<Badge | null>(null);
  const [selectedBadgeForRecipients, setSelectedBadgeForRecipients] = useState<Badge | null>(null);
  const [selectedStudentsForBadge, setSelectedStudentsForBadge] = useState<string[]>([]);
  const [selectedStudentsForBulkPoints, setSelectedStudentsForBulkPoints] = useState<string[]>([]);
  const [selectedClassForLeaderboard, setSelectedClassForLeaderboard] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    message: ''
  });

  // Form states
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'achievement',
    pointValue: 100
  });

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    reward: 50,
    deadline: ''
  });

  const [levelForm, setLevelForm] = useState({
    name: '',
    pointsRequired: 0,
    benefits: '',
    color: '#3B82F6'
  });

  const [awardForm, setAwardForm] = useState({
    type: 'points' as 'points' | 'badge',
    points: 10,
    badgeId: '',
    reason: ''
  });

  const [bulkPointsForm, setBulkPointsForm] = useState({
    points: 10,
    reason: ''
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBadges(),
        fetchChallenges(), 
        fetchLevels(),
        fetchStudents()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Gagal memuat data gamifikasi');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await badgeApi.getAll();
      if (response.success) {
        setBadges(response.badges || []);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await challengeApi.getAll();
      if (response.success) {
        setChallenges(response.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await levelApi.getAll();
      if (response.success) {
        setLevels(response.levels || []);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const [studentsResponse, gamificationResponse] = await Promise.all([
        apiRequest('getStudentsFromSheet', {}),
        gamificationApi.getAll()
      ]);

      // If students sheet doesn't exist or is empty, create sample data
      if (!studentsResponse.success || (studentsResponse.success && studentsResponse.students?.length === 0)) {
        const createResponse = await apiRequest('createStudentsSheet', {});
        
        if (createResponse.success) {
          // Try fetching students again
          const retryResponse = await apiRequest('getStudentsFromSheet', {});
    
          
          if (retryResponse.success && gamificationResponse.success) {
            const combinedData = combineStudentsWithGamification(
              retryResponse.students || [],
              gamificationResponse.data || []
            );
            setStudents(combinedData);
            showNotification('info', 'Data siswa sampel telah dibuat');
            return;
          }
        } else {
          showNotification('error', 'Gagal membuat data siswa sampel');
        }
      }

      if (studentsResponse.success && gamificationResponse.success) {
        const combinedData = combineStudentsWithGamification(
          studentsResponse.students || [],
          gamificationResponse.data || []
        );
        setStudents(combinedData);
      } else {
        showNotification('error', 'Gagal memuat data siswa');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat memuat data siswa');
    }
  };

  const combineStudentsWithGamification = (studentsFromSheet: any[], gamificationData: GamificationRecord[]): StudentData[] => {
    // Use unified gamification processing for consistency
    return processGamificationData(studentsFromSheet, gamificationData);
  };

  const refreshData = async () => {
    await fetchData();
    showNotification('success', 'Data berhasil diperbarui');
  };


  // CRUD Operations
  const handleSaveBadge = async () => {
    if (!badgeForm.name.trim() || !badgeForm.description.trim()) {
      showNotification('error', 'Nama dan deskripsi badge wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const response = editingBadge
        ? await badgeApi.update(editingBadge.id, badgeForm.name, badgeForm.description, badgeForm.icon, badgeForm.category, badgeForm.pointValue)
        : await badgeApi.create(badgeForm.name, badgeForm.description, badgeForm.icon, badgeForm.category, badgeForm.pointValue);

      if (response.success) {
        showNotification('success', editingBadge ? 'Badge berhasil diperbarui' : 'Badge berhasil dibuat');
        await fetchBadges();
        setShowCreateBadgeModal(false);
        setEditingBadge(null);
        setBadgeForm({ name: '', description: '', icon: '🏆', category: 'achievement', pointValue: 100 });
      } else {
        showNotification('error', response.error || 'Gagal menyimpan badge');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menyimpan badge');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChallenge = async () => {
    if (!challengeForm.title.trim() || !challengeForm.description.trim()) {
      showNotification('error', 'Judul dan deskripsi challenge wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const response = editingChallenge
        ? await challengeApi.update(editingChallenge.id.toString(), challengeForm.title, challengeForm.description, challengeForm.reward, challengeForm.deadline)
        : await challengeApi.create(challengeForm.title, challengeForm.description, challengeForm.reward, challengeForm.deadline);

      if (response.success) {
        showNotification('success', editingChallenge ? 'Challenge berhasil diperbarui' : 'Challenge berhasil dibuat');
        await fetchChallenges();
        setShowCreateChallengeModal(false);
        setEditingChallenge(null);
        setChallengeForm({ title: '', description: '', reward: 50, deadline: '' });
      } else {
        showNotification('error', response.error || 'Gagal menyimpan challenge');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menyimpan challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLevel = async () => {
    if (!levelForm.name.trim() || levelForm.pointsRequired <= 0) {
      showNotification('error', 'Nama dan poin yang diperlukan wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const response = editingLevel
        ? await levelApi.update(editingLevel.id, levelForm.name, levelForm.pointsRequired, levelForm.benefits, levelForm.color)
        : await levelApi.create(levelForm.name, levelForm.pointsRequired, levelForm.benefits, levelForm.color);

      if (response.success) {
        showNotification('success', editingLevel ? 'Level berhasil diperbarui' : 'Level berhasil dibuat');
        await fetchLevels();
        setShowCreateLevelModal(false);
        setEditingLevel(null);
        setLevelForm({ name: '', pointsRequired: 0, benefits: '', color: '#3B82F6' });
      } else {
        showNotification('error', response.error || 'Gagal menyimpan level');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menyimpan level');
    } finally {
      setSaving(false);
    }
  };

  const handleAward = async () => {
    if (!selectedStudent) return;

    setSaving(true);
    try {
      let response;
      if (awardForm.type === 'badge') {
        const badge = badges.find(b => b.id.toString() === awardForm.badgeId);
        if (!badge) {
          showNotification('error', 'Badge tidak ditemukan');
          setSaving(false);
          return;
        }

        response = await apiRequest('awardBadge', {
          classId: selectedStudent.classId,
          studentUsername: selectedStudent.username,
          badgeId: awardForm.badgeId,
          badgeName: badge.name
        });
        
        // Auto-update level based on badge points if badge was awarded successfully
        if (response.success && response.newTotal) {
          const newLevel = calculateLevelFromPoints(response.newTotal);
          if (newLevel > selectedStudent.level) {
            await gamificationApi.updateLevel(selectedStudent.classId, selectedStudent.username, newLevel);
          }
        }
      } else {
        response = await apiRequest('awardPoints', {
          classId: selectedStudent.classId,
          studentUsername: selectedStudent.username,
          points: awardForm.points,
          reason: awardForm.reason
        });
        
        // Auto-update level based on new points total if points were awarded successfully
        if (response.success && response.newTotal) {
          const newLevel = calculateLevelFromPoints(response.newTotal);
          if (newLevel > selectedStudent.level) {
            await gamificationApi.updateLevel(selectedStudent.classId, selectedStudent.username, newLevel);
          }
        }
      }



      if (response.success) {
        showNotification('success', `Berhasil memberikan ${awardForm.type === 'badge' ? 'badge' : 'poin'} kepada ${selectedStudent.name}`);
        await fetchStudents();
        setShowAwardModal(false);
        setSelectedStudent(null);
        setAwardForm({ type: 'points', points: 10, badgeId: '', reason: '' });
      } else {
        showNotification('error', response.error || 'Gagal memberikan reward');
      }
    } catch (error) {
      console.error('Award error:', error);
      showNotification('error', 'Terjadi kesalahan saat memberikan reward');
    } finally {
      setSaving(false);
    }
  };

  const handleBadgeAssignment = async () => {
    if (!selectedBadgeForAssign || selectedStudentsForBadge.length === 0) {
      showNotification('error', 'Pilih badge dan minimal satu siswa');
      return;
    }

    setSaving(true);
    try {


      const promises = selectedStudentsForBadge.map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
          const result = await apiRequest('awardBadge', {
            classId: student.classId,
            studentUsername: student.username,
            badgeId: selectedBadgeForAssign.id.toString(),
            badgeName: selectedBadgeForAssign.name
          });
          
          // Auto-update level if badge was awarded successfully
          if (result.success && result.newTotal) {
            const newLevel = calculateLevelFromPoints(result.newTotal);
            if (newLevel > student.level) {
              await gamificationApi.updateLevel(student.classId, student.username, newLevel);
            }
          }
          
          return result;
        }
        return Promise.resolve({ success: false, error: 'Student not found' });
      });

      const results = await Promise.all(promises);

      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success);
      
      if (successful > 0) {
        showNotification('success', `Badge berhasil diberikan kepada ${successful} siswa`);
        if (failed.length > 0) {
    
          showNotification('warning', `${failed.length} siswa gagal menerima badge`);
        }
        await fetchStudents();
      } else {
        showNotification('error', 'Gagal memberikan badge ke semua siswa');
      }

      setShowBadgeAssignModal(false);
      setSelectedBadgeForAssign(null);
      setSelectedStudentsForBadge([]);
    } catch (error) {
      console.error('Badge assignment error:', error);
      showNotification('error', 'Terjadi kesalahan saat memberikan badge');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPointsAward = async () => {
    if (selectedStudentsForBulkPoints.length === 0) {
      showNotification('error', 'Pilih minimal satu siswa');
      return;
    }

    if (bulkPointsForm.points <= 0) {
      showNotification('error', 'Jumlah poin harus lebih dari 0');
      return;
    }

    setSaving(true);
    try {
      const promises = selectedStudentsForBulkPoints.map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
          const result = await apiRequest('awardPoints', {
            classId: student.classId,
            studentUsername: student.username,
            points: bulkPointsForm.points,
            reason: bulkPointsForm.reason
          });
          
          // Auto-update level if points were awarded successfully
          if (result.success && result.newTotal) {
            const newLevel = calculateLevelFromPoints(result.newTotal);
            if (newLevel > student.level) {
              await gamificationApi.updateLevel(student.classId, student.username, newLevel);
            }
          }
          
          return result;
        }
        return Promise.resolve({ success: false, error: 'Student not found' });
      });

      const results = await Promise.all(promises);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success);
      
      if (successful > 0) {
        showNotification('success', `Poin berhasil diberikan kepada ${successful} siswa`);
        if (failed.length > 0) {
          showNotification('warning', `${failed.length} siswa gagal menerima poin`);
        }
        await fetchStudents();
      } else {
        showNotification('error', 'Gagal memberikan poin ke semua siswa');
      }

      setShowBulkPointsModal(false);
      setSelectedStudentsForBulkPoints([]);
      setBulkPointsForm({ points: 10, reason: '' });
    } catch (error) {
      console.error('Bulk points award error:', error);
      showNotification('error', 'Terjadi kesalahan saat memberikan poin');
    } finally {
      setSaving(false);
    }
  };

  // Helper functions
  const openEditBadge = (badge: Badge) => {
    setEditingBadge(badge);
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      pointValue: badge.pointValue
    });
    setShowEmojiPicker(false);
    setShowCreateBadgeModal(true);
  };

  const openEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      reward: challenge.reward,
      deadline: challenge.deadline
    });
    setShowCreateChallengeModal(true);
  };

  const openEditLevel = (level: Level) => {
    setEditingLevel(level);
    setLevelForm({
      name: level.name,
      pointsRequired: level.pointsRequired,
      benefits: level.benefits,
      color: level.color || '#3B82F6'
    });
    setShowCreateLevelModal(true);
  };

  const openAwardModal = (student: StudentData) => {
    setSelectedStudent(student);
    setShowAwardModal(true);
  };

  const deleteBadge = async (id: number) => {
    try {
      const response = await badgeApi.delete(id);
      if (response.success) {
        showNotification('success', 'Badge berhasil dihapus');
        await fetchBadges();
      } else {
        showNotification('error', response.error || 'Gagal menghapus badge');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menghapus badge');
    }
  };

  const deleteChallenge = async (id: number) => {
    try {
      const response = await challengeApi.delete(id.toString());
      if (response.success) {
        showNotification('success', 'Challenge berhasil dihapus');
        await fetchChallenges();
      } else {
        showNotification('error', response.error || 'Gagal menghapus challenge');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menghapus challenge');
    }
  };

  const deleteLevel = async (id: number) => {
    try {
      const response = await levelApi.delete(id);
      if (response.success) {
        showNotification('success', 'Level berhasil dihapus');
        await fetchLevels();
      } else {
        showNotification('error', response.error || 'Gagal menghapus level');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menghapus level');
    }
  };

  const toggleChallengeStatus = async (id: number) => {
    try {
      const response = await challengeApi.toggleStatus(id.toString());
      if (response.success) {
        showNotification('success', 'Status challenge berhasil diubah');
        await fetchChallenges();
      } else {
        showNotification('error', response.error || 'Gagal mengubah status challenge');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat mengubah status challenge');
    }
  };

  const openBadgeAssignModal = (badge: Badge) => {

    
    // Check if we have student data
    if (students.length === 0) {
      showNotification('warning', 'Tidak ada data siswa. Silakan refresh halaman.');
      return;
    }
    
    // Check if we have class data
    if (uniqueClasses.length === 0) {
      showNotification('warning', 'Tidak ada kelas terdeteksi. Pastikan siswa memiliki data kelas yang valid.');
      return;
    }
    
    setSelectedBadgeForAssign(badge);
    setClassFilter('all'); // Reset filter
    setLevelFilter('all'); // Reset filter
    setSelectedStudentsForBadge([]); // Reset selection
    setShowBadgeAssignModal(true);
  };

  const openBulkPointsModal = () => {
    // Check if we have student data
    if (students.length === 0) {
      showNotification('warning', 'Tidak ada data siswa. Silakan refresh halaman.');
      return;
    }
    
    // Check if we have class data
    if (uniqueClasses.length === 0) {
      showNotification('warning', 'Tidak ada kelas terdeteksi. Pastikan siswa memiliki data kelas yang valid.');
      return;
    }
    
    setClassFilter('all'); // Reset filter
    setLevelFilter('all'); // Reset filter
    setSelectedStudentsForBulkPoints([]); // Reset selection
    setBulkPointsForm({ points: 10, reason: '' }); // Reset form
    setShowBulkPointsModal(true);
  };

  const openClassLeaderboardModal = (classData: any) => {
    setSelectedClassForLeaderboard(classData);
    setShowClassLeaderboardModal(true);
  };

  const openBadgeRecipientsModal = (badge: Badge) => {
    setSelectedBadgeForRecipients(badge);
    setShowBadgeRecipientsModal(true);
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentsForBadge(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBulkPointsStudentSelection = (studentId: string) => {
    setSelectedStudentsForBulkPoints(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    const filteredStudents = getFilteredStudentsForAssignment();
    const allSelected = filteredStudents.every(student => selectedStudentsForBadge.includes(student.id));
    
    if (allSelected) {
      setSelectedStudentsForBadge(prev => prev.filter(id => !filteredStudents.some(s => s.id === id)));
    } else {
      setSelectedStudentsForBadge(prev => [...new Set([...prev, ...filteredStudents.map(s => s.id)])]);
    }
  };

  const handleSelectAllBulkPointsStudents = () => {
    const filteredStudents = getFilteredStudentsForBulkPoints();
    const allSelected = filteredStudents.every(student => selectedStudentsForBulkPoints.includes(student.id));
    
    if (allSelected) {
      setSelectedStudentsForBulkPoints(prev => prev.filter(id => !filteredStudents.some(s => s.id === id)));
    } else {
      setSelectedStudentsForBulkPoints(prev => [...new Set([...prev, ...filteredStudents.map(s => s.id)])]);
    }
  };

  const getFilteredStudentsForAssignment = () => {

    
    const filtered = students.filter(student => {
      const matchesClass = classFilter === 'all' || student.classId === classFilter;
      const matchesLevel = levelFilter === 'all' || student.level.toString() === levelFilter;
      

      
      return matchesClass && matchesLevel;
    });
    

    return filtered;
  };

  const getFilteredStudentsForBulkPoints = () => {
    const filtered = students.filter(student => {
      const matchesClass = classFilter === 'all' || student.classId === classFilter;
      const matchesLevel = levelFilter === 'all' || student.level.toString() === levelFilter;
      
      return matchesClass && matchesLevel;
    });

    return filtered;
  };

  // Filtered data with error handling
  const filteredStudents = useMemo(() => {
    try {
      if (!Array.isArray(students)) {
        return [];
      }
      
      return students.filter(student => {
        if (!student || typeof student !== 'object') {
          return false;
        }
        
        try {
          const name = student.name || '';
          const username = student.username || '';
          const studentClass = student.class || '';
          const query = (searchQuery || '').toLowerCase();
          
          return name.toLowerCase().includes(query) ||
                 username.toLowerCase().includes(query) ||
                 studentClass.toLowerCase().includes(query);
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return [];
    }
  }, [students, searchQuery]);

  // Pagination for Students Tab
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Statistics
  const stats = {
    totalStudents: students.length,
    totalBadges: badges.length,
    totalChallenges: challenges.length,
    totalLevels: levels.length,
    averagePoints: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.points, 0) / students.length) : 0,
    topStudent: students.length > 0 ? students.reduce((top, current) => current.points > top.points ? current : top) : null
  };

  // Get unique values for filters
  const uniqueClasses = React.useMemo(() => {

    
    const classMap = new Map();
    students.forEach(student => {
      if (student.classId && student.class) {
        classMap.set(student.classId, {
          id: student.classId,
          name: student.class
        });
      }
    });
    
    const classes = Array.from(classMap.values());

    return classes;
  }, [students]);

  const uniqueLevels = React.useMemo(() => {
    const levels = [...new Set(students.map(s => s.level))].sort((a, b) => a - b);

    return levels;
  }, [students]);

  const getBadgeIcon = (icon: string) => {
    if (icon.match(/\p{Emoji}/u)) {
      return <span className="text-2xl">{icon}</span>;
    }
    return <Trophy className="w-6 h-6 text-yellow-500" />;
  };

  // Get students who have received a specific badge
  const getStudentsWithBadge = (badgeName: string) => {
    return students.filter(student => 
      student.achievements && student.achievements.includes(badgeName)
    );
  };

  // Get badge recipient count
  const getBadgeRecipientCount = (badgeName: string) => {
    return getStudentsWithBadge(badgeName).length;
  };

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-gray-500',    // Level 1
      'bg-green-500',   // Level 2  
      'bg-blue-500',    // Level 3
      'bg-purple-500',  // Level 4
      'bg-yellow-500',  // Level 5+
    ];
    return colors[Math.min(level - 1, colors.length - 1)] || colors[0];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker) {
        const target = event.target as Element;
        const emojiPicker = document.querySelector('[data-emoji-picker]');
        if (emojiPicker && !emojiPicker.contains(target)) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification Toast */}
        {notification.visible && (
          <NotificationToast
            notification={notification}
            onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
          />
        )}

        {/* Header - Industrial Minimalism */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-industrial-black industrial-h1">
                Gamifikasi
              </h1>
              <p className="text-industrial-text-secondary">Kelola sistem penghargaan dan motivasi siswa</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={refreshData}
                variant="industrial-secondary" 
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowClockwise className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Industrial Minimalism */}
        <Card variant="industrial" className="mb-4 sm:mb-6">
          <nav className="flex space-x-8 border-b-2 border-industrial-black overflow-x-auto">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: ChartBar },
                { key: 'badges', label: 'Badge', icon: Medal },
                { key: 'levels', label: 'Level', icon: Trophy },
                { key: 'challenges', label: 'Challenge', icon: Target },
                { key: 'students', label: 'Siswa', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                      ? 'border-industrial-black text-industrial-white bg-industrial-black'
                      : 'border-transparent text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </nav>
        </Card>

        {/* Search and Filters - Industrial Minimalism */}
        {(activeTab === 'badges' || activeTab === 'students' || activeTab === 'challenges' || activeTab === 'levels') && (
          <Card variant="industrial" className="mb-4 sm:mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4" />
                <Input
                      variant="industrial"
                  placeholder="Cari data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {activeTab === 'badges' && (
                <Button 
                      variant="industrial-primary"
                  onClick={() => {
                    setEditingBadge(null);
                    setBadgeForm({ name: '', description: '', icon: '🏆', category: 'achievement', pointValue: 100 });
                    setShowCreateBadgeModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Badge
                </Button>
              )}
              {activeTab === 'levels' && (
                <Button 
                      variant="industrial-primary"
                  onClick={() => {
                    setEditingLevel(null);
                    setLevelForm({ name: '', pointsRequired: 0, benefits: '', color: '#3B82F6' });
                    setShowCreateLevelModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Level
                </Button>
              )}
              {activeTab === 'challenges' && (
                <Button 
                      variant="industrial-primary"
                  onClick={() => {
                    setEditingChallenge(null);
                    setChallengeForm({ title: '', description: '', reward: 50, deadline: '' });
                    setShowCreateChallengeModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Challenge
                </Button>
              )}
            </div>
          </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Dashboard Tab - Industrial Minimalism */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards - Industrial Minimalism */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="industrial">
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-semibold text-industrial-text-secondary">Total Siswa</p>
                          <p className="text-2xl font-bold text-industrial-black industrial-mono">{stats.totalStudents}</p>
                      </div>
                        <div className="bg-industrial-black border-2 border-industrial-black p-3">
                          <Users className="w-6 h-6 text-industrial-white" />
                      </div>
                    </div>
                    </CardContent>
                  </Card>

                  <Card variant="industrial">
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-semibold text-industrial-text-secondary">Total Badge</p>
                          <p className="text-2xl font-bold text-industrial-black industrial-mono">{stats.totalBadges}</p>
                      </div>
                        <div className="bg-industrial-black border-2 border-industrial-black p-3">
                          <Medal className="w-6 h-6 text-industrial-white" />
                      </div>
                    </div>
                    </CardContent>
                  </Card>

                  <Card variant="industrial">
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-semibold text-industrial-text-secondary">Rata-rata Poin</p>
                          <p className="text-2xl font-bold text-industrial-black industrial-mono">{stats.averagePoints}</p>
                      </div>
                        <div className="bg-industrial-black border-2 border-industrial-black p-3">
                          <Trophy className="w-6 h-6 text-industrial-white" />
                      </div>
                    </div>
                    </CardContent>
                  </Card>

                  <Card variant="industrial">
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-semibold text-industrial-text-secondary">Siswa Terbaik</p>
                          <p className="text-lg font-bold text-industrial-black truncate">
                          {stats.topStudent ? stats.topStudent.name : 'Belum ada'}
                        </p>
                        {stats.topStudent && (
                            <p className="text-sm text-industrial-text-secondary">{stats.topStudent.points} poin</p>
                        )}
                      </div>
                        <div className="bg-industrial-black border-2 border-industrial-black p-3">
                          <Star className="w-6 h-6 text-industrial-white" />
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Leaderboards - Industrial Minimalism */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Global Top Students */}
                  <Card variant="industrial">
                    <CardHeader className="p-6 border-b-2 border-industrial-black">
                      <CardTitle className="text-lg text-industrial-black industrial-h2 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Top 10 Global
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                  <div className="space-y-3">
                    {filteredStudents
                      .sort((a, b) => b.points - a.points)
                      .slice(0, 10)
                      .map((student, index) => (
                            <Card key={student.id} variant="industrial">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 border-2 border-industrial-black flex items-center justify-center text-sm font-bold ${
                                      index === 0 ? 'bg-industrial-black text-industrial-white' : 
                                      index === 1 ? 'bg-industrial-steel text-industrial-white' : 
                                      index === 2 ? 'bg-industrial-gray text-industrial-white' : 'bg-industrial-light text-industrial-black'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                                      <p className="font-semibold text-industrial-black">{student.name}</p>
                                      <p className="text-sm text-industrial-text-secondary">{student.class}</p>
                            </div>
                          </div>
                          <div className="text-right">
                                    <p className="font-bold text-industrial-black industrial-mono">{student.points} poin</p>
                                    <p className="text-sm text-industrial-text-secondary">Level {student.level}</p>
                          </div>
                        </div>
                              </CardContent>
                            </Card>
                      ))}
                        {filteredStudents.length === 0 && (
                          <div className="text-center py-8 text-industrial-text-secondary">
                            <div className="w-8 h-8 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                              <Users className="w-4 h-4 text-industrial-white" />
                  </div>
                            <p>Belum ada data siswa</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Classes */}
                  <Card variant="industrial">
                    <CardHeader className="p-6 border-b-2 border-industrial-black">
                      <CardTitle className="text-lg text-industrial-black industrial-h2 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Top Kelas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {uniqueClasses.length > 0 ? (
                          uniqueClasses
                            .map(classData => {
                              const classStudents = students.filter(s => s.classId === classData.id);
                              const totalPoints = classStudents.reduce((sum, s) => sum + s.points, 0);
                              const averagePoints = classStudents.length > 0 ? Math.round(totalPoints / classStudents.length) : 0;
                              const topStudent = classStudents.length > 0 
                                ? classStudents.reduce((top, current) => current.points > top.points ? current : top)
                                : null;
                              
                              return {
                                ...classData,
                                totalPoints,
                                averagePoints,
                                studentCount: classStudents.length,
                                topStudent
                              };
                            })
                            .sort((a, b) => b.averagePoints - a.averagePoints)
                            .map((classData, index) => (
                              <Card 
                                key={classData.id} 
                                variant="industrial"
                                className="cursor-pointer hover:bg-industrial-light transition-colors"
                                onClick={() => openClassLeaderboardModal(classData)}
                                title="Klik untuk melihat leaderboard kelas"
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 border-2 border-industrial-black flex items-center justify-center text-sm font-bold ${
                                        index === 0 ? 'bg-industrial-black text-industrial-white' : 
                                        index === 1 ? 'bg-industrial-steel text-industrial-white' : 
                                        index === 2 ? 'bg-industrial-gray text-industrial-white' : 'bg-industrial-light text-industrial-black'
                                      }`}>
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-industrial-black">{classData.name}</p>
                                        <p className="text-sm text-industrial-text-secondary">
                                          {classData.studentCount} siswa • Top: {classData.topStudent?.name || 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-industrial-black industrial-mono">{classData.averagePoints} poin</p>
                                      <p className="text-sm text-industrial-text-secondary">rata-rata</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        ) : (
                          <div className="text-center py-8 text-industrial-text-secondary">
                            <div className="w-8 h-8 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                              <Users className="w-4 h-4 text-industrial-white" />
                            </div>
                            <p>Belum ada data kelas</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Badges Tab - Industrial Minimalism */}
            {activeTab === 'badges' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.filter(badge =>
                  badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  badge.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((badge) => (
                  <Card 
                    key={badge.id} 
                    variant="industrial"
                    className="overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4 border-b-2 border-industrial-black pb-3">
                      <div className="flex items-center gap-3">
                        {getBadgeIcon(badge.icon)}
                        <div>
                            <h3 className="font-semibold text-industrial-black industrial-h3">{badge.name}</h3>
                            <p className="text-sm text-industrial-text-secondary">{badge.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                            variant="industrial-secondary"
                          size="sm"
                          onClick={() => openEditBadge(badge)}
                            className="h-8 w-8 p-0"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="industrial-secondary"
                          size="sm"
                          onClick={() => openBadgeAssignModal(badge)}
                            className="h-8 w-8 p-0"
                        >
                            <Gift className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="industrial-danger"
                          size="sm"
                          onClick={() => deleteBadge(badge.id)}
                            className="h-8 w-8 p-0"
                        >
                            <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                      <p className="text-sm text-industrial-text-secondary mb-3">{badge.description}</p>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-industrial-black industrial-mono">{badge.pointValue} poin</span>
                        <button
                          onClick={() => openBadgeRecipientsModal(badge)}
                          className="text-industrial-black hover:text-industrial-steel hover:underline transition-colors cursor-pointer font-semibold"
                          title="Klik untuk melihat siswa yang mendapat badge ini"
                        >
                          {getBadgeRecipientCount(badge.name)} siswa
                        </button>
                    </div>
                    </CardContent>
                  </Card>
                ))}
                {badges.length === 0 && (
                  <Card variant="industrial" className="col-span-full">
                    <CardContent className="text-center py-12">
                      <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                        <Medal className="w-6 h-6 text-industrial-white" />
                  </div>
                      <p className="text-industrial-text-secondary">Belum ada badge yang dibuat</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Levels Tab - Industrial Minimalism */}
            {activeTab === 'levels' && (
              <Card variant="industrial" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full industrial-table">
                    <thead className="bg-industrial-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Poin Diperlukan</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Manfaat</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-industrial-white uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-industrial-black">
                      {levels.filter(level =>
                        level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        level.benefits.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((level) => (
                        <motion.tr 
                          key={level.id} 
                          className="hover:bg-industrial-light"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="industrial-primary" className="text-sm">
                              {level.id}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-industrial-black">
                            {level.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-industrial-text-secondary industrial-mono">
                            {level.pointsRequired.toLocaleString()} poin
                          </td>
                          <td className="px-6 py-4 text-sm text-industrial-text-secondary">
                            {level.benefits}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="industrial-secondary"
                                size="sm"
                                onClick={() => openEditLevel(level)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="industrial-danger"
                                size="sm"
                                onClick={() => deleteLevel(level.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {levels.length === 0 && (
                  <Card variant="industrial">
                    <CardContent className="text-center py-12">
                      <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-6 h-6 text-industrial-white" />
                  </div>
                      <p className="text-industrial-text-secondary">Belum ada level yang dibuat</p>
                    </CardContent>
                  </Card>
                )}
              </Card>
            )}

            {/* Challenges Tab - Industrial Minimalism */}
            {activeTab === 'challenges' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.filter(challenge =>
                  challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((challenge) => (
                  <Card 
                    key={challenge.id} 
                    variant="industrial"
                    className="overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4 border-b-2 border-industrial-black pb-3">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 border-2 border-industrial-black ${challenge.isActive ? 'bg-industrial-black' : 'bg-industrial-light'}`}>
                            <Target className={`w-5 h-5 ${challenge.isActive ? 'text-industrial-white' : 'text-industrial-text-muted'}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-industrial-black industrial-h3">{challenge.title}</h3>
                            <Badge variant={challenge.isActive ? "industrial-success" : "industrial-secondary"} className="text-xs mt-1">
                            {challenge.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                            variant="industrial-secondary"
                          size="sm"
                          onClick={() => openEditChallenge(challenge)}
                            className="h-8 w-8 p-0"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="industrial-secondary"
                          size="sm"
                          onClick={() => toggleChallengeStatus(challenge.id)}
                            className="h-8 w-8 p-0"
                        >
                            <Lightning className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="industrial-danger"
                          size="sm"
                          onClick={() => deleteChallenge(challenge.id)}
                            className="h-8 w-8 p-0"
                        >
                            <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                      <p className="text-sm text-industrial-text-secondary mb-4">{challenge.description}</p>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-industrial-black industrial-mono">{challenge.reward} poin</span>
                        <span className="text-industrial-text-secondary">Deadline: {formatDate(challenge.deadline)}</span>
                    </div>
                    </CardContent>
                  </Card>
                ))}
                {challenges.length === 0 && (
                  <Card variant="industrial" className="col-span-full">
                    <CardContent className="text-center py-12">
                      <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                        <Target className="w-6 h-6 text-industrial-white" />
                  </div>
                      <p className="text-industrial-text-secondary">Belum ada challenge yang dibuat</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Students Tab - Industrial Minimalism */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                {/* Bulk Actions */}
                <div className="flex justify-end">
                  <Button 
                    variant="industrial-primary"
                    onClick={openBulkPointsModal}
                    className="flex items-center gap-2"
                  >
                    <Lightning className="w-4 h-4" />
                    Bulk Reward Poin
                  </Button>
                </div>

                <Card variant="industrial" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full industrial-table">
                      <thead className="bg-industrial-black">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Siswa</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Kelas</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Level</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Poin</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">Badge Diperoleh</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-industrial-white uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-industrial-black">
                      {filteredStudents.length === 0 && searchQuery.trim() !== '' ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                                <MagnifyingGlass className="w-6 h-6 text-industrial-white" />
                              </div>
                              <p className="text-lg font-semibold text-industrial-black industrial-h2 mb-2">Tidak ada hasil pencarian</p>
                              <p className="text-sm text-industrial-text-secondary mb-4">
                                Tidak ditemukan siswa dengan kata kunci "{searchQuery}"
                              </p>
                              <Button
                                variant="industrial-secondary"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="mt-4"
                              >
                                Hapus pencarian
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                                <Users className="w-6 h-6 text-industrial-white" />
                              </div>
                              <p className="text-lg font-semibold text-industrial-black industrial-h2 mb-2">Belum ada data siswa</p>
                              <p className="text-sm text-industrial-text-secondary">Data siswa akan muncul setelah sistem dimuat</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map((student, index) => {
                        // Safety check for student data
                        if (!student) return null;
                        
                        // Get badges earned by this student
                        const achievements = student.achievements || [];
                        const studentBadges = achievements
                          .map(badgeName => {
                            const badge = badges.find(b => b.name === badgeName);
                            return badge;
                          })
                          .filter(Boolean) as Badge[];

                        return (
                          <motion.tr 
                            key={`${student.id}-${index}`} 
                            className="hover:bg-industrial-light"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                                  <span className="text-sm font-semibold text-industrial-white">
                                    {(student.name || 'N').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-semibold text-industrial-black">{student.name || 'Nama tidak tersedia'}</div>
                                  <div className="text-sm text-industrial-text-secondary">{student.username || 'Username tidak tersedia'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-industrial-text-secondary">
                              {student.class || 'Kelas tidak tersedia'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="industrial-primary" className="text-sm">
                                Level {student.level || 1}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-industrial-black industrial-mono">
                              {(student.points || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                {studentBadges.length > 0 ? (
                                  <>
                                    {studentBadges.slice(0, 4).map((badge, index) => (
                                      <div
                                        key={`${badge.id}-${index}`}
                                        className="group relative"
                                        title={`${badge.name}: ${badge.description}`}
                                      >
                                        <div className="w-8 h-8 bg-industrial-black border-2 border-industrial-black flex items-center justify-center cursor-help hover:bg-industrial-steel transition-colors">
                                          {badge.icon.match(/\p{Emoji}/u) ? (
                                            <span className="text-sm">{badge.icon}</span>
                                          ) : (
                                            <Medal className="w-4 h-4 text-industrial-white" />
                                          )}
                                        </div>
                                        {/* Tooltip - Industrial Minimalism */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-industrial-black border-2 border-industrial-black text-industrial-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                                          <div className="font-semibold">{badge.name}</div>
                                          <div className="text-industrial-text-muted">{badge.description}</div>
                                          <div className="text-industrial-white industrial-mono">+{badge.pointValue} poin</div>
                                          {/* Arrow */}
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-industrial-black"></div>
                                        </div>
                                      </div>
                                    ))}
                                    {studentBadges.length > 4 && (
                                      <div className="w-8 h-8 bg-industrial-light border-2 border-industrial-black flex items-center justify-center text-xs text-industrial-black font-semibold">
                                        +{studentBadges.length - 4}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-sm text-industrial-text-secondary italic">Belum ada badge</span>
                                )}
                              </div>
                              <div className="text-xs text-industrial-text-secondary mt-1">
                                {studentBadges.length} badge total
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="industrial-primary"
                                size="sm"
                                onClick={() => openAwardModal(student)}
                                className="flex items-center gap-2"
                              >
                                <Gift className="w-4 h-4" />
                                Beri Reward
                              </Button>
                            </td>
                          </motion.tr>
                        );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls - Industrial Minimalism */}
                {filteredStudents.length > 0 && totalPages > 1 && (
                  <div className="border-t-2 border-industrial-black p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-industrial-text-secondary">
                        Menampilkan <span className="font-semibold text-industrial-black industrial-mono">{startIndex + 1}</span> - <span className="font-semibold text-industrial-black industrial-mono">{Math.min(endIndex, filteredStudents.length)}</span> dari <span className="font-semibold text-industrial-black industrial-mono">{filteredStudents.length}</span> siswa
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="industrial-secondary"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-3"
                        >
                          Sebelumnya
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "industrial-primary" : "industrial-secondary"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="h-8 w-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="industrial-secondary"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-3"
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      {/* Create/Edit Badge Modal - Industrial Minimalism */}
      <Modal
        isOpen={showCreateBadgeModal}
        onClose={() => {
          setShowCreateBadgeModal(false);
          setEditingBadge(null);
          setBadgeForm({ name: '', description: '', icon: '🏆', category: 'achievement', pointValue: 100 });
          setShowEmojiPicker(false);
        }}
        title={editingBadge ? 'Edit Badge' : 'Tambah Badge Baru'}
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Nama Badge <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                value={badgeForm.name}
                onChange={(e) => setBadgeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masukkan nama badge"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Deskripsi <span className="text-industrial-red">*</span>
              </label>
              <textarea
                value={badgeForm.description}
                onChange={(e) => setBadgeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Masukkan deskripsi badge"
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-industrial-black mb-2">Icon</label>
                <EmojiPicker
                  selectedEmoji={badgeForm.icon}
                  onEmojiSelect={(emoji) => setBadgeForm(prev => ({ ...prev, icon: emoji }))}
                  isOpen={showEmojiPicker}
                  onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-industrial-black mb-2">Nilai Poin</label>
                <Input
                  variant="industrial"
                  type="number"
                  value={badgeForm.pointValue}
                  onChange={(e) => setBadgeForm(prev => ({ ...prev, pointValue: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">Kategori</label>
              <select
                value={badgeForm.category}
                onChange={(e) => setBadgeForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel"
              >
                <option value="achievement">Achievement</option>
                <option value="activity">Activity</option>
                <option value="attendance">Attendance</option>
                <option value="special">Special</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t-2 border-industrial-black">
            <Button
              variant="industrial-secondary"
              onClick={() => {
                setShowCreateBadgeModal(false);
                setEditingBadge(null);
                setBadgeForm({ name: '', description: '', icon: '🏆', category: 'achievement', pointValue: 100 });
                setShowEmojiPicker(false);
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleSaveBadge}
              disabled={saving || !badgeForm.name.trim() || !badgeForm.description.trim()}
              className="flex-1 flex items-center gap-2"
            >
              <FloppyDisk className="w-4 h-4" />
              {saving ? 'Menyimpan...' : (editingBadge ? 'Update' : 'Simpan')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Level Modal - Industrial Minimalism */}
      <Modal
        isOpen={showCreateLevelModal}
        onClose={() => {
          setShowCreateLevelModal(false);
          setEditingLevel(null);
          setLevelForm({ name: '', pointsRequired: 0, benefits: '', color: '#3B82F6' });
        }}
        title={editingLevel ? 'Edit Level' : 'Tambah Level Baru'}
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Nama Level <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                value={levelForm.name}
                onChange={(e) => setLevelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Pemula, Mahir, Expert"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Poin Diperlukan <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="number"
                value={levelForm.pointsRequired}
                onChange={(e) => setLevelForm(prev => ({ ...prev, pointsRequired: parseInt(e.target.value) || 0 }))}
                placeholder="500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">Manfaat</label>
              <textarea
                value={levelForm.benefits}
                onChange={(e) => setLevelForm(prev => ({ ...prev, benefits: e.target.value }))}
                placeholder="Jelaskan manfaat mencapai level ini"
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">Warna</label>
              <Input
                variant="industrial"
                type="color"
                value={levelForm.color}
                onChange={(e) => setLevelForm(prev => ({ ...prev, color: e.target.value }))}
                className="h-12"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t-2 border-industrial-black">
            <Button
              variant="industrial-secondary"
              onClick={() => {
                setShowCreateLevelModal(false);
                setEditingLevel(null);
                setLevelForm({ name: '', pointsRequired: 0, benefits: '', color: '#3B82F6' });
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleSaveLevel}
              disabled={saving || !levelForm.name.trim() || levelForm.pointsRequired <= 0}
              className="flex-1 flex items-center gap-2"
            >
              <FloppyDisk className="w-4 h-4" />
              {saving ? 'Menyimpan...' : (editingLevel ? 'Update' : 'Simpan')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Challenge Modal - Industrial Minimalism */}
      <Modal
        isOpen={showCreateChallengeModal}
        onClose={() => {
          setShowCreateChallengeModal(false);
          setEditingChallenge(null);
          setChallengeForm({ title: '', description: '', reward: 50, deadline: '' });
        }}
        title={editingChallenge ? 'Edit Challenge' : 'Tambah Challenge Baru'}
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Judul Challenge <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                value={challengeForm.title}
                onChange={(e) => setChallengeForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Masukkan judul challenge"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Deskripsi <span className="text-industrial-red">*</span>
              </label>
              <textarea
                value={challengeForm.description}
                onChange={(e) => setChallengeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Jelaskan detail challenge"
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-industrial-black mb-2">Reward Poin</label>
                <Input
                  variant="industrial"
                  type="number"
                  value={challengeForm.reward}
                  onChange={(e) => setChallengeForm(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                  placeholder="50"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-industrial-black mb-2">Deadline</label>
                <Input
                  variant="industrial"
                  type="date"
                  value={challengeForm.deadline}
                  onChange={(e) => setChallengeForm(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t-2 border-industrial-black">
            <Button
              variant="industrial-secondary"
              onClick={() => {
                setShowCreateChallengeModal(false);
                setEditingChallenge(null);
                setChallengeForm({ title: '', description: '', reward: 50, deadline: '' });
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleSaveChallenge}
              disabled={saving || !challengeForm.title.trim() || !challengeForm.description.trim()}
              className="flex-1 flex items-center gap-2"
            >
              <FloppyDisk className="w-4 h-4" />
              {saving ? 'Menyimpan...' : (editingChallenge ? 'Update' : 'Simpan')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Award Modal */}
      <Modal
        isOpen={showAwardModal}
        onClose={() => {
          setShowAwardModal(false);
          setSelectedStudent(null);
          setAwardForm({ type: 'points', points: 10, badgeId: '', reason: '' });
        }}
        title="Beri Reward"
      >
        <div className="p-6">
          {selectedStudent && (
            <>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.class}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Reward</label>
                  <select
                    value={awardForm.type}
                    onChange={(e) => setAwardForm(prev => ({ ...prev, type: e.target.value as 'points' | 'badge' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="points">Poin</option>
                    <option value="badge">Badge</option>
                  </select>
                </div>

                {awardForm.type === 'points' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Poin</label>
                    <Input
                      type="number"
                      value={awardForm.points}
                      onChange={(e) => setAwardForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                      min="1"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Badge</label>
                    <select
                      value={awardForm.badgeId}
                      onChange={(e) => setAwardForm(prev => ({ ...prev, badgeId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Pilih badge...</option>
                      {badges.map(badge => (
                        <option key={badge.id} value={badge.id.toString()}>
                          {badge.name} (+{badge.pointValue} poin)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alasan (Opsional)</label>
                  <Input
                    value={awardForm.reason}
                    onChange={(e) => setAwardForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Alasan pemberian reward"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAwardModal(false);
                    setSelectedStudent(null);
                    setAwardForm({ type: 'points', points: 10, badgeId: '', reason: '' });
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAward}
                  disabled={saving || (awardForm.type === 'points' && awardForm.points <= 0) || (awardForm.type === 'badge' && !awardForm.badgeId)}
                  className="flex-1 flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  {saving ? 'Memberikan...' : 'Beri Reward'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Badge Assignment Modal */}
      <Modal
        isOpen={showBadgeAssignModal}
        onClose={() => {
          setShowBadgeAssignModal(false);
          setSelectedBadgeForAssign(null);
          setSelectedStudentsForBadge([]);
        }}
        title={selectedBadgeForAssign ? `Berikan Badge: ${selectedBadgeForAssign.name}` : 'Berikan Badge'}
        size="large"
      >
        <div className="p-6">
          {selectedBadgeForAssign && (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getBadgeIcon(selectedBadgeForAssign.icon)}
                  <div>
                    <p className="font-medium text-gray-900">{selectedBadgeForAssign.name}</p>
                    <p className="text-sm text-gray-500">+{selectedBadgeForAssign.pointValue} poin • {selectedBadgeForAssign.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Kelas</label>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">Semua kelas ({students.length} siswa)</option>
                    {uniqueClasses.map((classData) => (
                      <option key={classData.id} value={classData.id}>
                        {classData.name} ({students.filter(s => s.classId === classData.id).length} siswa)
                      </option>
                    ))}
                  </select>
                  {uniqueClasses.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Tidak ada kelas terdeteksi</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Level</label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">Semua level</option>
                    {uniqueLevels.map((level) => (
                      <option key={level} value={level.toString()}>
                        Level {level} ({students.filter(s => s.level === level).length} siswa)
                      </option>
                    ))}
                  </select>
                  {uniqueLevels.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Tidak ada level terdeteksi</p>
                  )}
                </div>
              </div>


              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pilih Siswa ({getFilteredStudentsForAssignment().length} tersedia)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllStudents}
                  >
                    {getFilteredStudentsForAssignment().every(student => selectedStudentsForBadge.includes(student.id)) ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {getFilteredStudentsForAssignment().map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedStudentsForBadge.includes(student.id)}
                        onChange={() => handleStudentSelection(student.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-purple-600">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.class} • Level {student.level}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredStudentsForAssignment().length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      Tidak ada siswa yang sesuai filter
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBadgeAssignModal(false);
                    setSelectedBadgeForAssign(null);
                    setSelectedStudentsForBadge([]);
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleBadgeAssignment}
                  disabled={saving || selectedStudentsForBadge.length === 0}
                  className="flex-1 flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  {saving ? 'Memberikan...' : `Berikan ke ${selectedStudentsForBadge.length} Siswa`}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Bulk Points Award Modal */}
      <Modal
        isOpen={showBulkPointsModal}
        onClose={() => {
          setShowBulkPointsModal(false);
          setSelectedStudentsForBulkPoints([]);
          setBulkPointsForm({ points: 10, reason: '' });
        }}
        title="Bulk Reward Poin"
        size="large"
      >
        <div className="p-6">
          <Card variant="industrial" className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-industrial-black border-2 border-industrial-black">
                  <Lightning className="w-5 h-5 text-industrial-white" />
                </div>
                <div>
                  <p className="font-semibold text-industrial-black">Berikan Poin ke Multiple Siswa</p>
                  <p className="text-sm text-industrial-text-secondary">Pilih siswa dan tentukan jumlah poin yang akan diberikan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">Filter Kelas</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel"
              >
                <option value="all">Semua kelas ({students.length} siswa)</option>
                {uniqueClasses.map((classData) => (
                  <option key={classData.id} value={classData.id}>
                    {classData.name} ({students.filter(s => s.classId === classData.id).length} siswa)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">Filter Level</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel"
              >
                <option value="all">Semua level</option>
                {uniqueLevels.map((level) => (
                  <option key={level} value={level.toString()}>
                    Level {level} ({students.filter(s => s.level === level).length} siswa)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Jumlah Poin <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="number"
                value={bulkPointsForm.points}
                onChange={(e) => setBulkPointsForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                placeholder="10"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">Alasan (Opsional)</label>
              <Input
                variant="industrial"
                value={bulkPointsForm.reason}
                onChange={(e) => setBulkPointsForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Alasan pemberian poin"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-industrial-black">
                Pilih Siswa ({getFilteredStudentsForBulkPoints().length} tersedia)
              </label>
              <Button
                variant="industrial-secondary"
                size="sm"
                onClick={handleSelectAllBulkPointsStudents}
              >
                {getFilteredStudentsForBulkPoints().every(student => selectedStudentsForBulkPoints.includes(student.id)) ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </Button>
            </div>
            <Card variant="industrial">
              <CardContent className="p-0 max-h-60 overflow-y-auto">
                {getFilteredStudentsForBulkPoints().map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 border-b-2 border-industrial-black last:border-b-0 hover:bg-industrial-light transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedStudentsForBulkPoints.includes(student.id)}
                      onChange={() => handleBulkPointsStudentSelection(student.id)}
                      className="w-4 h-4 border-2 border-industrial-black accent-industrial-black"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                        <span className="text-xs font-semibold text-industrial-white">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-industrial-black">{student.name}</p>
                        <p className="text-xs text-industrial-text-secondary">{student.class} • Level {student.level} • {student.points} poin</p>
                      </div>
                    </div>
                  </div>
                ))}
                {getFilteredStudentsForBulkPoints().length === 0 && (
                  <div className="p-4 text-center text-industrial-text-secondary">
                    Tidak ada siswa yang sesuai filter
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedStudentsForBulkPoints.length > 0 && (
            <Card variant="industrial" className="mb-4">
              <CardContent className="p-3">
                <p className="text-sm text-industrial-black">
                  <strong className="font-semibold">{selectedStudentsForBulkPoints.length} siswa dipilih</strong> akan menerima <strong className="font-semibold industrial-mono">{bulkPointsForm.points} poin</strong> masing-masing
                  {bulkPointsForm.reason && <span> untuk: {bulkPointsForm.reason}</span>}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 mt-6 pt-6 border-t-2 border-industrial-black">
            <Button
              variant="industrial-secondary"
              onClick={() => {
                setShowBulkPointsModal(false);
                setSelectedStudentsForBulkPoints([]);
                setBulkPointsForm({ points: 10, reason: '' });
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleBulkPointsAward}
              disabled={saving || selectedStudentsForBulkPoints.length === 0 || bulkPointsForm.points <= 0}
              className="flex-1 flex items-center gap-2"
            >
              <Lightning className="w-4 h-4" />
              {saving ? 'Memberikan...' : `Berikan ${bulkPointsForm.points} Poin ke ${selectedStudentsForBulkPoints.length} Siswa`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Class Leaderboard Modal */}
      <Modal
        isOpen={showClassLeaderboardModal}
        onClose={() => {
          setShowClassLeaderboardModal(false);
          setSelectedClassForLeaderboard(null);
        }}
        title={selectedClassForLeaderboard ? `Leaderboard ${selectedClassForLeaderboard.name}` : 'Leaderboard Kelas'}
        size="large"
      >
        <div className="p-6">
          {selectedClassForLeaderboard && (
            <>
              {/* Class Info Header - Industrial Minimalism */}
              <Card variant="industrial" className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                        <Users className="w-6 h-6 text-industrial-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-industrial-black industrial-h2">{selectedClassForLeaderboard.name}</h3>
                        <p className="text-sm text-industrial-text-secondary">
                          {selectedClassForLeaderboard.studentCount} siswa • Rata-rata: <span className="font-semibold industrial-mono">{selectedClassForLeaderboard.averagePoints}</span> poin
                        </p>
                      </div>
                    </div>
                    <Card variant="industrial" className="px-3 py-2">
                      <p className="text-xs text-industrial-text-secondary uppercase tracking-wide font-semibold">Top Student</p>
                      <p className="font-semibold text-industrial-black">{selectedClassForLeaderboard.topStudent?.name || 'N/A'}</p>
                      <p className="text-sm text-industrial-text-secondary industrial-mono">{selectedClassForLeaderboard.topStudent?.points || 0} poin</p>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Class Leaderboard - Industrial Minimalism */}
              <div className="space-y-3">
                <h4 className="font-semibold text-industrial-black industrial-h3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-industrial-black" />
                  Ranking Siswa dalam Kelas
                </h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {students
                    .filter(student => student.classId === selectedClassForLeaderboard.id)
                    .sort((a, b) => b.points - a.points)
                    .map((student, index) => {
                      // Get badges earned by this student
                      const achievements = student.achievements || [];
                      const studentBadges = achievements
                        .map(badgeName => {
                          const badge = badges.find(b => b.name === badgeName);
                          return badge;
                        })
                        .filter(Boolean) as Badge[];

                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card variant="industrial" className="hover:bg-industrial-light transition-colors">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 border-2 border-industrial-black flex items-center justify-center text-sm font-semibold ${
                                    index === 0 ? 'bg-industrial-black text-industrial-white' : 
                                    index === 1 ? 'bg-industrial-gray text-industrial-white' : 
                                    index === 2 ? 'bg-industrial-steel text-industrial-white' : 'bg-industrial-light text-industrial-black'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="w-10 h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                                    <span className="text-sm font-semibold text-industrial-white">
                                      {student.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-industrial-black">{student.name}</p>
                                    <p className="text-sm text-industrial-text-secondary">@{student.username}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  {/* Badges */}
                                  <div className="flex items-center gap-1">
                                    {studentBadges.length > 0 ? (
                                      <>
                                        {studentBadges.slice(0, 3).map((badge, badgeIndex) => (
                                          <div
                                            key={`${badge.id}-${badgeIndex}`}
                                            className="group relative w-6 h-6 bg-industrial-black border-2 border-industrial-black flex items-center justify-center cursor-help hover:bg-industrial-steel transition-colors"
                                          >
                                            {badge.icon.match(/\p{Emoji}/u) ? (
                                              <span className="text-xs">{badge.icon}</span>
                                            ) : (
                                              <Medal className="w-3 h-3 text-industrial-white" />
                                            )}
                                            
                                            {/* Tooltip - Industrial Minimalism */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-industrial-black border-2 border-industrial-black text-industrial-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                                              <div className="font-semibold">{badge.name}</div>
                                              <div className="text-industrial-text-muted">{badge.description}</div>
                                              <div className="text-industrial-white industrial-mono">+{badge.pointValue} poin</div>
                                              {/* Arrow */}
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-industrial-black"></div>
                                            </div>
                                          </div>
                                        ))}
                                        {studentBadges.length > 3 && (
                                          <div 
                                            className="group relative w-6 h-6 bg-industrial-light border-2 border-industrial-black flex items-center justify-center text-xs text-industrial-black font-semibold hover:bg-industrial-gray hover:text-industrial-white transition-colors cursor-help"
                                            title={`${studentBadges.length - 3} badge lainnya`}
                                          >
                                            +{studentBadges.length - 3}
                                            
                                            {/* Tooltip for additional badges - Industrial Minimalism */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-industrial-black border-2 border-industrial-black text-industrial-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                                              <div className="font-semibold">Badge Lainnya</div>
                                              <div className="text-industrial-text-muted">
                                                {studentBadges.slice(3).map(b => b.name).join(', ')}
                                              </div>
                                              {/* Arrow */}
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-industrial-black"></div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-industrial-text-secondary italic">Belum ada badge</span>
                                    )}
                                  </div>
                                  
                                  {/* Level */}
                                  <Badge variant="industrial-primary" className="text-xs">
                                    Lvl {student.level}
                                  </Badge>
                                  
                                  {/* Points */}
                                  <div className="text-right min-w-[80px]">
                                    <p className="font-semibold text-industrial-black industrial-mono">{student.points.toLocaleString()}</p>
                                    <p className="text-xs text-industrial-text-secondary">poin</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                </div>
              </div>

              {/* Class Statistics - Industrial Minimalism */}
              <div className="mt-6 pt-6 border-t-2 border-industrial-black">
                <h4 className="font-semibold text-industrial-black industrial-h3 mb-3">Statistik Kelas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card variant="industrial" className="text-center">
                    <CardContent className="p-3">
                      <p className="text-2xl font-semibold text-industrial-black industrial-mono">{selectedClassForLeaderboard.studentCount}</p>
                      <p className="text-xs text-industrial-text-secondary uppercase tracking-wide font-semibold">Total Siswa</p>
                    </CardContent>
                  </Card>
                  <Card variant="industrial" className="text-center">
                    <CardContent className="p-3">
                      <p className="text-2xl font-semibold text-industrial-black industrial-mono">{selectedClassForLeaderboard.averagePoints}</p>
                      <p className="text-xs text-industrial-text-secondary uppercase tracking-wide font-semibold">Rata-rata Poin</p>
                    </CardContent>
                  </Card>
                  <Card variant="industrial" className="text-center">
                    <CardContent className="p-3">
                      <p className="text-2xl font-semibold text-industrial-black industrial-mono">{selectedClassForLeaderboard.totalPoints.toLocaleString()}</p>
                      <p className="text-xs text-industrial-text-secondary uppercase tracking-wide font-semibold">Total Poin</p>
                    </CardContent>
                  </Card>
                  <Card variant="industrial" className="text-center">
                    <CardContent className="p-3">
                      <p className="text-2xl font-semibold text-industrial-black industrial-mono">
                        {students
                          .filter(s => s.classId === selectedClassForLeaderboard.id)
                          .reduce((sum, s) => sum + (s.achievements?.length || 0), 0)
                        }
                      </p>
                      <p className="text-xs text-industrial-text-secondary uppercase tracking-wide font-semibold">Total Badge</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t-2 border-industrial-black">
                <Button
                  variant="industrial-secondary"
                  onClick={() => {
                    setShowClassLeaderboardModal(false);
                    setSelectedClassForLeaderboard(null);
                  }}
                  className="px-6"
                >
                  Tutup
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Badge Recipients Modal */}
      <Modal
        isOpen={showBadgeRecipientsModal}
        onClose={() => {
          setShowBadgeRecipientsModal(false);
          setSelectedBadgeForRecipients(null);
        }}
        title={selectedBadgeForRecipients ? `Siswa yang Mendapat Badge: ${selectedBadgeForRecipients.name}` : 'Penerima Badge'}
        size="large"
      >
        <div className="p-6">
          {selectedBadgeForRecipients && (
            <>
              {/* Badge Info Header */}
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-300">
                      {getBadgeIcon(selectedBadgeForRecipients.icon)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedBadgeForRecipients.name}</h3>
                      <p className="text-sm text-gray-600">{selectedBadgeForRecipients.description}</p>
                      <p className="text-sm text-purple-600 font-medium">+{selectedBadgeForRecipients.pointValue} poin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white px-3 py-2 rounded-lg border">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Penerima</p>
                      <p className="text-2xl font-bold text-blue-600">{getBadgeRecipientCount(selectedBadgeForRecipients.name)}</p>
                      <p className="text-sm text-gray-600">dari {students.length} siswa</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipients List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Daftar Siswa Penerima
                </h4>
                
                {getStudentsWithBadge(selectedBadgeForRecipients.name).length > 0 ? (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {getStudentsWithBadge(selectedBadgeForRecipients.name)
                      .sort((a, b) => b.points - a.points) // Sort by points descending
                      .map((student, index) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">@{student.username} • {student.class}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Level */}
                            <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getLevelColor(student.level)}`}>
                              Lvl {student.level}
                            </div>
                            
                            {/* Points */}
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{student.points.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">total poin</p>
                            </div>
                            
                            {/* Badge count */}
                            <div className="text-right">
                              <p className="font-bold text-yellow-600">{student.achievements?.length || 0}</p>
                              <p className="text-xs text-gray-500">badge</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">Belum Ada Penerima</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Badge "{selectedBadgeForRecipients.name}" belum diberikan kepada siswa manapun
                    </p>
                    <Button
                      onClick={() => {
                        setShowBadgeRecipientsModal(false);
                        openBadgeAssignModal(selectedBadgeForRecipients);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Gift className="w-4 h-4" />
                      Berikan Badge Ini
                    </Button>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {getStudentsWithBadge(selectedBadgeForRecipients.name).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Statistik Badge</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {getBadgeRecipientCount(selectedBadgeForRecipients.name)}
                      </p>
                      <p className="text-xs text-blue-600 uppercase tracking-wide">Penerima</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((getBadgeRecipientCount(selectedBadgeForRecipients.name) / students.length) * 100)}%
                      </p>
                      <p className="text-xs text-green-600 uppercase tracking-wide">Persentase</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {getBadgeRecipientCount(selectedBadgeForRecipients.name) * selectedBadgeForRecipients.pointValue}
                      </p>
                      <p className="text-xs text-yellow-600 uppercase tracking-wide">Total Poin</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {uniqueClasses.filter(cls => 
                          getStudentsWithBadge(selectedBadgeForRecipients.name)
                            .some(student => student.classId === cls.id)
                        ).length}
                      </p>
                      <p className="text-xs text-purple-600 uppercase tracking-wide">Kelas Terlibat</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => openBadgeAssignModal(selectedBadgeForRecipients)}
                  className="flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Berikan ke Siswa Lain
                </Button>
                <Button
                  onClick={() => {
                    setShowBadgeRecipientsModal(false);
                    setSelectedBadgeForRecipients(null);
                  }}
                  className="px-6"
                >
                  Tutup
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default GamifikasiPage; 