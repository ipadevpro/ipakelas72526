import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, LogOut, Menu, X, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if current route is Dashboard (student route is /siswa)
  const isDashboard = location.pathname === '/siswa' || location.pathname === '/siswa/';

  useEffect(() => {
    // Periksa apakah user sudah login dan rolenya adalah student
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'student') {
        navigate('/login');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#1a1c2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .pixel-header-dash { border-bottom: 4px solid #000; box-shadow: 0px 2px 0px 0px rgba(0,0,0,0.8); }
        .pixel-border-dash { border: 3px solid #000; box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.8); }
        .pixel-button-dash { border: 3px solid #000; box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.8); transition: all 0.1s; }
        .pixel-button-dash:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px rgba(0,0,0,0.8); }
      `}</style>
      <div className={`min-h-screen ${isDashboard ? 'bg-[#87CEEB]' : 'bg-[#1a1c2e]'} ${isDashboard ? 'text-black' : 'text-white'}`} style={isDashboard ? {fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"} : {}}>
        {/* Header */}
        {isDashboard ? (
          <header className="h-auto pixel-header-dash bg-white relative z-50" style={{fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
            <div className="flex items-center justify-between p-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 pixel-border-dash bg-[#FFD700] flex items-center justify-center">
                  <Sword className="w-5 h-5 text-black" strokeWidth={3} />
                </div>
                <h1 className="text-xs text-black font-bold leading-tight">
                  STUDENT DASHBOARD
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {/* User info - Pixel */}
                <div className="hidden sm:flex items-center gap-2 max-w-[200px]">
                  <div className="text-right min-w-0 flex-1">
                    <div className="text-xs text-black font-semibold leading-tight break-words">
                      {currentUser?.fullName || 'STUDENT'}
                    </div>
                    <div className="text-xs text-gray-600 leading-tight font-medium break-words">
                      {currentUser?.className || currentUser?.class || 'CLASS'}
                    </div>
                  </div>
                  <div className="w-9 h-9 pixel-border-dash bg-[#4ECDC4] flex items-center justify-center text-xs text-black font-bold">
                    {currentUser?.fullName?.[0] || 'S'}
                  </div>
                </div>
                
                {/* Mobile menu button - Pixel */}
                <button
                  onClick={toggleMobileMenu}
                  className="sm:hidden pixel-button-dash bg-[#87CEEB] text-black px-2.5 py-1.5 flex items-center justify-center"
                  title="MENU"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Menu className="w-4 h-4" strokeWidth={3} />
                  )}
                </button>
                
                {/* Logout button - Pixel */}
                <button
                  onClick={handleLogout}
                  className="pixel-button-dash bg-[#FF6B6B] text-white text-xs px-2.5 py-1.5 font-semibold"
                  title="LOGOUT"
                >
                  LOGOUT
                </button>
              </div>
            </div>
          </header>
        ) : (
          <header className="h-16 flex items-center justify-between border-b border-[#353964] px-4 lg:px-8 bg-[#252940]">
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-6 w-6 text-indigo-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Student Dashboard
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="font-medium">{currentUser.fullName || 'Student'}</div>
                  <div className="text-xs text-indigo-300">{currentUser.className || 'Student'}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-2 ring-purple-400">
                  {currentUser.fullName?.[0] || 'S'}
                </div>
              </div>
              
              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMobileMenu}
                className="md:hidden text-white hover:bg-[#353964]"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
              
              {/* Logout button for desktop */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2 bg-[#252940] border-[#353964] text-gray-300 hover:bg-[#353964] hover:text-white"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </header>
        )}
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}>
          <div className={`fixed inset-y-0 right-0 w-3/4 max-w-sm z-50 ${isDashboard ? 'bg-white pixel-border-dash' : 'bg-[#252940]'}`} onClick={(e) => e.stopPropagation()} style={isDashboard ? {fontFamily: "'Press Start 2P', monospace"} : {}}>
            <div className={`h-16 flex items-center px-6 ${isDashboard ? 'pixel-border-dash border-b-4 border-black' : 'border-b border-[#353964]'}`}>
              <div className="flex items-center space-x-2">
                {isDashboard ? (
                  <>
                    <div className="w-6 h-6 pixel-border-dash bg-[#FFD700] flex items-center justify-center">
                      <Sword className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                    <h1 className="text-[6px] text-black font-bold">MENU</h1>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="h-5 w-5 text-indigo-400" />
                    <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Menu</h1>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <div className={isDashboard ? 'pixel-border-dash bg-white p-4' : 'bg-[#1e213a] rounded-lg p-4 border border-[#353964]'}>
                <div className="flex items-center gap-3 mb-4">
                  {isDashboard ? (
                    <div className="w-10 h-10 pixel-border-dash bg-[#4ECDC4] flex items-center justify-center text-[8px] text-black font-bold">
                      {currentUser.fullName?.[0] || 'S'}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-2 ring-purple-400">
                      {currentUser.fullName?.[0] || 'S'}
                    </div>
                  )}
                  <div>
                    <div className={isDashboard ? 'text-[6px] text-black font-bold' : 'font-medium'}>{currentUser.fullName || 'Student'}</div>
                    <div className={isDashboard ? 'text-[5px] text-gray-600' : 'text-xs text-indigo-300'}>{currentUser.className || 'Student'}</div>
                  </div>
                </div>
                
                {isDashboard ? (
                  <button
                    onClick={handleLogout}
                    className="w-full pixel-button-dash bg-[#FF6B6B] text-white text-[6px] px-3 py-2"
                  >
                    LOGOUT
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-[#252940] border-[#353964] text-gray-300 hover:bg-[#353964] hover:text-white"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className={isDashboard ? 'min-h-[calc(100vh-4rem)]' : 'min-h-[calc(100vh-4rem)]'}>
        <Outlet />
      </main>
    </div>
    </>
  );
};

export default StudentLayout; 