import React from 'react';
import { LoginFlow } from './components/LoginFlow';
import { Dashboard } from './components/Dashboard';
import { Language, User } from './types';
import { getStationByName } from './services/firService';

const STATION_KEY = 'fir_station_data';

interface SavedStation {
  station_id: number;
  stationName: string;
  location: string;
  contact: string;
}

export default function App() {
  const [language, setLanguage] = React.useState<Language>('en');
  const [officer, setOfficer] = React.useState<User | null>(null);

  const [savedStation, setSavedStation] = React.useState<SavedStation | null>(() => {
    try {
      const raw = localStorage.getItem(STATION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Validate saved station against DB on startup — clear if it no longer exists
  React.useEffect(() => {
    if (!savedStation) return;
    getStationByName(savedStation.stationName).catch(() => {
      // Station not found in DB (e.g. DB was reset) — clear stale cache
      localStorage.removeItem(STATION_KEY);
      setSavedStation(null);
    });
  }, []);

  const handleLogin = (userData: User) => {
    const stationData: SavedStation = {
      station_id: userData.station_id,
      stationName: userData.stationName,
      location: userData.location,
      contact: userData.contact,
    };
    localStorage.setItem(STATION_KEY, JSON.stringify(stationData));
    setSavedStation(stationData);
    setOfficer(userData);
  };

  const handleLogout = () => {
    setOfficer(null);
  };

  const handleChangeStation = () => {
    localStorage.removeItem(STATION_KEY);
    setSavedStation(null);
    setOfficer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {!officer ? (
        <LoginFlow
          onLogin={handleLogin}
          language={language}
          savedStation={savedStation}
        />
      ) : (
        <Dashboard
          user={officer}
          language={language}
          onLanguageChange={setLanguage}
          onLogout={handleLogout}
          onChangeStation={handleChangeStation}
        />
      )}
    </div>
  );
}
