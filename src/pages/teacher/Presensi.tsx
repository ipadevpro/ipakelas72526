import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserCircle, Calendar, CaretLeft, CaretRight, 
  Download, ArrowClockwise, Users, CheckCircle, 
  XCircle, Warning, Heart, ChartBar, FloppyDisk, ChartPie
} from 'phosphor-react';
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

// Enhanced Loading Skeleton - Industrial Minimalism
const LoadingSkeleton = () => (
  <div className="space-y-3 sm:space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border-2 border-industrial-black bg-industrial-white">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-industrial-light border-2 border-industrial-black"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 sm:h-4 bg-industrial-light w-3/4"></div>
          <div className="h-2 sm:h-3 bg-industrial-light w-1/2"></div>
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="w-12 sm:w-16 h-6 sm:h-8 bg-industrial-light border-2 border-industrial-black"></div>
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
    success: 'bg-industrial-white border-2 border-industrial-black text-industrial-black',
    error: 'bg-industrial-white border-2 border-industrial-red text-industrial-red',
    warning: 'bg-industrial-white border-2 border-industrial-black text-industrial-black',
    info: 'bg-industrial-white border-2 border-industrial-steel text-industrial-black'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 max-w-md"
      >
        <div className={`p-3 sm:p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${styles[notification.type]}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold flex-1 pr-2">{notification.message}</span>
            <button onClick={onClose} className="ml-2 text-industrial-text-secondary hover:text-industrial-black text-lg">
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
      <div className="min-h-screen p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-industrial-white border-2 border-industrial-black shadow-[0_8px_16px_rgba(0,0,0,0.3)] p-6 sm:p-8 max-w-sm mx-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-industrial-black border-t-industrial-steel animate-spin"></div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2">Memuat Data Presensi</h3>
              <p className="text-xs sm:text-sm text-industrial-text-secondary">Mohon tunggu sebentar...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))} 
      />

      {/* Enhanced Header - Industrial Minimalism */}
      <div className="bg-industrial-white border-b-2 border-industrial-black sticky top-0 z-30 mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-4 h-4 sm:w-6 sm:h-6 text-industrial-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-industrial-black industrial-h1 truncate">
                  Presensi Siswa
                </h1>
                <p className="text-xs sm:text-sm text-industrial-text-secondary hidden sm:block">Kelola kehadiran siswa dengan mudah</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="industrial-secondary"
                size="sm"
                onClick={fetchInitialData}
                className="w-8 h-8 sm:w-10 sm:h-10 p-0"
              >
                <ArrowClockwise className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              <Button
                variant="industrial-secondary"
                size="sm"
                      onClick={() => {
                        setExportType(activeTab === 'class-recap' ? 'recap' : 'all');
                        setSelectedExportClass('');
                        setShowExportModal(true);
                      }}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Data</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Enhanced Statistics - Industrial Minimalism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          {/* Statistics Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-industrial-black industrial-h1">
                Statistik Presensi Real-Time
              </h2>
              <Button
                variant="industrial-secondary"
                size="sm"
                onClick={fetchAllRecords}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <ArrowClockwise className="w-3 h-3 sm:w-4 sm:h-4" />
                Refresh Data
              </Button>
            </div>
            
            {/* Statistics Info */}
            <Card variant="industrial">
              <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-industrial-steel flex-shrink-0"></div>
                    <span className="text-industrial-text-secondary">Total Records:</span>
                    <span className="font-semibold text-industrial-black industrial-mono">{statsInfo.totalRecords}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-industrial-black flex-shrink-0"></div>
                    <span className="text-industrial-text-secondary">Tanggal Recorded:</span>
                    <span className="font-semibold text-industrial-black industrial-mono">{statsInfo.uniqueDatesCount} hari</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-industrial-steel flex-shrink-0"></div>
                    <span className="text-industrial-text-secondary">Siswa Tercatat:</span>
                    <span className="font-semibold text-industrial-black industrial-mono">{statsInfo.uniqueStudentsCount} siswa</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-industrial-black flex-shrink-0"></div>
                    <span className="text-industrial-text-secondary">Periode:</span>
                    <span className="font-semibold text-industrial-black truncate">
                    {statsInfo.dateRange || 'Belum ada data'}
                  </span>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Statistics Cards - Industrial Minimalism */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                  <p className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Total Hadir</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{stats.totalPresent}</p>
                  <p className="text-industrial-text-muted text-xs mt-1">Semua data</p>
              </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-industrial-white" />
            </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                  <p className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Sakit</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-steel industrial-mono truncate">{stats.totalSick}</p>
                  <p className="text-industrial-text-muted text-xs mt-1">Semua data</p>
              </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-steel border-2 border-industrial-steel flex items-center justify-center flex-shrink-0 ml-2">
                  <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-industrial-white" />
            </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                  <p className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Izin</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono truncate">{stats.totalPermission}</p>
                  <p className="text-industrial-text-muted text-xs mt-1">Semua data</p>
              </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center flex-shrink-0 ml-2">
                  <Warning className="w-4 h-4 sm:w-6 sm:h-6 text-industrial-white" />
            </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="industrial">
            <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                  <p className="text-industrial-text-secondary text-xs sm:text-sm font-semibold">Alfa</p>
                  <p className="text-xl sm:text-2xl font-bold text-industrial-red industrial-mono truncate">{stats.totalAbsent}</p>
                  <p className="text-industrial-text-muted text-xs mt-1">Semua data</p>
              </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-red border-2 border-industrial-red flex items-center justify-center flex-shrink-0 ml-2">
                  <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-industrial-white" />
            </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tab Navigation - Industrial Minimalism */}
        <Card variant="industrial" className="mb-4 sm:mb-6">
          <div className="flex border-b-2 border-industrial-black overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 text-center font-semibold transition-all text-xs sm:text-sm ${
                activeTab === 'daily'
                  ? 'bg-industrial-black text-industrial-white'
                  : 'text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Presensi Harian</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('class-recap')}
              className={`flex-1 min-w-0 px-2 sm:px-4 py-3 sm:py-4 text-center font-semibold transition-all text-xs sm:text-sm ${
                activeTab === 'class-recap'
                  ? 'bg-industrial-black text-industrial-white'
                  : 'text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <ChartPie className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Rekap</span>
              </div>
            </button>
          </div>

          <CardContent className="p-4 sm:p-6">
            {activeTab === 'daily' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Overview Status untuk Semua Kelas - Industrial Minimalism */}
                <Card variant="industrial">
                  <CardHeader className="p-4 border-b-2 border-industrial-black">
                    <CardTitle className="text-sm sm:text-base text-industrial-black industrial-h2">
                      Status Presensi Semua Kelas - {formatDate(selectedDate).split(',')[0]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {classes.map((cls) => {
                        const status = getClassAttendanceStatus(cls.id, selectedDate);
                        return (
                          <div 
                            key={cls.id}
                            className={`p-3 border-2 cursor-pointer transition-all ${
                              selectedClass === cls.id 
                                ? 'bg-industrial-black border-industrial-black' 
                                : 'bg-industrial-white border-industrial-black hover:bg-industrial-light'
                            }`}
                            onClick={() => handleClassSelect(cls.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`text-xs sm:text-sm font-semibold truncate flex-1 mr-2 ${
                                selectedClass === cls.id ? 'text-industrial-white' : 'text-industrial-black'
                              }`}>
                                {cls.name}
                              </h4>
                              {status.status === 'complete' && (
                                <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                                  selectedClass === cls.id ? 'text-industrial-white' : 'text-industrial-black'
                                }`} />
                              )}
                              {status.status === 'partial' && (
                                <Warning className={`w-4 h-4 flex-shrink-0 ${
                                  selectedClass === cls.id ? 'text-industrial-white' : 'text-industrial-black'
                                }`} />
                              )}
                              {status.status === 'not-taken' && (
                                <XCircle className={`w-4 h-4 flex-shrink-0 ${
                                  selectedClass === cls.id ? 'text-industrial-white' : 'text-industrial-text-muted'
                                }`} />
                              )}
                            </div>
                            <div className={`text-xs ${
                              selectedClass === cls.id ? 'text-industrial-white' : 'text-industrial-text-secondary'
                            }`}>
                              {status.status === 'complete' && `✓ Lengkap (${status.count}/${status.total})`}
                              {status.status === 'partial' && `⚠ Sebagian (${status.count}/${status.total})`}
                              {status.status === 'not-taken' && '○ Belum diambil'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Controls */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-industrial-black">
                      Pilih Kelas
                    </label>
                    <div className="space-y-3">
                    <select
                      value={selectedClass}
                      onChange={(e) => handleClassSelect(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-industrial-white border-2 border-industrial-black focus:outline-none focus:border-industrial-steel text-xs sm:text-sm"
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
                        <Card variant="industrial">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-industrial-black">
                                Status Presensi:
                              </span>
                              {(() => {
                                const attendanceStatus = getClassAttendanceStatus(selectedClass, selectedDate);
                                
                                if (attendanceStatus.status === 'complete') {
                                  return (
                                    <Badge variant="industrial-success" className="text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Lengkap ({attendanceStatus.count}/{attendanceStatus.total})
                                    </Badge>
                                  );
                                } else if (attendanceStatus.status === 'partial') {
                                  return (
                                    <Badge variant="industrial-warning" className="text-xs">
                                      <Warning className="w-3 h-3 mr-1" />
                                      Sebagian ({attendanceStatus.count}/{attendanceStatus.total})
                                    </Badge>
                                  );
                                } else {
                                  return (
                                    <Badge variant="industrial-secondary" className="text-xs">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Belum Diambil
                                    </Badge>
                                  );
                                }
                              })()}
                            </div>
                            <div className="text-xs text-industrial-text-secondary">
                              {formatDate(selectedDate).split(',')[0]}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-industrial-black">
                      Tanggal
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="industrial-secondary"
                        size="sm"
                        onClick={goToPreviousDay}
                        className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                      >
                        <CaretLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      
                        <div className="flex-1 px-2 sm:px-4 py-2 sm:py-3 bg-industrial-white border-2 border-industrial-black min-w-0">
                          <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-text-muted flex-shrink-0" />
                            <span className="text-industrial-black font-semibold text-xs sm:text-sm truncate">
                              {new Date(selectedDate).toLocaleDateString('id-ID', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="industrial-secondary"
                        size="sm"
                        onClick={goToNextDay}
                        className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                      >
                        <CaretRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-industrial-black">
                      Aksi Cepat
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="industrial-primary"
                        size="sm"
                        onClick={setToday}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Hari Ini
                      </Button>
                      
                      <Button
                        variant="industrial-primary"
                        size="sm"
                        onClick={handleMarkAllPresent}
                        disabled={!selectedClass || students.length === 0}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Semua Hadir
                      </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Students List - Industrial Minimalism */}
                {selectedClass && (
                  <Card variant="industrial" className="overflow-hidden">
                    <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-industrial-black bg-industrial-black">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg text-industrial-white industrial-h2">Daftar Siswa</CardTitle>
                        <Badge variant="industrial-secondary" className="text-xs sm:text-sm">
                          {students.length} siswa
                        </Badge>
                      </div>
                    </CardHeader>

                      {isLoadingStudents ? (
                      <CardContent className="p-4 sm:p-6">
                          <LoadingSkeleton />
                      </CardContent>
                      ) : students.length === 0 ? (
                      <CardContent className="p-8 sm:p-12 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-industrial-white" />
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2">Tidak ada siswa</p>
                        <p className="text-xs sm:text-sm text-industrial-text-secondary">Silakan pilih kelas yang memiliki siswa</p>
                      </CardContent>
                      ) : (
                      <CardContent>
                          {/* Mobile View */}
                          <div className="block sm:hidden">
                            <div className="space-y-3 p-4">
                              {students.map((student, index) => (
                                <motion.div
                                  key={student.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="bg-industrial-white border-2 border-industrial-black p-4 space-y-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-industrial-black border-2 border-industrial-black flex items-center justify-center text-industrial-white font-semibold text-xs flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-industrial-black truncate">{student.fullName}</div>
                                      <div className="text-xs text-industrial-text-secondary truncate">{student.username}</div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(['present', 'sick', 'permission', 'absent'] as AttendanceStatus[]).map((status) => (
                                      <Button
                                        key={status}
                                        variant={attendanceData[student.username] === status ? "industrial-primary" : "industrial-secondary"}
                                        size="sm"
                                        onClick={() => setAttendanceData(prev => ({ ...prev, [student.username]: status }))}
                                        className="text-xs"
                                      >
                                        {statusConfig[status].label}
                                      </Button>
                                    ))}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Desktop View */}
                          <div className="hidden sm:block overflow-x-auto">
                          <table className="industrial-table w-full min-w-[600px]">
                            <thead>
                              <tr>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  No
                                </th>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-industrial-white uppercase">
                                  Nama Siswa
                                </th>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-industrial-white uppercase">
                                  Status Kehadiran
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((student, index) => (
                                <motion.tr 
                                  key={student.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-industrial-black industrial-mono">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-industrial-black border-2 border-industrial-black flex items-center justify-center text-industrial-white font-semibold text-xs sm:text-sm mr-3 sm:mr-4 flex-shrink-0">
                                        {student.fullName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs sm:text-sm font-semibold text-industrial-black truncate">{student.fullName}</div>
                                        <div className="text-xs text-industrial-text-secondary truncate">{student.username}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                                      {(['present', 'sick', 'permission', 'absent'] as AttendanceStatus[]).map((status) => (
                                        <Button
                                          key={status}
                                          variant={attendanceData[student.username] === status ? "industrial-primary" : "industrial-secondary"}
                                          size="sm"
                                          onClick={() => setAttendanceData(prev => ({ ...prev, [student.username]: status }))}
                                          className="text-xs"
                                        >
                                          {statusConfig[status].label}
                                        </Button>
                                      ))}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                      )}

                    {selectedClass && students.length > 0 && (
                      <div className="bg-industrial-light px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-industrial-black">
                        <div className="flex justify-end">
                          <Button
                            variant="industrial-primary"
                            size="sm"
                            onClick={handleSaveAttendance}
                            disabled={isSaving}
                            className="flex items-center gap-2 text-xs sm:text-sm"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <FloppyDisk className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Simpan Presensi</span>
                              </>
                            )}
                    </Button>
                  </div>
                </div>
                    )}
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'class-recap' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-industrial-black industrial-h2">
                      <ChartPie className="w-4 h-4 sm:w-5 sm:h-5 text-industrial-black" />
                      Rekap Presensi Per Kelas
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-industrial-text-secondary mt-1">
                      {classRecaps.length > 0 ? (
                        <>Menampilkan statistik presensi untuk {classRecaps.length} kelas • Data real-time</>
                      ) : (
                        'Belum ada data rekap per kelas'
                      )}
                    </p>
          </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="industrial-secondary"
                      size="sm"
                      onClick={fetchAllRecords}
                      className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                      title="Refresh data"
                    >
                      <ArrowClockwise className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button
                      variant="industrial-primary"
                      size="sm"
                      onClick={() => {
                        setExportType('recap');
                        setSelectedExportClass('');
                        setShowExportModal(true);
                      }}
                      className="text-xs sm:text-sm"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Export Rekap</span>
                      <span className="sm:hidden">Export</span>
                    </Button>
        </div>
      </div>

                {classRecaps.length === 0 ? (
                  <Card variant="industrial">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                        <ChartPie className="w-6 h-6 sm:w-8 sm:h-8 text-industrial-white" />
                  </div>
                      <p className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2">Belum ada data rekap kelas</p>
                      <p className="text-xs sm:text-sm text-industrial-text-secondary">Data akan muncul setelah presensi dilakukan di berbagai kelas</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:gap-6">
                    {classRecaps.map((recap, index) => (
                      <Card key={recap.classId} variant="industrial" className="overflow-hidden">
                        {/* Class Header */}
                        <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black bg-industrial-black">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <CardTitle className="text-lg sm:text-xl text-industrial-white industrial-h1">{recap.className}</CardTitle>
                              <p className="text-industrial-text-muted text-xs sm:text-sm mt-1">
                                {recap.totalStudents} siswa • {recap.uniqueDates} hari tercatat • {recap.totalRecords} total records
                              </p>
                              {recap.dateRange && (
                                <p className="text-industrial-text-muted text-xs mt-1">
                                  Periode: {recap.dateRange}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-center bg-industrial-white border-2 border-industrial-white p-3">
                                <div className="text-2xl font-bold text-industrial-black industrial-mono">{recap.attendanceRate}%</div>
                                <div className="text-xs text-industrial-text-secondary">Tingkat Kehadiran</div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Statistics Grid */}
                        <CardContent className="p-4 sm:p-6">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <Card variant="industrial">
                              <CardContent className="p-4 text-center">
                                <div className="w-6 h-6 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                                  <CheckCircle className="w-4 h-4 text-industrial-white" />
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{recap.presentCount}</div>
                                <div className="text-xs text-industrial-text-secondary font-semibold">Hadir</div>
                                <div className="text-xs text-industrial-text-muted mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.presentCount / recap.totalRecords) * 100) : 0}%
                              </div>
                              </CardContent>
                            </Card>

                            <Card variant="industrial">
                              <CardContent className="p-4 text-center">
                                <div className="w-6 h-6 bg-industrial-steel border-2 border-industrial-steel flex items-center justify-center mx-auto mb-2">
                                  <Heart className="w-4 h-4 text-industrial-white" />
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-industrial-steel industrial-mono">{recap.sickCount}</div>
                                <div className="text-xs text-industrial-text-secondary font-semibold">Sakit</div>
                                <div className="text-xs text-industrial-text-muted mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.sickCount / recap.totalRecords) * 100) : 0}%
                              </div>
                              </CardContent>
                            </Card>

                            <Card variant="industrial">
                              <CardContent className="p-4 text-center">
                                <div className="w-6 h-6 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-2">
                                  <Warning className="w-4 h-4 text-industrial-white" />
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-industrial-black industrial-mono">{recap.permissionCount}</div>
                                <div className="text-xs text-industrial-text-secondary font-semibold">Izin</div>
                                <div className="text-xs text-industrial-text-muted mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.permissionCount / recap.totalRecords) * 100) : 0}%
                              </div>
                              </CardContent>
                            </Card>

                            <Card variant="industrial">
                              <CardContent className="p-4 text-center">
                                <div className="w-6 h-6 bg-industrial-red border-2 border-industrial-red flex items-center justify-center mx-auto mb-2">
                                  <XCircle className="w-4 h-4 text-industrial-white" />
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-industrial-red industrial-mono">{recap.absentCount}</div>
                                <div className="text-xs text-industrial-text-secondary font-semibold">Alfa</div>
                                <div className="text-xs text-industrial-text-muted mt-1">
                                {recap.totalRecords > 0 ? Math.round((recap.absentCount / recap.totalRecords) * 100) : 0}%
                              </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-industrial-black">Distribusi Kehadiran</span>
                              <span className="text-sm text-industrial-text-secondary industrial-mono">{recap.totalRecords} total records</span>
                            </div>
                            <div className="w-full h-4 bg-industrial-light border-2 border-industrial-black overflow-hidden">
                              <div className="h-full flex">
                                {recap.totalRecords > 0 && (
                                  <>
                                    <div 
                                      className="bg-industrial-black transition-all duration-500"
                                      style={{ width: `${(recap.presentCount / recap.totalRecords) * 100}%` }}
                                      title="Hadir"
                                    ></div>
                                    <div 
                                      className="bg-industrial-steel transition-all duration-500"
                                      style={{ width: `${(recap.sickCount / recap.totalRecords) * 100}%` }}
                                      title="Sakit"
                                    ></div>
                                    <div 
                                      className="bg-industrial-gray transition-all duration-500"
                                      style={{ width: `${(recap.permissionCount / recap.totalRecords) * 100}%` }}
                                      title="Izin"
                                    ></div>
                                    <div 
                                      className="bg-industrial-red transition-all duration-500"
                                      style={{ width: `${(recap.absentCount / recap.totalRecords) * 100}%` }}
                                      title="Alfa"
                                    ></div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-industrial-text-secondary mt-1">
                              <span>Hadir: {recap.presentCount}</span>
                              <span>Sakit: {recap.sickCount}</span>
                              <span>Izin: {recap.permissionCount}</span>
                              <span>Alfa: {recap.absentCount}</span>
                            </div>
                          </div>

                          {/* Class Summary */}
                          <Card variant="industrial">
                            <CardContent className="p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                              <div>
                                  <div className="text-lg font-bold text-industrial-black industrial-mono">{recap.totalStudents}</div>
                                  <div className="text-xs text-industrial-text-secondary font-semibold">Total Siswa</div>
                              </div>
                              <div>
                                  <div className="text-lg font-bold text-industrial-black industrial-mono">{recap.uniqueDates}</div>
                                  <div className="text-xs text-industrial-text-secondary font-semibold">Hari Aktif</div>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                  <div className="text-lg font-bold text-industrial-black industrial-mono">
                                  {recap.totalRecords > 0 && recap.totalStudents > 0 ? 
                                    Math.round(recap.totalRecords / (recap.totalStudents * recap.uniqueDates) * 100) : 0}%
                                </div>
                                  <div className="text-xs text-industrial-text-secondary font-semibold">Partisipasi</div>
                              </div>
                            </div>
                            </CardContent>
                          </Card>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Export Modal - Industrial Minimalism */}
      {showExportModal && (
        <div className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center z-50 p-4">
          <Card variant="industrial" className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
            <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
              <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Export Data Presensi</CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-industrial-black mb-3">Pilih Jenis Export:</label>
              <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-industrial-black cursor-pointer hover:bg-industrial-light">
                  <input
                    type="radio"
                    name="exportType"
                    value="all"
                    checked={exportType === 'all'}
                    onChange={(e) => setExportType(e.target.value as 'all' | 'class' | 'recap')}
                      className="mr-3"
                  />
                  <div>
                      <div className="font-semibold text-industrial-black">Rekap Semua Kelas</div>
                      <div className="text-xs text-industrial-text-secondary">Ringkasan per siswa dari semua kelas</div>
                  </div>
                </label>
                
                  <label className="flex items-center p-3 border-2 border-industrial-black cursor-pointer hover:bg-industrial-light">
                  <input
                    type="radio"
                    name="exportType"
                    value="class"
                    checked={exportType === 'class'}
                    onChange={(e) => setExportType(e.target.value as 'all' | 'class' | 'recap')}
                      className="mr-3"
                  />
                  <div>
                      <div className="font-semibold text-industrial-black">Rekap Per Kelas</div>
                      <div className="text-xs text-industrial-text-secondary">Ringkasan per siswa untuk kelas tertentu</div>
                  </div>
                </label>
                
                {activeTab === 'class-recap' && (
                    <label className="flex items-center p-3 border-2 border-industrial-black cursor-pointer hover:bg-industrial-light">
                    <input
                      type="radio"
                      name="exportType"
                      value="recap"
                      checked={exportType === 'recap'}
                      onChange={(e) => setExportType(e.target.value as 'all' | 'class' | 'recap')}
                        className="mr-3"
                    />
                    <div>
                        <div className="font-semibold text-industrial-black">Statistik Kelas</div>
                        <div className="text-xs text-industrial-text-secondary">Data statistik rekap per kelas</div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Class Selection (when exportType is 'class') */}
            {exportType === 'class' && (
                <div>
                  <label className="block text-sm font-semibold text-industrial-black mb-2">Pilih Kelas:</label>
                <select
                  value={selectedExportClass}
                  onChange={(e) => setSelectedExportClass(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm"
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
              <Card variant="industrial">
                <CardContent className="p-3">
                  <h4 className="font-semibold text-industrial-black mb-2">Format Export:</h4>
                  <div className="text-xs text-industrial-text-secondary space-y-1">
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
                </CardContent>
              </Card>
            </CardContent>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t-2 border-industrial-black">
              <Button
                variant="industrial-secondary"
                size="sm"
                onClick={() => {
                  setShowExportModal(false);
                  setExportType('all');
                  setSelectedExportClass('');
                }}
                className="flex-1 text-xs sm:text-sm order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                variant="industrial-primary"
                size="sm"
                onClick={handleExport}
                disabled={exportType === 'class' && !selectedExportClass}
                className="flex-1 text-xs sm:text-sm order-1 sm:order-2"
              >
                Export Data
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PresensiPage; 