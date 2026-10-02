import { useState } from 'react';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (tab === 'register') {
        if (!username || !email || !password) {
          setError('Please fill in all fields');
          setIsSubmitting(false);
          return;
        }

        const res = await apiService.register({ username, email, password });

        if (res.success && res.data?.token) {
          login(res.data.token, res.data.user);
          onClose();
        } else {
          setError(res.error || 'Registration failed');
        }
      } else {
        if (!email && !username) {
          setError('Please provide email or username');
          setIsSubmitting(false);
          return;
        }

        const res = await apiService.login({ emailOrUsername: email || username, password });

        if (res.success && res.data?.token) {
          login(res.data.token, res.data.user);
          onClose();
        } else {
          setError(res.error || 'Login failed. Please check credentials.');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-cream border hairline p-6 sm:p-8 relative shadow-[0_24px_80px_rgba(32,35,31,0.25)] animate-rise-in">

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-inksoft hover:text-ink w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-7">
          <img src="/reelroom_logo.svg" alt="" className="w-11 h-11 mb-4" />
          <h2 className="font-display text-3xl font-medium text-ink">
            {tab === 'login' ? 'Welcome back' : 'Take your seat'}
          </h2>
          <p className="text-sm text-inksoft mt-2">
            {tab === 'login' ? 'Log in to rejoin the room.' : 'Create an account to host and join screenings.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-parchment p-1 rounded-xl mb-6 border hairline" role="tablist">
          {['login', 'register'].map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? 'bg-forest text-ivory shadow-sm' : 'text-inksoft hover:text-ink'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/25 text-coraldeep text-xs flex items-center gap-2" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-username" className="block text-xs font-semibold text-inksoft mb-2">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-ink/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-username"
                  type="text"
                  placeholder="CinemaFan99"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="field !pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-inksoft mb-2">
              {tab === 'register' ? 'Email' : 'Email or username'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-email"
                type="text"
                placeholder={tab === 'register' ? 'you@example.com' : 'Email or username'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="field !pl-10"
                autoComplete={tab === 'register' ? 'email' : 'username'}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-inksoft mb-2">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="field !pl-10"
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3.5">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-ivory/40 border-t-ivory rounded-full animate-spin" />
                Processing…
              </span>
            ) : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

      </div>
    </div>
  );
};
