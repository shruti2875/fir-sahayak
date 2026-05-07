import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Language, User } from '../types';
import { TRANSLATIONS } from '../constants';
import {
  registerStation,
  getStationByName,
  loginOfficer,
  registerOfficer,
} from '../services/firService';

interface SavedStation {
  station_id: number;
  stationName: string;
  location: string;
  contact: string;
}

interface LoginFlowProps {
  onLogin: (userData: User) => void;
  language: Language;
  savedStation?: SavedStation | null;
}

export const LoginFlow: React.FC<LoginFlowProps> = ({ onLogin, language, savedStation }) => {
  const [step, setStep] = React.useState(savedStation ? 2 : 1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);

  const [stationForm, setStationForm] = React.useState({
    stationName: savedStation?.stationName || '',
    location: savedStation?.location || '',
    contact: savedStation?.contact || '',
  });

  const [officerForm, setOfficerForm] = React.useState({
    officerName: '',
    email: '',
    password: '',
    rank: '',
  });

  // Resolved station_id after step 1
  const [stationId, setStationId] = React.useState<number | null>(
    savedStation?.station_id ?? null
  );

  const t = TRANSLATIONS[language];

  // ── Step 1: Station ────────────────────────────────────────────────────────
  const handleStationNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Try to find existing station first to avoid duplicates
      let station;
      try {
        station = await getStationByName(stationForm.stationName);
      } catch {
        // Not found — create it
        station = await registerStation({
          station_name: stationForm.stationName,
          location: stationForm.location,
          contact_number: stationForm.contact,
        });
      }
      setStationId(station.station_id);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to register station. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Officer login / register ──────────────────────────────────────
  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!stationId) {
      setError('Station ID missing. Please go back and re-enter station details.');
      return;
    }
    setLoading(true);
    try {
      let officer;
      if (isRegistering) {
        officer = await registerOfficer({
          name: officerForm.officerName,
          email: officerForm.email,
          password: officerForm.password,
          rank: officerForm.rank,
          station_id: stationId,
        });
      } else {
        officer = await loginOfficer(officerForm.email, officerForm.password);
      }

      onLogin({
        station_id: stationId,
        stationName: stationForm.stationName || savedStation?.stationName || '',
        location: stationForm.location || savedStation?.location || '',
        contact: stationForm.contact || savedStation?.contact || '',
        officer_id: officer.officer_id,
        officerName: officer.name,
        email: officer.email,
        rank: officer.rank,
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStation = () => {
    setStep(1);
    setStationId(null);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AnimatePresence mode="wait">

        {/* ── Step 1: Station ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-md border border-gray-200"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-orange-500 w-8 h-8" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Government of India</p>
              <h1 className="text-2xl font-bold text-gray-800">{t.loginTitle}</h1>
              <p className="text-gray-500 text-sm mt-1">Enter your station details to proceed</p>
            </div>

            <form onSubmit={handleStationNext} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.stationName}</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. Central Police Station"
                  value={stationForm.stationName}
                  onChange={(e) => setStationForm({ ...stationForm, stationName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.stationLocation}</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="City, State"
                  value={stationForm.location}
                  onChange={(e) => setStationForm({ ...stationForm, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.contactNumber}</label>
                <input
                  required
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="+91 00000 00000"
                  value={stationForm.contact}
                  onChange={(e) => setStationForm({ ...stationForm, contact: e.target.value })}
                />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg mt-4 flex items-center justify-center gap-2 transition"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>{t.next}<ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Step 2: Officer ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-md border border-gray-200"
          >
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-orange-500 w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isRegistering ? 'Register Officer' : t.officerLogin}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {savedStation
                  ? `Station: ${savedStation.stationName}`
                  : `Station: ${stationForm.stationName}`}
              </p>
            </div>

            <form onSubmit={handleOfficerSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase">{t.officerName}</label>
                    <input
                      required
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Officer Name"
                      value={officerForm.officerName}
                      onChange={(e) => setOfficerForm({ ...officerForm, officerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase">Rank</label>
                    <input
                      required
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="e.g. Inspector"
                      value={officerForm.rank}
                      onChange={(e) => setOfficerForm({ ...officerForm, rank: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">{t.emailId}</label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="officer@police.gov.in"
                  value={officerForm.email}
                  onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                />
              </div>

              <div className="relative">
                <label className="text-xs font-medium text-gray-600 uppercase">{t.password}</label>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 bg-white text-black caret-black focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="••••••••"
                  value={officerForm.password}
                  onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg mt-2 flex items-center justify-center gap-2 transition"
              >
                {loading
                  ? <Loader2 className="animate-spin w-5 h-5" />
                  : isRegistering ? 'Register & Login' : t.login}
              </button>

              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="w-full text-orange-500 text-sm hover:text-orange-600 mt-1"
              >
                {isRegistering ? 'Already registered? Login' : 'New officer? Register here'}
              </button>

              <button
                type="button"
                onClick={handleChangeStation}
                className="w-full text-gray-400 text-xs hover:text-gray-600 mt-1"
              >
                Change Station
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
