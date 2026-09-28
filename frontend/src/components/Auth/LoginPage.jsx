import React, { useState } from 'react';
import { 
  Wind, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Navigation,
  Activity
} from 'lucide-react';
import { loginUser, setAuthSession } from '../../services/api';
import AirParticlesBackground from '../3D/AirParticlesBackground';
import Card3DTilt from '../3D/Card3DTilt';

export default function LoginPage({ onLoginSuccess, onNavigateRegister, onNavigateHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
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
      const data = await loginUser(email.trim(), password);
      if (data && data.access_token) {
        setAuthSession(data.access_token, data.user);
        onLoginSuccess(data.user);
      } else {
        setErrorMsg('Authentication failed. No token received.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else if (Array.isArray(detail)) {
        setErrorMsg(detail.map((d) => d.msg || d.detail).join(', '));
      } else {
        setErrorMsg('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@airsense.ai');
    setPassword('demo123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <AirParticlesBackground density="low" opacity={0.3} />

      {/* Atmospheric lighting glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        {/* Back to Home Link */}
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to home</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ========================================================================= */}
          {/* LEFT: LARGE ATMOSPHERIC VISUAL & PLATFORM IDENTITY                         */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Environmental Intelligence</span>
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
                Access your environmental surveillance console, evaluate trained XGBoost 24-hour predictions, and compute lower-exposure driving routes.
              </p>
            </div>

            {/* Feature Highlights Modules */}
            <div className="space-y-3 pt-2">
              <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Real-Time AQI & Weather</span>
                  <span className="text-[11px] text-slate-400">Continuous multi-pollutant readings across worldwide monitoring nodes</span>
                </div>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">XGBoost ML Forecasting</span>
                  <span className="text-[11px] text-slate-400">24-hour predictive curves with empirical error bounds</span>
                </div>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Cleaner Route Planning</span>
                  <span className="text-[11px] text-slate-400">OSRM road routing with estimated atmospheric exposure reduction</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: MINIMAL GLASS AUTHENTICATION PANEL                                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6">
            <Card3DTilt maxTilt={3} scale={1.005} glowColor="rgba(16, 185, 129, 0.2)">
              <div className="glass-panel-elevated rounded-3xl p-7 sm:p-10 border border-slate-700/60 shadow-2xl relative">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
                    Welcome back.
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your credentials to access your environmental dashboard.
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
                    <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email"
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleDemoFill}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                      >
                        Use Demo Credentials
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
                  Don&apos;t have an account yet?{' '}
                  <button
                    onClick={onNavigateRegister}
                    className="text-emerald-400 hover:text-emerald-300 font-bold ml-1 cursor-pointer transition-colors"
                  >
                    Register free
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
