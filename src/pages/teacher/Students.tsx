import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  Plus, 
  MagnifyingGlass, 
  Users, 
  GraduationCap, 
  Pencil,
  Trash,
  Eye,
  Calendar,
  UserPlus,
  BookOpen,
  Warning,
  CheckCircle,
  X,
  Funnel,
  Envelope,
  User,
  DotsThreeVertical,
  Download,
  UserCircle,
  UserMinus,
  Phone,
  MapPin,
  Upload,
  FileXls,
  WarningCircle,
  Spinner,
  ArrowClockwise
} from 'phosphor-react';
import { studentsApi, classApi } from '@/lib/api';

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId?: string;
  className?: string;
  role?: string;
  joinedAt?: string;
  backendId?: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
}

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lazy loading states
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const studentsPerPage = 20; // Load 20 students at a time
  
  // Modal States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form States
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: 'pass123',
    fullName: '',
    classId: ''
  });
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    classId: ''
  });
  
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  
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
      loadStudents();
    }
  }, [classes, selectedClassId]);
  
  useEffect(() => {
    // Filter students based on search term and selected class
    let filtered = students;
    
    // Filter by class
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(student => student.classId === selectedClassId);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredStudents(filtered);
    
    // Reset pagination when filters change
    setCurrentPage(1);
    setHasMoreData(true);
    
    // Load initial page of filtered data
    loadDisplayedStudents(filtered, 1);
  }, [searchTerm, students, selectedClassId]);

  // Load students for display with pagination
  const loadDisplayedStudents = (sourceStudents: Student[], page: number) => {
    const startIndex = 0;
    const endIndex = page * studentsPerPage;
    const newDisplayedStudents = sourceStudents.slice(startIndex, endIndex);
    
    setDisplayedStudents(newDisplayedStudents);
    setHasMoreData(endIndex < sourceStudents.length);
  };

  // Load more students (infinite scroll)
  const loadMoreStudents = () => {
    if (isLoadingMore || !hasMoreData) return;
    
    setIsLoadingMore(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = currentPage * studentsPerPage;
      const endIndex = nextPage * studentsPerPage;
      const newStudents = filteredStudents.slice(startIndex, endIndex);
      
      if (newStudents.length > 0) {
        setDisplayedStudents(prev => [...prev, ...newStudents]);
        setCurrentPage(nextPage);
        setHasMoreData(endIndex < filteredStudents.length);
      } else {
        setHasMoreData(false);
      }
      
      setIsLoadingMore(false);
    }, 300);
  };

  // Infinite scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Check if user has scrolled near the bottom (within 100px)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (hasMoreData && !isLoadingMore) {
        loadMoreStudents();
      }
    }
  };

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

  const debugStudentData = async () => {
    try {
      console.log('🔍 Debug: Current students in state:', students);
      
      const response = await studentsApi.getAll();
      console.log('🔍 Debug: Raw API response:', response);
      
      if (response.success && response.students) {
        console.log('🔍 Debug: Raw students data:', response.students);
        
        response.students.forEach((student: any, index: number) => {
          console.log(`🔍 Debug: Student ${index + 1}:`, {
            id: student.id,
            studentUsername: student.studentUsername,
            username: student.username,
            fullName: student.fullName,
            classId: student.classId,
            raw: student
          });
        });
      }
      
      showNotification('success', 'Data siswa telah dicetak ke console. Buka Developer Tools untuk melihat.');
    } catch (error) {
      console.error('🔍 Debug error:', error);
      showNotification('error', 'Terjadi kesalahan saat debugging');
    }
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
  
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      
      const response = await studentsApi.getAll();
      
      if (response.success) {
        // Process students data to include class name
        // Backend returns: id (composite), username, fullName, classId, role, joinedAt
        const processedStudents = (response.students || [])
          .map((student: any) => {
            const className = getClassName(student.classId);
            
            // Use 'username' field since 'studentUsername' is undefined in backend response
            const studentUsername = student.username || student.studentUsername;
            
            // Skip students without valid username
            if (!studentUsername) {
              return null;
            }
            
            return {
              id: student.id, // Keep original backend ID (composite format)
              username: studentUsername,
              fullName: student.fullName || 'Unknown',
              classId: student.classId,
              className,
              role: student.role || 'student',
              joinedAt: student.joinedAt,
              backendId: student.id // Store original backend ID separately
            };
          })
          .filter(Boolean); // Remove null entries
        
        setStudents(processedStudents);
        
        // Reset pagination after loading new data
        setCurrentPage(1);
        setHasMoreData(processedStudents.length > studentsPerPage);
      } else {
        console.error('❌ Failed to load students:', response.error);
        showNotification('error', response.error || 'Gagal memuat data siswa');
      }
    } catch (error) {
      console.error('💥 Error loading students:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data siswa');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getClassName = (classId?: string) => {
    if (!classId || classId === '' || classId === 'default') {
      return 'Belum ada kelas';
    }
    
    const foundClass = classes.find(c => c.id === classId);
    return foundClass ? foundClass.name : 'Kelas tidak ditemukan';
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await studentsApi.create(
        newStudent.classId,
        newStudent.username,
        newStudent.fullName,
        newStudent.password
      );
      
      if (response.success) {
        setNewStudent({ username: '', password: 'pass123', fullName: '', classId: '' });
        setShowCreateForm(false);
        showNotification('success', `Siswa "${newStudent.fullName}" berhasil dibuat!`);
        await loadStudents();
      } else {
        console.error('❌ Failed to create student:', response.error);
        showNotification('error', response.error || 'Gagal membuat siswa');
      }
    } catch (error) {
      console.error('💥 Error creating student:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat siswa');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName,
      classId: student.classId || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsUpdating(true);

    try {
      const response = await studentsApi.update(
        editingStudent.id,
        editForm.fullName
      );
      
      if (response.success) {
        setShowEditForm(false);
        setEditingStudent(null);
        showNotification('success', `Data siswa "${editForm.fullName}" berhasil diperbarui!`);
        await loadStudents();
      } else {
        console.error('❌ Failed to update student:', response.error);
        showNotification('error', response.error || 'Gagal memperbarui data siswa');
      }
    } catch (error) {
      console.error('💥 Error updating student:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui data siswa');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    
    // Validation before deletion
    
    // Validate student ID before deleting (use the original backend ID)
    if (!deletingStudent.id || 
        deletingStudent.id === 'undefined' || 
        deletingStudent.id === '' || 
        typeof deletingStudent.id !== 'string' ||
        deletingStudent.id.trim() === '') {
      console.error('❌ Cannot delete student: Invalid ID', deletingStudent);
      showNotification('error', 'Tidak dapat menghapus siswa: ID tidak valid');
      setShowDeleteConfirm(false);
      setDeletingStudent(null);
      return;
    }
    
    setIsDeleting(true);

    try {
      // Use the original backend ID (composite format) for deletion
      const response = await studentsApi.delete(deletingStudent.id);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingStudent(null);
        showNotification('success', `Siswa "${deletingStudent.fullName}" berhasil dihapus!`);
        await loadStudents();
      } else {
        console.error('❌ Failed to delete student:', response.error);
        showNotification('error', response.error || 'Gagal menghapus siswa');
      }
    } catch (error) {
      console.error('💥 Error deleting student:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus siswa');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Siswa</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua siswa dan penempatan kelas</p>
          </div>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 border-2 border-industrial-black bg-industrial-white p-3 sm:p-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-industrial-light border-2 border-industrial-black flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 sm:h-4 bg-industrial-light w-1/4"></div>
                    <div className="h-2 sm:h-3 bg-industrial-light w-1/3"></div>
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
    <div className="space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen p-4 sm:p-6">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50"
          >
            <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <Warning className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span className="font-medium text-sm sm:text-base flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
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
            <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1">Siswa</h1>
            <p className="text-industrial-text-secondary mt-2 text-sm sm:text-base industrial-body">Kelola semua siswa dan penempatan kelas</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="industrial-secondary"
              onClick={debugStudentData}
              className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Debug Data
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              variant="industrial-primary"
              className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Tambah Siswa
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
                  placeholder="Cari siswa berdasarkan nama, username, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Funnel className="w-4 h-4 text-industrial-text-muted flex-shrink-0" />
                <select 
                  className="px-3 py-2 border-2 border-industrial-black text-xs sm:text-sm bg-industrial-white focus:outline-none focus:border-industrial-steel flex-1 sm:flex-none min-w-0"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <Badge variant="industrial-secondary" className="text-xs sm:text-sm whitespace-nowrap">
                  {displayedStudents.length} dari {filteredStudents.length} Siswa
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Modern Table - Desktop View - Industrial Minimalism */}
      <AnimatedContainer variant={fadeInUp} delay={0.2}>
        <Card variant="industrial" className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <div 
              className="max-h-[600px] overflow-y-auto"
              onScroll={handleScroll}
            >
              <table className="industrial-table w-full">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-industrial-white uppercase tracking-wider">
                      Bergabung
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-industrial-white uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStudents.length > 0 ? (
                    displayedStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mr-4">
                            <User className="w-5 h-5 text-industrial-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-industrial-black">{student.fullName}</div>
                            <div className="text-sm text-industrial-text-secondary flex items-center">
                              <Envelope className="w-3 h-3 mr-1" />
                              {student.username}
                              {/* Debug: Show username if it's problematic */}
                              {(!student.username || student.username === 'undefined' || student.username === '') && (
                                <div className="text-xs text-industrial-red font-mono bg-industrial-white border-2 border-industrial-red px-1 mt-1">
                                  ⚠️ Invalid Username: "{student.username}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-industrial-black font-mono bg-industrial-light border-2 border-industrial-black px-2 py-1">
                          {student.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={student.className === 'Belum ada kelas' ? 'industrial-secondary' : 'industrial-primary'}
                          className="text-xs"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {student.className}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-industrial-text-secondary">
                        {student.joinedAt ? (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(student.joinedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="industrial-secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="industrial-secondary"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="industrial-danger"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                  ) : null}
                  
                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Spinner className="w-4 h-4 animate-spin text-industrial-steel" />
                          <span className="text-sm text-industrial-text-secondary">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Load more button */}
                  {!isLoadingMore && hasMoreData && displayedStudents.length > 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        <Button
                          variant="industrial-secondary"
                          onClick={loadMoreStudents}
                        >
                          <ArrowClockwise className="w-4 h-4 mr-2" />
                          Muat {Math.min(studentsPerPage, filteredStudents.length - displayedStudents.length)} Siswa Lagi
                        </Button>
                      </td>
                    </tr>
                  )}
                  
                  {/* No data state */}
                  {displayedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-industrial-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-industrial-black mb-1 industrial-h2">
                          {searchTerm ? 'Tidak ada siswa yang ditemukan' : 'Belum ada siswa'}
                        </h3>
                        <p className="text-industrial-text-secondary mb-4">
                          {searchTerm 
                            ? 'Coba ubah kata kunci pencarian atau filter kelas'
                            : 'Mulai dengan menambahkan siswa pertama untuk mengelola pembelajaran'
                          }
                        </p>
                        {!searchTerm && (
                          <Button 
                            onClick={() => setShowCreateForm(true)}
                            variant="industrial-primary"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Tambah Siswa Pertama
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Industrial Minimalism */}
          <div className="md:hidden">
            {displayedStudents.length > 0 ? (
              <div 
                className="p-4 space-y-3 max-h-[600px] overflow-y-auto"
                onScroll={handleScroll}
              >
                {displayedStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-industrial-white border-2 border-industrial-black p-4 hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-industrial-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-industrial-black truncate">{student.fullName}</h3>
                          <p className="text-xs text-industrial-text-secondary flex items-center">
                            <Envelope className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{student.username}</span>
                          </p>
                          {/* Debug info for problematic usernames */}
                          {(!student.username || student.username === 'undefined' || student.username === '') && (
                            <div className="text-xs text-industrial-red font-mono bg-industrial-white border-2 border-industrial-red px-1 mt-1">
                              ⚠️ Invalid Username: "{student.username}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="industrial-secondary"
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="industrial-secondary"
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                          className="w-8 h-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="industrial-danger"
                          size="sm"
                          onClick={() => handleDeleteStudent(student)}
                          className="w-8 h-8 p-0"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center">
                        <Badge 
                          variant={student.className === 'Belum ada kelas' ? 'industrial-secondary' : 'industrial-primary'}
                          className="text-xs"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {student.className}
                        </Badge>
                      </div>
                      {student.joinedAt && (
                        <div className="flex items-center text-industrial-text-secondary">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            {new Date(student.joinedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {/* Loading more indicator for mobile */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2">
                          <Spinner className="w-4 h-4 animate-spin text-industrial-steel" />
                      <span className="text-sm text-industrial-text-secondary">Memuat data...</span>
                    </div>
                  </div>
                )}
                
                {/* Load more button for mobile */}
                {!isLoadingMore && hasMoreData && displayedStudents.length > 0 && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="industrial-secondary"
                      onClick={loadMoreStudents}
                    >
                          <ArrowClockwise className="w-4 h-4 mr-2" />
                      Muat {Math.min(studentsPerPage, filteredStudents.length - displayedStudents.length)} Siswa Lagi
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Tidak ada siswa yang ditemukan' : 'Belum ada siswa'}
                </h3>
                <p className="text-gray-500 mb-4 text-sm">
                  {searchTerm 
                    ? 'Coba ubah kata kunci pencarian atau filter kelas'
                    : 'Mulai dengan menambahkan siswa pertama untuk mengelola pembelajaran'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah Siswa Pertama
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Pagination Info Footer */}
          {displayedStudents.length > 0 && (
            <div className="border-t bg-gray-50/30 px-4 sm:px-6 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-600 gap-2">
                <span>
                  Menampilkan {displayedStudents.length} dari {filteredStudents.length} siswa
                  {filteredStudents.length !== students.length && (
                    <span className="text-gray-500"> (difilter dari {students.length} total)</span>
                  )}
                </span>
                {!hasMoreData && filteredStudents.length > studentsPerPage && (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Semua data telah dimuat
                  </span>
                )}
                {hasMoreData && !isLoadingMore && (
                  <span className="text-blue-600 font-medium">
                    {filteredStudents.length - displayedStudents.length} siswa lagi tersedia
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </AnimatedContainer>

      {/* Create Student Modal */}
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
                  <CardTitle className="text-lg sm:text-xl text-industrial-black industrial-h2">Tambah Siswa Baru</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                    Isi informasi siswa yang akan ditambahkan
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateStudent}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Username</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: john_doe, siswa001"
                        value={newStudent.username}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, username: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Nama Lengkap</label>
                      <Input
                        variant="industrial"
                        placeholder="Contoh: John Doe"
                        value={newStudent.fullName}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, fullName: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Password</label>
                      <Input
                        variant="industrial"
                        type="password"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Kelas</label>
                      <select
                        className="flex h-10 sm:h-11 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-sm sm:text-base focus:outline-none focus:border-industrial-steel"
                        value={newStudent.classId}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, classId: e.target.value }))}
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
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
                        'Tambah Siswa'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {showEditForm && editingStudent && (
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
                  <CardTitle className="text-lg sm:text-xl text-industrial-black industrial-h2">Edit Siswa</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                    Perbarui informasi siswa "{editingStudent.fullName}"
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateStudent}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Username</label>
                      <Input
                        variant="industrial"
                        value={editingStudent.username}
                        disabled
                        className="bg-industrial-light h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-industrial-text-secondary">Username tidak dapat diubah</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Nama Lengkap</label>
                      <Input
                        variant="industrial"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-industrial-black">Kelas</label>
                      <select
                        className="flex h-10 sm:h-11 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-sm sm:text-base focus:outline-none focus:border-industrial-steel"
                        value={editForm.classId}
                        onChange={(e) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
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
                        'Perbarui Data'
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
        {showDeleteConfirm && deletingStudent && (
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
              <Card variant="industrial" className="w-full max-w-md shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-red">
                  <CardTitle className="flex items-center gap-2 text-industrial-red text-lg sm:text-xl industrial-h2">
                    <Warning className="w-5 h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-industrial-black">
                    Apakah Anda yakin ingin menghapus siswa <strong>"{deletingStudent.fullName}"</strong>?
                  </p>
                  <p className="text-sm text-industrial-text-secondary mt-2">
                    Semua data yang terkait dengan siswa ini akan ikut terhapus.
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
                    onClick={confirmDeleteStudent}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      <>
                        <Trash className="w-4 h-4 mr-2" />
                        Hapus Siswa
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

export default StudentsPage; 