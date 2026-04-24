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
    <div className="flex h-screen w-full bg-fa-bg-page overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 bg-fa-bg-shell border-r border-fa-border flex flex-col">
        {/* App Name */}
        <div className="p-6">
          <h1 className="font-['Sora'] text-2xl font-semibold text-fa-brand tracking-wide">
            Lockdin.AI
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-fa-brand text-white shadow-lg shadow-fa-brand/20' 
                    : 'text-fa-text-secondary hover:bg-fa-bg-hover hover:text-fa-text-primary'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-fa-text-secondary'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Info */}
        <div className="p-4 border-t border-fa-border flex items-center gap-3 mt-auto">
          <div className="w-10 h-10 rounded-full bg-fa-bg-page border border-fa-border flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-fa-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{settings.profile.name || 'Student'}</p>
            <p className="text-xs text-fa-text-muted truncate">{settings.profile.uni || 'Lockdin.AI'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-fa-bg-page p-[24px]">
        {children}
      </main>
    </div>
  );
};

export default Layout;
