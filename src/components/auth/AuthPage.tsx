import { useState, type FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/api';
import { useStore } from '../../store/useStore';
import { LogoCivil as CivilEngineeringLogo } from '../LogoCivil';

type AxiosLikeError = {
  response?: { data?: { message?: string; resetToken?: string; resetUrl?: string } };
};

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setUser, setAuthenticated } = useStore();
  const [rememberMe, setRememberMe] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', newPassword: '', confirmPassword: '', role: 'user'
  });

  useEffect(() => {
    // Check URL for reset token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    } else if (window.location.pathname.includes('reset-password')) {
      // Buka /reset-password tanpa token — tampilkan error
      setMode('reset');
      setError('Link reset tidak valid. Silakan minta link reset baru.');
    }

    const saved = localStorage.getItem('sivilize_remember_me');
    if (saved) {
      try {
        const { email } = JSON.parse(saved);
        setFormData(prev => ({ ...prev, email }));
        setRememberMe(true);
      } catch {
        localStorage.removeItem('sivilize_remember_me');
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const response = await authService.login({ email: formData.email, password: formData.password, rememberMe });
        if (response.success) {
          setUser(response.data);
          setAuthenticated(true);
          if (rememberMe) localStorage.setItem('sivilize_remember_me', JSON.stringify({ email: formData.email }));
          else localStorage.removeItem('sivilize_remember_me');
        }
      } else if (mode === 'register') {
        const response = await authService.register({ name: formData.name, email: formData.email, password: formData.password });
        if (response.success) { setUser(response.data); setAuthenticated(true); }
      } else if (mode === 'forgot') {
        const response = await authService.forgotPassword(formData.email);
        if (response.success) {
          // Dev mode: tampilkan token langsung
          if (response.data?.resetToken) {
            setResetToken(response.data.resetToken);
            setSuccess(`Link reset: ${response.data.resetUrl || ''}`);
          } else {
            setSuccess(`Email reset password telah dikirim ke ${formData.email}. Cek inbox Anda.`);
          }
        }
      } else if (mode === 'reset') {
        if (!resetToken) {
          setError('Link reset tidak valid. Silakan minta link reset baru.');
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Password baru tidak cocok');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          setError('Password minimal 8 karakter');
          setLoading(false);
          return;
        }
        const response = await authService.resetPassword(resetToken, formData.newPassword);
        if (response.success) {
          setSuccess('Password berhasil diubah! Anda akan diarahkan ke halaman login...');
          setTimeout(() => {
            setMode('login');
            setError('');
            setSuccess('');
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
            // Bersihkan token dari URL
            window.history.replaceState({}, '', '/');
          }, 3000);
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      setError(axiosErr.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-glow mb-4 text-white">
        <CivilEngineeringLogo size={40} variant="icon" className="text-white" />
      </div>
      <h1 className="text-3xl font-black text-white italic tracking-tighter">SIVILIZE HUB PRO</h1>
      <p className="text-text-secondary mt-2">Platform Teknik Sipil Berbasis AI</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Logo />
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-8">

            {/* Tab Login/Register */}
            {(mode === 'login' || mode === 'register') && (
              <div className="flex gap-4 mb-8 bg-background p-1 rounded-xl border border-border">
                <button onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary'}`}>Login</button>
                <button onClick={() => { setMode('register'); setError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'register' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary'}`}>Register</button>
              </div>
            )}

            {/* Forgot Password Header */}
            {mode === 'forgot' && (
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <KeyRound size={24} className="text-primary" />
                </div>
                <h2 className="text-white font-bold text-lg">Lupa Password</h2>
                <p className="text-text-secondary text-sm mt-1">Masukkan email Anda untuk mendapatkan link reset password</p>
              </div>
            )}

            {/* Reset Password Header */}
            {mode === 'reset' && (
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Lock size={24} className="text-primary" />
                </div>
                <h2 className="text-white font-bold text-lg">Reset Password</h2>
                <p className="text-text-secondary text-sm mt-1">Masukkan password baru Anda</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Register: Nama */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary uppercase font-bold">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-all" placeholder="Nama Lengkap" />
                  </div>
                </div>
              )}

              {/* Email */}
              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary uppercase font-bold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-all" placeholder="email@contoh.com" />
                  </div>
                </div>
              )}

              {/* Password (login/register) */}
              {(mode === 'login' || mode === 'register') && (
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary uppercase font-bold">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-all" placeholder="••••••••" />
                  </div>
                </div>
              )}

              {/* New Password (reset) */}
              {mode === 'reset' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary uppercase font-bold">Password Baru</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                      <input type="password" required value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-all" placeholder="Min. 8 karakter" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary uppercase font-bold">Konfirmasi Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                      <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-all" placeholder="Ulangi password baru" />
                    </div>
                  </div>
                </>
              )}

              {/* Remember me */}
              {mode === 'login' && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input id="remember-me" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 bg-background border border-border rounded cursor-pointer accent-primary" />
                    <label htmlFor="remember-me" className="text-xs text-text-secondary cursor-pointer">Ingat saya</label>
                  </div>
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs text-primary hover:text-primary-hover transition-colors font-bold">
                    Lupa Password?
                  </button>
                </div>
              )}

              {/* Error & Success */}
              {error && (
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <p className="text-red-500 text-xs font-bold">{error}</p>
                  {mode === 'reset' && !resetToken && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="mt-2 text-xs text-primary hover:text-primary-hover font-bold underline"
                    >
                      Minta Link Reset Baru →
                    </button>
                  )}
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                  <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                  <p className="text-green-400 text-xs font-bold break-all">{success}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4 group">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' ? 'Masuk ke Platform' :
                       mode === 'register' ? 'Daftar Sekarang' :
                       mode === 'forgot' ? 'Kirim Link Reset' : 'Reset Password'}
                    </span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Back to login */}
              {(mode === 'forgot' || mode === 'reset') && (
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-xs text-text-secondary hover:text-white transition-colors mt-2">
                  ← Kembali ke Login
                </button>
              )}
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
