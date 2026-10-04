import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Download, Trash2, Scale, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const { user, logout } = useAuth();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportData = () => {
    if (!user) return;
    const userData = {
      export_version: '1.0.0',
      export_date: new Date().toISOString(),
      legal_basis: 'GDPR Article 20 - Right to Data Portability',
      profile: user,
      activity: {
        feed: JSON.parse(localStorage.getItem('vibe_feed') || '[]'),
        messages: JSON.parse(localStorage.getItem('vibe_messages') || '[]'),
      },
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe_data_export_${user.username}.json`;
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDeleteAccount = () => {
    if (confirm('GDPR Article 17 (Right to Erasure): are you sure you want to permanently delete your account and all vibes? this cannot be undone.')) {
      localStorage.clear();
      logout();
      onClose();
      window.location.reload();
    }
  };

  if (!type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[85vh] rounded-3xl glass-modal border border-white/[0.12] shadow-2xl p-6 flex flex-col text-left my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-syne font-bold text-lg text-white lowercase">
                  {type === 'privacy' ? 'privacy policy & legal safeguards' : 'terms of service'}
                </h3>
                <p className="text-[11px] text-zinc-400 lowercase">
                  effective date: 2026 • gdpr / coppa / ccpa compliant
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Legal Scrollable Body */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-zinc-300 leading-relaxed lowercase">
            {type === 'privacy' ? (
              <>
                <section className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <h4 className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    1. strict 14+ minimum age requirement
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    vibe strictly complies with child and youth online privacy protections (including the US COPPA, GDPR Article 8, and UK Age Appropriate Design Code). registration is strictly limited to individuals aged 14 and older. date of birth is mathematically checked upon registration and any underage submission is blocked.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-white mb-1">2. data collected & purpose</h4>
                  <p className="text-zinc-400">
                    we collect only necessary profile data (username, encrypted password hash, DOB for age verification, and optional avatar). posts, voice notes, and BeReal drops are processed through pre-upload automated AI safety scanning to ensure a secure environment.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-white mb-1">3. automated content moderation (ai & vision)</h4>
                  <p className="text-zinc-400">
                    vibe operates an automated pre-publish machine learning & heuristic moderation pipeline. content containing hate speech, harassment, explicit nudity, or doxxing is automatically detected and blocked prior to being indexed or published to the community feed.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-white mb-1">4. your gdpr & privacy rights</h4>
                  <p className="text-zinc-400 mb-3">
                    under gdpr (eu) and ccpa (california), you hold the right to access, rectify, export, and delete your data at any time without fees:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExportData}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center gap-1.5 font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{downloadSuccess ? 'exported!' : 'export my data (article 20)'}</span>
                    </button>

                    <button
                      onClick={handleDeleteAccount}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5 font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>delete my account (article 17)</span>
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    1. community conduct & zero tolerance policy
                  </h4>
                  <p className="text-zinc-400 text-[11px]">
                    vibe is a community built for authentic creative expression. harassment, cyberbullying, hate speech, illegal transactions, impersonation, or unconsented sexual content result in immediate account ban and log persistence for legal authorities.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-white mb-1">2. age eligibility declaration</h4>
                  <p className="text-zinc-400">
                    by creating an account, you legally warrant that you are at least 14 years of age. providing false birth dates constitutes a breach of contract and terms of use, leading to immediate profile termination.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-white mb-1">3. aura & gamification system</h4>
                  <p className="text-zinc-400">
                    aura points and tiers are virtual gamification elements within the vibe application. they possess zero monetary value and cannot be exchanged, sold, or redeemed for fiat currency or crypto assets.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-white mb-1">4. content ownership & intellectual property</h4>
                  <p className="text-zinc-400">
                    you retain complete copyright and ownership over your original photos, audio recordings, and text vibes. by posting, you grant vibe a non-exclusive license solely to display your media to other users in accordance with your privacy choices.
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/[0.08] mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all"
            >
              i understand & agree
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
