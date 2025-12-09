import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingCard, LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, StaggeredList, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  Plus, 
  MagnifyingGlass, 
  BookOpen, 
  Users, 
  Pencil,
  Trash,
  Eye,
  Calendar,
  Trophy,
  TrendUp,
  Warning,
  CheckCircle,
  X,
  ArrowClockwise
} from 'phosphor-react';
import { classApi } from '@/lib/api';

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacherUsername: string;
  createdAt: string;
}

interface ClassStats {
  studentsCount: number;
  assignmentsCount: number;
  averageGrade: number | null;
}

const Classes = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [classStats, setClassStats] = useState<Record<string, ClassStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Create Modal State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    subject: '',
    description: ''
  });

  // Edit Modal State
  const [showEditForm, setShowEditForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    description: ''
  });

  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    // Filter classes based on search term
    if (searchTerm) {
      const filtered = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(classes);
    }
  }, [searchTerm, classes]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      setLoadingProgress(20);
      
      const response = await classApi.getAll();
      
      if (response.success) {
        const classesList = response.classes || [];
        setClasses(classesList);
        setFilteredClasses(classesList);
        setLoadingProgress(60);
        
        // Show classes immediately, load stats in background
        setIsLoading(false);
        setLoadingProgress(100);
        
        // Load statistics incrementally in the background
        if (classesList.length > 0) {
          loadClassStatsIncremental(classesList);
        }
      } else {
        console.error('❌ Failed to load classes:', response.error);
        showNotification('error', response.error || 'Gagal memuat data kelas');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('💥 Error loading classes:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data kelas');
      setIsLoading(false);
    }
  };

  const loadClassStatsIncremental = async (classesList: ClassItem[]) => {
    if (classesList.length === 0) return;
    
    try {
      setIsLoadingStats(true);
      
      // Load stats one by one to show progressive updates
      let completed = 0;
      
      // Function to load single class stats
      const loadSingleClassStats = async (classItem: ClassItem) => {
        try {
          const statsResponse = await classApi.getStats(classItem.id);
          const stats = statsResponse.success && statsResponse.stats ? 
            statsResponse.stats : 
            { studentsCount: 0, assignmentsCount: 0, averageGrade: null };
          
          // Update stats immediately for this class
          setClassStats(prev => ({
            ...prev,
            [classItem.id]: stats
          }));
          
          completed++;
          const progress = Math.round((completed / classesList.length) * 100);
          
          return { classId: classItem.id, stats };
        } catch (error) {
          console.error(`Error loading stats for class ${classItem.id}:`, error);
          // Set default stats for failed requests
          const defaultStats = { studentsCount: 0, assignmentsCount: 0, averageGrade: null };
          setClassStats(prev => ({
            ...prev,
            [classItem.id]: defaultStats
          }));
          completed++;
          return { classId: classItem.id, stats: defaultStats };
        }
      };
      
      // Load first 3 classes immediately (most important)
      const priorityClasses = classesList.slice(0, 3);
      const remainingClasses = classesList.slice(3);
      
      // Load priority classes in parallel
      await Promise.all(
        priorityClasses.map((classItem) => loadSingleClassStats(classItem))
      );
      
      // Load remaining classes with small delays to prevent overwhelming
      for (let i = 0; i < remainingClasses.length; i++) {
        const classItem = remainingClasses[i];
        setTimeout(() => {
          loadSingleClassStats(classItem);
        }, i * 100); // 100ms delay between each request
      }
      
    } catch (error) {
      console.error('💥 Error loading class statistics:', error);
    } finally {
      // Mark stats loading as complete after a reasonable time
      setTimeout(() => {
        setIsLoadingStats(false);
      }, classesList.length * 150); // Give enough time for all requests
    }
  };

  // Keep the old function as fallback for full reload
  const loadClassStats = async (classesList: ClassItem[]) => {
    if (classesList.length === 0) return;
    
    try {
      setIsLoadingStats(true);
      
      const statsPromises = classesList.map(async (classItem) => {
        try {
          const statsResponse = await classApi.getStats(classItem.id);
          return {
            classId: classItem.id,
            stats: statsResponse.success && statsResponse.stats ? 
              statsResponse.stats : 
              { studentsCount: 0, assignmentsCount: 0, averageGrade: null }
          };
        } catch (error) {
          console.error(`Error loading stats for class ${classItem.id}:`, error);
          return {
            classId: classItem.id,
            stats: { studentsCount: 0, assignmentsCount: 0, averageGrade: null }
          };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      
      // Convert to object for easy lookup
      const statsMap: Record<string, ClassStats> = {};
      statsResults.forEach(({ classId, stats }) => {
        statsMap[classId] = stats;
      });
      
      setClassStats(statsMap);
      
    } catch (error) {
      console.error('💥 Error loading class statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Optimized refresh with intelligent reloading
  const handleRefresh = async () => {
    try {
      
      // Quick refresh: only reload stats if classes are already loaded
      if (classes.length > 0) {
        setIsLoadingStats(true);
        showNotification('success', 'Memperbarui statistik kelas...');
        await loadClassStats(classes);
      } else {
        // Full reload if no classes are loaded
        await loadClasses();
      }
      
      showNotification('success', 'Data berhasil diperbarui');
    } catch (error) {
      console.error('💥 Error refreshing data:', error);
      showNotification('error', 'Gagal memperbarui data');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await classApi.create(
        newClass.name,
        newClass.subject,
        newClass.description
      );
      
      if (response.success) {
        setNewClass({ name: '', subject: '', description: '' });
        setShowCreateForm(false);
        showNotification('success', `Kelas "${newClass.name}" berhasil dibuat!`);
        await loadClasses(); // Reload classes and stats
      } else {
        console.error('❌ Failed to create class:', response.error);
        showNotification('error', response.error || 'Gagal membuat kelas');
      }
    } catch (error) {
      console.error('💥 Error creating class:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat kelas');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClass = (classItem: ClassItem) => {
    setEditingClass(classItem);
    setEditForm({
      name: classItem.name,
      subject: classItem.subject,
      description: classItem.description
    });
    setShowEditForm(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    
    setIsUpdating(true);

    try {
      const response = await classApi.update(
        editingClass.id,
        editForm.name,
        editForm.subject,
        editForm.description
      );
      
      if (response.success) {
        setShowEditForm(false);
        setEditingClass(null);
        showNotification('success', `Kelas "${editForm.name}" berhasil diperbarui!`);
        await handleRefresh(); // Use optimized refresh
      } else {
        console.error('❌ Failed to update class:', response.error);
        showNotification('error', response.error || 'Gagal memperbarui kelas');
      }
    } catch (error) {
      console.error('💥 Error updating class:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui kelas');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClass = (classItem: ClassItem) => {
    setDeletingClass(classItem);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteClass = async () => {
    if (!deletingClass) return;
    
    setIsDeleting(true);

    try {
      const response = await classApi.delete(deletingClass.id);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingClass(null);
        showNotification('success', `Kelas "${deletingClass.name}" berhasil dihapus!`);
        await handleRefresh(); // Use optimized refresh
      } else {
        console.error('❌ Failed to delete class:', response.error);
        showNotification('error', response.error || 'Gagal menghapus kelas');
      }
    } catch (error) {
      console.error('💥 Error deleting class:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus kelas');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRandomGradient = () => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Kelas</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua kelas Anda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen">
      {/* Notification - Industrial Minimalism */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50"
          >
            <div className={`flex items-center gap-3 p-3 sm:p-4 border-2 shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${
              notification.type === 'success' 
                ? 'bg-industrial-white text-industrial-black border-industrial-black' 
                : 'bg-industrial-white text-industrial-red border-industrial-red'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-industrial-black" />
              ) : (
                <Warning className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-industrial-red" />
              )}
              <span className="font-semibold text-sm sm:text-base flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-industrial-text-secondary hover:text-industrial-black transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Industrial Minimalism */}
      <AnimatedContainer variant={fadeInUp}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1">Kelas</h1>
            <p className="text-industrial-text-secondary mt-2 text-sm sm:text-base industrial-body">
              Kelola semua kelas Anda dengan mudah
              {isLoadingStats && <span className="ml-2 text-industrial-steel">• Memuat statistik...</span>}
              {loadingProgress > 0 && loadingProgress < 100 && (
                <span className="ml-2 text-industrial-steel">• Loading {loadingProgress}%</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh}
              variant="industrial-secondary"
              size="sm"
              disabled={isLoadingStats}
              className="flex items-center gap-2 flex-1 sm:flex-none h-9 sm:h-10"
            >
              <ArrowClockwise className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm">{isLoadingStats ? 'Memuat...' : 'Refresh'}</span>
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              variant="industrial-primary"
              className="flex-1 sm:flex-none h-9 sm:h-10"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Buat Kelas</span>
            </Button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Search and Filters - Industrial Minimalism */}
      <AnimatedContainer variant={slideInFromLeft} delay={0.1}>
        <Card variant="industrial">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4" />
                <Input
                  variant="industrial"
                  placeholder="Cari kelas, mata pelajaran, atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-2 self-start sm:self-center">
                <Badge variant="industrial-secondary" className="text-xs sm:text-sm whitespace-nowrap">
                  {filteredClasses.length} Kelas
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Classes Grid */}
      <StaggeredList>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClasses.map((classItem, index) => {
            const stats = classStats[classItem.id] || { studentsCount: 0, assignmentsCount: 0, averageGrade: null };
            
            return (
              <AnimatedContainer key={classItem.id} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card variant="industrial" className="hover:shadow-[0_6px_12px_rgba(0,0,0,0.2)] transition-all duration-200 overflow-hidden">
                    {/* Card Header - Industrial Minimalism */}
                    <div className="bg-industrial-black border-b-2 border-industrial-black p-4 sm:p-6 text-industrial-white relative">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold mb-2 truncate text-industrial-white">{classItem.name}</h3>
                          {classItem.subject && (
                            <Badge variant="industrial-secondary" className="text-xs border-industrial-white bg-industrial-white text-industrial-black">
                              {classItem.subject}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-10">
                        <BookOpen className="w-full h-full text-industrial-white" />
                      </div>
                    </div>

                    <CardContent className="p-4 sm:p-6">
                      <p className="text-industrial-text-secondary mb-4 line-clamp-2 text-sm sm:text-base">
                        {classItem.description || 'Tidak ada deskripsi'}
                      </p>

                      {/* Stats - Industrial Minimalism */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                          </div>
                          <div className="text-base sm:text-lg font-bold text-industrial-black industrial-mono">
                            {!stats || isLoadingStats ? (
                              <div className="w-6 h-5 sm:w-8 sm:h-6 mx-auto bg-industrial-light border-2 border-industrial-border animate-pulse"></div>
                            ) : (
                              stats.studentsCount
                            )}
                          </div>
                          <div className="text-xs text-industrial-text-secondary">Siswa</div>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                          </div>
                          <div className="text-base sm:text-lg font-bold text-industrial-black industrial-mono">
                            {!stats || isLoadingStats ? (
                              <div className="w-6 h-5 sm:w-8 sm:h-6 mx-auto bg-industrial-light border-2 border-industrial-border animate-pulse"></div>
                            ) : (
                              stats.assignmentsCount
                            )}
                          </div>
                          <div className="text-xs text-industrial-text-secondary">Tugas</div>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                            <TrendUp className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                          </div>
                          <div className="text-base sm:text-lg font-bold text-industrial-black industrial-mono">
                            {!stats || isLoadingStats ? (
                              <div className="w-6 h-5 sm:w-8 sm:h-6 mx-auto bg-industrial-light border-2 border-industrial-border animate-pulse"></div>
                            ) : (
                              stats.averageGrade !== null ? stats.averageGrade.toFixed(1) : '-'
                            )}
                          </div>
                          <div className="text-xs text-industrial-text-secondary">Rata-rata</div>
                        </div>
                      </div>

                      {/* Action Buttons - Industrial Minimalism */}
                      <div className="flex gap-2">
                        <Button variant="industrial-secondary" size="sm" className="flex-1 h-8 sm:h-9 text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Lihat</span>
                          <span className="sm:hidden">Detail</span>
                        </Button>
                        <Button 
                          variant="industrial-secondary" 
                          size="sm"
                          onClick={() => handleEditClass(classItem)}
                          className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                        >
                          <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          variant="industrial-danger" 
                          size="sm" 
                          className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                          onClick={() => handleDeleteClass(classItem)}
                        >
                          <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>

                      {/* Created date - Industrial Minimalism */}
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-industrial-border flex items-center text-xs text-industrial-text-secondary">
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          Dibuat {new Date(classItem.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedContainer>
            );
          })}
        </div>
      </StaggeredList>

      {/* Empty State - Industrial Minimalism */}
      {!isLoading && filteredClasses.length === 0 && (
        <AnimatedContainer variant={fadeInUp} delay={0.3}>
          <Card variant="industrial">
            <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-industrial-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-industrial-black mb-2 industrial-h2">
                {searchTerm ? 'Tidak ada kelas yang ditemukan' : 'Belum ada kelas'}
              </h3>
              <p className="text-industrial-text-secondary mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                {searchTerm 
                  ? 'Coba ubah kata kunci pencarian Anda'
                  : 'Mulai dengan membuat kelas pertama Anda untuk mengelola siswa dan pembelajaran'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  variant="industrial-primary"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Kelas Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isCreating && setShowCreateForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card variant="industrial" className="w-full max-w-md shadow-[0_8px_16px_rgba(0,0,0,0.3)] mx-4">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-lg sm:text-xl text-industrial-black industrial-h2">Buat Kelas Baru</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                    Isi informasi kelas yang akan Anda buat
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateClass}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Nama Kelas</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: 9A, X-IPA-1"
                        value={newClass.name}
                        onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Mata Pelajaran</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: Matematika, Fisika, Bahasa Indonesia"
                        value={newClass.subject}
                        onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Deskripsi</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: Kelas pagi, Semester ganjil"
                        value={newClass.description}
                        onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </CardContent>
                  <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                    <Button
                      type="button"
                      variant="industrial-secondary"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="industrial-primary"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Membuat...</span>
                        </div>
                      ) : (
                        'Buat Kelas'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Class Modal */}
      <AnimatePresence>
        {showEditForm && editingClass && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isUpdating && setShowEditForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card variant="industrial" className="w-full max-w-md shadow-[0_8px_16px_rgba(0,0,0,0.3)] mx-4">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-lg sm:text-xl text-industrial-black industrial-h2">Edit Kelas</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                    Perbarui informasi kelas "{editingClass.name}"
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateClass}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Nama Kelas</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: 9A, X-IPA-1"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Mata Pelajaran</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: Matematika, Fisika, Bahasa Indonesia"
                        value={editForm.subject}
                        onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Deskripsi</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: Kelas pagi, Semester ganjil"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </CardContent>
                  <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                    <Button
                      type="button"
                      variant="industrial-secondary"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                      onClick={() => setShowEditForm(false)}
                      disabled={isUpdating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="industrial-primary"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memperbarui...</span>
                        </div>
                      ) : (
                        'Perbarui Kelas'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deletingClass && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card variant="industrial" className="w-full max-w-md shadow-[0_8px_16px_rgba(0,0,0,0.3)] mx-4">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-red">
                  <CardTitle className="flex items-center gap-2 text-industrial-red text-lg sm:text-xl industrial-h2">
                    <Warning className="w-4 h-4 sm:w-5 sm:h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-industrial-black text-sm sm:text-base">
                    Apakah Anda yakin ingin menghapus kelas <strong>"{deletingClass.name}"</strong>?
                  </p>
                  <p className="text-xs sm:text-sm text-industrial-text-secondary mt-2">
                    Semua data yang terkait dengan kelas ini akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                  <Button
                    type="button"
                    variant="industrial-secondary"
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="industrial-danger"
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                    onClick={confirmDeleteClass}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      <>
                        <Trash className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Hapus Kelas
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Classes; 