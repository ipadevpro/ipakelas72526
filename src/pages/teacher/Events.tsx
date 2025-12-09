import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MagnifyingGlass, Calendar, Clock, Pencil, Trash, Eye, CalendarBlank, Users, CheckCircle, X, FloppyDisk, WarningCircle, ArrowClockwise, ChartBar } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { classApi, eventApi } from '@/lib/api';

// Interfaces
interface Class {
  id: string;
  name: string;
  description: string;
  studentCount: number;
}

interface Event {
  id: string;
  classId: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  createdAt: string;
  className?: string;
}

interface EventForm {
  classId: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
}

interface ReportData {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByType: Array<{
    type: string;
    count: number;
  }>;
  eventsByClass: Array<{
    className: string;
    count: number;
  }>;
  eventsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

// Event types
const EVENT_TYPES = [
  { value: 'ujian', label: 'Ujian', icon: '📝', color: 'bg-red-100 text-red-700' },
  { value: 'tugas', label: 'Tugas', icon: '📚', color: 'bg-blue-100 text-blue-700' },
  { value: 'presentasi', label: 'Presentasi', icon: '🎤', color: 'bg-purple-100 text-purple-700' },
  { value: 'praktikum', label: 'Praktikum', icon: '🔬', color: 'bg-green-100 text-green-700' },
  { value: 'karyawisata', label: 'Karyawisata', icon: '🚌', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'olahraga', label: 'Olahraga', icon: '⚽', color: 'bg-orange-100 text-orange-700' },
  { value: 'seminar', label: 'Seminar', icon: '🎓', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'lainnya', label: 'Lainnya', icon: '📅', color: 'bg-gray-100 text-gray-700' }
];

// Enhanced Notification Toast Component
const NotificationToast = ({ notification, onClose }: {
  notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; visible: boolean };
  onClose: () => void;
}) => {
  if (!notification.visible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'error': return <WarningCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'warning': return <WarningCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'info': return <WarningCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'bg-industrial-white border-2 border-industrial-black text-industrial-black';
      case 'error': return 'bg-industrial-white border-2 border-industrial-red text-industrial-red';
      case 'warning': return 'bg-industrial-white border-2 border-industrial-black text-industrial-black';
      case 'info': return 'bg-industrial-white border-2 border-industrial-steel text-industrial-black';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 p-3 sm:p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)] max-w-md ${getColors()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">{getIcon()}</div>
            <span className="ml-2 font-semibold text-sm sm:text-base truncate">{notification.message}</span>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-industrial-text-secondary hover:text-industrial-black transition-opacity flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Loading Skeleton Component - Industrial Minimalism
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} variant="industrial">
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 sm:h-6 w-16 sm:w-20 bg-industrial-light"></div>
              <div className="h-5 sm:h-6 w-12 sm:w-16 bg-industrial-light"></div>
            </div>
            <div className="h-5 sm:h-6 w-3/4 bg-industrial-light mb-2"></div>
            <div className="h-3 sm:h-4 w-full bg-industrial-light mb-3"></div>
            <div className="flex items-center gap-4">
              <div className="h-3 sm:h-4 w-24 sm:w-32 bg-industrial-light"></div>
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-industrial-light"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
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
  if (!isOpen) return null;

  const sizeClasses = {
    default: 'max-w-md',
    large: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-industrial-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`bg-industrial-white border-2 border-industrial-black shadow-[0_8px_16px_rgba(0,0,0,0.3)] ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden mx-4 flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 bg-industrial-white border-b-2 border-industrial-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2">{title}</h3>
            <button
              onClick={onClose}
              className="text-industrial-text-secondary hover:text-industrial-black transition-colors p-1 hover:bg-industrial-light"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              {children}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const EventsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Form state
  const [eventForm, setEventForm] = useState<EventForm>({
    classId: '',
    title: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: 'lainnya'
  });

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    visible: boolean;
  }>({
    type: 'success',
    message: '',
    visible: false
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showNotification('error', 'Gagal memuat data awal');
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
        showNotification('error', 'Gagal memuat daftar kelas');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      showNotification('error', 'Gagal memuat daftar kelas');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getAll();
      if (response.success) {
        const eventsWithClass = (response.events || []).map((event: Event) => ({
          ...event,
          className: getClassName(event.classId)
        }));
        setEvents(eventsWithClass);
        calculateReportData(eventsWithClass);
      } else {
        showNotification('error', 'Gagal memuat daftar kegiatan');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('error', 'Gagal memuat daftar kegiatan');
    }
  };

  const calculateReportData = (eventData: Event[]) => {
    const now = new Date();
    const upcoming = eventData.filter(event => new Date(event.eventDate) >= now);
    const past = eventData.filter(event => new Date(event.eventDate) < now);

    // Events by type
    const typeMap = new Map();
    eventData.forEach(event => {
      typeMap.set(event.eventType, (typeMap.get(event.eventType) || 0) + 1);
    });

    // Events by class
    const classMap = new Map();
    eventData.forEach(event => {
      const className = event.className || 'Unknown';
      classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    // Events by month
    const monthMap = new Map();
    eventData.forEach(event => {
      const month = new Date(event.eventDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });

    setReportData({
      totalEvents: eventData.length,
      upcomingEvents: upcoming.length,
      pastEvents: past.length,
      eventsByType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      eventsByClass: Array.from(classMap.entries()).map(([className, count]) => ({ className, count })),
      eventsByMonth: Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }))
    });
  };

  const getClassName = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES.find(t => t.value === 'lainnya')!;
  };

  const resetForm = () => {
    setEventForm({
      classId: '',
      title: '',
      description: '',
      eventDate: new Date().toISOString().split('T')[0],
      eventType: 'lainnya'
    });
  };

  const handleCreateEvent = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEventForm({
      classId: event.classId,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      eventType: event.eventType
    });
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.classId || !eventForm.eventDate) {
      showNotification('error', 'Harap isi semua field yang wajib!');
      return;
    }

    setSaving(true);
    try {
      const response = await eventApi.create(
        eventForm.classId,
        eventForm.title,
        eventForm.description,
        eventForm.eventDate,
        eventForm.eventType
      );

      if (response.success) {
        showNotification('success', 'Kegiatan berhasil dibuat!');
        setShowCreateModal(false);
        resetForm();
        fetchEvents();
      } else {
        showNotification('error', response.error || 'Gagal membuat kegiatan');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat membuat kegiatan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !eventForm.title || !eventForm.classId || !eventForm.eventDate) {
      showNotification('error', 'Harap isi semua field yang wajib!');
      return;
    }

    setSaving(true);
    try {
      const response = await eventApi.update(
        selectedEvent.id,
        eventForm.title,
        eventForm.description,
        eventForm.eventDate,
        eventForm.eventType
      );

      if (response.success) {
        showNotification('success', 'Kegiatan berhasil diperbarui!');
        setShowEditModal(false);
        setSelectedEvent(null);
        resetForm();
        fetchEvents();
      } else {
        showNotification('error', response.error || 'Gagal memperbarui kegiatan');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat memperbarui kegiatan');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;

    setSaving(true);
    try {
      const response = await eventApi.delete(selectedEvent.id);

      if (response.success) {
        showNotification('success', 'Kegiatan berhasil dihapus!');
        setShowDeleteModal(false);
        setSelectedEvent(null);
        fetchEvents();
      } else {
        showNotification('error', response.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menghapus kegiatan');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isEventUpcoming = (eventDate: string) => {
    return new Date(eventDate) >= new Date();
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.className || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'upcoming' && isEventUpcoming(event.eventDate)) ||
                         (filter === 'past' && !isEventUpcoming(event.eventDate)) ||
                         event.classId === filter;

    const matchesType = typeFilter === 'all' || event.eventType === typeFilter;
    
    return matchesSearch && matchesFilter && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        <NotificationToast 
          notification={notification} 
          onClose={() => setNotification(prev => ({ ...prev, visible: false }))} 
        />

        {/* Header - Industrial Minimalism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1">
              Kegiatan
            </h1>
            <p className="text-industrial-text-secondary mt-1 text-sm sm:text-base">Kelola jadwal dan kegiatan kelas</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="industrial-secondary"
              onClick={fetchEvents}
              className="h-10 sm:h-11 text-sm sm:text-base"
            >
              <ArrowClockwise className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleCreateEvent}
              className="h-10 sm:h-11 text-sm sm:text-base"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Tambah Kegiatan
            </Button>
          </div>
        </motion.div>

        {/* Navigation Tabs - Industrial Minimalism */}
        <Card variant="industrial" className="mb-4 sm:mb-6 inline-flex overflow-x-auto">
          <div className="flex border-b-2 border-industrial-black">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-industrial-black text-industrial-white'
                  : 'text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
              }`}
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Daftar Kegiatan
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-industrial-black text-industrial-white'
                  : 'text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
              }`}
            >
              <ChartBar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Laporan
            </button>
          </div>
        </Card>

        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Search and Filter - Industrial Minimalism */}
            <Card variant="industrial">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4" />
                      <Input
                        variant="industrial"
                        placeholder="Cari kegiatan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 sm:px-4 py-2 border-2 border-industrial-black bg-industrial-white text-xs sm:text-sm focus:outline-none focus:border-industrial-steel flex-1 sm:flex-none min-w-0"
                    >
                      <option value="all">Semua Waktu</option>
                      <option value="upcoming">Mendatang</option>
                      <option value="past">Sudah Lewat</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 sm:px-4 py-2 border-2 border-industrial-black bg-industrial-white text-xs sm:text-sm focus:outline-none focus:border-industrial-steel flex-1 sm:flex-none min-w-0"
                    >
                      <option value="all">Semua Jenis</option>
                      {EVENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events List - Industrial Minimalism */}
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <Card variant="industrial">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-industrial-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2 mb-2">Belum ada kegiatan</h3>
                    <p className="text-industrial-text-secondary mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                      {searchQuery || filter !== 'all' || typeFilter !== 'all' 
                        ? 'Tidak ada kegiatan yang sesuai dengan filter yang dipilih'
                        : 'Mulai dengan membuat kegiatan pertama Anda'
                      }
                    </p>
                    {(!searchQuery && filter === 'all' && typeFilter === 'all') && (
                      <Button 
                        variant="industrial-primary"
                        onClick={handleCreateEvent} 
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Tambah Kegiatan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <motion.div 
                  className="grid gap-4"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {filteredEvents.map((event) => {
                    const typeInfo = getEventTypeInfo(event.eventType);
                    const upcoming = isEventUpcoming(event.eventDate);
                    
                    return (
                      <Card key={event.id} variant="industrial" className="group overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-industrial-black pb-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="industrial-secondary" className="text-xs">
                                  {typeInfo.label}
                                </Badge>
                                <Badge variant={upcoming ? "industrial-success" : "industrial-secondary"} className="text-xs">
                                  {upcoming ? 'Mendatang' : 'Sudah Lewat'}
                                </Badge>
                              </div>
                              <h3 className="text-lg sm:text-xl font-semibold text-industrial-black industrial-h2 mb-2 line-clamp-2">
                                {event.title}
                              </h3>
                              <p className="text-industrial-text-secondary mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">{event.description}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-industrial-text-secondary">
                                <div className="flex items-center">
                                  <CalendarBlank className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{formatDate(event.eventDate)}</span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{event.className}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="industrial-secondary"
                                size="sm"
                                onClick={() => handleViewEvent(event)}
                                className="h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="industrial-secondary"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                                className="h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="industrial-danger"
                                size="sm"
                                onClick={() => handleDeleteEvent(event)}
                                className="h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && reportData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards - Industrial Minimalism */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
              <Card variant="industrial">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Total Kegiatan</p>
                      <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono">{reportData.totalEvents}</p>
                    </div>
                    <div className="bg-industrial-black border-2 border-industrial-black p-2 sm:p-3">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="industrial">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Kegiatan Mendatang</p>
                      <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono">{reportData.upcomingEvents}</p>
                    </div>
                    <div className="bg-industrial-black border-2 border-industrial-black p-2 sm:p-3">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="industrial">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Kegiatan Selesai</p>
                      <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono">{reportData.pastEvents}</p>
                    </div>
                    <div className="bg-industrial-black border-2 border-industrial-black p-2 sm:p-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts - Industrial Minimalism */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Events by Type */}
              <Card variant="industrial">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Kegiatan per Jenis</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {reportData.eventsByType.map(({ type, count }) => {
                      const typeInfo = getEventTypeInfo(type);
                      const percentage = Math.round((count / reportData.totalEvents) * 100);
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <Badge variant="industrial-secondary" className="text-xs mr-3 flex-shrink-0">
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            <div className="w-16 sm:w-24 bg-industrial-light border-2 border-industrial-black h-2 mr-2 sm:mr-3">
                              <div 
                                className="bg-industrial-black h-2" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-industrial-black industrial-mono w-6 sm:w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Events by Class */}
              <Card variant="industrial">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Kegiatan per Kelas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {reportData.eventsByClass.map(({ className, count }) => {
                      const percentage = Math.round((count / reportData.totalEvents) * 100);
                      return (
                        <div key={className} className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-industrial-black truncate">{className}</span>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            <div className="w-16 sm:w-24 bg-industrial-light border-2 border-industrial-black h-2 mr-2 sm:mr-3">
                              <div 
                                className="bg-industrial-steel h-2" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-industrial-black industrial-mono w-6 sm:w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events by Month - Industrial Minimalism */}
            <Card variant="industrial">
              <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Kegiatan per Bulan</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {reportData.eventsByMonth.map(({ month, count }) => (
                    <Card key={month} variant="industrial">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-industrial-black truncate">{month}</span>
                          <span className="text-xs sm:text-sm font-bold text-industrial-black industrial-mono flex-shrink-0 ml-2">{count}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Event Modal - Industrial Minimalism */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tambah Kegiatan Baru"
        >
          <div className="space-y-4 sm:space-y-6 min-h-0">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Kelas <span className="text-industrial-red">*</span>
              </label>
              <select
                value={eventForm.classId}
                onChange={(e) => setEventForm({ ...eventForm, classId: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm sm:text-base"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Judul Kegiatan <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Masukkan judul kegiatan"
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Jenis Kegiatan
              </label>
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm sm:text-base"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Tanggal Kegiatan <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Deskripsi
              </label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Masukkan deskripsi kegiatan"
                rows={4}
                className="w-full px-3 py-2 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm sm:text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-industrial-black">
              <Button
                variant="industrial-secondary"
                onClick={() => setShowCreateModal(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                variant="industrial-primary"
                onClick={handleSaveEvent}
                disabled={saving}
                className="w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-industrial-white border-t-transparent mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <FloppyDisk className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Event Modal - Industrial Minimalism */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Kegiatan"
        >
          <div className="space-y-4 sm:space-y-6 min-h-0">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Kelas <span className="text-industrial-red">*</span>
              </label>
              <select
                value={eventForm.classId}
                onChange={(e) => setEventForm({ ...eventForm, classId: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm sm:text-base"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Judul Kegiatan <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Masukkan judul kegiatan"
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Jenis Kegiatan
              </label>
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm sm:text-base"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Tanggal Kegiatan <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Deskripsi
              </label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Masukkan deskripsi kegiatan"
                rows={4}
                className="w-full px-3 py-2 border-2 border-industrial-black bg-industrial-white focus:outline-none focus:border-industrial-steel text-sm sm:text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-industrial-black">
              <Button
                variant="industrial-secondary"
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                variant="industrial-primary"
                onClick={handleUpdateEvent}
                disabled={saving}
                className="w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-industrial-white border-t-transparent mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <FloppyDisk className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Event Modal - Industrial Minimalism */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Detail Kegiatan"
        >
          {selectedEvent && (
            <div className="space-y-4 sm:space-y-6 min-h-0">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Judul</label>
                  <p className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2">{selectedEvent.title}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Kelas</label>
                    <p className="font-semibold text-industrial-black">{selectedEvent.className}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Jenis</label>
                    <div className="flex items-center">
                      {(() => {
                        const typeInfo = getEventTypeInfo(selectedEvent.eventType);
                        return (
                          <Badge variant="industrial-secondary" className="text-xs">
                            {typeInfo.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Tanggal</label>
                  <p className="font-semibold text-industrial-black">{formatDate(selectedEvent.eventDate)}</p>
                  <p className="text-xs sm:text-sm text-industrial-text-secondary mt-1">
                    {isEventUpcoming(selectedEvent.eventDate) ? 'Mendatang' : 'Sudah Lewat'}
                  </p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Deskripsi</label>
                    <Card variant="industrial">
                      <CardContent className="p-3">
                        <p className="text-industrial-black whitespace-pre-wrap text-sm sm:text-base">{selectedEvent.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Dibuat</label>
                  <p className="text-xs sm:text-sm text-industrial-text-secondary">{formatTime(selectedEvent.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-industrial-black">
                <Button
                  variant="industrial-secondary"
                  onClick={() => setShowDetailModal(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Tutup
                </Button>
                <Button
                  variant="industrial-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditEvent(selectedEvent);
                  }}
                  className="w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
                >
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal - Industrial Minimalism */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Konfirmasi Hapus"
        >
          {selectedEvent && (
            <div className="space-y-4 sm:space-y-6 min-h-0">
              <div className="flex items-center text-industrial-red mb-4">
                <WarningCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                <span className="font-semibold text-sm sm:text-base">Peringatan!</span>
              </div>
              <p className="text-industrial-black text-sm sm:text-base">
                Apakah Anda yakin ingin menghapus kegiatan <strong>"{selectedEvent.title}"</strong>?
              </p>
              <p className="text-xs sm:text-sm text-industrial-text-secondary">
                Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-industrial-black">
                <Button
                  variant="industrial-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Batal
                </Button>
                <Button
                  variant="industrial-danger"
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-industrial-white border-t-transparent mr-2"></div>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default EventsPage; 