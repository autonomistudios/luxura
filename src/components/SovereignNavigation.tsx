import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SovereignNavigation = () => {
  const location           = useLocation();
  const navigate           = useNavigate();
  const { user, brand, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Atelier',  path: '/',        soon: false },
    { name: 'Studio',   path: '/studio',  soon: false },
    { name: 'Wardrobe', path: '/garment', soon: false },
    { name: 'Cinema',   path: '/video',   soon: true  },
    { name: 'Vault',    path: '/vault',   soon: false },
    { name: 'Profile',  path: '/profile', soon: false },
  ];

  const isActive = (path: string) => location.pathname === path;
  const tierCfg = brand ? { label: brand.tier, color: '#B8952A' } : null;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* DESKTOP: Minimalist Top Header */}
      <nav className="hidden md:flex fixed top-0 left-0 w-full z-50 px-12 py-8 justify-between items-center backdrop-blur-md bg-[#FAF9F6]/85 border-b border-[#1C1C1C]/10">
        <Link to="/" className="group">
          <span className="text-3xl font-serif text-[#1C1C1C] tracking-tighter leading-none block">
            LUX<span className="text-[#D4AF37] italic font-light">AURA</span>
          </span>
          <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/30 group-hover:text-[#D4AF37]/60 transition-colors">
            Private Atelier
          </p>
        </Link>

        <div className="flex gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative text-[11px] font-mono uppercase tracking-[0.4em] transition-all duration-700 flex items-center gap-1.5 ${
                isActive(link.path) ? 'text-[#D4AF37]' : 'text-[#1C1C1C]/45 hover:text-[#1C1C1C]'
              }`}
            >
              {link.name}
              {link.soon && (
                <span className="w-1 h-1 rounded-full bg-[#D4AF37] animate-pulse" />
              )}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`text-[11px] font-mono uppercase tracking-[0.4em] transition-all duration-700 border-l border-[#1C1C1C]/10 pl-12 ${
                isActive('/admin') ? 'text-[#D4AF37]' : 'text-[#1C1C1C]/25 hover:text-[#1C1C1C]/60'
              }`}
            >
              Console
            </Link>
          )}
        </div>

        <div className="flex items-center gap-6">
          {profile && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 border border-[#1C1C1C]/10 bg-[#1C1C1C]/[0.02]">
                <Zap size={9} style={{ color: tierCfg?.color || '#D4AF37' }} />
                {isAdmin ? (
                  <span className="text-[9px] font-mono text-[#1C1C1C]/55">∞ <span className="text-[8px] text-[#1C1C1C]/35 uppercase tracking-widest">credits</span></span>
                ) : profile.tier === 'free' && !profile.freeRunUsed ? (
                  <span className="text-[9px] font-mono text-[#D4AF37]/80 uppercase tracking-widest">1 Free Run</span>
                ) : (
                  <>
                    <span className="text-[9px] font-mono text-[#1C1C1C]/55">{profile.imageCredits}</span>
                    <span className="text-[8px] font-mono text-[#1C1C1C]/35 uppercase tracking-widest">credits</span>
                  </>
                )}
              </div>

              <span
                className="text-[8px] font-mono uppercase tracking-[0.3em] px-2 py-1 border"
                style={{
                  borderColor: `${tierCfg?.color || '#D4AF37'}40`,
                  color:        tierCfg?.color || '#D4AF37',
                }}
              >
                {tierCfg?.label}
              </span>

              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full overflow-hidden border border-[#1C1C1C]/15 hover:border-[#D4AF37]/40 transition-colors shrink-0"
              >
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1C1C1C]/5 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-[#1C1C1C]/50">
                      {profile.displayName.charAt(0)}
                    </span>
                  </div>
                )}
              </button>
            </>
          )}

          {!user && (
            <Link
              to="/login"
              className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/40 hover:text-[#1C1C1C] transition-colors border border-[#1C1C1C]/15 hover:border-[#1C1C1C]/35 px-4 py-2"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* MOBILE: Top Header */}
      <nav className="md:hidden fixed top-0 left-0 w-full z-[1100] px-6 py-4 flex justify-between items-center backdrop-blur-md bg-[#FAF9F6]/85 border-b border-[#1C1C1C]/10">
        <Link to="/" className="group" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="text-2xl font-serif text-[#1C1C1C] tracking-tighter leading-none block">
            LUX<span className="text-[#D4AF37] italic font-light">AURA</span>
          </span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#1C1C1C] p-2">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* MOBILE: Full Screen Drawer — intentionally dark for contrast */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[1050] backdrop-blur-xl flex flex-col pt-24 px-8 h-[100dvh]" style={{ backgroundColor: 'rgba(10,10,10,0.97)' }}>
          <div className="flex flex-col gap-8 mt-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-xl font-mono uppercase tracking-[0.3em] flex items-center gap-3 ${
                  isActive(link.path) ? 'text-[#D4AF37]' : 'text-white/60'
                }`}
              >
                {link.name}
                {link.soon && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className={`text-xl font-mono uppercase tracking-[0.3em] border-l-2 border-[#D4AF37]/50 pl-4 mt-4 ${
                  isActive('/admin') ? 'text-[#D4AF37]' : 'text-white/50'
                }`}
              >
                Console
              </Link>
            )}
          </div>

          <div className="mt-auto mb-12 flex flex-col gap-6">
            {profile ? (
              <div className="flex items-center justify-between border-t border-white/10 pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/40">
                        <span className="text-lg font-mono tracking-tighter">
                          {profile.displayName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-white/60">{profile.displayName}</span>
                    <div className="flex items-center gap-1.5 border border-white/10 rounded-full px-2 py-0.5 w-max">
                      <Zap size={10} style={{ color: tierCfg?.color || '#D4AF37' }} />
                      <span className="text-[10px] font-mono text-white/60">
                        {isAdmin ? '∞ credits' : profile.tier === 'free' && !profile.freeRunUsed ? '1 Free Run' : `${profile.imageCredits} credits`}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400/80 hover:text-red-400 border border-red-500/20 px-3 py-1.5 rounded-sm">
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full text-center text-xs font-mono uppercase tracking-[0.3em] text-[#D4AF37] border border-[#D4AF37]/30 py-4 hover:bg-[#D4AF37]/5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SovereignNavigation;
