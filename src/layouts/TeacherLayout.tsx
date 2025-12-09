import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { House, Users, BookOpen, Trophy, Calendar, Bookmark, Stack, Gear, ChartBar, SignOut, List, X } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { clearSessionCredentials, getCurrentUser } from '@/lib/api';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get current user from localStorage
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // If no user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear session credentials and navigate to login
    clearSessionCredentials();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Dashboard', path: '/guru', icon: <House size={20} /> },
    { name: 'Kelas', path: '/guru/kelas', icon: <BookOpen size={20} /> },
    { name: 'Siswa', path: '/guru/siswa', icon: <Users size={20} /> },
    { name: 'Tugas', path: '/guru/tugas', icon: <Bookmark size={20} /> },
    { name: 'Nilai', path: '/guru/nilai', icon: <Trophy size={20} /> },
    { name: 'Presensi', path: '/guru/presensi', icon: <Calendar size={20} /> },
    { name: 'Jurnal', path: '/guru/jurnal', icon: <Stack size={20} /> },
    { name: 'Kegiatan', path: '/guru/kegiatan', icon: <Calendar size={20} /> },
    { name: 'Bank Soal', path: '/guru/bank-soal', icon: <Bookmark size={20} /> },
    { name: 'Gamifikasi', path: '/guru/gamifikasi', icon: <ChartBar size={20} /> },
    { name: 'Pengaturan', path: '/guru/pengaturan', icon: <Gear size={20} /> },
  ];

  // Show loading if no user data yet
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-light">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-industrial-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-industrial-text-secondary font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-light flex">
      {/* Sidebar for desktop - Industrial Minimalism */}
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <div className="flex flex-col h-full bg-industrial-dark border-r-2 border-industrial-black">
          {/* Logo/Header */}
          <div className="h-16 flex items-center px-6 border-b-2 border-industrial-black bg-industrial-dark">
            <h1 className="text-xl font-bold text-industrial-white industrial-h2">Kelas Guru</h1>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-3 text-sm font-semibold transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-industrial-white text-industrial-black shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                    : 'text-industrial-white hover:bg-industrial-gray hover:text-industrial-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* User section */}
          <div className="p-4 border-t-2 border-industrial-black bg-industrial-dark">
            <div className="flex items-center gap-3 mb-4 p-3 bg-industrial-gray border-2 border-industrial-black">
              <div className="w-10 h-10 bg-industrial-white text-industrial-black flex items-center justify-center font-bold text-sm border-2 border-industrial-black">
                {currentUser.fullName?.[0] || currentUser.username?.[0] || 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-industrial-white truncate text-sm">
                  {currentUser.fullName || currentUser.username || 'Guru'}
                </div>
                <div className="text-xs text-industrial-text-muted truncate">
                  {currentUser.username}
                </div>
              </div>
            </div>
            <Button
              variant="industrial-secondary"
              className="w-full justify-start gap-2 h-10"
              onClick={handleLogout}
            >
              <SignOut size={18} />
              Keluar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header - Industrial Minimalism */}
        <header className="h-16 lg:hidden flex items-center justify-between border-b-2 border-industrial-black px-4 bg-industrial-white sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button 
              variant="industrial-secondary"
              size="icon" 
              onClick={toggleMobileMenu}
              className="h-10 w-10"
            >
              {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </Button>
            <h1 className="text-lg font-bold text-industrial-black">Kelas Guru</h1>
          </div>
          <div className="w-8 h-8 bg-industrial-black text-industrial-white flex items-center justify-center text-sm font-bold border-2 border-industrial-black">
            {currentUser.fullName?.[0] || currentUser.username?.[0] || 'G'}
          </div>
        </header>
        
        {/* Mobile menu overlay - Industrial Minimalism */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-industrial-black/80"
              onClick={toggleMobileMenu}
            />
            
            {/* Menu panel */}
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-industrial-white border-r-2 border-industrial-black shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
              {/* Menu header */}
              <div className="h-16 flex items-center justify-between px-6 border-b-2 border-industrial-black bg-industrial-white">
                <h1 className="text-lg font-bold text-industrial-black">Menu</h1>
                <Button 
                  variant="industrial-secondary"
                  size="icon" 
                  onClick={toggleMobileMenu}
                  className="h-10 w-10"
                >
                  <X size={20} />
                </Button>
              </div>
              
              {/* User info */}
              <div className="p-4 border-b-2 border-industrial-black bg-industrial-white">
                <div className="flex items-center gap-3 p-3 bg-industrial-light border-2 border-industrial-black">
                  <div className="w-12 h-12 bg-industrial-black text-industrial-white flex items-center justify-center font-bold text-sm border-2 border-industrial-black">
                    {currentUser.fullName?.[0] || currentUser.username?.[0] || 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-industrial-black truncate text-sm">
                      {currentUser.fullName || currentUser.username || 'Guru'}
                    </div>
                    <div className="text-xs text-industrial-text-secondary truncate">
                      {currentUser.username}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation links */}
              <div className="flex-1 py-4 overflow-y-auto bg-industrial-white">
                <div className="space-y-1 px-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        location.pathname === item.path
                          ? 'bg-industrial-black text-industrial-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                          : 'text-industrial-text-primary hover:bg-industrial-light hover:text-industrial-black border-2 border-transparent hover:border-industrial-black'
                      }`}
                      onClick={toggleMobileMenu}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </div>
                
                {/* Logout button */}
                <div className="mt-6 px-4">
                  <Button
                    variant="industrial-secondary"
                    className="w-full justify-start gap-2 h-11"
                    onClick={handleLogout}
                  >
                    <SignOut size={18} />
                    Keluar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content - Industrial Minimalism */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] lg:min-h-screen bg-industrial-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout; 