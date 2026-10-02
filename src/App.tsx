import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import HomePage from '@/components/HomePage';
import BookingFlow from '@/components/BookingFlow';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import AuthPortal from '@/components/AuthPortal';
import ProfilePage from '@/components/ProfilePage';

type View = 'home' | 'booking' | 'admin-login' | 'admin-dashboard' | 'auth' | 'profile';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [view, setView] = useState<View>('home');

  // Auto-redirect: if admin logs in while on login screen, go to dashboard.
  // If session is lost while on dashboard, go back to login.
  useEffect(() => {
    if (view === 'admin-login' && session) setView('admin-dashboard');
    if (view === 'admin-dashboard' && !session) setView('admin-login');
  }, [session, view]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (view) {
    case 'booking':
      return <BookingFlow onBack={() => setView('home')} />;
    case 'admin-login':
      return <AdminLogin onBack={() => setView('home')} />;
    case 'admin-dashboard':
      return <AdminDashboard onBackHome={() => setView('home')} />;
    case 'auth':
      return <AuthPortal onBack={() => setView('home')} initialMode="signin" />;
    case 'profile':
      return session ? <ProfilePage onBack={() => setView('home')} /> : <AuthPortal onBack={() => setView('home')} />;
    default:
      return (
        <HomePage
          onReservo={() => setView('booking')}
          onAdminClick={() => setView('admin-login')}
          onAccount={() => setView(session ? 'profile' : 'auth')}
          accountLabel={session ? (profile?.full_name || 'Profili Im') : 'Hyr / Regjistrohu'}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
