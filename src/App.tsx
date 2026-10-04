import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VibeProvider } from './context/VibeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { VibeFeed } from './components/VibeFeed';
import { CreateVibeModal } from './components/CreateVibeModal';
import { DmModal } from './components/DmModal';
import { SecretAdmin } from './components/SecretAdmin';
import { AuthModal } from './components/AuthModal';
import { LegalModals } from './components/LegalModals';
import { CookieBanner } from './components/CookieBanner';

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDmModal, setShowDmModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleOpenDm = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowDmModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top sticky Navbar */}
      <Navbar
        onOpenCreate={handleOpenCreate}
        onOpenDm={handleOpenDm}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenLegal={(type) => setLegalModalType(type)}
      />

      {/* Main Container with Sidebar + Feed */}
      <div className="flex-1 max-w-6xl w-full mx-auto flex justify-center pb-24 lg:pb-8">
        <Sidebar
          onOpenCreate={handleOpenCreate}
          onOpenDm={handleOpenDm}
          onOpenAdmin={() => setShowAdminModal(true)}
          onOpenLegal={(type) => setLegalModalType(type)}
        />

        <main className="flex-1 max-w-xl w-full py-2">
          <VibeFeed onOpenCreate={handleOpenCreate} />
        </main>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <MobileNav
        onOpenCreate={handleOpenCreate}
        onOpenDm={handleOpenDm}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* Modals & Overlays */}
      <CreateVibeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <DmModal
        isOpen={showDmModal}
        onClose={() => setShowDmModal(false)}
      />

      <SecretAdmin
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onOpenLegal={(type) => setLegalModalType(type)}
      />

      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      <CookieBanner />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VibeProvider>
        <MainLayout />
      </VibeProvider>
    </AuthProvider>
  );
}
