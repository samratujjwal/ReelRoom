import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRoom } from './context/RoomContext';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { WatchRoom } from './components/WatchRoom/WatchRoom';
import { AuthModal } from './components/AuthModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { ExplorePage } from './components/ExplorePage';
import { Dashboard } from './components/Dashboard';

const AppContent = () => {
  const { activeRoomId, joinRoom, notification, setNotification } = useRoom();
  const { isLoading, isAuthenticated, user } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // Auto-join room if URL query param `?room=roomId` is present
  // Require auth - redirect to login if not authenticated
  useEffect(() => {
    if (isLoading) return; // Wait until auth is initialized
    const params = new URLSearchParams(window.location.search);
    const roomIdParam = params.get('room');
    if (roomIdParam && !activeRoomId) {
      if (!isAuthenticated || !user) {
        // Not logged in - open auth modal instead of guest join
        setIsAuthModalOpen(true);
      } else {
        joinRoom(roomIdParam, user.username);
      }
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-ivory text-ink selection:bg-coral selection:text-ivory">

      <div>
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
        />

        <main>
          {activeRoomId ? (
            <WatchRoom />
          ) : currentPage === 'explore' ? (
            <ExplorePage onOpenAuth={() => setIsAuthModalOpen(true)} />
          ) : currentPage === 'dashboard' ? (
            <Dashboard
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
            />
          ) : (
            <Lobby
              onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onNavigateExplore={() => setCurrentPage('explore')}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Floating Banner */}
      {notification && (
        <div className="toast-container">
          <div className="toast" role="status">
            <span className="text-base">
              {notification.type === 'success' ? '🎉' : notification.type === 'warning' ? '⚠️' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="font-medium text-xs sm:text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-ivory/60 hover:text-ivory text-xs font-bold px-1"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-16 border-t hairline bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/reelroom_logo.svg" alt="" className="w-7 h-7" />
            <p className="font-display font-semibold text-lg text-ink">ReelRoom</p>
          </div>
          <p className="text-xs text-inksoft text-center sm:text-right">Watch together. Stay in sync. — Real-time rooms over WebSockets, with host controls.</p>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </AuthProvider>
  );
}
