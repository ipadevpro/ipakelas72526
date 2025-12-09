import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { Eye, EyeSlash, GraduationCap, Users, BookOpen } from 'phosphor-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Administrator' }
  ];

  return (
    <div className="min-h-screen bg-industrial-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features - Neo-Brutalism */}
        <AnimatedContainer variant={slideInFromLeft} className="space-y-8">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-industrial-black border-2 border-industrial-black flex items-center justify-center shadow-brutal">
                <GraduationCap className="w-6 h-6 text-industrial-white" weight="bold" />
              </div>
              <h1 className="text-3xl font-bold text-industrial-black industrial-h1">
                Kelas Guru
              </h1>
            </motion.div>
            
            <h2 className="text-2xl lg:text-4xl font-bold text-industrial-black industrial-h1 mb-4">
              Platform Manajemen Kelas Modern
            </h2>
            <p className="text-lg text-industrial-text-secondary mb-8">
              Kelola kelas, siswa, dan aktivitas pembelajaran dengan mudah dan efisien
            </p>

            {/* Features - Neo-Brutalism */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Users, title: "Manajemen Siswa", desc: "Kelola data siswa dengan mudah" },
                { icon: BookOpen, title: "Pembelajaran", desc: "Tugas dan penilaian terintegrasi" },
                { icon: GraduationCap, title: "Gamifikasi", desc: "Badge dan level untuk motivasi" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card variant="industrial" className="text-center p-4">
                    <feature.icon className="w-8 h-8 text-industrial-black mx-auto mb-2" weight="bold" />
                    <h3 className="font-semibold text-industrial-black text-sm">{feature.title}</h3>
                    <p className="text-xs text-industrial-text-secondary">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatedContainer>

        {/* Right Side - Login Form - Neo-Brutalism */}
        <AnimatedContainer variant={fadeInUp} delay={0.3}>
          <Card variant="industrial" className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1 text-center border-b-2 border-industrial-black">
              <CardTitle className="text-2xl font-bold text-industrial-black industrial-h2">Masuk ke Akun</CardTitle>
              <CardDescription className="text-industrial-text-secondary">
                Masukkan username dan password untuk mengakses dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-semibold text-industrial-black">
                    Username
                  </label>
                  <Input
                    variant="industrial"
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-industrial-black">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      variant="industrial"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-industrial-text-muted hover:text-industrial-black transition-colors"
                    >
                      {showPassword ? <EyeSlash className="w-4 h-4" weight="bold" /> : <Eye className="w-4 h-4" weight="bold" />}
                    </button>
                  </div>
                </div>

                {/* Demo Credentials - Neo-Brutalism */}
                <motion.div 
                  className="p-3 bg-industrial-blue border-2 border-industrial-black shadow-brutal-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm font-semibold text-industrial-black mb-2">Demo Account:</p>
                  {demoUsers.map((user, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-industrial-white border-2 border-industrial-black cursor-pointer hover:bg-industrial-light transition-colors shadow-brutal-sm"
                      onClick={() => {
                        setUsername(user.username);
                        setPassword(user.password);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-industrial-black">{user.username}</p>
                        <Badge variant="industrial-secondary" className="text-xs">{user.role}</Badge>
                      </div>
                      <p className="text-xs text-industrial-text-secondary industrial-mono">{user.password}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>

              <CardFooter className="border-t-2 border-industrial-black pt-6">
                <Button
                  type="submit"
                  variant="industrial-primary"
                  disabled={isLoading}
                  className="w-full h-11 font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  );
};

export default LoginPage; 