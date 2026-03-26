import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LoginFlowProps {
  onLogin: (userData: any) => void;
  language: Language;
}

export const LoginFlow: React.FC<LoginFlowProps> = ({ onLogin, language }) => {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    stationName: '',
    location: '',
    contact: '',
    officerName: '',
    email: '',
    password: ''
  });

  const t = TRANSLATIONS[language];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(formData);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/30 rounded-full blur-[120px]" />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                <Shield className="text-primary w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white">{t.loginTitle}</h1>
              <p className="text-white/60 text-sm mt-1">Enter your station details to proceed</p>
            </div>

            <form onSubmit={handleNext} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t.stationName}</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="e.g. Central Police Station"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t.stationLocation}</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t.contactNumber}</label>
                <input
                  required
                  type="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="+91 00000 00000"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    {t.next}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                <Shield className="text-primary w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white">{t.officerLogin}</h1>
              <p className="text-white/60 text-sm mt-1">Verify officer credentials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t.officerName}</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="Officer Name"
                  value={formData.officerName}
                  onChange={(e) => setFormData({ ...formData, officerName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t.emailId}</label>
                <input
                  required
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="officer@police.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1 relative">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{t.password}</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t.login}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-white/40 text-sm hover:text-white/60 transition-colors mt-2"
              >
                Go back to station details
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
