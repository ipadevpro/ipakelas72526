import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { authApi, getCurrentUser } from '@/lib/api';
import { 
  GraduationCap, 
  BookOpen, 
  ArrowClockwise, 
  Eye, 
  EyeSlash,
  User,
  Lock,
  ArrowRight,
  Shield,
  Users
} from 'phosphor-react';
import { useAuthStore } from '@/store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [showAdmin, setShowAdmin] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      // User is already logged in, redirect to appropriate dashboard
      if (user.role === 'teacher') {
        navigate('/guru');
      } else if (user.role === 'student') {
        navigate('/siswa');
      }
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.username || !form.password) {
      setError('Username dan password harus diisi');
      setLoading(false);
      return;
    }

    try {
      // Kirim data ke backend Google Apps Script
      const data = await authApi.login(form.username, form.password);
      
      if (data.success) {
        // Session dan user data disimpan di localStorage via authApi.login
        
        // Redirect ke dashboard sesuai role
        if (data.user.role === 'teacher') {
          navigate('/guru');
        } else if (data.user.role === 'student') {
          // Pastikan siswa diarahkan ke dashboard siswa
          navigate('/siswa');
        } else {
          setError('Tipe user tidak valid.');
        }
      } else {
        // Tampilkan pesan error spesifik
        setError('Username atau password tidak valid. Silakan coba lagi.');
        console.error('Login error:', data.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server. Silakan coba beberapa saat lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: 'teacher' | 'student') => {
    setActiveTab(tab);
    setForm({ username: '', password: '' });
    setError('');
  };

  // Verify student data - for admin only
  const verifyStudentData = async () => {
    setVerifying(true);
    setVerificationResult('');
    try {
      const result = await authApi.verifyStudents();
      if (result.success) {
        setVerificationResult(`Verifikasi berhasil: ${result.message}`);
      } else {
        setVerificationResult(`Verifikasi gagal: ${result.error}`);
      }
    } catch (err) {
      setVerificationResult('Terjadi kesalahan saat melakukan verifikasi');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  // Toggle admin panel on pressing Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdmin(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-industrial-white flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative"
      >
        {/* Header - Neo-Brutalism */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <Card variant="industrial" className="p-6 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-industrial-black industrial-h1 mb-2">
              Kelas Guru
            </h1>
            <p className="text-base sm:text-lg text-industrial-text-secondary">
              Platform manajemen pembelajaran
            </p>
          </Card>
        </motion.div>

        {/* Role selection tabs - Neo-Brutalism */}
        <motion.div variants={itemVariants} className="mb-4">
          <Card variant="industrial" className="p-1">
            <div className="flex gap-1">
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all duration-200 text-sm font-semibold ${
                  activeTab === 'teacher' 
                    ? 'bg-industrial-black text-industrial-white shadow-brutal-sm' 
                    : 'bg-industrial-white text-industrial-black border-2 border-industrial-black hover:bg-industrial-light'
                }`}
                onClick={() => switchTab('teacher')}
              >
                <BookOpen size={18} weight="bold" />
                <span>Guru</span>
              </button>
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all duration-200 text-sm font-semibold ${
                  activeTab === 'student' 
                    ? 'bg-industrial-black text-industrial-white shadow-brutal-sm' 
                    : 'bg-industrial-white text-industrial-black border-2 border-industrial-black hover:bg-industrial-light'
                }`}
                onClick={() => switchTab('student')}
              >
                <GraduationCap size={18} weight="bold" />
                <span>Siswa</span>
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Login Card - Neo-Brutalism */}
        <motion.div variants={itemVariants}>
          <Card variant="industrial" className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">

              <div className="text-center mb-4 pb-4 border-b-2 border-industrial-black">
                <p className="text-sm text-industrial-text-secondary">
                  {activeTab === 'teacher' 
                    ? 'Masuk ke dashboard guru untuk mengelola kelas dan siswa'
                    : 'Masuk ke dashboard siswa untuk melihat progress belajar'
                  }
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Username Field - Neo-Brutalism */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-industrial-black">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4" weight="bold" />
                    <Input
                      variant="industrial"
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder={activeTab === 'teacher' ? 'Masukkan username guru' : 'Masukkan username siswa'}
                      className="pl-10 h-10 text-sm"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field - Neo-Brutalism */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-industrial-black">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4" weight="bold" />
                    <Input
                      variant="industrial"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Masukkan password"
                      className="pl-10 pr-10 h-10 text-sm"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted hover:text-industrial-black transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeSlash className="w-4 h-4" weight="bold" />
                      ) : (
                        <Eye className="w-4 h-4" weight="bold" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message - Neo-Brutalism */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-industrial-white border-2 border-industrial-red text-industrial-red px-3 py-2 text-sm font-semibold shadow-brutal-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Button - Neo-Brutalism */}
                <Button
                  type="submit"
                  variant="industrial-primary"
                  className="w-full h-10 text-sm font-semibold"
                  disabled={loading || !form.username || !form.password}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Masuk...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Masuk</span>
                      <ArrowRight className="w-4 h-4" weight="bold" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Panel - Hidden by default */}
        <AnimatePresence>
          {showAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4 sm:mt-6"
            >
              <Card variant="industrial" className="border-2 border-industrial-yellow bg-industrial-yellow">
                <CardHeader className="pb-3 border-b-2 border-industrial-black">
                  <CardTitle className="text-lg flex items-center gap-2 text-industrial-black font-semibold">
                    <Shield className="w-5 h-5" weight="bold" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription className="text-industrial-black text-sm font-semibold">
                    Panel administratif untuk verifikasi sistem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={verifyStudentData}
                    disabled={verifying}
                    variant="industrial-secondary"
                    className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold"
                  >
                    {verifying ? (
                      <div className="flex items-center gap-2">
                        <ArrowClockwise className="w-4 h-4 animate-spin" weight="bold" />
                        <span>Memverifikasi...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" weight="bold" />
                        <span>Verifikasi Data Siswa</span>
                      </div>
                    )}
                  </Button>
                  
                  <AnimatePresence>
                    {verificationResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-industrial-white border-2 border-industrial-black p-3 text-sm text-industrial-black font-semibold shadow-brutal-sm"
                      >
                        {verificationResult}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <p className="text-xs text-industrial-black text-center font-semibold">
                    Press Ctrl+Shift+A to toggle this panel
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login; 