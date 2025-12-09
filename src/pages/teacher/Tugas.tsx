import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  WarningCircle,
  XCircle,
  Eye,
  Pencil,
  Trash,
  Plus,
  MagnifyingGlass,
  Funnel,
  FileText,
  TrendUp,
  TrendDown,
  Target,
  Warning,
  Spinner,
  ArrowClockwise,
  X,
  FloppyDisk,
  Activity,
  Lightning,
  Trophy,
  GraduationCap,
  Copy
} from 'phosphor-react';
import { assignmentApi, classApi } from '@/lib/api';

interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className?: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  submissionCount?: number;
  totalStudents?: number;
  status?: 'active' | 'completed' | 'overdue';
  completionRate?: number;
  averageScore?: number;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
}

const TugasPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'created' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk operations
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  
  // Form States
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    maxPoints: 100
  });
  
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    maxPoints: 100
  });
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  useEffect(() => {
    loadClasses();
  }, []);
  
  useEffect(() => {
    if (classes.length > 0) {
      loadAssignments();
    }
  }, [classes, selectedClassId]);

  // Monitor for grade changes to auto-complete assignments
  useEffect(() => {
    const handleGradeUpdate = (event: CustomEvent) => {
      const { assignmentId } = event.detail;
      if (assignmentId) {
        // Delay to ensure grade is saved before checking
        setTimeout(() => {
          checkAutoComplete(assignmentId);
        }, 1000);
      }
    };

    // Listen for grade update events
    window.addEventListener('gradeUpdated', handleGradeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('gradeUpdated', handleGradeUpdate as EventListener);
    };
  }, [assignments]);
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Sort and filter assignments
  useEffect(() => {
    let filtered = assignments;
    
    // Filter by class
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(assignment => assignment.classId === selectedClassId);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.className && assignment.className.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort assignments
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          const statusOrder = { 'overdue': 0, 'active': 1, 'completed': 2 };
          aValue = statusOrder[a.status || 'active'];
          bValue = statusOrder[b.status || 'active'];
          break;
        default:
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments, selectedClassId, sortBy, sortOrder]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedAssignments.length === filteredAssignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(filteredAssignments.map(a => a.id));
    }
  };

  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = selectedAssignments.map(id => assignmentApi.delete(id));
      await Promise.all(deletePromises);
      
      showNotification('success', `${selectedAssignments.length} tugas berhasil dihapus!`);
      setSelectedAssignments([]);
      await loadAssignments();
    } catch (error) {
      showNotification('error', 'Gagal menghapus beberapa tugas');
    } finally {
      setIsDeleting(false);
      setShowBulkActions(false);
    }
  };

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      const response = await assignmentApi.create(
        assignment.classId,
        `${assignment.title} (Copy)`,
        assignment.description,
        assignment.dueDate,
        assignment.maxPoints
      );
      
      if (response.success) {
        showNotification('success', `Tugas "${assignment.title}" berhasil diduplikasi!`);
        await loadAssignments();
      }
    } catch (error) {
      showNotification('error', 'Gagal menduplikasi tugas');
    }
  };

  // Complete assignment function
  const handleCompleteAssignment = async (assignment: Assignment) => {
    try {
      const response = await assignmentApi.updateStatus(assignment.id, 'completed');
      
      if (response.success) {
        showNotification('success', `Tugas "${assignment.title}" telah ditandai selesai!`);
        await loadAssignments();
      } else {
        showNotification('error', response.error || 'Gagal menandai tugas selesai');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menandai tugas selesai');
    }
  };

  // Check if all students have been graded for an assignment
  const checkAutoComplete = async (assignmentId: string) => {
    try {
      // Get grades for this assignment
      const gradesResponse = await assignmentApi.getGrades(assignmentId);
      // Get students for this assignment's class
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;
      
      const studentsResponse = await assignmentApi.getStudentsByClass(assignment.classId);
      
      if (gradesResponse.success && studentsResponse.success) {
        const grades = gradesResponse.grades || [];
        const students = studentsResponse.students || [];
        
        // Check if all students have grades
        const gradedStudents = grades.map((g: any) => g.studentUsername);
        const allStudents = students.map((s: any) => s.username);
        
        const allGraded = allStudents.every((studentUsername: string) => 
          gradedStudents.includes(studentUsername)
        );
        
        if (allGraded && assignment.status !== 'completed') {
          // Auto-complete the assignment
          await assignmentApi.updateStatus(assignmentId, 'completed');
          showNotification('success', `Tugas "${assignment.title}" otomatis ditandai selesai karena semua siswa sudah dinilai!`);
          await loadAssignments();
        }
      }
    } catch (error) {
      console.error('Error checking auto-complete:', error);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    await Promise.all([loadClasses(), loadAssignments()]);
    showNotification('success', 'Data berhasil diperbarui!');
  };

  // Get enhanced statistics
  const getEnhancedStats = () => {
    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'active').length;
    const overdue = assignments.filter(a => a.status === 'overdue').length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    
    const thisWeek = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= weekFromNow;
    }).length;

    const averagePoints = total > 0 
      ? Math.round(assignments.reduce((sum, a) => sum + a.maxPoints, 0) / total) 
      : 0;

    return { total, active, overdue, completed, thisWeek, averagePoints };
  };

  const loadClasses = async () => {
    try {
      const response = await classApi.getAll();
      if (response.success) {
        setClasses(response.classes || []);
      } else {
        console.error('❌ Failed to load classes:', response.error);
        showNotification('error', response.error || 'Gagal memuat data kelas');
      }
    } catch (error) {
      console.error('💥 Error loading classes:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data kelas');
    }
  };
  
  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      
      const response = selectedClassId === 'all' 
        ? await assignmentApi.getAll()
        : await assignmentApi.getByClass(selectedClassId);
      
      if (response.success) {
        // Process assignments data to include class name and status
        const processedAssignments = (response.assignments || [])
          .map((assignment: any) => {
            const className = getClassName(assignment.classId);
            const status = getAssignmentStatus(assignment.dueDate);
            
            return {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              classId: assignment.classId,
              className: className,
              dueDate: assignment.dueDate,
              maxPoints: assignment.maxPoints || 100,
              createdAt: assignment.createdAt,
              status: status,
              submissionCount: 0, // Will be calculated from grades
              totalStudents: 0    // Will be calculated from students
            };
          });
        
        setAssignments(processedAssignments);
      } else {
        console.error('❌ Failed to load assignments:', response.error);
        showNotification('error', response.error || 'Gagal memuat data tugas');
      }
    } catch (error) {
      console.error('💥 Error loading assignments:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data tugas');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getClassName = (classId?: string) => {
    if (!classId) return 'Tidak ada kelas';
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : 'Unknown Class';
  };

  const getAssignmentStatus = (dueDate: string): 'active' | 'completed' | 'overdue' => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) {
      return 'overdue';
    }
    
    // For simplicity, we'll mark as active. In real app, you'd check submission status
    return 'active';
  };

  const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await assignmentApi.create(
        newAssignment.classId,
        newAssignment.title,
        newAssignment.description,
        newAssignment.dueDate,
        newAssignment.maxPoints
      );
      
      if (response.success) {
        setNewAssignment({ title: '', description: '', classId: '', dueDate: '', maxPoints: 100 });
        setShowCreateForm(false);
        showNotification('success', `Tugas "${newAssignment.title}" berhasil dibuat!`);
        await loadAssignments();
      } else {
        console.error('❌ Failed to create assignment:', response.error);
        showNotification('error', response.error || 'Gagal membuat tugas');
      }
    } catch (error) {
      console.error('💥 Error creating assignment:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat tugas');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description,
      classId: assignment.classId,
      dueDate: assignment.dueDate,
      maxPoints: assignment.maxPoints
    });
    setShowEditForm(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAssignment) return;
    
    setIsUpdating(true);

    try {
      const response = await assignmentApi.update(
        editingAssignment.id,
        editForm.title,
        editForm.description,
        editForm.dueDate,
        editForm.maxPoints
      );
      
      if (response.success) {
        setShowEditForm(false);
        setEditingAssignment(null);
        showNotification('success', `Tugas "${editForm.title}" berhasil diperbarui!`);
        await loadAssignments();
      } else {
        console.error('❌ Failed to update assignment:', response.error);
        showNotification('error', response.error || 'Gagal memperbarui tugas');
      }
    } catch (error) {
      console.error('💥 Error updating assignment:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui tugas');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    
    setIsDeleting(true);

    try {
      const response = await assignmentApi.delete(deletingAssignment.id);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingAssignment(null);
        showNotification('success', `Tugas "${deletingAssignment.title}" berhasil dihapus!`);
        await loadAssignments();
      } else {
        console.error('❌ Failed to delete assignment:', response.error);
        showNotification('error', response.error || 'Gagal menghapus tugas');
      }
    } catch (error) {
      console.error('💥 Error deleting assignment:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus tugas');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Selesai';
      case 'overdue':
        return 'Lewat Deadline';
      default:
        return 'Aktif';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tugas</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua tugas dan aktivitas pembelajaran siswa</p>
          </div>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 border-2 border-industrial-black bg-industrial-white p-3 sm:p-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-industrial-light border-2 border-industrial-black flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 sm:h-4 bg-industrial-light w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-industrial-light w-1/2"></div>
                  </div>
                  <div className="h-6 sm:h-8 bg-industrial-light border-2 border-industrial-black w-16 sm:w-20 flex-shrink-0"></div>
                  <div className="h-6 sm:h-8 bg-industrial-light border-2 border-industrial-black w-20 sm:w-24 flex-shrink-0"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      {/* Notification - Industrial Minimalism */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 max-w-md"
          >
            <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${
              notification.type === 'success' 
                ? 'bg-industrial-white text-industrial-black border-industrial-black' 
                : 'bg-industrial-white text-industrial-red border-industrial-red'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-industrial-black" />
              ) : (
                <Warning className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-industrial-red" />
              )}
              <span className="font-semibold text-xs sm:text-sm flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-industrial-text-secondary hover:text-industrial-black transition-colors"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Industrial Minimalism */}
      <AnimatedContainer variant={fadeInUp}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1">
              Tugas
            </h1>
            <p className="text-industrial-text-secondary mt-2 text-sm sm:text-base industrial-body">Kelola semua tugas dan aktivitas pembelajaran siswa</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {selectedAssignments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 order-3 sm:order-1"
              >
                <Badge variant="industrial-secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                  {selectedAssignments.length} dipilih
                </Badge>
                <Button 
                  variant="industrial-danger" 
                  size="sm"
                  onClick={() => setShowBulkActions(true)}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Trash className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Hapus
                </Button>
              </motion.div>
            )}
            <Button 
              variant="industrial-secondary" 
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoading}
              className="order-2 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <ArrowClockwise className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              variant="industrial-primary"
              className="order-1 sm:order-3 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="hidden sm:inline">Buat Tugas Baru</span>
              <span className="sm:hidden">Buat Tugas</span>
            </Button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Enhanced Filters - Industrial Minimalism */}
      <AnimatedContainer variant={slideInFromLeft} delay={0.1}>
        <Card variant="industrial">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-3 h-3 sm:w-4 sm:h-4" />
                <Input
                  variant="industrial"
                  placeholder="Cari tugas berdasarkan judul atau deskripsi..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <Funnel className="w-3 h-3 sm:w-4 sm:h-4 text-industrial-text-muted flex-shrink-0" />
                  <select
                    className="flex h-9 sm:h-10 border-2 border-industrial-black bg-industrial-white px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel min-w-0 flex-1"
                    value={selectedClassId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClassId(e.target.value)}
                  >
                    <option value="all">Semua Kelas</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-industrial-text-muted flex-shrink-0" />
                  <select
                    className="flex h-9 sm:h-10 border-2 border-industrial-black bg-industrial-white px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel min-w-0 flex-1"
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}
                  >
                    <option value="dueDate">Urutkan: Deadline</option>
                    <option value="title">Urutkan: Judul</option>
                    <option value="created">Urutkan: Dibuat</option>
                    <option value="status">Urutkan: Status</option>
                  </select>
                </div>
                <Button
                  variant="industrial-secondary"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-9 px-2 sm:px-3"
                >
                  {sortOrder === 'asc' ? (
                    <TrendUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <TrendDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
            </div>
            {filteredAssignments.length > 0 && (
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAssignments.length === filteredAssignments.length}
                    onChange={handleSelectAll}
                    className="border-2 border-industrial-black text-industrial-steel focus:ring-industrial-steel"
                  />
                  <span className="text-xs sm:text-sm text-industrial-text-secondary">
                    Pilih semua ({filteredAssignments.length} tugas)
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-industrial-text-muted">
                  Menampilkan {filteredAssignments.length} dari {assignments.length} tugas
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Enhanced Statistics Cards - Industrial Minimalism */}
      <AnimatedContainer variant={slideInFromLeft} delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Total Tugas</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{getEnhancedStats().total}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Tugas Aktif</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{getEnhancedStats().active}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Lewat Deadline</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-red industrial-mono truncate">{getEnhancedStats().overdue}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-red border-2 border-industrial-red flex items-center justify-center flex-shrink-0 ml-2">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Selesai</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{getEnhancedStats().completed}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Minggu Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{getEnhancedStats().thisWeek}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <Lightning className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Rata-rata Poin</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{getEnhancedStats().averagePoints}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {/* Assignments List - Industrial Minimalism */}
      <AnimatedContainer variant={fadeInUp} delay={0.3}>
        <Card variant="industrial">
          <CardHeader className="border-b-2 border-industrial-black p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
              Daftar Tugas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
              Menampilkan {filteredAssignments.length} dari {assignments.length} tugas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAssignments.length > 0 ? (
              <div className="divide-y divide-industrial-border">
                <AnimatePresence>
                  {filteredAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 sm:p-6 hover:bg-industrial-light transition-colors border-b border-industrial-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={() => handleSelectAssignment(assignment.id)}
                              className="border-2 border-industrial-black text-industrial-steel focus:ring-industrial-steel"
                            />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center text-industrial-white font-bold text-sm sm:text-base">
                              {assignment.title.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                              <h3 className="font-semibold text-industrial-black text-sm sm:text-base truncate">{assignment.title}</h3>
                              <Badge 
                                variant={assignment.status === 'completed' ? 'industrial-primary' : assignment.status === 'overdue' ? 'industrial-danger' : 'industrial-secondary'}
                                className="font-semibold text-xs flex-shrink-0"
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(assignment.status || 'active')}
                                  <span>{getStatusText(assignment.status || 'active')}</span>
                                </div>
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-industrial-text-secondary mb-3 line-clamp-2">{assignment.description}</p>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-industrial-text-secondary">
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{assignment.className}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{formatDate(assignment.dueDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{assignment.maxPoints} poin</span>
                              </div>
                              {assignment.completionRate && (
                                <div className="flex items-center gap-1">
                                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{Math.round(assignment.completionRate)}% selesai</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-1 ml-2 sm:ml-4 flex-shrink-0">
                          <Button
                            variant="industrial-secondary"
                            size="sm"
                            onClick={() => handleViewAssignment(assignment)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          {assignment.status !== 'completed' && (
                          <Button
                              variant="industrial-secondary"
                              size="sm"
                              onClick={() => handleCompleteAssignment(assignment)}
                              className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                              title="Tandai Selesai"
                            >
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          <Button
                            variant="industrial-secondary"
                            size="sm"
                            onClick={() => handleDuplicateAssignment(assignment)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Duplikasi Tugas"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="industrial-secondary"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Edit Tugas"
                          >
                            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="industrial-danger"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Hapus Tugas"
                          >
                            <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 px-4">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-industrial-border mx-auto mb-4" />
                <h3 className="font-semibold text-industrial-black mb-2 text-sm sm:text-base industrial-h2">Belum ada tugas</h3>
                <p className="text-industrial-text-secondary mb-4 text-xs sm:text-sm">
                  {searchTerm || selectedClassId !== 'all' 
                    ? 'Tidak ada tugas yang sesuai dengan filter Anda'
                    : 'Mulai dengan membuat tugas pertama untuk siswa Anda'
                  }
                </p>
                {!searchTerm && selectedClassId === 'all' && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    variant="industrial-primary"
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Buat Tugas Pertama
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Create Assignment Modal */}
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
              <Card variant="industrial" className="w-full max-w-2xl shadow-[0_8px_16px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto mx-4">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Buat Tugas Baru</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                    Isi informasi tugas yang akan diberikan kepada siswa
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateAssignment}>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">Judul Tugas</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: Tugas Matematika - Persamaan Kuadrat"
                        value={newAssignment.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">Deskripsi</label>
                      <textarea
                        placeholder="Jelaskan detail tugas, instruksi, dan kriteria penilaian..."
                        value={newAssignment.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="flex w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm placeholder:text-industrial-text-muted focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-industrial-black">Kelas</label>
                        <select
                          className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                          value={newAssignment.classId}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAssignment(prev => ({ ...prev, classId: e.target.value }))}
                          required
                        >
                          <option value="">Pilih Kelas</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-industrial-black">Batas Waktu</label>
                        <input
                          type="datetime-local"
                          value={newAssignment.dueDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">Nilai Maksimal</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="100"
                        value={newAssignment.maxPoints}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignment(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                        className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                        required
                      />
                    </div>
                  </CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                    <Button
                      type="button"
                      variant="industrial-secondary"
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-2 sm:order-1"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="industrial-primary"
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-1 sm:order-2"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Membuat...</span>
                        </div>
                      ) : (
                        'Buat Tugas'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Assignment Modal */}
      <AnimatePresence>
        {showEditForm && editingAssignment && (
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
              <Card variant="industrial" className="w-full max-w-2xl shadow-[0_8px_16px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Edit Tugas</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                    Perbarui informasi tugas "{editingAssignment.title}"
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateAssignment}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">Judul Tugas</label>
                      <Input
                        variant="industrial"
                        value={editForm.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">Deskripsi</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="flex w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm placeholder:text-industrial-text-muted focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-industrial-black">Kelas</label>
                        <select
                          className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                          value={editForm.classId}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                          required
                        >
                          <option value="">Pilih Kelas</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-industrial-black">Batas Waktu</label>
                        <input
                          type="datetime-local"
                          value={editForm.dueDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">Nilai Maksimal</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={editForm.maxPoints}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                        className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                        required
                      />
                    </div>
                  </CardContent>
                  <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                    <Button
                      type="button"
                      variant="industrial-secondary"
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                      onClick={() => setShowEditForm(false)}
                      disabled={isUpdating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="industrial-primary"
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memperbarui...</span>
                        </div>
                      ) : (
                        'Perbarui Tugas'
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
        {showDeleteConfirm && deletingAssignment && (
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
                  <CardTitle className="flex items-center gap-2 text-industrial-red text-base sm:text-lg industrial-h2">
                    <Warning className="w-4 h-4 sm:w-5 sm:h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-industrial-black text-xs sm:text-sm">
                    Apakah Anda yakin ingin menghapus tugas "{deletingAssignment.title}"? 
                    Semua data terkait termasuk pengumpulan dan nilai akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                  <Button
                    variant="industrial-secondary"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-2 sm:order-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="industrial-danger"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-1 sm:order-2"
                    onClick={confirmDeleteAssignment}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      'Hapus Tugas'
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal - Industrial Minimalism */}
      <AnimatePresence>
        {showDetailModal && selectedAssignment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-industrial-black/80 z-40"
              onClick={() => setShowDetailModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card variant="industrial" className="w-full max-w-2xl shadow-[0_8px_16px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="flex items-center gap-2 text-industrial-black industrial-h2">
                    <FileText className="w-5 h-5 text-industrial-black" />
                    Detail Tugas
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                    Informasi lengkap tugas "{selectedAssignment.title}"
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                  <div className="border-b-2 border-industrial-border pb-4">
                    <h3 className="font-semibold mb-2 text-industrial-black text-sm sm:text-base">Judul</h3>
                    <p className="text-industrial-text-secondary">{selectedAssignment.title}</p>
                  </div>
                  <div className="border-b-2 border-industrial-border pb-4">
                    <h3 className="font-semibold mb-2 text-industrial-black text-sm sm:text-base">Deskripsi</h3>
                    <p className="text-industrial-text-secondary whitespace-pre-wrap">{selectedAssignment.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b-2 border-industrial-border pb-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-industrial-black text-sm sm:text-base">Kelas</h3>
                      <p className="text-industrial-text-secondary">{selectedAssignment.className}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-industrial-black text-sm sm:text-base">Batas Waktu</h3>
                      <p className="text-industrial-text-secondary">{formatDate(selectedAssignment.dueDate)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-industrial-black text-sm sm:text-base">Nilai Maksimal</h3>
                      <p className="text-industrial-text-secondary industrial-mono">{selectedAssignment.maxPoints} poin</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-industrial-black text-sm sm:text-base">Status</h3>
                      <Badge 
                        variant={selectedAssignment.status === 'completed' ? 'industrial-primary' : selectedAssignment.status === 'overdue' ? 'industrial-danger' : 'industrial-secondary'}
                        className="font-semibold"
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedAssignment.status || 'active')}
                          <span>{getStatusText(selectedAssignment.status || 'active')}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                  <Button
                    variant="industrial-secondary"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="industrial-primary"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditAssignment(selectedAssignment);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Tugas
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Actions Confirmation Modal - Industrial Minimalism */}
      <AnimatePresence>
        {showBulkActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-industrial-black/80 z-40"
              onClick={() => !isDeleting && setShowBulkActions(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card variant="industrial" className="w-full max-w-md shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-red">
                  <CardTitle className="flex items-center gap-2 text-industrial-red text-base sm:text-lg industrial-h2">
                    <Warning className="w-5 h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-industrial-black text-xs sm:text-sm">
                    Apakah Anda yakin ingin menghapus {selectedAssignments.length > 1 ? 'tugas ini' : 'tugas terpilih'}? 
                    Semua data terkait termasuk pengumpulan dan nilai akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-industrial-black">
                  <Button
                    variant="industrial-secondary"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={() => setShowBulkActions(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="industrial-danger"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      'Hapus Tugas'
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

export default TugasPage; 