import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, Calendar, ChevronLeft, ChevronRight, 
  Download, RefreshCw, Users, CheckCircle, 
  XCircle, AlertTriangle, Heart, BarChart3, Save, PieChart
} from 'lucide-react';
import { classApi, studentsApi as studentApi, attendanceApi } from '../../lib/api';
import * as XLSX from 'xlsx';

// Add custom styles for hiding scrollbar
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideStyle;
  document.head.appendChild(style);
}

// Enhanced interfaces
interface Class {
  id: string;
  name: string;
  description: string;
  studentCount?: number;
}

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId: string;
}

interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  studentUsername: string;
  status: string;
  notes: string;
}

type AttendanceStatus = 'present' | 'sick' | 'permission' | 'absent';

interface AttendanceStatusMap {
  [studentUsername: string]: AttendanceStatus;
}

interface ClassRecap {
  classId: string;
  className: string;
  totalStudents: number;
  totalRecords: number;
  presentCount: number;
  sickCount: number;
  permissionCount: number;
  absentCount: number;
  attendanceRate: number;
  uniqueDates: number;
  dateRange: string;
}

// Status configuration
const statusConfig = {
  present: { label: 'Hadir', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100' },
  sick: { label: 'Sakit', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
  permission: { label: 'Izin', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  absent: { label: 'Alfa', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100' }
};

// Enhanced Loading Skeleton
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-3 sm:space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 sm:h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Enhanced Notification Component
const NotificationToast = ({ notification, onClose }: {
  notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; visible: boolean };
  onClose: () => void;
}) => {
  if (!notification.visible) return null;

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 max-w-md"
      >
        <div className={`p-3 sm:p-4 rounded-xl border shadow-lg ${styles[notification.type]}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium flex-1 pr-2">{notification.message}</span>
            <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700 text-lg">
              ×
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const PresensiPage = () => {
  // Enhanced state management
  const [activeTab, setActiveTab] = useState<'daily' | 'class-recap'>('daily');
  const [classRecaps, setClassRecaps] = useState<ClassRecap[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceStatusMap>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'class' | 'recap'>('all');
  const [selectedExportClass, setSelectedExportClass] = useState<string>('');

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });

  // Statistics
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalSick: 0,
    totalPermission: 0,
    totalAbsent: 0
  });

  // Additional statistics info
  const [statsInfo, setStatsInfo] = useState({
    totalRecords: 0,
    uniqueDatesCount: 0,
    uniqueStudentsCount: 0,
    dateRange: ''
  });

  // Notification helper
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  };

  // Date formatting
  const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Check if class has attendance data for specific date
  const hasAttendanceData = (classId: string, date: Date) => {
    const dateString = formatDateForAPI(date);
    return attendanceRecords.some(record => 
      record.classId === classId && record.date === dateString
    );
  };

  // Get attendance status for a class on specific date
  const getClassAttendanceStatus = (classId: string, date: Date) => {
    const dateString = formatDateForAPI(date);
    const classRecordsForDate = attendanceRecords.filter(record => 
      record.classId === classId && record.date === dateString
    );
    
    const recordedCount = classRecordsForDate.length;
    
    if (recordedCount === 0) {
      return { status: 'not-taken', count: 0, total: 0 };
    }

    // Get unique students for this class from attendance records to estimate total
    const uniqueStudentsInClass = [...new Set(
      attendanceRecords
        .filter(r => r.classId === classId)
        .map(r => r.studentUsername)
    )].length;
    
    // Use loaded students count if available, otherwise estimate from records
    const totalStudents = (selectedClass === classId && students.length > 0) 
      ? students.length 
      : uniqueStudentsInClass;
    
    if (totalStudents === 0) {
      return { status: 'partial', count: recordedCount, total: recordedCount };
    }
    
    if (recordedCount >= totalStudents) {
      return { status: 'complete', count: recordedCount, total: totalStudents };
    } else {
      return { status: 'partial', count: recordedCount, total: totalStudents };
    }
  };

  // Calculate class-based attendance recap
  const calculateClassRecaps = (records: AttendanceRecord[], classes: Class[], students: Student[]) => {
    const recapMap = new Map<string, ClassRecap>();
    
    // Initialize recap for each class
    classes.forEach(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      recapMap.set(cls.id, {
        classId: cls.id,
        className: cls.name,
        totalStudents: classStudents.length,
        totalRecords: 0,
        presentCount: 0,
        sickCount: 0,
        permissionCount: 0,
        absentCount: 0,
        attendanceRate: 0,
        uniqueDates: 0,
        dateRange: ''
      });
    });
    
    // Process records by class
    const classDatesMap = new Map<string, Set<string>>();
    
    records.forEach(record => {
      const recap = recapMap.get(record.classId);
      if (recap) {
        recap.totalRecords++;
        
        // Count by status
        switch (record.status) {
          case 'present':
            recap.presentCount++;
            break;
          case 'sick':
            recap.sickCount++;
            break;
          case 'permission':
            recap.permissionCount++;
            break;
          case 'absent':
            recap.absentCount++;
            break;
        }
        
        // Track unique dates per class
        if (!classDatesMap.has(record.classId)) {
          classDatesMap.set(record.classId, new Set());
        }
        classDatesMap.get(record.classId)!.add(record.date);
      }
    });
    
    // Calculate attendance rates and date ranges
    Array.from(recapMap.values()).forEach(recap => {
      // Calculate attendance rate
      if (recap.totalRecords > 0) {
        recap.attendanceRate = Math.round((recap.presentCount / recap.totalRecords) * 100);
      }
      
      // Set unique dates count
      const dates = classDatesMap.get(recap.classId);
      recap.uniqueDates = dates ? dates.size : 0;
      
      // Calculate date range
      if (dates && dates.size > 0) {
        const sortedDates = Array.from(dates).sort();
        const firstDate = new Date(sortedDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        
        if (sortedDates.length === 1) {
          recap.dateRange = firstDate;
        } else {
          recap.dateRange = `${firstDate} - ${lastDate}`;
        }
      }
    });
    
    return Array.from(recapMap.values()).sort((a, b) => a.className.localeCompare(b.className));
  };

  // Real-time statistics calculation from all records
  const calculateRealTimeStats = (records: AttendanceRecord[]) => {
    
    const stats = {
      totalPresent: 0,
      totalSick: 0,
      totalPermission: 0,
      totalAbsent: 0,
      totalRecords: records.length,
      uniqueDates: new Set<string>(),
      uniqueStudents: new Set<string>()
    };

    records.forEach(record => {
      // Count by status
      switch (record.status) {
        case 'present':
          stats.totalPresent++;
          break;
        case 'sick':
          stats.totalSick++;
          break;
        case 'permission':
          stats.totalPermission++;
          break;
        case 'absent':
          stats.totalAbsent++;
          break;
      }
      
      // Track unique dates and students
      stats.uniqueDates.add(record.date);
      stats.uniqueStudents.add(record.studentUsername);
    });

    // Calculate date range
    let dateRange = '';
    if (stats.uniqueDates.size > 0) {
      const sortedDates = Array.from(stats.uniqueDates).sort();
      const firstDate = new Date(sortedDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      
      if (sortedDates.length === 1) {
        dateRange = firstDate;
      } else {
        dateRange = `${firstDate} - ${lastDate}`;
      }
    }

    const finalStats = {
      totalPresent: stats.totalPresent,
      totalSick: stats.totalSick,
      totalPermission: stats.totalPermission,
      totalAbsent: stats.totalAbsent,
      totalRecords: stats.totalRecords,
      uniqueDatesCount: stats.uniqueDates.size,
      uniqueStudentsCount: stats.uniqueStudents.size,
      dateRange
    };

    return finalStats;
  };

  // Enhanced data fetching
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchClasses(), fetchAllRecords()]);
      showNotification('success', 'Data berhasil dimuat');
      
      // Force refresh statistics after initial load

    } catch (error) {
      console.error('Error fetching initial data:', error);
      showNotification('error', 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classApi.getAll();
      if (response.success) {
        setClasses(response.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async (classId: string) => {
    if (!classId) return;
    
    try {
      setIsLoadingStudents(true);
      const response = await studentApi.getAll();
      if (response.success) {
        const classStudents = response.students.filter((s: Student) => s.classId === classId);
        setStudents(classStudents);
        await fetchAttendanceForDate(classId, formatDateForAPI(selectedDate));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showNotification('error', 'Gagal memuat data siswa');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await studentApi.getAll();
      if (response.success) {
        return response.students || [];
      }
    } catch (error) {
      console.error('Error fetching all students:', error);
    }
    return [];
  };

  const fetchAttendanceForDate = async (classId: string, date: string) => {
    try {
      const response = await attendanceApi.getByClass(classId, date);
      if (response.success) {
        const statusMap: AttendanceStatusMap = {};
        response.attendance.forEach((record: AttendanceRecord) => {
          statusMap[record.studentUsername] = record.status as AttendanceStatus;
        });
        setAttendanceData(statusMap);
        
        // Note: We don't update global statistics here anymore
        // Global stats are managed by fetchAllRecords and useEffect
  
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAllRecords = async () => {
    try {

      const response = await attendanceApi.getAll();
      if (response.success) {
        const allRecords = response.attendance || [];
        setAttendanceRecords(allRecords);
        
        // Get all students for class recap calculation
        const allStudents = await fetchAllStudents();
        
        // Calculate class recaps
        if (allRecords.length > 0 && classes.length > 0) {
          const recaps = calculateClassRecaps(allRecords, classes, allStudents);
          setClassRecaps(recaps);
        } else {
          setClassRecaps([]);
        }
        
        // Immediately calculate and update global statistics
        if (allRecords.length > 0) {
          const calculatedStats = calculateRealTimeStats(allRecords);
          setStats({
            totalPresent: calculatedStats.totalPresent,
            totalSick: calculatedStats.totalSick,
            totalPermission: calculatedStats.totalPermission,
            totalAbsent: calculatedStats.totalAbsent
          });
          
          setStatsInfo({
            totalRecords: calculatedStats.totalRecords,
            uniqueDatesCount: calculatedStats.uniqueDatesCount,
            uniqueStudentsCount: calculatedStats.uniqueStudentsCount,
            dateRange: calculatedStats.dateRange
          });
          
        } else {
          setStats({
            totalPresent: 0,
            totalSick: 0,
            totalPermission: 0,
            totalAbsent: 0
          });
          setStatsInfo({
            totalRecords: 0,
            uniqueDatesCount: 0,
            uniqueStudentsCount: 0,
            dateRange: ''
          });
        }
      } else {
        console.error('❌ Failed to fetch all records:', response.error);
        showNotification('error', 'Gagal memuat riwayat presensi: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error fetching all records:', error);
      showNotification('error', 'Error saat memuat riwayat presensi');
    }
  };

  // Navigation
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
    if (selectedClass) {
      fetchAttendanceForDate(selectedClass, formatDateForAPI(previousDay));
    }
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
    if (selectedClass) {
      fetchAttendanceForDate(selectedClass, formatDateForAPI(nextDay));
    }
  };

  const setToday = () => {
    const today = new Date();
    setSelectedDate(today);
    if (selectedClass) {
      fetchAttendanceForDate(selectedClass, formatDateForAPI(today));
    }
  };

  // Attendance management
  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setAttendanceData({});
    fetchStudents(classId);
  };

  const handleMarkAllPresent = () => {
    const newData: AttendanceStatusMap = {};
    students.forEach(student => {
      newData[student.username] = 'present';
    });
    setAttendanceData(newData);
    showNotification('success', 'Semua siswa ditandai hadir');
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) {
      showNotification('error', 'Pilih kelas terlebih dahulu');
      return;
    }

    if (Object.keys(attendanceData).length === 0) {
      showNotification('error', 'Tidak ada data presensi untuk disimpan');
      return;
    }

    try {
      setIsSaving(true);

      
      const response = await attendanceApi.update(
        selectedClass,
        formatDateForAPI(selectedDate),
        attendanceData
      );
      
      if (response.success) {
        showNotification('success', 'Presensi berhasil disimpan');
        
        // First refresh all records to update global statistics
        await fetchAllRecords();
        
        // Then refresh current date data for UI display (without overriding stats)
        await fetchAttendanceForDate(selectedClass, formatDateForAPI(selectedDate));
        

      } else {
        console.error('❌ Failed bulk save:', response.error);
        showNotification('error', 'Gagal menyimpan presensi: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error saving attendance:', error);
      showNotification('error', 'Error menyimpan presensi');
    } finally {
      setIsSaving(false);
    }
  };

  // Create structured Excel export with student summary
  const createStudentSummaryExport = async (classId?: string) => {
    // Get all students for the selected class or all classes
    const allStudents = await fetchAllStudents();
    const targetStudents = classId 
      ? allStudents.filter((s: any) => s.classId === classId)
      : allStudents;

    // Filter records by class if specified
    const targetRecords = classId 
      ? attendanceRecords.filter(r => r.classId === classId)
      : attendanceRecords;

    // Get class info
    const classInfo = classId 
      ? classes.find(c => c.id === classId)
      : null;

    // Create student summary data
    const studentSummary = targetStudents.map((student: any, index: number) => {
      const studentRecords = targetRecords.filter(r => r.studentUsername === student.username);
      
      const presentCount = studentRecords.filter(r => r.status === 'present').length;
      const sickCount = studentRecords.filter(r => r.status === 'sick').length;
      const permissionCount = studentRecords.filter(r => r.status === 'permission').length;
      const absentCount = studentRecords.filter(r => r.status === 'absent').length;
      const totalRecords = studentRecords.length;
      
      const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

      return {
        'No': index + 1,
        'Nama Siswa': student.fullName,
        'Username': student.username,
        'Kelas': classInfo ? classInfo.name : (classes.find(c => c.id === student.classId)?.name || 'Unknown'),
        'Total Hari': totalRecords,
        'Hadir': presentCount,
        'Sakit': sickCount,
        'Izin': permissionCount,
        'Alfa': absentCount,
        'Persentase Kehadiran': `${attendanceRate}%`
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Add title
    const title = classInfo 
      ? `REKAP PRESENSI SISWA - ${classInfo.name.toUpperCase()}`
      : 'REKAP PRESENSI SISWA - SEMUA KELAS';
    
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
    
    // Add class info
    let currentRow = 3;
    if (classInfo) {
      XLSX.utils.sheet_add_aoa(ws, [['Kelas:', classInfo.name]], { origin: `A${currentRow}` });
      currentRow++;
      XLSX.utils.sheet_add_aoa(ws, [['Jumlah Siswa:', targetStudents.length]], { origin: `A${currentRow}` });
      currentRow++;
    } else {
      XLSX.utils.sheet_add_aoa(ws, [['Total Siswa:', targetStudents.length]], { origin: `A${currentRow}` });
      currentRow++;
      XLSX.utils.sheet_add_aoa(ws, [['Total Kelas:', classes.length]], { origin: `A${currentRow}` });
      currentRow++;
    }
    
    // Add export date
    XLSX.utils.sheet_add_aoa(ws, [['Tanggal Export:', new Date().toLocaleDateString('id-ID')]], { origin: `A${currentRow}` });
    currentRow += 2;
    
    // Add table headers
    const headers = ['No', 'Nama Siswa', 'Username', 'Kelas', 'Total Hari', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Persentase Kehadiran'];
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${currentRow}` });
    currentRow++;
    
    // Add student data
    studentSummary.forEach((student: any) => {
      const row = [
        student['No'],
        student['Nama Siswa'],
        student['Username'],
        student['Kelas'],
        student['Total Hari'],
        student['Hadir'],
        student['Sakit'],
        student['Izin'],
        student['Alfa'],
        student['Persentase Kehadiran']
      ];
      XLSX.utils.sheet_add_aoa(ws, [row], { origin: `A${currentRow}` });
      currentRow++;
    });
    
    // Add summary statistics
    currentRow += 1;
    const totalRecords = targetRecords.length;
    const totalPresent = targetRecords.filter(r => r.status === 'present').length;
    const totalSick = targetRecords.filter(r => r.status === 'sick').length;
    const totalPermission = targetRecords.filter(r => r.status === 'permission').length;
    const totalAbsent = targetRecords.filter(r => r.status === 'absent').length;
    const overallAttendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    
    XLSX.utils.sheet_add_aoa(ws, [['RINGKASAN KESELURUHAN']], { origin: `A${currentRow}` });
    currentRow++;
    XLSX.utils.sheet_add_aoa(ws, [['Total Records:', totalRecords]], { origin: `A${currentRow}` });
    currentRow++;
    XLSX.utils.sheet_add_aoa(ws, [['Total Hadir:', totalPresent]], { origin: `A${currentRow}` });
    currentRow++;
    XLSX.utils.sheet_add_aoa(ws, [['Total Sakit:', totalSick]], { origin: `A${currentRow}` });
    currentRow++;
    XLSX.utils.sheet_add_aoa(ws, [['Total Izin:', totalPermission]], { origin: `A${currentRow}` });
    currentRow++;
    XLSX.utils.sheet_add_aoa(ws, [['Total Alfa:', totalAbsent]], { origin: `A${currentRow}` });
    currentRow++;
    XLSX.utils.sheet_add_aoa(ws, [['Tingkat Kehadiran Keseluruhan:', `${overallAttendanceRate}%`]], { origin: `A${currentRow}` });
    
    // Set column widths
    ws['!cols'] = [
      { width: 5 },   // No
      { width: 25 },  // Nama Siswa
      { width: 15 },  // Username
      { width: 15 },  // Kelas
      { width: 12 },  // Total Hari
      { width: 8 },   // Hadir
      { width: 8 },   // Sakit
      { width: 8 },   // Izin
      { width: 8 },   // Alfa
      { width: 18 }   // Persentase
    ];
    
    // Add worksheet to workbook
    const sheetName = classInfo ? classInfo.name : 'Semua Kelas';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate filename
    const fileName = classInfo 
      ? `rekap_presensi_${classInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `rekap_presensi_semua_kelas_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, fileName);
  };

  // Export functionality
  const handleExport = async () => {
    try {
      if (exportType === 'recap' && activeTab === 'class-recap' && classRecaps.length > 0) {
        // Export class recap data
        const exportData = classRecaps.map(recap => ({
          'Nama Kelas': recap.className,
          'Total Siswa': recap.totalStudents,
          'Total Records': recap.totalRecords,
          'Hari Aktif': recap.uniqueDates,
          'Periode': recap.dateRange,
          'Hadir': recap.presentCount,
          'Sakit': recap.sickCount,
          'Izin': recap.permissionCount,
          'Alfa': recap.absentCount,
          'Tingkat Kehadiran (%)': recap.attendanceRate,
          'Partisipasi (%)': recap.totalRecords > 0 && recap.totalStudents > 0 ? 
            Math.round(recap.totalRecords / (recap.totalStudents * recap.uniqueDates) * 100) : 0
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rekap Per Kelas');
        XLSX.writeFile(wb, `rekap_presensi_per_kelas_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (exportType === 'class' && selectedExportClass) {
        // Export student summary for selected class
        await createStudentSummaryExport(selectedExportClass);
      } else if (exportType === 'all') {
        // Export student summary for all classes
        await createStudentSummaryExport();
      } else {
        // Fallback: Export regular attendance records
    const exportData = attendanceRecords.map(record => ({
      Tanggal: record.date,
      Kelas: classes.find(c => c.id === record.classId)?.name || 'Unknown',
      Siswa: record.studentUsername,
      Status: statusConfig[record.status as AttendanceStatus]?.label || record.status,
      Catatan: record.notes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Presensi');
    XLSX.writeFile(wb, `presensi_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    
    setShowExportModal(false);
    showNotification('success', 'Data berhasil diekspor');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('error', 'Gagal mengekspor data');
    }
  };


  // Auto-refresh statistics whenever attendance records change
  useEffect(() => {

    
    if (attendanceRecords.length > 0) {
      const calculatedStats = calculateRealTimeStats(attendanceRecords);
      

      
      setStats({
        totalPresent: calculatedStats.totalPresent,
        totalSick: calculatedStats.totalSick,
        totalPermission: calculatedStats.totalPermission,
        totalAbsent: calculatedStats.totalAbsent
      });
      
      setStatsInfo({
        totalRecords: calculatedStats.totalRecords,
        uniqueDatesCount: calculatedStats.uniqueDatesCount,
        uniqueStudentsCount: calculatedStats.uniqueStudentsCount,
        dateRange: calculatedStats.dateRange
      });
      
    } else {
      setStats({
        totalPresent: 0,
        totalSick: 0,
        totalPermission: 0,
        totalAbsent: 0
      });
      
      setStatsInfo({
        totalRecords: 0,
        uniqueDatesCount: 0,
        uniqueStudentsCount: 0,
        dateRange: ''
      });
    }
  }, [attendanceRecords]);

  // Update statistics when class selection changes (not for initial load)
  useEffect(() => {
    if (attendanceRecords.length > 0 && selectedClass) {

      // Statistics will be calculated in the component render
    }
  }, [selectedClass]);


  // Auto-refresh class recaps when switching to class-recap tab
  useEffect(() => {
    if (activeTab === 'class-recap') {
      // Ensure we have fresh data for class recaps
      if (classRecaps.length === 0 && attendanceRecords.length > 0 && classes.length > 0) {
        fetchAllRecords();
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl max-w-sm mx-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Memuat Data Presensi</h3>
              <p className="text-xs sm:text-sm text-gray-500">Mohon tunggu sebentar...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))} 
      />

      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate">
                  Presensi Siswa
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Kelola kehadiran siswa dengan mudah</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={fetchInitialData}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button
                      onClick={() => {
                        setExportType(activeTab === 'class-recap' ? 'recap' : 'all');
                        setSelectedExportClass('');
                        setShowExportModal(true);
                      }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          {/* Statistics Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Statistik Presensi Real-Time
              </h2>
              <button
                onClick={fetchAllRecords}
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors w-full sm:w-auto justify-center"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                Refresh Data
              </button>
            </div>
            
            {/* Statistics Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-semibold text-gray-900">{statsInfo.totalRecords}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Tanggal Recorded:</span>
                  <span className="font-semibold text-gray-900">{statsInfo.uniqueDatesCount} hari</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Siswa Tercatat:</span>
                  <span className="font-semibold text-gray-900">{statsInfo.uniqueStudentsCount} siswa</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Periode:</span>
                  <span className="font-semibold text-gray-900 truncate">
                    {statsInfo.dateRange || 'Belum ada data'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total Hadir</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalPresent}</p>
                <p className="text-green-200 text-xs mt-1">Semua data</p>
              </div>
              <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Sakit</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalSick}</p>
                <p className="text-blue-200 text-xs mt-1">Semua data</p>
              </div>
              <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-yellow-100 text-xs sm:text-sm font-medium">Izin</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalPermission}</p>
                <p className="text-yellow-200 text-xs mt-1">Semua data</p>
              </div>
              <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-red-100 text-xs sm:text-sm font-medium">Alfa</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalAbsent}</p>
                <p className="text-red-200 text-xs mt-1">Semua data</p>
              </div>
              <XCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-xl">
          <div className="flex border-b border-gray-200/50 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 text-center font-medium transition-all ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">Presensi Harian</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('class-recap')}
              className={`flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 text-center font-medium transition-all ${
                activeTab === 'class-recap'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">Rekap</span>
              </div>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'daily' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Overview Status untuk Semua Kelas */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">
                    Status Presensi Semua Kelas - {formatDate(selectedDate).split(',')[0]}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classes.map((cls) => {
                      const status = getClassAttendanceStatus(cls.id, selectedDate);
                      return (
                        <div 
                          key={cls.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            selectedClass === cls.id 
                              ? 'bg-blue-100 border-blue-300' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleClassSelect(cls.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                              {cls.name}
                            </h4>
                            {status.status === 'complete' && (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                            {status.status === 'partial' && (
                              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            )}
                            {status.status === 'not-taken' && (
                              <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {status.status === 'complete' && `✓ Lengkap (${status.count}/${status.total})`}
                            {status.status === 'partial' && `⚠ Sebagian (${status.count}/${status.total})`}
                            {status.status === 'not-taken' && '○ Belum diambil'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Pilih Kelas
                    </label>
                    <div className="space-y-3">
                      <select
                        value={selectedClass}
                        onChange={(e) => handleClassSelect(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      >
                        <option value="">Pilih Kelas...</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Status Presensi untuk Kelas Terpilih */}
                      {selectedClass && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              Status Presensi:
                            </span>
                            {(() => {
                              const attendanceStatus = getClassAttendanceStatus(selectedClass, selectedDate);
                              
                              if (attendanceStatus.status === 'complete') {
                                return (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Lengkap ({attendanceStatus.count}/{attendanceStatus.total})
                                  </Badge>
                                );
                              } else if (attendanceStatus.status === 'partial') {
                                return (
                                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Sebagian ({attendanceStatus.count}/{attendanceStatus.total})
                                  </Badge>
                                );
                              } else {
                                return (
                                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Belum Diambil
                                  </Badge>
                                );
                              }
                            })()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(selectedDate).split(',')[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Tanggal
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={goToPreviousDay}
                          className="p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors flex-shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                        <div className="flex-1 px-2 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl min-w-0">
                          <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 font-medium text-xs sm:text-sm truncate">
                              {new Date(selectedDate).toLocaleDateString('id-ID', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={goToNextDay}
                          className="p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors flex-shrink-0"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Aksi Cepat
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={setToday}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all text-xs sm:text-sm font-medium"
                      >
                        Hari Ini
                      </button>
                      
                      <button
                        onClick={handleMarkAllPresent}
                        disabled={!selectedClass || students.length === 0}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-xs sm:text-sm font-medium disabled:opacity-50"
                      >
                        Semua Hadir
                      </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                {selectedClass && (
                  <div className="bg-white rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Daftar Siswa</h3>
                        <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                          {students.length} siswa
                        </span>
                      </div>
                    </div>

                    <div>
                      {isLoadingStudents ? (
                        <div className="p-4 sm:p-6">
                          <LoadingSkeleton />
                        </div>
                      ) : students.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center">
                          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-base sm:text-lg font-medium text-gray-900">Tidak ada siswa</p>
                          <p className="text-xs sm:text-sm text-gray-500">Silakan pilih kelas yang memiliki siswa</p>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View */}
                          <div className="block sm:hidden">
                            <div className="space-y-3 p-4">
                              {students.map((student, index) => (
                                <motion.div
                                  key={student.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="bg-gray-50 rounded-xl p-4 space-y-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-gray-900 truncate">{student.fullName}</div>
                                      <div className="text-xs text-gray-500 truncate">{student.username}</div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(['present', 'sick', 'permission', 'absent'] as AttendanceStatus[]).map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => setAttendanceData(prev => ({ ...prev, [student.username]: status }))}
                                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-all text-center ${
                                          attendanceData[student.username] === status
                                            ? `${statusConfig[status].color} text-white shadow-md`
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                      >
                                        {statusConfig[status].label}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Desktop View */}
                          <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  No
                                </th>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Nama Siswa
                                </th>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status Kehadiran
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {students.map((student, index) => (
                                <motion.tr 
                                  key={student.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm mr-3 sm:mr-4 flex-shrink-0">
                                        {student.fullName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{student.fullName}</div>
                                        <div className="text-xs text-gray-500 truncate">{student.username}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                                      {(['present', 'sick', 'permission', 'absent'] as AttendanceStatus[]).map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => setAttendanceData(prev => ({ ...prev, [student.username]: status }))}
                                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs font-medium rounded-lg transition-all ${
                                            attendanceData[student.username] === status
                                              ? `${statusConfig[status].color} text-white shadow-md`
                                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                          }`}
                                        >
                                          {statusConfig[status].label}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </>
                      )}
                    </div>

                    {selectedClass && students.length > 0 && (
                      <div className="bg-gray-50/50 px-4 sm:px-6 py-3 sm:py-4 border-t">
                        <div className="flex justify-end">
                          <button
                            onClick={handleSaveAttendance}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 text-xs sm:text-sm"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Simpan Presensi</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            {activeTab === 'class-recap' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      Rekap Presensi Per Kelas
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {classRecaps.length > 0 ? (
                        <>Menampilkan statistik presensi untuk {classRecaps.length} kelas • Data real-time</>
                      ) : (
                        'Belum ada data rekap per kelas'
                      )}
                    </p>
          </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={fetchAllRecords}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                      title="Refresh data"
                    >
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <Button
                      onClick={() => {
                        setExportType('recap');
                        setSelectedExportClass('');
                        setShowExportModal(true);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Export Rekap</span>
                      <span className="sm:hidden">Export</span>
                    </Button>
        </div>
      </div>

                {classRecaps.length === 0 ? (
                  <div className="bg-white rounded-2xl border shadow-lg p-8 sm:p-12 text-center">
                    <PieChart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-base sm:text-lg font-medium text-gray-900">Belum ada data rekap kelas</p>
                    <p className="text-xs sm:text-sm text-gray-500">Data akan muncul setelah presensi dilakukan di berbagai kelas</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6">
                    {classRecaps.map((recap, index) => (
                      <motion.div
                        key={recap.classId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl border shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                      >
                        {/* Class Header */}
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold">{recap.className}</h3>
                              <p className="text-purple-100 text-sm">
                                {recap.totalStudents} siswa • {recap.uniqueDates} hari tercatat • {recap.totalRecords} total records
                              </p>
                              {recap.dateRange && (
                                <p className="text-purple-200 text-xs mt-1">
                                  Periode: {recap.dateRange}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-center bg-white/20 rounded-xl p-3">
                                <div className="text-2xl font-bold">{recap.attendanceRate}%</div>
                                <div className="text-xs text-purple-200">Tingkat Kehadiran</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="p-4 sm:p-6">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-green-700">{recap.presentCount}</div>
                              <div className="text-xs text-green-600">Hadir</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.presentCount / recap.totalRecords) * 100) : 0}%
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                              <Heart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-blue-700">{recap.sickCount}</div>
                              <div className="text-xs text-blue-600">Sakit</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.sickCount / recap.totalRecords) * 100) : 0}%
                              </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                              <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-yellow-700">{recap.permissionCount}</div>
                              <div className="text-xs text-yellow-600">Izin</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.permissionCount / recap.totalRecords) * 100) : 0}%
                              </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-red-700">{recap.absentCount}</div>
                              <div className="text-xs text-red-600">Alfa</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.absentCount / recap.totalRecords) * 100) : 0}%
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Distribusi Kehadiran</span>
                              <span className="text-sm text-gray-500">{recap.totalRecords} total records</span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full flex">
                                {recap.totalRecords > 0 && (
                                  <>
                                    <div 
                                      className="bg-green-500 transition-all duration-500"
                                      style={{ width: `${(recap.presentCount / recap.totalRecords) * 100}%` }}
                                    ></div>
                                    <div 
                                      className="bg-blue-500 transition-all duration-500"
                                      style={{ width: `${(recap.sickCount / recap.totalRecords) * 100}%` }}
                                    ></div>
                                    <div 
                                      className="bg-yellow-500 transition-all duration-500"
                                      style={{ width: `${(recap.permissionCount / recap.totalRecords) * 100}%` }}
                                    ></div>
                                    <div 
                                      className="bg-red-500 transition-all duration-500"
                                      style={{ width: `${(recap.absentCount / recap.totalRecords) * 100}%` }}
                                    ></div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Hadir: {recap.presentCount}</span>
                              <span>Sakit: {recap.sickCount}</span>
                              <span>Izin: {recap.permissionCount}</span>
                              <span>Alfa: {recap.absentCount}</span>
                            </div>
                          </div>

                          {/* Class Summary */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold text-gray-900">{recap.totalStudents}</div>
                                <div className="text-xs text-gray-600">Total Siswa</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-gray-900">{recap.uniqueDates}</div>
                                <div className="text-xs text-gray-600">Hari Aktif</div>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-lg font-bold text-gray-900">
                                  {recap.totalRecords > 0 && recap.totalStudents > 0 ? 
                                    Math.round(recap.totalRecords / (recap.totalStudents * recap.uniqueDates) * 100) : 0}%
                                </div>
                                <div className="text-xs text-gray-600">Partisipasi</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Export Data Presensi</h3>
            
            {/* Export Type Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Jenis Export:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportType"
                    value="all"
                    checked={exportType === 'all'}
                    onChange={(e) => setExportType(e.target.value as 'all' | 'class' | 'recap')}
                    className="mr-3 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Rekap Semua Kelas</div>
                    <div className="text-xs text-gray-500">Ringkasan per siswa dari semua kelas</div>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportType"
                    value="class"
                    checked={exportType === 'class'}
                    onChange={(e) => setExportType(e.target.value as 'all' | 'class' | 'recap')}
                    className="mr-3 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Rekap Per Kelas</div>
                    <div className="text-xs text-gray-500">Ringkasan per siswa untuk kelas tertentu</div>
                  </div>
                </label>
                
                {activeTab === 'class-recap' && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="recap"
                      checked={exportType === 'recap'}
                      onChange={(e) => setExportType(e.target.value as 'all' | 'class' | 'recap')}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Statistik Kelas</div>
                      <div className="text-xs text-gray-500">Data statistik rekap per kelas</div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Class Selection (when exportType is 'class') */}
            {exportType === 'class' && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas:</label>
                <select
                  value={selectedExportClass}
                  onChange={(e) => setSelectedExportClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Pilih Kelas...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Format Information */}
            <div className="mb-4 sm:mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Format Export:</h4>
              <div className="text-xs text-blue-800 space-y-1">
                {exportType === 'all' && (
                  <div>• Rekap per siswa dari semua kelas dengan judul, keterangan, tabel rapi, dan ringkasan</div>
                )}
                {exportType === 'class' && (
                  <div>• Rekap per siswa untuk kelas terpilih dengan judul, keterangan kelas, tabel rapi, dan ringkasan</div>
                )}
                {exportType === 'recap' && (
                  <div>• Data statistik dan persentase per kelas</div>
                )}
                <div>• Format: Excel (.xlsx)</div>
                <div>• Kolom: No, Nama, Username, Kelas, Total Hari, Hadir, Sakit, Izin, Alfa, Persentase</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportType('all');
                  setSelectedExportClass('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium order-2 sm:order-1"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                disabled={exportType === 'class' && !selectedExportClass}
                className="flex-1 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium order-1 sm:order-2"
              >
                Export Data
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PresensiPage; 