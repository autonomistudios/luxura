import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Already signed in → send to studio
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  async function handleSignIn() {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('[LOGIN] Google sign-in error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase. Add luxaurastudio.vercel.app to Firebase Console → Authentication → Authorized Domains.');
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError(null); // user just closed the popup, not an error
      } else {
        setAuthError(err?.message || 'Sign-in failed. Please try again.');
      }
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-white/20 animate-pulse">Initializing…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Atmospheric grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
        <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
      <div className="fixed inset-0 pointer-events-none bg-gradient-radial from-transparent to-black/60" />

      {/* Decorative corner marks */}
      <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-[#D4AF37]/20" />
      <div className="absolute top-10 right-10 w-12 h-12 border-t border-r border-[#D4AF37]/20" />
      <div className="absolute bottom-10 left-10 w-12 h-12 border-b border-l border-[#D4AF37]/20" />
      <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-[#D4AF37]/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-12 max-w-sm w-full text-center"
      >
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-5xl font-serif text-white tracking-tighter">
            LUX<span className="text-[#D4AF37] italic font-light">AURA</span>
          </h1>
          <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-white/20">
            Private Atelier
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent" />

        {/* Sign-in block */}
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/30">
              Member Access
            </p>
            <p className="text-[13px] text-white/50 font-light leading-relaxed">
              Your vault, credits, and studio settings are tied to your account.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-4 bg-white/[0.04] border border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/[0.07] transition-all duration-500 px-6 py-4 text-white group"
          >
            {/* Google G icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] group-hover:text-[#D4AF37] transition-colors">
              Continue with Google
            </span>
          </motion.button>
        </div>

        {/* Auth error */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full border border-red-500/20 bg-red-500/5 px-4 py-3"
          >
            <p className="text-[9px] font-mono text-red-400/80 leading-relaxed">{authError}</p>
          </motion.div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-white/5" />

        {/* Pricing link */}
        <div className="space-y-3 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">
            New to LuxAura?
          </p>
          <Link
            to="/pricing"
            className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
          >
            View Plans &amp; Pricing →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
