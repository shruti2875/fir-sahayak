import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-md border border-gray-200 relative z-10"
          >
            <div className="flex flex-col items-center mb-8">
              
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-orange-500 w-8 h-8" />
              </div>

              <p className="text-sm text-gray-500 mb-1">Government of India</p>
              <h1 className="text-2xl font-bold text-gray-800">{t.loginTitle}</h1>
              <p className="text-gray-500 text-sm mt-1">Enter your station details to proceed</p>
            </div>

            <form onSubmit={handleNext} className="space-y-4">
              
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.stationName}</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. Central Police Station"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.stationLocation}</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.contactNumber}</label>
                <input
                  required
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="+91 00000 00000"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg mt-4 flex items-center justify-center gap-2 transition"
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
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-md border border-gray-200 relative z-10"
          >
            <div className="flex flex-col items-center mb-8">

              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-orange-500 w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold text-gray-800">{t.officerLogin}</h1>
              <p className="text-gray-500 text-sm mt-1">Verify officer credentials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.officerName}</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Officer Name"
                  value={formData.officerName}
                  onChange={(e) => setFormData({ ...formData, officerName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.emailId}</label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="officer@police.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative">
                <label className="text-xs font-medium text-gray-600 uppercase">{t.password}</label>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg mt-4 flex items-center justify-center gap-2 transition"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t.login}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-500 text-sm hover:text-gray-700 mt-2"
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