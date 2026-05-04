import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Timer, HeartPulse, Settings, BookOpen, User } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const Layout = ({ children }) => {
  const location = useLocation();
  const { settings } = useSettings();
  const [avatar, setAvatar] = useState(() => localStorage.getItem('userAvatar') || null);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem('userAvatar'));
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Focus Session', path: '/focus', icon: Timer },
    { name: 'Academic Planner', path: '/planner', icon: BookOpen },
    { name: 'Wellness', path: '/wellness', icon: HeartPulse },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#FFF8E7] overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 bg-[#FFF8E7] border-r border-[#E8D5A3] flex flex-col z-10">
        {/* App Name */}
        <div className="p-6 pb-2">
          <h1 className="font-['Sora'] text-2xl font-bold text-[#00C896] tracking-tight">
            Lockdin.AI
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-all duration-300 relative group ${
                  isActive 
                    ? 'text-[#4F46E5] font-semibold bg-[#EEF2FF] rounded-r-xl' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-r-xl'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4F46E5] rounded-r-md"></div>
                )}
                <Icon size={20} className={isActive ? 'text-[#4F46E5]' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Info */}
        <div className="p-4 border border-[#E8D5A3] flex items-center gap-3 mt-auto bg-[#FFFDF4] hover:bg-white transition-colors cursor-pointer m-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 duration-300">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C6FFF] p-[2px] flex-shrink-0">
            <div className="w-full h-full bg-white rounded-full overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1A1A2E] truncate">{settings.profile.name || 'Student'}</p>
            <p className="text-xs text-gray-500 truncate">{settings.profile.uni || 'Lockdin.AI'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-[#FFF8E7] p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
