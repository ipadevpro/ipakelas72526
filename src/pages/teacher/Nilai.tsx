import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  GraduationCap,
  TrendUp,
  TrendDown,
  CaretDown,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  WarningCircle,
  Warning,
  Pencil,
  Trash,
  Plus,
  Eye,
  Star,
  Clock,
  Spinner,
  X,
  ArrowClockwise,
  FloppyDisk,
  ChartBar,
  ThumbsUp,
  Activity,
  Target
} from 'phosphor-react';
import { gradeApi, assignmentApi, classApi, studentApi } from '@/lib/api';
import * as XLSX from 'xlsx';

interface Grade {
  id: string;
  assignmentId: string;
  studentUsername: string;
  studentName: string;
  points: number;
  feedback: string;
  gradedAt: string;
  assignmentInfo?: {
    id: string;
    title: string;
    classId: string;
  };
  maxPoints?: number;
  percentage?: number;
  status?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
}

interface Class {
  id: string;
  name: string;
  subject?: string;
  description?: string;
}

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId: string;
}

const NilaiPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('grades');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enhanced UI states
  const [sortBy, setSortBy] = useState<'student' | 'assignment' | 'points' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPendingPage, setCurrentPendingPage] = useState(1);
  const [itemsPerPendingPage, setItemsPerPendingPage] = useState(20);
  
  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Data states
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Filter states
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    assignmentId: '',
    studentUsername: '',
    points: '',
    feedback: ''
  });
  
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // Loading states for different operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Bulk grading states
  const [bulkAssignmentId, setBulkAssignmentId] = useState<string>('');
  const [bulkGrades, setBulkGrades] = useState<Array<{
    studentUsername: string;
    studentName: string;
    points: string;
    feedback: string;
  }>>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  const fetchInitialData = async () => {
    setLoading(true);
    try {
  
      
      // Fetch all necessary data
      await Promise.all([
        fetchClasses(),
        fetchAssignments(),
        fetchStudents(),
        fetchGrades()
      ]);
      

    } catch (err) {
      console.error('Error in fetchInitialData:', err);
      setError('Gagal mengambil data. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
          const response = await classApi.getAll();
    if (response.success) {
      setClasses(response.classes || []);
      } else {
        console.error('Failed to fetch classes:', response.error);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
          const response = await assignmentApi.getAll();
    if (response.success) {
      setAssignments(response.assignments || []);
      } else {
        console.error('Failed to fetch assignments:', response.error);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students...');
      const response = await studentApi.getAll();
      console.log('Students API response:', response);
      if (response.success) {
        setStudents(response.students || []);
        console.log('Students set to state:', response.students);
      } else {
        console.error('Failed to fetch students:', response.error);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchGrades = async () => {
    try {
      console.log('Fetching all grades...');
      
      const response = await gradeApi.getAll();
      console.log('Grades API response:', response);
      
      if (response.success) {
        const gradesData = response.grades || [];
        
        // Enhance grades data with additional calculated fields
        const enhancedGrades = gradesData.map((grade: any) => {
          const assignment = assignments.find(a => a.id === grade.assignmentId);
          const maxPoints = assignment?.maxPoints || 100;
          const percentage = (grade.points / maxPoints) * 100;
          const status = getGradeStatus(grade.points, maxPoints);
          
          // Get student name from the grade data or from students list
          let studentName = grade.studentName;
          if (!studentName) {
            const student = students.find(s => s.username === grade.studentUsername);
            studentName = student?.fullName || grade.studentUsername;
          }
          
          return {
            ...grade,
            studentName,
            maxPoints,
            percentage: Math.round(percentage),
            status
          };
        });
        
        console.log('Setting enhanced grades to state:', enhancedGrades);
        setGrades(enhancedGrades);
      } else {
        console.error('Failed to fetch grades:', response.error);
        setError(response.error || 'Gagal mengambil data nilai');
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Terjadi kesalahan saat mengambil data nilai');
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    setSelectedAssignmentId('all'); // Reset assignment filter when class changes
  };

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignmentId(value);
  };

  const handleExportGrades = async () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = filteredGrades.map((grade, index) => {
        const assignment = assignments.find(a => a.id === grade.assignmentId);
        const student = students.find(s => s.username === grade.studentUsername);
        
        return {
          'No': index + 1,
          'Nama Siswa': grade.studentName,
          'Username': grade.studentUsername,
          'Kelas': getStudentClassName(grade.studentUsername, grade.assignmentId),
          'Tugas': getAssignmentName(grade.assignmentId),
          'Nilai': grade.points,
          'Nilai Maksimal': assignment?.maxPoints || 100,
          'Persentase': assignment?.maxPoints ? Math.round((grade.points / assignment.maxPoints) * 100) : Math.round(grade.points),
          'Feedback': grade.feedback || '-',
          'Tanggal Dinilai': formatDate(grade.gradedAt),
          'Tanggal Deadline': assignment?.dueDate ? formatDate(assignment.dueDate) : '-'
        };
      });

      if (exportData.length === 0) {
        alert('Tidak ada data nilai untuk diekspor');
        return;
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 20 },  // Nama Siswa
        { wch: 15 },  // Username
        { wch: 10 },  // Kelas
        { wch: 25 },  // Tugas
        { wch: 8 },   // Nilai
        { wch: 12 },  // Nilai Maksimal
        { wch: 10 },  // Persentase
        { wch: 30 },  // Feedback
        { wch: 15 },  // Tanggal Dinilai
        { wch: 15 }   // Tanggal Deadline
      ];
      worksheet['!cols'] = columnWidths;

      // Add header styling
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      // Format percentage column
      for (let row = 1; row <= exportData.length; row++) {
        const percentageCell = XLSX.utils.encode_cell({ r: row, c: 7 }); // Column H (Persentase)
        if (worksheet[percentageCell]) {
          worksheet[percentageCell].z = '0"%"'; // Format as percentage
        }
      }

      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `Laporan_Nilai_${dateStr}`;
      
      if (selectedClassId !== 'all') {
        const className = getClassName(selectedClassId);
        filename += `_${className.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      
      if (selectedAssignmentId !== 'all') {
        const assignmentName = getAssignmentName(selectedAssignmentId);
        filename += `_${assignmentName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Nilai');

      // Add summary sheet
      const summaryData = [
        { 'Informasi': 'Total Nilai', 'Nilai': exportData.length },
        { 'Informasi': 'Rata-rata', 'Nilai': exportData.length > 0 ? Math.round(exportData.reduce((sum, item) => sum + item.Nilai, 0) / exportData.length * 100) / 100 : 0 },
        { 'Informasi': 'Nilai Tertinggi', 'Nilai': exportData.length > 0 ? Math.max(...exportData.map(item => item.Nilai)) : 0 },
        { 'Informasi': 'Nilai Terendah', 'Nilai': exportData.length > 0 ? Math.min(...exportData.map(item => item.Nilai)) : 0 },
        { 'Informasi': 'Tanggal Ekspor', 'Nilai': new Date().toLocaleDateString('id-ID') },
        { 'Informasi': 'Filter Kelas', 'Nilai': selectedClassId === 'all' ? 'Semua Kelas' : getClassName(selectedClassId) },
        { 'Informasi': 'Filter Tugas', 'Nilai': selectedAssignmentId === 'all' ? 'Semua Tugas' : getAssignmentName(selectedAssignmentId) }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
      
      // Style summary sheet headers
      ['A1', 'B1'].forEach(cell => {
        if (summarySheet[cell]) {
          summarySheet[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      });

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

      // Write and download file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      alert(`Data nilai berhasil diekspor! File: ${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting grades:', error);
      alert('Terjadi kesalahan saat mengekspor data nilai');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      assignmentId: selectedAssignmentId !== 'all' ? selectedAssignmentId : '',
      studentUsername: '',
      points: '',
      feedback: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (grade: Grade) => {
    setFormData({
      id: grade.id,
      assignmentId: grade.assignmentId,
      studentUsername: grade.studentUsername,
      points: grade.points.toString(),
      feedback: grade.feedback
    });
    setShowEditModal(true);
  };

  const handleOpenDetailModal = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDetailModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.assignmentId || !formData.studentUsername || !formData.points) {
      setError('Tugas, siswa, dan nilai wajib diisi');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await gradeApi.create(
        formData.assignmentId,
        formData.studentUsername,
        parseFloat(formData.points),
        formData.feedback
      );
      
      if (response.success) {
        await fetchGrades();
        setShowAddModal(false);
        
        // Dispatch event for auto-complete check
        const gradeUpdateEvent = new CustomEvent('gradeUpdated', {
          detail: { assignmentId: formData.assignmentId }
        });
        window.dispatchEvent(gradeUpdateEvent);
        
        setFormData({ id: '', assignmentId: '', studentUsername: '', points: '', feedback: '' });
        showNotification('success', 'Nilai berhasil ditambahkan!');
      } else {
        setError(response.error || 'Gagal menambahkan nilai');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menambah nilai');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.points) {
      setError('Nilai wajib diisi');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await gradeApi.update(
        formData.id,
        parseFloat(formData.points),
        formData.feedback
      );
      
      if (response.success) {
        await fetchGrades();
        setShowEditModal(false);
        
        // Dispatch event for auto-complete check
        const gradeUpdateEvent = new CustomEvent('gradeUpdated', {
          detail: { assignmentId: formData.assignmentId }
        });
        window.dispatchEvent(gradeUpdateEvent);
        
        showNotification('success', 'Nilai berhasil diperbarui!');
      } else {
        setError(response.error || 'Gagal mengubah nilai');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengubah nilai');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    setError('');
    setIsDeleting(true);
    try {
      const response = await gradeApi.delete(id);
      
      if (response.success) {
        await fetchGrades();
        setDeleteConfirmId(null);
        showNotification('success', 'Nilai berhasil dihapus!');
      } else {
        setError(response.error || 'Gagal menghapus nilai');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghapus nilai');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAssignmentName = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    return assignment ? assignment.title : 'Tugas tidak ditemukan';
  };

  const getClassFromAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      return getClassName(assignment.classId);
    }
    return 'Kelas tidak ditemukan';
  };

  const getClassName = (classId: string) => {
    console.log('Looking for class with ID:', classId);
    console.log('Available classes:', classes);
    
    if (!classId) {
      console.log('No classId provided');
      return 'ID kelas tidak valid';
    }
    
    if (!classes || classes.length === 0) {
      console.log('No classes available');
      return 'Data kelas tidak tersedia';
    }
    
    const cls = classes.find(c => c.id === classId);
    console.log('Found class:', cls);
    
    if (!cls) {
      console.log(`Class with ID ${classId} not found`);
      console.log('Available class IDs:', classes.map(c => c.id));
      return 'Kelas tidak ditemukan';
    }
    
    return cls.name || 'Nama kelas tidak tersedia';
  };

  const getStudentClassName = (studentUsername: string, assignmentId?: string) => {
    console.log('Getting class name for student:', studentUsername, 'assignmentId:', assignmentId);
    
    if (!studentUsername) {
      return 'Username tidak valid';
    }
    
    // Pertama coba cari dari data siswa
    if (students && students.length > 0) {
      const student = students.find(s => s.username === studentUsername);
      if (student && student.classId) {
        const className = getClassName(student.classId);
        if (className !== 'Kelas tidak ditemukan') {
          return className;
        }
      }
    }
    
    // Jika tidak ditemukan dari data siswa, coba dari assignment
    if (assignmentId) {
      const classFromAssignment = getClassFromAssignment(assignmentId);
      if (classFromAssignment !== 'Kelas tidak ditemukan') {
        return classFromAssignment;
      }
    }
    
    // Coba cari dari grades yang ada
    const grade = grades.find(g => g.studentUsername === studentUsername);
    if (grade && grade.assignmentId) {
      const classFromAssignment = getClassFromAssignment(grade.assignmentId);
      if (classFromAssignment !== 'Kelas tidak ditemukan') {
        return classFromAssignment;
      }
    }
    
    // Fallback: tampilkan informasi yang tersedia
    const student = students.find(s => s.username === studentUsername);
    if (student && student.classId) {
      return `Kelas ID: ${student.classId}`;
    }
    
    return 'Kelas tidak ditemukan';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const filteredGrades = grades.filter(grade => {
    // Filter berdasarkan search query
    const matchesSearch = !searchQuery || 
      grade.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.studentUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAssignmentName(grade.assignmentId).toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter berdasarkan kelas yang dipilih
    let matchesClass = true;
    if (selectedClassId !== 'all') {
      // Cari assignment untuk mendapatkan classId
      const assignment = assignments.find(a => a.id === grade.assignmentId);
              if (assignment) {
          matchesClass = assignment.classId === selectedClassId;
        } else {
          // Jika assignment tidak ditemukan, coba dari data siswa
          const student = students.find(s => s.username === grade.studentUsername);
          if (student) {
            matchesClass = student.classId === selectedClassId;
          } else {
            matchesClass = false;
          }
        }
    }
    
    // Filter berdasarkan assignment yang dipilih
    const matchesAssignment = selectedAssignmentId === 'all' || grade.assignmentId === selectedAssignmentId;
    
    return matchesSearch && matchesClass && matchesAssignment;
  }).sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'student':
        aValue = a.studentName.toLowerCase();
        bValue = b.studentName.toLowerCase();
        break;
      case 'assignment':
        aValue = getAssignmentName(a.assignmentId).toLowerCase();
        bValue = getAssignmentName(b.assignmentId).toLowerCase();
        break;
      case 'points':
        aValue = a.points;
        bValue = b.points;
        break;
      case 'date':
        aValue = new Date(a.gradedAt).getTime();
        bValue = new Date(b.gradedAt).getTime();
        break;
      default:
        aValue = new Date(a.gradedAt).getTime();
        bValue = new Date(b.gradedAt).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGrades = filteredGrades.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setCurrentPendingPage(1);
  }, [searchQuery, selectedClassId, selectedAssignmentId, sortBy, sortOrder]);

  const filteredAssignments = assignments.filter(assignment => {
    if (selectedClassId === 'all') return true;
    return assignment.classId === selectedClassId;
  });

  const filteredStudents = students.filter(student => {
    if (selectedClassId === 'all') return true;
    return student.classId === selectedClassId;
  });

  // Enhanced statistics
  const getEnhancedStats = () => {
    const total = filteredGrades.length;
    const averageScore = total > 0 
      ? filteredGrades.reduce((sum, grade) => sum + grade.points, 0) / total 
      : 0;
    const highestScore = total > 0 
      ? Math.max(...filteredGrades.map(grade => grade.points)) 
      : 0;
    const lowestScore = total > 0 
      ? Math.min(...filteredGrades.map(grade => grade.points)) 
      : 0;
    
    const excellentCount = filteredGrades.filter(g => g.status === 'excellent').length;
    const goodCount = filteredGrades.filter(g => g.status === 'good').length;
    const fairCount = filteredGrades.filter(g => g.status === 'fair').length;
    const poorCount = filteredGrades.filter(g => g.status === 'poor').length;
    
    const averagePercentage = total > 0 
      ? filteredGrades.reduce((sum, grade) => sum + (grade.percentage || 0), 0) / total 
      : 0;

    return {
      total,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      excellentCount,
      goodCount,
      fairCount,
      poorCount,
      averagePercentage: Math.round(averagePercentage),
      passRate: total > 0 ? Math.round(((excellentCount + goodCount + fairCount) / total) * 100) : 0,
      trend: {
        up: excellentCount + goodCount,
        down: poorCount
      }
    };
  };

  // Calculate statistics
  // const averageScore = filteredGrades.length > 0 
  //   ? filteredGrades.reduce((sum, grade) => sum + grade.points, 0) / filteredGrades.length 
  //   : 0;
  
  // const highestScore = filteredGrades.length > 0 
  //   ? Math.max(...filteredGrades.map(grade => grade.points)) 
  //   : 0;
    
  // const lowestScore = filteredGrades.length > 0 
  //   ? Math.min(...filteredGrades.map(grade => grade.points)) 
  //   : 0;

  // Enhanced helper functions
  const getGradeStatus = (points: number, maxPoints: number = 100): 'excellent' | 'good' | 'fair' | 'poor' => {
    const percentage = (points / maxPoints) * 100;
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 60) return 'fair';
    return 'poor';
  };

  const getGradeStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Sangat Baik';
      case 'good':
        return 'Baik';
      case 'fair':
        return 'Cukup';
      case 'poor':
        return 'Perlu Perbaikan';
      default:
        return 'N/A';
    }
  };

  const getGradeStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Star className="w-4 h-4" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4" />;
      case 'fair':
        return <Activity className="w-4 h-4" />;
      case 'poor':
        return <Warning className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Bulk operations
  const handleSelectAll = () => {
    const currentPageGradeIds = paginatedGrades.map(g => g.id);
    const allCurrentPageSelected = currentPageGradeIds.every(id => selectedGrades.includes(id));
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      setSelectedGrades(prev => prev.filter(id => !currentPageGradeIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedGrades(prev => {
        const newSelection = [...prev];
        currentPageGradeIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleSelectGrade = (gradeId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gradeId) 
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedGrades.length === 0) return;
    
    setIsBulkDeleting(true);
    try {
      const deletePromises = selectedGrades.map(id => gradeApi.delete(id));
      await Promise.all(deletePromises);
      
      showNotification('success', `${selectedGrades.length} nilai berhasil dihapus!`);
      setSelectedGrades([]);
      await fetchGrades();
    } catch (error) {
      showNotification('error', 'Gagal menghapus beberapa nilai');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkActions(false);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchInitialData();
    showNotification('success', 'Data berhasil diperbarui!');
    setIsRefreshing(false);
  };

  const getPendingGrades = () => {
    const pendingList: Array<{
      studentUsername: string;
      studentName: string;
      studentClassId: string;
      assignmentId: string;
      assignmentTitle: string;
      assignmentClassName: string;
    }> = [];
    
    // Filter assignments based on selected filters
    const relevantAssignments = assignments.filter(assignment => {
      if (selectedClassId !== 'all') {
        return assignment.classId === selectedClassId;
      }
      if (selectedAssignmentId !== 'all') {
        return assignment.id === selectedAssignmentId;
      }
      return true;
    });
    
    // For each assignment, check which students haven't been graded
    relevantAssignments.forEach(assignment => {
      // Get students for this assignment's class
      const classStudents = students.filter(student => student.classId === assignment.classId);
      
      // Get existing grades for this assignment
      const assignmentGrades = grades.filter(grade => grade.assignmentId === assignment.id);
      const gradedStudentUsernames = new Set(assignmentGrades.map(grade => grade.studentUsername));
      
      // Find students who haven't been graded yet
      const ungradedStudents = classStudents.filter(student => 
        !gradedStudentUsernames.has(student.username)
      );
      
      // Add to pending list
      ungradedStudents.forEach(student => {
        pendingList.push({
          studentUsername: student.username,
          studentName: student.fullName,
          studentClassId: student.classId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          assignmentClassName: getClassName(assignment.classId)
        });
      });
    });
    
    return pendingList;
  };

  // Get pending grades and pagination calculations
  const pendingGrades = getPendingGrades();
  const totalPendingPages = Math.ceil(pendingGrades.length / itemsPerPendingPage);
  const startPendingIndex = (currentPendingPage - 1) * itemsPerPendingPage;
  const endPendingIndex = startPendingIndex + itemsPerPendingPage;
  const paginatedPendingGrades = pendingGrades.slice(startPendingIndex, endPendingIndex);

  const handleQuickGrade = (pendingGrade: any) => {
    // Pre-fill form with pending grade data
    setFormData({
      id: '',
      assignmentId: pendingGrade.assignmentId,
      studentUsername: pendingGrade.studentUsername,
      points: '',
      feedback: ''
    });
    setShowAddModal(true);
  };

  // Bulk grading functions
  const handleOpenBulkModal = () => {
    setBulkAssignmentId(selectedAssignmentId !== 'all' ? selectedAssignmentId : '');
    setBulkGrades([]);
    setShowBulkModal(true);
  };

  const handleBulkAssignmentChange = (assignmentId: string) => {
    setBulkAssignmentId(assignmentId);
    
    if (assignmentId) {
      // Get assignment to find its class
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        // Get students for this assignment's class
        const classStudents = students.filter(s => s.classId === assignment.classId);
        
        // Get existing grades for this assignment
        const existingGrades = grades.filter(g => g.assignmentId === assignmentId);
        const gradedStudentUsernames = new Set(existingGrades.map(g => g.studentUsername));
        
        // Filter out students who already have grades
        const ungradedStudents = classStudents.filter(s => !gradedStudentUsernames.has(s.username));
        
        // Initialize bulk grades array
        const initialBulkGrades = ungradedStudents.map(student => ({
          studentUsername: student.username,
          studentName: student.fullName,
          points: '',
          feedback: ''
        }));
        
        setBulkGrades(initialBulkGrades);
      }
    } else {
      setBulkGrades([]);
    }
  };

  const handleBulkGradeChange = (index: number, field: 'points' | 'feedback', value: string) => {
    setBulkGrades(prev => prev.map((grade, i) => 
      i === index ? { ...grade, [field]: value } : grade
    ));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkAssignmentId) {
      showNotification('error', 'Pilih tugas terlebih dahulu');
      return;
    }

    // Filter out empty grades
    const validGrades = bulkGrades.filter(grade => grade.points.trim() !== '');
    
    if (validGrades.length === 0) {
      showNotification('error', 'Masukkan minimal satu nilai');
      return;
    }

    // Validate points
    const invalidGrades = validGrades.filter(grade => {
      const points = parseFloat(grade.points);
      return isNaN(points) || points < 0 || points > 100;
    });

    if (invalidGrades.length > 0) {
      showNotification('error', 'Semua nilai harus berupa angka antara 0-100');
      return;
    }

    setIsBulkSubmitting(true);
    
    try {
      // Submit each grade individually using URLSearchParams (CORS compliant)
      const submitPromises = validGrades.map(async (grade) => {
        const response = await gradeApi.create(
          bulkAssignmentId,
          grade.studentUsername,
          parseFloat(grade.points),
          grade.feedback
        );
        return response;
      });

      const results = await Promise.all(submitPromises);
      
      // Check if all submissions were successful
      const failedSubmissions = results.filter(result => !result.success);
      
      if (failedSubmissions.length === 0) {
        showNotification('success', `${validGrades.length} nilai berhasil disimpan!`);
        
        // Dispatch event for auto-complete check
        const gradeUpdateEvent = new CustomEvent('gradeUpdated', {
          detail: { assignmentId: bulkAssignmentId }
        });
        window.dispatchEvent(gradeUpdateEvent);
        
        setShowBulkModal(false);
        setBulkGrades([]);
        setBulkAssignmentId('');
        await fetchGrades(); // Refresh grades data
      } else {
        showNotification('error', `${failedSubmissions.length} dari ${validGrades.length} nilai gagal disimpan`);
      }
    } catch (error) {
      console.error('Error in bulk submit:', error);
      showNotification('error', 'Terjadi kesalahan saat menyimpan nilai');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="h-8 bg-industrial-light border-2 border-industrial-black w-64"></div>
            <div className="h-4 bg-industrial-light border-2 border-industrial-black w-96"></div>
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="industrial">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-industrial-light w-1/2"></div>
                    <div className="h-6 bg-industrial-light w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Table Skeleton */}
          <Card variant="industrial">
            <CardContent className="p-6">
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border-2 border-industrial-black bg-industrial-white">
                    <div className="w-10 h-10 bg-industrial-light border-2 border-industrial-black"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-industrial-light w-1/4"></div>
                      <div className="h-3 bg-industrial-light w-1/3"></div>
                    </div>
                    <div className="h-6 bg-industrial-light border-2 border-industrial-black w-20"></div>
                    <div className="h-6 bg-industrial-light border-2 border-industrial-black w-24"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Notification - Industrial Minimalism */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-4 right-4 z-50 p-4 border-2 shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${
                notification.type === 'success' 
                  ? 'bg-industrial-white border-industrial-black text-industrial-black' 
                  : 'bg-industrial-white border-industrial-red text-industrial-red'
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-industrial-black" />
                ) : (
                  <Warning className="w-5 h-5 text-industrial-red" />
                )}
                <span className="font-semibold">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-industrial-text-secondary hover:text-industrial-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - Industrial Minimalism */}
        <AnimatedContainer variant={fadeInUp}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1">
                Manajemen Nilai
              </h1>
              <p className="text-industrial-text-secondary mt-2 text-sm sm:text-base industrial-body">Kelola penilaian dan lihat progres siswa dengan analitik mendalam</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {selectedGrades.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="industrial-secondary" className="px-3 py-1 text-xs sm:text-sm">
                    {selectedGrades.length} dipilih
                  </Badge>
                  <Button
                    variant="industrial-danger"
                    size="sm"
                    onClick={() => setShowBulkActions(true)}
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                    Hapus Terpilih
                  </Button>
                </motion.div>
              )}
              <Button 
                variant="industrial-secondary" 
                size="sm"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <ArrowClockwise className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Memperbarui...' : 'Refresh'}
              </Button>
              <Button 
                variant="industrial-secondary" 
                size="sm"
                className="flex gap-1 items-center text-xs sm:text-sm"
                onClick={handleExportGrades}
                disabled={isExporting || filteredGrades.length === 0}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
              </Button>
              <Button 
                variant="industrial-secondary"
                onClick={handleOpenBulkModal} 
                className="flex gap-1 items-center text-xs sm:text-sm"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Bulk Nilai</span>
              </Button>
              <Button 
                onClick={handleOpenAddModal} 
                variant="industrial-primary"
                className="flex gap-1 items-center text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Input Nilai Baru</span>
              </Button>
            </div>
          </div>
        </AnimatedContainer>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-industrial-white border-2 border-industrial-red px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-industrial-red" />
              <span className="text-industrial-black font-semibold">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Enhanced Statistics Cards - Industrial Minimalism */}
        <AnimatedContainer variant={slideInFromLeft} delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Total Nilai</p>
                    <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().total}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Rata-rata</p>
                    <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().averageScore}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Nilai Tertinggi</p>
                    <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().highestScore}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                    <TrendUp className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Sangat Baik</p>
                    <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().excellentCount}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Tingkat Lulus</p>
                    <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().passRate}%</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Perlu Perbaikan</p>
                    <p className="text-xl sm:text-2xl font-bold text-industrial-red industrial-mono">{getEnhancedStats().poorCount}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-red border-2 border-industrial-red flex items-center justify-center">
                    <Warning className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedContainer>

        {/* Enhanced Controls and Filters - Industrial Minimalism */}
        <AnimatedContainer variant={fadeInUp} delay={0.3}>
          <Card variant="industrial">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
                {/* Class filter */}
                <div>
                  <label htmlFor="class-filter" className="text-xs sm:text-sm font-semibold text-industrial-black mb-2 block">
                    Filter Kelas
                  </label>
                  <select 
                    id="class-filter"
                    className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                  >
                    <option value="all">Semua Kelas</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignment filter */}
                <div>
                  <label htmlFor="assignment-filter" className="text-xs sm:text-sm font-semibold text-industrial-black mb-2 block">
                    Filter Tugas
                  </label>
                  <select 
                    id="assignment-filter"
                    className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                    value={selectedAssignmentId}
                    onChange={(e) => handleAssignmentChange(e.target.value)}
                  >
                    <option value="all">Semua Tugas</option>
                    {filteredAssignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label htmlFor="search" className="text-xs sm:text-sm font-semibold text-industrial-black mb-2 block">
                    Cari Nilai
                  </label>
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-3 h-3 sm:w-4 sm:h-4" />
                    <Input
                      variant="industrial"
                      id="search"
                      placeholder="Cari siswa atau tugas..."
                      className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort by */}
                <div>
                  <label htmlFor="sort-by" className="text-xs sm:text-sm font-semibold text-industrial-black mb-2 block">
                    Urutkan Berdasarkan
                  </label>
                  <select 
                    id="sort-by"
                    className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'student' | 'assignment' | 'points' | 'date')}
                  >
                    <option value="date">Tanggal Terbaru</option>
                    <option value="student">Nama Siswa</option>
                    <option value="assignment">Nama Tugas</option>
                    <option value="points">Nilai</option>
                  </select>
                </div>

                {/* Sort order */}
                <div>
                  <label htmlFor="sort-order" className="text-xs sm:text-sm font-semibold text-industrial-black mb-2 block">
                    Urutan
                  </label>
                  <select 
                    id="sort-order"
                    className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">Menurun</option>
                    <option value="asc">Menaik</option>
                  </select>
                </div>
              </div>

              {/* Select All and Results Count */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-industrial-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={paginatedGrades.length > 0 && paginatedGrades.every(g => selectedGrades.includes(g.id))}
                      onChange={handleSelectAll}
                      className="w-4 h-4 border-2 border-industrial-black text-industrial-steel focus:ring-industrial-steel"
                    />
                    <label htmlFor="select-all" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Pilih Semua (Halaman Ini)
                    </label>
                  </div>
                  <div className="text-xs sm:text-sm text-industrial-text-secondary">
                    Menampilkan {filteredGrades.length} dari {grades.length} nilai
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Tabs - Industrial Minimalism */}
        <div className="flex border-b-2 border-industrial-black bg-industrial-white">
          <button
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'grades'
                ? 'border-industrial-black text-industrial-black bg-industrial-light'
                : 'border-transparent text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
            }`}
            onClick={() => setActiveTab('grades')}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              Daftar Nilai ({filteredGrades.length})
            </div>
          </button>
          <button
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-industrial-black text-industrial-black bg-industrial-light'
                : 'border-transparent text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              Belum Dinilai ({pendingGrades.length})
            </div>
          </button>
          <button
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-industrial-black text-industrial-black bg-industrial-light'
                : 'border-transparent text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            <div className="flex items-center gap-2">
              <ChartBar className="w-3 h-3 sm:w-4 sm:h-4" />
              Analitik Mendalam
            </div>
          </button>
        </div>

        {activeTab === 'grades' && (
          <AnimatedContainer variant={fadeInUp} delay={0.4}>
            <Card variant="industrial" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="industrial-table w-full">
                  <thead>
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedGrades.length > 0 && paginatedGrades.every(g => selectedGrades.includes(g.id))}
                          onChange={handleSelectAll}
                          className="w-4 h-4 border-2 border-industrial-black text-industrial-steel focus:ring-industrial-steel"
                        />
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Siswa</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Tugas</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Nilai</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Feedback</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Tanggal</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-industrial-white text-xs sm:text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedGrades.length > 0 ? (
                        paginatedGrades.map((grade, index) => (
                          <motion.tr 
                            key={grade.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`transition-colors ${
                              selectedGrades.includes(grade.id) ? 'bg-industrial-light' : ''
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <input
                                type="checkbox"
                                checked={selectedGrades.includes(grade.id)}
                                onChange={() => handleSelectGrade(grade.id)}
                                className="w-4 h-4 border-2 border-industrial-black text-industrial-steel focus:ring-industrial-steel"
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div>
                                <div className="font-semibold text-industrial-black text-xs sm:text-sm">{grade.studentName}</div>
                                <div className="text-xs sm:text-sm text-industrial-text-secondary">
                                  {grade.studentUsername} • {getStudentClassName(grade.studentUsername, grade.assignmentId)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="max-w-xs">
                                <div className="font-semibold text-industrial-black text-xs sm:text-sm truncate">
                                  {getAssignmentName(grade.assignmentId)}
                                </div>
                                <div className="text-xs sm:text-sm text-industrial-text-secondary">
                                  Max: {grade.maxPoints || 100} poin
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{grade.points}</span>
                                <div className="text-xs sm:text-sm text-industrial-text-secondary">
                                  <div>{grade.percentage}%</div>
                                  <div>/{grade.maxPoints || 100}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <Badge 
                                variant={grade.status === 'excellent' ? 'industrial-success' : grade.status === 'good' ? 'industrial-primary' : grade.status === 'poor' ? 'industrial-danger' : 'industrial-warning'}
                                className="text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  {getGradeStatusIcon(grade.status || 'fair')}
                                  <span>{getGradeStatusText(grade.status || 'fair')}</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="max-w-xs">
                                <p className="text-xs sm:text-sm text-industrial-text-secondary break-words">
                                  {grade.feedback || '-'}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-industrial-text-secondary">
                                {formatDate(grade.gradedAt)}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="industrial-secondary"
                                  size="sm"
                                  onClick={() => handleOpenDetailModal(grade)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="industrial-secondary"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(grade)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="industrial-danger"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(grade.id)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                                <FileText className="w-8 h-8 text-industrial-white" />
                              </div>
                              <div>
                                <p className="text-industrial-black font-semibold text-sm sm:text-base">
                                  {searchQuery ? 'Tidak ada nilai yang sesuai dengan pencarian' : 'Belum ada nilai'}
                                </p>
                                <p className="text-industrial-text-secondary text-xs sm:text-sm mt-1">
                                  {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Mulai tambahkan nilai untuk siswa'}
                                </p>
                              </div>
                              {!searchQuery && (
                                <Button onClick={handleOpenAddModal} variant="industrial-primary" className="mt-2 text-xs sm:text-sm">
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  Tambah Nilai Pertama
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {filteredGrades.length > itemsPerPage && (
                <div className="border-t-2 border-industrial-black p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-industrial-text-secondary">Items per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border-2 border-industrial-black bg-industrial-white px-2 py-1 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-industrial-text-secondary">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredGrades.length)} dari {filteredGrades.length} nilai
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="industrial-secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <CaretLeft className="w-4 h-4" />
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
                              className="h-8 min-w-8 px-2 text-xs sm:text-sm"
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
                        className="h-8 w-8 p-0"
                      >
                        <CaretRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </AnimatedContainer>
        )}

        {activeTab === 'pending' && (
          <AnimatedContainer variant={fadeInUp} delay={0.4}>
            <Card variant="industrial" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="industrial-table w-full">
                  <thead>
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Siswa</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Tugas</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Kelas</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-industrial-white text-xs sm:text-sm">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-industrial-white text-xs sm:text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedPendingGrades.length > 0 ? (
                        paginatedPendingGrades.map((student, index) => (
                          <motion.tr 
                            key={`${student.studentUsername}-${student.assignmentId}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div>
                                <div className="font-semibold text-industrial-black text-xs sm:text-sm">{student.studentName}</div>
                                <div className="text-xs sm:text-sm text-industrial-text-secondary">
                                  {student.studentUsername}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="max-w-xs">
                                <div className="font-semibold text-industrial-black text-xs sm:text-sm truncate">
                                  {student.assignmentTitle}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="max-w-xs">
                                <div className="font-semibold text-industrial-black text-xs sm:text-sm truncate">
                                  {student.assignmentClassName}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <Badge variant="industrial-warning" className="text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Belum Dinilai</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                              <Button
                                variant="industrial-primary"
                                size="sm"
                                onClick={() => handleQuickGrade(student)}
                                className="text-xs sm:text-sm"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Nilai Sekarang
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-industrial-white" />
                              </div>
                              <div>
                                <p className="text-industrial-black font-semibold text-sm sm:text-base">
                                  Semua Siswa Sudah Dinilai!
                                </p>
                                <p className="text-industrial-text-secondary text-xs sm:text-sm mt-1">
                                  {selectedAssignmentId !== 'all' 
                                    ? `Semua siswa sudah mendapat nilai untuk tugas "${getAssignmentName(selectedAssignmentId)}"` 
                                    : selectedClassId !== 'all'
                                    ? `Semua siswa di kelas "${getClassName(selectedClassId)}" sudah dinilai`
                                    : 'Semua siswa untuk semua tugas sudah mendapat nilai'
                                  }
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls for Pending */}
              {pendingGrades.length > itemsPerPendingPage && (
                <div className="border-t-2 border-industrial-black p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-industrial-text-secondary">Items per page:</span>
                      <select
                        value={itemsPerPendingPage}
                        onChange={(e) => {
                          setItemsPerPendingPage(Number(e.target.value));
                          setCurrentPendingPage(1);
                        }}
                        className="border-2 border-industrial-black bg-industrial-white px-2 py-1 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-industrial-text-secondary">
                        Menampilkan {startPendingIndex + 1}-{Math.min(endPendingIndex, pendingGrades.length)} dari {pendingGrades.length} belum dinilai
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="industrial-secondary"
                        size="sm"
                        onClick={() => setCurrentPendingPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPendingPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <CaretLeft className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPendingPages) }, (_, i) => {
                          let pageNum;
                          if (totalPendingPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPendingPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPendingPage >= totalPendingPages - 2) {
                            pageNum = totalPendingPages - 4 + i;
                          } else {
                            pageNum = currentPendingPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPendingPage === pageNum ? "industrial-primary" : "industrial-secondary"}
                              size="sm"
                              onClick={() => setCurrentPendingPage(pageNum)}
                              className="h-8 min-w-8 px-2 text-xs sm:text-sm"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="industrial-secondary"
                        size="sm"
                        onClick={() => setCurrentPendingPage(prev => Math.min(totalPendingPages, prev + 1))}
                        disabled={currentPendingPage === totalPendingPages}
                        className="h-8 w-8 p-0"
                      >
                        <CaretRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </AnimatedContainer>
        )}

        {activeTab === 'analytics' && (
          <AnimatedContainer variant={fadeInUp} delay={0.4}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card variant="industrial" className="lg:col-span-2">
                <CardHeader className="pb-4 border-b-2 border-industrial-black">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
                    <ChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
                    Distribusi Nilai
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">
                    Analisis performa akademik siswa berdasarkan kategori nilai
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-industrial-white border-2 border-industrial-black">
                      <div className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().excellentCount}</div>
                      <div className="text-xs sm:text-sm text-industrial-black font-semibold mt-1">Sangat Baik</div>
                      <div className="text-xs text-industrial-text-secondary">85% - 100%</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-industrial-white border-2 border-industrial-steel">
                      <div className="text-xl sm:text-2xl font-bold text-industrial-steel industrial-mono">{getEnhancedStats().goodCount}</div>
                      <div className="text-xs sm:text-sm text-industrial-black font-semibold mt-1">Baik</div>
                      <div className="text-xs text-industrial-text-secondary">70% - 84%</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-industrial-white border-2 border-industrial-black">
                      <div className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{getEnhancedStats().fairCount}</div>
                      <div className="text-xs sm:text-sm text-industrial-black font-semibold mt-1">Cukup</div>
                      <div className="text-xs text-industrial-text-secondary">60% - 69%</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-industrial-white border-2 border-industrial-red">
                      <div className="text-xl sm:text-2xl font-bold text-industrial-red industrial-mono">{getEnhancedStats().poorCount}</div>
                      <div className="text-xs sm:text-sm text-industrial-black font-semibold mt-1">Perlu Perbaikan</div>
                      <div className="text-xs text-industrial-text-secondary">{'< 60%'}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span className="text-industrial-black font-semibold">Tingkat Kelulusan</span>
                        <span className="font-semibold text-industrial-black industrial-mono">{getEnhancedStats().passRate}%</span>
                      </div>
                      <div className="w-full bg-industrial-light border-2 border-industrial-black h-3">
                        <div 
                          className="bg-industrial-black h-3 transition-all duration-1000" 
                          style={{ width: `${getEnhancedStats().passRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span className="text-industrial-black font-semibold">Rata-rata Persentase</span>
                        <span className="font-semibold text-industrial-black industrial-mono">{getEnhancedStats().averagePercentage}%</span>
                      </div>
                      <div className="w-full bg-industrial-light border-2 border-industrial-black h-3">
                        <div 
                          className="bg-industrial-steel h-3 transition-all duration-1000" 
                          style={{ width: `${getEnhancedStats().averagePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 sm:space-y-6">
                <Card variant="industrial">
                  <CardHeader className="pb-3 sm:pb-4 border-b-2 border-industrial-black">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
                      <TrendUp className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
                      Statistik Kunci
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-4">
                    <div className="flex justify-between items-center border-b-2 border-industrial-border pb-2">
                      <span className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Total Nilai</span>
                      <span className="font-bold text-base sm:text-lg text-industrial-black industrial-mono">{getEnhancedStats().total}</span>
                    </div>
                    <div className="flex justify-between items-center border-b-2 border-industrial-border pb-2">
                      <span className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Rata-rata</span>
                      <span className="font-bold text-base sm:text-lg text-industrial-steel industrial-mono">{getEnhancedStats().averageScore}</span>
                    </div>
                    <div className="flex justify-between items-center border-b-2 border-industrial-border pb-2">
                      <span className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Tertinggi</span>
                      <span className="font-bold text-base sm:text-lg text-industrial-black industrial-mono">{getEnhancedStats().highestScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Terendah</span>
                      <span className="font-bold text-base sm:text-lg text-industrial-red industrial-mono">{getEnhancedStats().lowestScore}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="industrial">
                  <CardHeader className="pb-3 sm:pb-4 border-b-2 border-industrial-black">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
                      Tren Performa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-industrial-border pb-2">
                        <div className="flex items-center gap-2">
                          <TrendUp className="w-3 h-3 sm:w-4 sm:h-4 text-industrial-black" />
                          <span className="text-xs sm:text-sm text-industrial-text-secondary font-semibold">Performa Baik</span>
                        </div>
                        <span className="font-semibold text-industrial-black text-sm sm:text-base industrial-mono">{getEnhancedStats().trend.up}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendDown className="w-3 h-3 sm:w-4 sm:h-4 text-industrial-red" />
                          <span className="text-xs sm:text-sm text-industrial-text-secondary font-semibold">Perlu Perhatian</span>
                        </div>
                        <span className="font-semibold text-industrial-red text-sm sm:text-base industrial-mono">{getEnhancedStats().trend.down}</span>
                      </div>
                    </div>
                    
                    {getEnhancedStats().trend.down > 0 && (
                      <div className="mt-4 p-3 bg-industrial-white border-2 border-industrial-red">
                        <div className="flex items-start gap-2">
                          <Warning className="w-3 h-3 sm:w-4 sm:h-4 text-industrial-red mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <p className="font-semibold text-industrial-red">Rekomendasi</p>
                            <p className="text-industrial-black">Ada {getEnhancedStats().trend.down} siswa yang perlu perhatian khusus</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* Add Modal - Industrial Minimalism */}
        {showAddModal && (
          <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center p-4 z-50">
            <Card variant="industrial" className="max-w-md w-full shadow-[0_8px_16px_rgba(0,0,0,0.3)] mx-4">
              <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Tambah Nilai Baru</CardTitle>
              </CardHeader>
              
              <form onSubmit={handleAddGrade}>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-2">
                    <label htmlFor="assignmentId" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Tugas *
                    </label>
                    <select
                      id="assignmentId"
                      className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                      value={formData.assignmentId}
                      onChange={(e) => handleSelectChange('assignmentId', e.target.value)}
                      required
                    >
                      <option value="">Pilih Tugas</option>
                      {filteredAssignments.map(assignment => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title} - {getClassName(assignment.classId)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="studentUsername" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Siswa *
                    </label>
                    <select
                      id="studentUsername"
                      className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                      value={formData.studentUsername}
                      onChange={(e) => handleSelectChange('studentUsername', e.target.value)}
                      required
                    >
                      <option value="">Pilih Siswa</option>
                      {filteredStudents.map(student => (
                        <option key={student.username} value={student.username}>
                          {student.fullName} ({getStudentClassName(student.username, formData.assignmentId)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="points" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Nilai *
                    </label>
                    <Input
                      variant="industrial"
                      id="points"
                      name="points"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.points}
                      onChange={handleInputChange}
                      placeholder="Masukkan nilai (0-100)"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="feedback" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Feedback
                    </label>
                    <textarea
                      id="feedback"
                      name="feedback"
                      rows={3}
                      className="flex w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm placeholder:text-industrial-text-muted focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      value={formData.feedback}
                      onChange={handleInputChange}
                      placeholder="Masukkan feedback untuk siswa"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t-2 border-industrial-black">
                    <Button 
                      type="button" 
                      variant="industrial-secondary" 
                      onClick={() => setShowAddModal(false)}
                      className="order-2 sm:order-1 h-9 text-xs sm:text-sm"
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      variant="industrial-primary"
                      className="order-1 sm:order-2 h-9 text-xs sm:text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        'Simpan'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}

        {/* Bulk Grading Modal - Industrial Minimalism */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center p-4 z-50">
            <Card variant="industrial" className="max-w-4xl w-full shadow-[0_8px_16px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Bulk Input Nilai</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary mt-1">Input nilai untuk beberapa siswa sekaligus</CardDescription>
              </CardHeader>
              
              <form onSubmit={handleBulkSubmit} className="flex flex-col h-full overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                  {/* Assignment Selection */}
                  <div className="space-y-2">
                    <label htmlFor="bulk-assignment" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Pilih Tugas *
                    </label>
                    <select
                      id="bulk-assignment"
                      className="flex h-9 sm:h-10 w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-industrial-steel"
                      value={bulkAssignmentId}
                      onChange={(e) => handleBulkAssignmentChange(e.target.value)}
                      required
                    >
                      <option value="">Pilih Tugas</option>
                      {assignments.map(assignment => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title} - {getClassName(assignment.classId)} (Max: {assignment.maxPoints || 100})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Students Table */}
                  {bulkGrades.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-industrial-black">
                        Daftar Siswa ({bulkGrades.length} siswa belum dinilai)
                      </label>
                      <div className="border-2 border-industrial-black overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="industrial-table w-full">
                            <thead>
                              <tr>
                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  No
                                </th>
                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  Nama Siswa
                                </th>
                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  Username
                                </th>
                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  Nilai (0-100) *
                                </th>
                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  Feedback
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkGrades.map((grade, index) => (
                                <tr key={grade.studentUsername}>
                                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-industrial-black industrial-mono">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                                    <div className="text-xs sm:text-sm font-semibold text-industrial-black">
                                      {grade.studentName}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-industrial-text-secondary">
                                    {grade.studentUsername}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                                    <Input
                                      variant="industrial"
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={grade.points}
                                      onChange={(e) => handleBulkGradeChange(index, 'points', e.target.value)}
                                      placeholder="0-100"
                                      className="w-20 sm:w-24 h-8 text-xs sm:text-sm"
                                    />
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                                    <Input
                                      variant="industrial"
                                      type="text"
                                      value={grade.feedback}
                                      onChange={(e) => handleBulkGradeChange(index, 'feedback', e.target.value)}
                                      placeholder="Feedback (opsional)"
                                      className="w-full h-8 text-xs sm:text-sm"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          type="button"
                          variant="industrial-secondary"
                          size="sm"
                          onClick={() => {
                            const points = prompt('Masukkan nilai yang sama untuk semua siswa (0-100):');
                            if (points && !isNaN(parseFloat(points)) && parseFloat(points) >= 0 && parseFloat(points) <= 100) {
                              setBulkGrades(prev => prev.map(grade => ({ ...grade, points })));
                            }
                          }}
                          className="text-xs sm:text-sm"
                        >
                          Set Nilai Sama
                        </Button>
                        <Button
                          type="button"
                          variant="industrial-secondary"
                          size="sm"
                          onClick={() => {
                            const feedback = prompt('Masukkan feedback yang sama untuk semua siswa:');
                            if (feedback) {
                              setBulkGrades(prev => prev.map(grade => ({ ...grade, feedback })));
                            }
                          }}
                          className="text-xs sm:text-sm"
                        >
                          Set Feedback Sama
                        </Button>
                        <Button
                          type="button"
                          variant="industrial-danger"
                          size="sm"
                          onClick={() => {
                            setBulkGrades(prev => prev.map(grade => ({ ...grade, points: '', feedback: '' })));
                          }}
                          className="text-xs sm:text-sm"
                        >
                          Reset Semua
                        </Button>
            </div>
          </div>
        )}

                  {bulkAssignmentId && bulkGrades.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-industrial-white" />
                      </div>
                      <p className="text-industrial-black font-semibold text-sm sm:text-base">Semua siswa sudah dinilai!</p>
                      <p className="text-xs sm:text-sm text-industrial-text-secondary">Pilih tugas lain untuk menilai siswa yang belum dinilai.</p>
                    </div>
                  )}
                </div>
                
                {/* Modal Footer */}
                <div className="border-t-2 border-industrial-black p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-industrial-text-secondary">
                      {bulkGrades.length > 0 && (
                        <span>
                          {bulkGrades.filter(g => g.points.trim() !== '').length} dari {bulkGrades.length} siswa akan dinilai
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        type="button" 
                        variant="industrial-secondary" 
                        onClick={() => setShowBulkModal(false)}
                        className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"
                        disabled={isBulkSubmitting}
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit"
                        variant="industrial-primary"
                        className="flex-1 sm:flex-none h-9 text-xs sm:text-sm"
                        disabled={isBulkSubmitting || bulkGrades.filter(g => g.points.trim() !== '').length === 0}
                      >
                        {isBulkSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                            <span>Menyimpan...</span>
                          </div>
                        ) : (
                          <>
                            <FloppyDisk className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Simpan Semua Nilai
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Edit Modal - Industrial Minimalism */}
        {showEditModal && (
          <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center p-4 z-50">
            <Card variant="industrial" className="max-w-md w-full shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
              <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Edit Nilai</CardTitle>
              </CardHeader>
              
              <form onSubmit={handleEditGrade}>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-industrial-black">Tugas</label>
                    <div className="p-2 bg-industrial-light border-2 border-industrial-border text-xs sm:text-sm text-industrial-black">
                      {getAssignmentName(formData.assignmentId)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-industrial-black">Siswa</label>
                    <div className="p-2 bg-industrial-light border-2 border-industrial-border text-xs sm:text-sm text-industrial-black">
                      {students.find(s => s.username === formData.studentUsername)?.fullName} 
                      ({getStudentClassName(formData.studentUsername, formData.assignmentId)})
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="points-edit" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Nilai *
                    </label>
                    <Input
                      variant="industrial"
                      id="points-edit"
                      name="points"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.points}
                      onChange={handleInputChange}
                      placeholder="Masukkan nilai (0-100)"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="feedback-edit" className="text-xs sm:text-sm font-semibold text-industrial-black">
                      Feedback
                    </label>
                    <textarea
                      id="feedback-edit"
                      name="feedback"
                      rows={3}
                      className="flex w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 text-xs sm:text-sm placeholder:text-industrial-text-muted focus:outline-none focus:border-industrial-steel focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      value={formData.feedback}
                      onChange={handleInputChange}
                      placeholder="Masukkan feedback untuk siswa"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t-2 border-industrial-black">
                    <Button 
                      type="button" 
                      variant="industrial-secondary" 
                      onClick={() => setShowEditModal(false)}
                      className="h-9 text-xs sm:text-sm"
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit"
                      variant="industrial-primary"
                      className="h-9 text-xs sm:text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        'Simpan Perubahan'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}

        {/* Detail Modal - Industrial Minimalism */}
        {showDetailModal && selectedGrade && (
          <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center p-4 z-50">
            <Card variant="industrial" className="max-w-md w-full shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
              <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Detail Nilai</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="border-b-2 border-industrial-border pb-4">
                  <label className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Siswa</label>
                  <p className="text-base sm:text-lg font-semibold text-industrial-black mt-1">{selectedGrade.studentName}</p>
                  <p className="text-xs sm:text-sm text-industrial-text-secondary">{getStudentClassName(selectedGrade.studentUsername, selectedGrade.assignmentId)}</p>
                </div>
                
                <div className="border-b-2 border-industrial-border pb-4">
                  <label className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Tugas</label>
                  <p className="text-base sm:text-lg font-semibold text-industrial-black mt-1">{getAssignmentName(selectedGrade.assignmentId)}</p>
                </div>
                
                <div className="border-b-2 border-industrial-border pb-4">
                  <label className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Nilai</label>
                  <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono mt-1">{selectedGrade.points}</p>
                </div>
                
                <div className="border-b-2 border-industrial-border pb-4">
                  <label className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Feedback</label>
                  <p className="text-xs sm:text-sm text-industrial-black mt-1">{selectedGrade.feedback || 'Tidak ada feedback'}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Dinilai Pada</label>
                  <p className="text-xs sm:text-sm text-industrial-black mt-1">{formatDate(selectedGrade.gradedAt)}</p>
                </div>
                
                <div className="flex justify-end pt-4 border-t-2 border-industrial-black">
                  <Button onClick={() => setShowDetailModal(false)} variant="industrial-secondary" className="h-9 text-xs sm:text-sm">
                    Tutup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation - Industrial Minimalism */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center p-4 z-50">
            <Card variant="industrial" className="max-w-sm w-full shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
              <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-red">
                <CardTitle className="text-base sm:text-lg text-industrial-red industrial-h2">Konfirmasi Hapus</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-industrial-black text-xs sm:text-sm mb-6">
                Apakah Anda yakin ingin menghapus nilai ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
                <div className="flex justify-end gap-2 pt-4 border-t-2 border-industrial-black">
                <Button 
                  type="button" 
                    variant="industrial-secondary" 
                  onClick={() => setDeleteConfirmId(null)}
                    className="h-9 text-xs sm:text-sm"
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button 
                  type="button" 
                    variant="industrial-danger" 
                  onClick={() => handleDeleteGrade(deleteConfirmId)}
                    className="h-9 text-xs sm:text-sm"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                      <span>Menghapus...</span>
                    </div>
                  ) : (
                    'Hapus'
                  )}
                </Button>
              </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Actions Confirmation Modal - Industrial Minimalism */}
        {showBulkActions && (
          <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card variant="industrial" className="max-w-md w-full shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-red">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-industrial-red border-2 border-industrial-red flex items-center justify-center">
                      <Trash className="w-5 h-5 text-industrial-white" />
                </div>
                <div>
                      <CardTitle className="text-base sm:text-lg text-industrial-red industrial-h2">Konfirmasi Hapus Massal</CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-industrial-text-secondary">Tindakan ini tidak dapat dibatalkan</CardDescription>
                </div>
              </div>
                </CardHeader>
              
                <CardContent className="p-4 sm:p-6">
                  <p className="text-industrial-black text-xs sm:text-sm mb-4">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold">{selectedGrades.length} nilai</span> yang dipilih?
                </p>
                  <div className="p-3 bg-industrial-white border-2 border-industrial-red">
                  <div className="flex items-center gap-2">
                      <Warning className="w-4 h-4 text-industrial-red" />
                      <p className="text-xs sm:text-sm text-industrial-red font-semibold">Data yang dihapus tidak dapat dikembalikan</p>
                </div>
              </div>
              
                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-industrial-black">
                <Button 
                      variant="industrial-secondary" 
                  onClick={() => setShowBulkActions(false)}
                      className="h-9 text-xs sm:text-sm"
                  disabled={isBulkDeleting}
                >
                  Batal
                </Button>
                <Button 
                      variant="industrial-danger" 
                  onClick={handleBulkDelete}
                      className="h-9 text-xs sm:text-sm"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                      <span>Menghapus...</span>
                    </div>
                  ) : (
                    <>
                          <Trash className="w-4 h-4 mr-2" />
                      Hapus {selectedGrades.length} Nilai
                    </>
                  )}
                </Button>
              </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NilaiPage; 