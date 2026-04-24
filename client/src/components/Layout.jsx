import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Timer, HeartPulse, Settings, BookOpen } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

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
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-fa-bg-page p-[24px]">
        {children}
      </main>
    </div>
  );
};

export default Layout;
