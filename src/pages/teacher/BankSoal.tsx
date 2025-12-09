import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MagnifyingGlass, FileText, List, SquaresFour, Eye, Pencil, Trash, ArrowsDownUp, CheckCircle, WarningCircle, X, FloppyDisk, ArrowClockwise, ChartBar, BookOpen, Users } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { questionBankApi, classApi } from '@/lib/api';

// Interfaces
interface Class {
  id: string;
  name: string;
  description: string;
  studentCount: number;
}

interface Question {
  id: string;
  classId: string;
  category: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  createdAt: string;
  className?: string;
}

interface QuestionForm {
  classId: string;
  category: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
}

interface ReportData {
  totalQuestions: number;
  questionsByDifficulty: Array<{
    difficulty: string;
    count: number;
  }>;
  questionsByClass: Array<{
    className: string;
    count: number;
  }>;
  questionsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

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
        className={`fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 p-3 sm:p-4 shadow-[0_4px_8px_rgba(0,0,0,0.15)] max-w-md sm:max-w-md ${getColors()}`}
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
    {[...Array(5)].map((_, i) => (
      <Card key={i} variant="industrial">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-20 bg-industrial-light"></div>
              <div className="h-6 w-16 bg-industrial-light"></div>
              <div className="h-6 w-24 bg-industrial-light"></div>
            </div>
            <div className="h-6 w-3/4 bg-industrial-light mb-2"></div>
            <div className="h-4 w-full bg-industrial-light mb-3"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-32 bg-industrial-light"></div>
              <div className="h-4 w-24 bg-industrial-light"></div>
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
          <div className="sticky top-0 bg-industrial-white border-b-2 border-industrial-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-industrial-black industrial-h2">{title}</h3>
            <button
              onClick={onClose}
              className="text-industrial-text-secondary hover:text-industrial-black transition-colors p-1 hover:bg-industrial-light"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const BankSoalPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Data states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Form state
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    classId: '',
    category: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'medium'
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
        fetchQuestions()
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

  const fetchQuestions = async () => {
    try {
      const response = await questionBankApi.getAll();
      if (response.success) {
        const questionsWithClassName = (response.questions || []).map((question: Question) => ({
          ...question,
          className: getClassName(question.classId),
          options: Array.isArray(question.options) ? question.options : 
                  (typeof question.options === 'string' ? (question.options as string).split(',') : [])
        }));
        setQuestions(questionsWithClassName);
        calculateReportData(questionsWithClassName);
      } else {
        showNotification('error', 'Gagal memuat daftar soal');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      showNotification('error', 'Gagal memuat daftar soal');
    }
  };

  const calculateReportData = (questionData: Question[]) => {
    // Questions by difficulty
    const difficultyMap = new Map();
    questionData.forEach(question => {
      difficultyMap.set(question.difficulty, (difficultyMap.get(question.difficulty) || 0) + 1);
    });

    // Questions by class
    const classMap = new Map();
    questionData.forEach(question => {
      const className = question.className || 'Unknown';
      classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    // Questions by category
    const categoryMap = new Map();
    questionData.forEach(question => {
      categoryMap.set(question.category, (categoryMap.get(question.category) || 0) + 1);
    });

    setReportData({
      totalQuestions: questionData.length,
      questionsByDifficulty: Array.from(difficultyMap.entries()).map(([difficulty, count]) => ({ difficulty, count })),
      questionsByClass: Array.from(classMap.entries()).map(([className, count]) => ({ className, count })),
      questionsByCategory: Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }))
    });
  };

  const getClassName = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const resetForm = () => {
    setQuestionForm({
      classId: '',
      category: '',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      difficulty: 'medium'
    });
  };

  const handleCreateQuestion = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionForm({
      classId: question.classId,
      category: question.category,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? question.options : 
               (typeof question.options === 'string' ? (question.options as string).split(',') : ['', '', '', '']),
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty
    });
    setShowEditModal(true);
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowViewModal(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionText || !questionForm.classId || !questionForm.category || !questionForm.correctAnswer) {
      showNotification('error', 'Harap isi semua field yang wajib!');
      return;
    }

    setSaving(true);
    try {
      const response = await questionBankApi.create(
        questionForm.classId,
        questionForm.category,
        questionForm.questionText,
        questionForm.options,
        questionForm.correctAnswer,
        questionForm.difficulty
      );

      if (response.success) {
        showNotification('success', 'Soal berhasil dibuat!');
        setShowCreateModal(false);
        resetForm();
        fetchQuestions();
      } else {
        showNotification('error', response.error || 'Gagal membuat soal');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat membuat soal');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion || !questionForm.questionText || !questionForm.classId || !questionForm.category || !questionForm.correctAnswer) {
      showNotification('error', 'Harap isi semua field yang wajib!');
      return;
    }

    setSaving(true);
    try {
      const response = await questionBankApi.update(
        selectedQuestion.id,
        questionForm.category,
        questionForm.questionText,
        questionForm.options,
        questionForm.correctAnswer,
        questionForm.difficulty
      );

      if (response.success) {
        showNotification('success', 'Soal berhasil diperbarui!');
        setShowEditModal(false);
        setSelectedQuestion(null);
        resetForm();
        fetchQuestions();
      } else {
        showNotification('error', response.error || 'Gagal memperbarui soal');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat memperbarui soal');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuestion) return;

    setSaving(true);
    try {
      const response = await questionBankApi.delete(selectedQuestion.id);

      if (response.success) {
        showNotification('success', 'Soal berhasil dihapus!');
        setShowDeleteModal(false);
        setSelectedQuestion(null);
        fetchQuestions();
      } else {
        showNotification('error', response.error || 'Gagal menghapus soal');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menghapus soal');
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="industrial-success" className="text-xs">Mudah</Badge>;
      case 'medium':
        return <Badge variant="industrial-warning" className="text-xs">Sedang</Badge>;
      case 'hard':
        return <Badge variant="industrial-danger" className="text-xs">Sulit</Badge>;
      default:
        return <Badge variant="industrial-secondary" className="text-xs">{difficulty}</Badge>;
    }
  };

  const getTypeLabel = (options: string[]) => {
    const hasOptions = options && options.some(opt => opt.trim() !== '');
    return hasOptions 
      ? <Badge variant="industrial-primary" className="text-xs">Pilihan Ganda</Badge>
      : <Badge variant="industrial-secondary" className="text-xs">Esai</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (question.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.options.some(option => option.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || question.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    const matchesClass = classFilter === 'all' || question.classId === classFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesClass;
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
              <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1">
                Bank Soal
              </h1>
              <p className="text-industrial-text-secondary text-sm sm:text-base">Kelola soal-soal dan bank pertanyaan untuk berbagai mata pelajaran</p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full sm:w-auto"
            >
              <Button 
                variant="industrial-primary"
                onClick={handleCreateQuestion}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Tambah Soal Baru
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation - Industrial Minimalism */}
        <Card variant="industrial" className="mb-4 sm:mb-6">
          <nav className="flex overflow-x-auto border-b-2 border-industrial-black">
            {[
              { id: 'questions', label: 'Daftar Soal', icon: BookOpen },
              { id: 'categories', label: 'Kategori', icon: FileText },
              { id: 'reports', label: 'Laporan', icon: ChartBar }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-industrial-black text-industrial-white bg-industrial-black'
                    : 'border-transparent text-industrial-text-secondary hover:text-industrial-black hover:bg-industrial-light'
                }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </Card>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search and Filters - Industrial Minimalism */}
            <Card variant="industrial">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      variant="industrial"
                      placeholder="Cari soal berdasarkan teks, kategori, atau kelas..."
                      className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select 
                      className="px-2 sm:px-3 py-2 border-2 border-industrial-black bg-industrial-white text-xs sm:text-sm focus:outline-none focus:border-industrial-steel transition-colors flex-1 sm:flex-none min-w-0"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Semua Kategori</option>
                      {Array.from(new Set(questions.map(q => q.category))).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <select 
                      className="px-2 sm:px-3 py-2 border-2 border-industrial-black bg-industrial-white text-xs sm:text-sm focus:outline-none focus:border-industrial-steel transition-colors flex-1 sm:flex-none min-w-0"
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                    >
                      <option value="all">Semua Tingkat</option>
                      <option value="easy">Mudah</option>
                      <option value="medium">Sedang</option>
                      <option value="hard">Sulit</option>
                    </select>
                    <select 
                      className="px-2 sm:px-3 py-2 border-2 border-industrial-black bg-industrial-white text-xs sm:text-sm focus:outline-none focus:border-industrial-steel transition-colors flex-1 sm:flex-none min-w-0"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                      ))}
                    </select>
                    <div className="flex border-2 border-industrial-black overflow-hidden bg-industrial-white">
                      <button 
                        className={`p-1.5 sm:p-2 transition-colors ${viewMode === 'list' ? 'bg-industrial-black text-industrial-white' : 'text-industrial-text-secondary hover:bg-industrial-light'}`}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        className={`p-1.5 sm:p-2 transition-colors ${viewMode === 'grid' ? 'bg-industrial-black text-industrial-white' : 'text-industrial-text-secondary hover:bg-industrial-light'}`}
                        onClick={() => setViewMode('grid')}
                      >
                        <SquaresFour className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    <Button 
                      variant="industrial-secondary"
                      size="sm"
                      onClick={fetchQuestions}
                      className="h-8 sm:h-10 px-2 sm:px-3"
                    >
                      <ArrowClockwise className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions List/Grid - Industrial Minimalism */}
            {viewMode === 'list' ? (
              <Card variant="industrial" className="overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full industrial-table">
                    <thead className="bg-industrial-black">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-industrial-white">Soal</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-industrial-white">
                          <div className="flex items-center gap-1">
                            <span>Kelas</span>
                            <ArrowsDownUp className="w-4 h-4 text-industrial-text-muted" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-industrial-white">
                          <div className="flex items-center gap-1">
                            <span>Kategori</span>
                            <ArrowsDownUp className="w-4 h-4 text-industrial-text-muted" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-industrial-white">Tipe</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-industrial-white">Kesulitan</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-industrial-white">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-industrial-black">
                      {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((question, index) => (
                          <motion.tr
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-industrial-light transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-industrial-black line-clamp-2 max-w-md">
                                {question.questionText}
                              </div>
                              <div className="text-xs text-industrial-text-secondary mt-1">
                                {formatDate(question.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-industrial-black">{question.className}</td>
                            <td className="px-6 py-4 text-sm text-industrial-black">{question.category}</td>
                            <td className="px-6 py-4">{getTypeLabel(question.options)}</td>
                            <td className="px-6 py-4">{getDifficultyLabel(question.difficulty)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="industrial-secondary" 
                                  size="sm"
                                  onClick={() => handleViewQuestion(question)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="industrial-secondary" 
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="industrial-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mb-4">
                                <BookOpen className="w-6 h-6 text-industrial-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-industrial-black industrial-h2 mb-2">
                                Tidak ada soal yang ditemukan
                              </h3>
                              <p className="text-industrial-text-secondary mb-4">
                                Coba ubah filter pencarian atau tambahkan soal baru
                              </p>
                              <Button variant="industrial-primary" onClick={handleCreateQuestion}>
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Soal Pertama
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Industrial Minimalism */}
                <div className="md:hidden">
                  {filteredQuestions.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {filteredQuestions.map((question, index) => (
                        <Card key={question.id} variant="industrial">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3 border-b-2 border-industrial-black pb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-industrial-black line-clamp-2 mb-2">
                                  {question.questionText}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {getTypeLabel(question.options)}
                                  {getDifficultyLabel(question.difficulty)}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 ml-2">
                                <Button
                                  variant="industrial-secondary"
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => handleViewQuestion(question)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="industrial-secondary"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="industrial-danger"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-industrial-text-secondary">
                              <div className="flex items-center">
                                <span className="font-semibold">Kelas:</span>
                                <span className="ml-1">{question.className}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold">Kategori:</span>
                                <span className="ml-1">{question.category}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold">Dibuat:</span>
                                <span className="ml-1">{formatDate(question.createdAt)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card variant="industrial">
                      <CardContent className="p-6 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mb-4">
                            <BookOpen className="w-6 h-6 text-industrial-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-industrial-black industrial-h2 mb-2">
                            Tidak ada soal yang ditemukan
                          </h3>
                          <p className="text-industrial-text-secondary mb-4 text-sm">
                            Coba ubah filter pencarian atau tambahkan soal baru
                          </p>
                          <Button variant="industrial-primary" onClick={handleCreateQuestion} className="h-10 text-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Soal Pertama
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question, index) => (
                    <Card
                      key={question.id}
                      variant="industrial"
                      className="group overflow-hidden"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-3 sm:mb-4 border-b-2 border-industrial-black pb-3">
                          <div className="flex flex-wrap gap-2">
                            {getTypeLabel(question.options)}
                            {getDifficultyLabel(question.difficulty)}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="industrial-secondary" 
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="industrial-danger" 
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleDeleteQuestion(question)}
                            >
                              <Trash className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-industrial-black line-clamp-3 mb-3 min-h-[3.5rem] sm:min-h-[4.5rem] text-sm sm:text-base">
                          {question.questionText}
                        </h3>
                        
                        <div className="space-y-2 text-xs sm:text-sm text-industrial-text-secondary">
                          <div className="flex justify-between">
                            <span className="font-semibold">Kelas:</span>
                            <span>{question.className}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Kategori:</span>
                            <span>{question.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Pilihan:</span>
                            <span>{question.options.filter(opt => opt.trim()).length}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-industrial-black">
                          <Button
                            variant="industrial-secondary"
                            size="sm"
                            className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                            onClick={() => handleViewQuestion(question)}
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Lihat Detail
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card variant="industrial" className="col-span-full">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-industrial-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-industrial-black industrial-h2 mb-2">Tidak ada soal yang ditemukan</h3>
                      <p className="text-industrial-text-secondary mb-4 sm:mb-6 text-sm sm:text-base">Coba ubah filter atau tambahkan soal baru untuk memulai</p>
                      <Button variant="industrial-primary" onClick={handleCreateQuestion} className="h-9 sm:h-10 text-sm sm:text-base">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Tambah Soal Pertama
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {classes.map((classItem, index) => (
                <Card
                  key={classItem.id}
                  variant="industrial"
                  className="overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3 sm:mb-4 border-b-2 border-industrial-black pb-3">
                      <div className="p-2 bg-industrial-black border-2 border-industrial-black">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                      </div>
                      <Badge variant="industrial-primary" className="text-xs">
                        {questions.filter(q => q.classId === classItem.id).length} soal
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-industrial-black mb-2 text-sm sm:text-base industrial-h3">{classItem.name}</h3>
                    <p className="text-xs sm:text-sm text-industrial-text-secondary mb-3 sm:mb-4 line-clamp-2">{classItem.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="industrial-secondary" 
                        size="sm" 
                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => {
                          setClassFilter(classItem.id);
                          setActiveTab('questions');
                        }}
                      >
                        Lihat Soal
                      </Button>
                      <Button 
                        variant="industrial-primary"
                        size="sm" 
                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => {
                          setQuestionForm(prev => ({ ...prev, classId: classItem.id }));
                          handleCreateQuestion();
                        }}
                      >
                        Buat Soal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && reportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Summary Cards - Industrial Minimalism */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
              <Card variant="industrial">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Total Soal</p>
                      <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono">{reportData.totalQuestions}</p>
                    </div>
                    <div className="bg-industrial-black border-2 border-industrial-black p-2 sm:p-3">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="industrial">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Total Kategori</p>
                      <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono">{reportData.questionsByCategory.length}</p>
                    </div>
                    <div className="bg-industrial-black border-2 border-industrial-black p-2 sm:p-3">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="industrial">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-industrial-text-secondary">Kelas Aktif</p>
                      <p className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-mono">{reportData.questionsByClass.length}</p>
                    </div>
                    <div className="bg-industrial-black border-2 border-industrial-black p-2 sm:p-3">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section - Industrial Minimalism */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Questions by Difficulty */}
              <Card variant="industrial">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Distribusi Tingkat Kesulitan</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {reportData.questionsByDifficulty.map((item) => (
                      <div key={item.difficulty} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getDifficultyLabel(item.difficulty)}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-industrial-black industrial-mono">{item.count} soal</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Questions by Category */}
              <Card variant="industrial">
                <CardHeader className="p-4 sm:p-6 border-b-2 border-industrial-black">
                  <CardTitle className="text-base sm:text-lg text-industrial-black industrial-h2">Distribusi Kategori</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {reportData.questionsByCategory.slice(0, 5).map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-industrial-text-secondary truncate">{item.category}</span>
                        <span className="text-xs sm:text-sm font-semibold text-industrial-black industrial-mono flex-shrink-0 ml-2">{item.count} soal</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Question Modal - Industrial Minimalism */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Soal Baru"
        size="large"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Kelas <span className="text-industrial-red">*</span>
              </label>
              <select
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel transition-colors"
                value={questionForm.classId}
                onChange={(e) => setQuestionForm({ ...questionForm, classId: e.target.value })}
              >
                <option value="">Pilih Kelas</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Kategori <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="text"
                value={questionForm.category}
                onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                placeholder="Contoh: Aljabar, Kalkulus, dll"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-industrial-black mb-2">
              Pertanyaan <span className="text-industrial-red">*</span>
            </label>
            <textarea
              className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 h-24 focus:outline-none focus:border-industrial-steel transition-colors resize-none"
              value={questionForm.questionText}
              onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
              placeholder="Tulis soal di sini..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-industrial-black mb-2">
              Pilihan Jawaban (kosongkan jika soal esai)
            </label>
            <div className="space-y-3">
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-industrial-text-secondary w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input
                    variant="industrial"
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Jawaban Benar <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="text"
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                placeholder="Jawaban yang benar"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Tingkat Kesulitan <span className="text-industrial-red">*</span>
              </label>
              <select
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel transition-colors"
                value={questionForm.difficulty}
                onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
              >
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-industrial-black">
            <Button
              variant="industrial-secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleSaveQuestion}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                <>
                  <FloppyDisk className="w-4 h-4 mr-2" />
                  Simpan Soal
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Question Modal - Industrial Minimalism */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Soal"
        size="large"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Kelas <span className="text-industrial-red">*</span>
              </label>
              <select
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel transition-colors"
                value={questionForm.classId}
                onChange={(e) => setQuestionForm({ ...questionForm, classId: e.target.value })}
              >
                <option value="">Pilih Kelas</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Kategori <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="text"
                value={questionForm.category}
                onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                placeholder="Contoh: Aljabar, Kalkulus, dll"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-industrial-black mb-2">
              Pertanyaan <span className="text-industrial-red">*</span>
            </label>
            <textarea
              className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 h-24 focus:outline-none focus:border-industrial-steel transition-colors resize-none"
              value={questionForm.questionText}
              onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
              placeholder="Tulis soal di sini..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-industrial-black mb-2">
              Pilihan Jawaban (kosongkan jika soal esai)
            </label>
            <div className="space-y-3">
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-industrial-text-secondary w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input
                    variant="industrial"
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Jawaban Benar <span className="text-industrial-red">*</span>
              </label>
              <Input
                variant="industrial"
                type="text"
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                placeholder="Jawaban yang benar"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-industrial-black mb-2">
                Tingkat Kesulitan <span className="text-industrial-red">*</span>
              </label>
              <select
                className="w-full border-2 border-industrial-black bg-industrial-white px-3 py-2 focus:outline-none focus:border-industrial-steel transition-colors"
                value={questionForm.difficulty}
                onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
              >
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-industrial-black">
            <Button
              variant="industrial-secondary"
              onClick={() => setShowEditModal(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              variant="industrial-primary"
              onClick={handleUpdateQuestion}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                <>
                  <FloppyDisk className="w-4 h-4 mr-2" />
                  Update Soal
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Question Modal - Industrial Minimalism */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Soal"
        size="large"
      >
        {selectedQuestion && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="industrial">
                <CardContent className="p-4">
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-1">Kelas</label>
                  <p className="text-sm font-semibold text-industrial-black">{selectedQuestion.className}</p>
                </CardContent>
              </Card>
              <Card variant="industrial">
                <CardContent className="p-4">
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-1">Kategori</label>
                  <p className="text-sm font-semibold text-industrial-black">{selectedQuestion.category}</p>
                </CardContent>
              </Card>
            </div>

            <Card variant="industrial">
              <CardContent className="p-4">
                <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Pertanyaan</label>
                <p className="text-industrial-black leading-relaxed">{selectedQuestion.questionText}</p>
              </CardContent>
            </Card>

            {selectedQuestion.options && selectedQuestion.options.some(opt => opt.trim()) && (
              <div>
                <label className="block text-sm font-semibold text-industrial-black mb-3">Pilihan Jawaban</label>
                <div className="space-y-2">
                  {selectedQuestion.options.filter(opt => opt.trim()).map((option, index) => (
                    <Card key={index} variant="industrial">
                      <CardContent className="p-3">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-industrial-black w-8 flex-shrink-0">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-sm text-industrial-black">{option}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="industrial">
                <CardContent className="p-4">
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-1">Jawaban Benar</label>
                  <p className="text-sm font-semibold text-industrial-black">{selectedQuestion.correctAnswer}</p>
                </CardContent>
              </Card>
              <Card variant="industrial">
                <CardContent className="p-4">
                  <label className="block text-sm font-semibold text-industrial-text-secondary mb-2">Tingkat Kesulitan</label>
                  <div>{getDifficultyLabel(selectedQuestion.difficulty)}</div>
                </CardContent>
              </Card>
            </div>

            <Card variant="industrial">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-sm font-semibold text-industrial-text-secondary mb-1">Dibuat pada</label>
                    <p className="text-sm text-industrial-black">{formatDate(selectedQuestion.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-industrial-text-secondary mb-1">Tipe Soal</label>
                    <div>{getTypeLabel(selectedQuestion.options)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-industrial-black">
              <Button
                variant="industrial-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Tutup
              </Button>
              <Button
                variant="industrial-primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditQuestion(selectedQuestion);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Soal
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Question Modal - Industrial Minimalism */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Soal"
      >
        {selectedQuestion && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-industrial-black border-2 border-industrial-black flex items-center justify-center mx-auto mb-4">
                <WarningCircle className="w-8 h-8 text-industrial-white" />
              </div>
              <h3 className="text-lg font-semibold text-industrial-black industrial-h2 mb-2">
                Apakah Anda yakin ingin menghapus soal ini?
              </h3>
              <Card variant="industrial" className="mb-4">
                <CardContent className="p-4">
                  <p className="text-sm text-industrial-black line-clamp-3">
                    "{selectedQuestion.questionText}"
                  </p>
                </CardContent>
              </Card>
              <p className="text-sm text-industrial-red font-semibold">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-industrial-black">
              <Button
                variant="industrial-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                variant="industrial-danger"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-industrial-white border-t-transparent rounded-full animate-spin" />
                    Menghapus...
                  </div>
                ) : (
                  <>
                    <Trash className="w-4 h-4 mr-2" />
                    Hapus Soal
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BankSoalPage; 