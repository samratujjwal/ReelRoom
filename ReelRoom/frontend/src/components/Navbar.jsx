import { useState, useEffect } from 'react';
import { LogOut, LogIn, Plus, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const Navbar = ({ currentPage = 'home', onNavigate, onOpenAuth, onOpenCreateRoom }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await apiService.getHealth();
        setIsBackendHealthy(r.success);
      } catch {
        setIsBackendHealthy(false);
      }
    };
    check();
    const i = setInterval(check, 30000);
    return () => clearInterval(i);
  }, []);

  const navItems = [
    { key: 'home', label: 'Home' },
    { key: 'explore', label: 'Explore' },
    ...(isAuthenticated ? [{ key: 'dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-ivory/95 backdrop-blur border-b hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] gap-4">

          {/* Brand */}
          <button
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral rounded-lg"
            aria-label="ReelRoom home"
          >
            <img src="/reelroom_logo.svg" alt="" className="w-9 h-9 shrink-0" />
            <span className="font-display font-semibold text-[22px] tracking-tight text-ink">
              ReelRoom<span className="text-coral">.</span>
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  currentPage === item.key
                    ? 'bg-forest text-ivory'
                    : 'text-inksoft hover:text-ink hover:bg-ink/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Signal status */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-inksoft" title="Backend connection status">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy === null ? 'bg-sand' : isBackendHealthy ? 'bg-forest animate-pulse' : 'bg-brick'
              }`} />
              <span>{isBackendHealthy === null ? 'Checking signal…' : isBackendHealthy ? 'Signal live' : 'Signal down'}</span>
            </div>

            {onOpenCreateRoom && (
              <button
                onClick={isAuthenticated ? onOpenCreateRoom : onOpenAuth}
                className="btn-primary !py-2.5 !px-4 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Start a room</span>
                <span className="sm:hidden">Start</span>
              </button>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 bg-parchment border hairline rounded-full p-1 pl-1.5">
                <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center text-ivory text-xs font-bold shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-ink max-w-[90px] sm:max-w-[140px] truncate hidden sm:block">{user.username}</span>
                <button
                  onClick={logout}
                  title="Log Out"
                  aria-label="Log out"
                  className="w-7 h-7 rounded-full hover:bg-coral/15 hover:text-coraldeep flex items-center justify-center text-inksoft transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={onOpenAuth} className="btn-outline !py-2.5 !px-4 text-xs sm:text-sm">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Log in</span>
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg hover:bg-ink/5 flex items-center justify-center text-inksoft hover:text-ink transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t hairline space-y-1">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => { onNavigate?.(item.key); setMobileOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  currentPage === item.key ? 'bg-forest text-ivory' : 'text-inksoft hover:text-ink hover:bg-ink/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-inksoft">
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-forest' : 'bg-brick'}`} />
              <span>{isBackendHealthy === null ? 'Checking signal…' : isBackendHealthy ? 'Signal live' : 'Signal down'}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
