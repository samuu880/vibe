import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Sparkles, User, Lock, Mail, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenLegal }) => {
  const { login, register, validateAge14 } = useAuth();
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('2008-06-15');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Live age calculation
  const ageValidation = validateAge14(birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isRegister) {
      if (!ageValidation.valid) {
        setErrorMsg(`strictly 14+ required by law. you entered age ${ageValidation.age}. registration is restricted.`);
        return;
      }
      if (!agreedToTerms) {
        setErrorMsg('you must accept the terms of service and privacy policy to proceed.');
        return;
      }

      setIsLoading(true);
      try {
        await register(username, email, password, birthDate);
        onClose();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'registration failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await login(username, password);
        onClose();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="w-full max-w-md rounded-3xl glass-modal border border-white/[0.12] shadow-2xl p-6 text-left relative"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-syne font-bold text-2xl text-white tracking-tight lowercase">
                {isRegister ? 'join vibe' : 'welcome back'}
              </h3>
              <p className="text-xs text-zinc-400 lowercase mt-1">
                {isRegister ? 'daily dual drops, voice notes & real aura' : 'log in to stack your aura'}
              </p>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300 lowercase"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 lowercase block mb-1">
                  username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. solarsurf"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white placeholder-zinc-500 lowercase transition-all"
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 lowercase block mb-1">
                    email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@domain.app"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white placeholder-zinc-500 lowercase transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 lowercase block mb-1">
                  password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="minimum 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white placeholder-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* STRICT 14+ AGE VERIFICATION SECTION */}
              {isRegister && (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-zinc-300 lowercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      date of birth (strictly 14+)
                    </label>

                    {birthDate && (
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                          ageValidation.valid
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {ageValidation.age} years old ({ageValidation.valid ? 'eligible' : 'under 14 blocked'})
                      </span>
                    )}
                  </div>

                  <input
                    type="date"
                    required
                    value={birthDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white lowercase"
                  />

                  <p className="text-[10px] text-zinc-500 leading-tight">
                    legal protection: vibe enforces a mandatory 14+ minimum age in strict accordance with gdpr article 8 and coppa to safeguard youth privacy.
                  </p>
                </div>
              )}

              {/* Legal agreement checkbox */}
              {isRegister && (
                <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-400 lowercase">
                  <input
                    type="checkbox"
                    id="termsCheck"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="accent-purple-600 rounded mt-0.5 w-3.5 h-3.5"
                  />
                  <label htmlFor="termsCheck" className="cursor-pointer leading-tight">
                    i agree to the{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('terms')}
                      className="text-purple-400 underline hover:text-purple-300"
                    >
                      terms of service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('privacy')}
                      className="text-purple-400 underline hover:text-purple-300"
                    >
                      privacy policy
                    </button>
                    .
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (isRegister && !ageValidation.valid)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-purple-600/30 lowercase cursor-pointer"
              >
                {isLoading ? 'verifying...' : isRegister ? 'create account (+1,000 aura)' : 'sign in'}
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg(null);
                }}
                className="text-xs text-zinc-400 hover:text-purple-300 transition-colors lowercase"
              >
                {isRegister ? 'already have a vibe account? log in' : 'new to vibe? create an account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
