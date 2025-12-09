import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  GraduationCap, 
  BookOpen, 
  User,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  UserPlus,
  Shield
} from 'phosphor-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student', // Default role adalah student
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi form
    if (!form.fullName || !form.username || !form.password || !form.confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      // Since there's no register endpoint yet, we'll simulate a successful registration
      // In a real app, this would be: const data = await authApi.register(...)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just redirect to login with success message
      // TODO: Implement actual registration endpoint in the backend
      console.log('Registration would be:', {
        username: form.username,
        fullName: form.fullName,
        role: form.role
      });
      
      // Simulate successful registration
      navigate('/login', { 
        state: { message: 'Pendaftaran berhasil! Silakan login dengan akun Anda.' }
      });
      
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-industrial-green border-2 border-industrial-black flex items-center justify-center mx-auto mb-4 shadow-brutal">
            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-industrial-black" weight="bold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-industrial-black industrial-h1 mb-2">Daftar Akun</h1>
          <p className="text-sm sm:text-base text-industrial-text-secondary">Bergabung dengan platform pembelajaran modern</p>
        </motion.div>

        {/* Register Card - Neo-Brutalism */}
        <motion.div variants={itemVariants}>
          <Card variant="industrial" className="w-full max-w-md mx-auto">
            <CardHeader className="pb-4 sm:pb-6 border-b-2 border-industrial-black">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-industrial-black industrial-h2">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-industrial-green" weight="bold" />
                <span>Buat Akun Baru</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-industrial-text-secondary">
                Isi data diri Anda untuk membuat akun baru di Kelas Guru
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Full Name Field - Neo-Brutalism */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-industrial-black">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                    <Input
                      variant="industrial"
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap Anda"
                      className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Role Selection - Neo-Brutalism */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-industrial-black">
                    Daftar Sebagai
                  </label>
                  <Card variant="industrial" className="p-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base font-semibold ${
                          form.role === 'student' 
                            ? 'bg-industrial-green text-industrial-black shadow-brutal-sm' 
                            : 'bg-industrial-white text-industrial-black border-2 border-industrial-black hover:bg-industrial-light'
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, role: 'student' }))}
                      >
                        <GraduationCap size={18} className="sm:w-5 sm:h-5" weight="bold" />
                        <span>Siswa</span>
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base font-semibold ${
                          form.role === 'teacher' 
                            ? 'bg-industrial-green text-industrial-black shadow-brutal-sm' 
                            : 'bg-industrial-white text-industrial-black border-2 border-industrial-black hover:bg-industrial-light'
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, role: 'teacher' }))}
                      >
                        <BookOpen size={18} className="sm:w-5 sm:h-5" weight="bold" />
                        <span>Guru</span>
                      </button>
                    </div>
                  </Card>
                </div>

                {/* Username Field - Neo-Brutalism */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-industrial-black">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                    <Input
                      variant="industrial"
                      id="username"
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Pilih username unik"
                      className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field - Neo-Brutalism */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-industrial-black">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                    <Input
                      variant="industrial"
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimal 6 karakter"
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted hover:text-industrial-black transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeSlash className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field - Neo-Brutalism */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-industrial-black">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                    <Input
                      variant="industrial"
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ulangi password"
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted hover:text-industrial-black transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeSlash className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
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
                      className="bg-industrial-white border-2 border-industrial-red text-industrial-red px-4 py-3 text-sm font-semibold shadow-brutal-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Register Button - Neo-Brutalism */}
                <Button
                  type="submit"
                  variant="industrial-primary"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold"
                  disabled={loading || !form.fullName || !form.username || !form.password || !form.confirmPassword}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Mendaftar...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Daftar Sekarang</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Login Link - Neo-Brutalism */}
              <div className="pt-4 border-t-2 border-industrial-black">
                <div className="text-center">
                  <p className="text-sm text-industrial-text-secondary">
                    Sudah punya akun?{' '}
                    <Link 
                      to="/login" 
                      className="text-industrial-green font-semibold hover:text-industrial-black transition-colors"
                    >
                      Masuk disini
                    </Link>
                  </p>
                </div>
              </div>

              {/* Terms notice - Neo-Brutalism */}
              <div className="text-center">
                <p className="text-xs text-industrial-text-secondary">
                  Dengan mendaftar, Anda menyetujui{' '}
                  <span className="text-industrial-green hover:text-industrial-black cursor-pointer font-semibold">
                    Syarat & Ketentuan
                  </span>{' '}
                  dan{' '}
                  <span className="text-industrial-green hover:text-industrial-black cursor-pointer font-semibold">
                    Kebijakan Privasi
                  </span>{' '}
                  kami.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer - Neo-Brutalism */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6 sm:mt-8"
        >
          <p className="text-xs sm:text-sm text-industrial-text-secondary">
            © 2024 Kelas Guru. Platform pembelajaran digital.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register; 