import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from './ui/primitives';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { firebaseAPI, auth } from '../firebase';
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, 
  TrendingUp, Shield, KeyRound, Sparkles, LogIn, UserPlus, Building2 
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to parse Firebase error codes to friendly messages
  const getFriendlyError = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up or use Quick Demo Sign In.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in.';
      case 'auth/weak-password':
        return 'Password is too weak. Must be at least 6 characters.';
      case 'auth/missing-password':
        return 'Please enter your password.';
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return 'Invalid email or password. If you do not have an account yet, click "Register Account" or use "Quick Demo Login".';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Access has been temporarily locked. Please try again later.';
      default:
        return 'An unexpected authentication error occurred. Please try again or use Quick Demo Login.';
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const demoEmail = 'demo@scarletcrm.com';
    const demoPass = 'demo123456';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      onSuccess();
    } catch (err: any) {
      // If user not found or invalid credential, automatically register the demo user account
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          if (userCred.user) {
            await firebaseAPI.saveCompanySettings({
              companyName: 'ScarletCRM Operations HQ',
              companyTagline: 'Corporate Operations Portal',
              logoUrl: '',
              address: '100 Corporate Plaza, Suite 500',
              email: demoEmail,
              phone: '+1 (800) 555-0199',
              website: 'www.scarletcrm.com'
            }, userCred.user.uid);
          }
          onSuccess();
          return;
        } catch (createErr: any) {
          setError(getFriendlyError(createErr.code || ''));
        }
      } else {
        setError(getFriendlyError(err.code || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!isForgotPassword) {
      if (!password) {
        setError('Please enter your password.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
      if (isRegister && password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Password reset link sent to your email. Check your spam folder if you do not see it.');
        setIsForgotPassword(false);
      } else if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save company branding settings for this new company ID
        if (userCred.user) {
          const compName = companyNameInput.trim() || 'Company Operations HQ';
          await firebaseAPI.saveCompanySettings({
            companyName: compName,
            companyTagline: 'Corporate Operations Portal',
            logoUrl: '',
            address: '100 Corporate Plaza, Suite 500',
            email: email,
            phone: '+1 (800) 555-0199',
            website: 'www.company.com'
          }, userCred.user.uid);
        }

        setSuccessMsg('Company account created successfully! Signing you in...');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
        setCompanyNameInput('');
        onSuccess();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(getFriendlyError(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden transition-colors">
      {/* HEADER SECTION */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-black tracking-tighter text-lg shadow-card">
            S
          </div>
          <div>
            <span className="font-display font-black text-sm tracking-widest text-ink uppercase">
              Scarlet<span className="text-brand">CRM</span>
            </span>
            <div className="text-[9px] font-mono text-ink-faint uppercase tracking-wider">
              Secure Operations Portal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-2 border border-border rounded-xl text-[11px] font-mono text-ink-soft">
            <Shield size={12} className="text-brand" />
            <span>AES-256 HTTPS</span>
          </div>
        </div>
      </header>

      {/* CORE LOGIN CONTAINER */}
      <main className="w-full max-w-md mx-auto my-auto py-8 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-pop relative"
        >
          {/* Accent indicator line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand rounded-t-2xl" />

          {/* Form Header */}
          <div className="mb-6 text-center">
            <h1 className="font-display font-black text-xl text-ink uppercase tracking-wider mb-1.5">
              {isForgotPassword 
                ? 'Reset Password' 
                : isRegister 
                  ? 'Create CRM Account' 
                  : 'Employee Sign In'}
            </h1>
            <p className="text-xs text-ink-soft font-sans leading-relaxed">
              {isForgotPassword 
                ? 'Enter your email address to receive a secure recovery link.' 
                : isRegister 
                  ? 'Sign up for a secure account to access the Company CRM.' 
                  : 'Please authenticate with your credentials to access the console.'}
            </p>
          </div>

          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 rounded-xl bg-loss-soft border border-loss/30 flex gap-2.5 items-start text-loss text-xs leading-relaxed"
              >
                <AlertCircle size={16} className="text-loss flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 rounded-xl bg-gain-soft border border-gain/30 flex gap-2.5 items-start text-gain text-xs leading-relaxed"
              >
                <CheckCircle2 size={16} className="text-gain flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-faint mb-1.5">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-faint">
                    <Building2 size={14} />
                  </span>
                  <input
                    type="text"
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    placeholder="e.g., Acme Technologies Corp"
                    className="w-full bg-surface-2 border border-border focus:border-brand/50 rounded-xl px-3 py-2.5 pl-9 text-xs text-ink outline-none transition-all placeholder:text-ink-faint"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-faint mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-faint">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-surface-2 border border-border focus:border-brand/50 rounded-xl px-3 py-2.5 pl-9 text-xs text-ink outline-none transition-all placeholder:text-ink-faint"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                    Security Password
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[10px] font-mono uppercase tracking-wider text-brand hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-faint">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-2 border border-border focus:border-brand/50 rounded-xl px-3 py-2.5 pl-9 pr-10 text-xs text-ink outline-none transition-all placeholder:text-ink-faint"
                    required={!isForgotPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-faint hover:text-ink transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-faint mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-faint">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-2 border border-border focus:border-brand/50 rounded-xl px-3 py-2.5 pl-9 text-xs text-ink outline-none transition-all placeholder:text-ink-faint"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl shadow-card hover:shadow-pop transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? (
                    <>
                      <KeyRound size={13} />
                      <span>Send Recovery Link</span>
                    </>
                  ) : isRegister ? (
                    <>
                      <UserPlus size={13} />
                      <span>Create Account</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={13} />
                      <span>Authenticate</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          {!isForgotPassword && (
            <div className="mt-4 pt-3 border-t border-border flex flex-col items-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full bg-surface-2 hover:bg-brand-soft text-brand border border-brand/20 font-mono text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-card"
              >
                <Sparkles size={13} className="text-brand" />
                <span>Quick Demo Sign In (Instant Access)</span>
              </button>
            </div>
          )}

          {/* Switch Mode Footer */}
          <div className="mt-6 border-t border-border pt-4 flex flex-col gap-2 items-center text-center">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-ink-soft hover:text-ink font-mono uppercase tracking-wide cursor-pointer"
              >
                Back to Sign In
              </button>
            ) : (
              <div className="text-xs text-ink-faint">
                {isRegister ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setIsRegister(false);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-brand hover:underline font-semibold cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </>
                ) : (
                  <>
                    New team member?{' '}
                    <button
                      onClick={() => {
                        setIsRegister(true);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-brand hover:underline font-semibold cursor-pointer"
                    >
                      Register Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 text-[10px] text-ink-faint font-mono">
        <div>
          © 2026 SCARLETCRM OPERATIONS CORP. ALL RIGHTS RESERVED.
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span>PORTAL VER: 2.1.0-SECURE</span>
          <span className="text-border">|</span>
          <span>SYS TIME: UTC 2026-07-20</span>
        </div>
      </footer>
    </div>
  );
}
