import React, { useState } from 'react';
import { 
  Wind, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { registerUser, setAuthSession } from '../../services/api';
import AirParticlesBackground from '../3D/AirParticlesBackground';
import Card3DTilt from '../3D/Card3DTilt';

export default function RegisterPage({ onRegisterSuccess, onNavigateLogin, onNavigateHome }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Too short', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const validate = () => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter a full name (at least 2 characters).');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await registerUser(name.trim(), email.trim().toLowerCase(), password);
      if (data && data.access_token) {
        setAuthSession(data.access_token, data.user);
        onRegisterSuccess(data.user);
      } else {
        setErrorMsg('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else if (Array.isArray(detail)) {
        setErrorMsg(detail.map((d) => d.msg || d.detail).join(', '));
      } else {
        setErrorMsg('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <AirParticlesBackground density="low" opacity={0.3} />

      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to home</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Free Account</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-[1.5px] shadow-xl shadow-emerald-500/20 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Wind className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
                    AirSense<span className="text-emerald-400">.</span>ai
                  </h1>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">Predict Air. Plan Smart. Breathe Better.</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed pt-1">
                Gain continuous access to real-time atmospheric intelligence, configure threshold notifications for local AQI surges, and plan healthier travel corridors.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Global Atmospheric Search</span>
                  <span className="text-[11px] text-slate-400">Query and monitor any city worldwide</span>
                </div>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Machine Learning Forecasts</span>
                  <span className="text-[11px] text-slate-400">24-hour predictive curves using trained XGBoost regressors</span>
                </div>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Pollution-Aware Route Navigation</span>
                  <span className="text-[11px] text-slate-400">Compare travel time vs estimated atmospheric exposure</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card3DTilt maxTilt={3} scale={1.005} glowColor="rgba(16, 185, 129, 0.2)">
              <div className="glass-panel-elevated rounded-3xl p-7 sm:p-10 border border-slate-700/60 shadow-2xl relative">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
                    Create your account
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill in your details below to get started immediately.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Madhan K"
                        autoComplete="name"
                        className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Free Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={onNavigateLogin}
                    className="text-emerald-400 hover:text-emerald-300 font-bold ml-1 cursor-pointer transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </Card3DTilt>
          </div>
        </div>
      </div>
    </div>
  );
}
