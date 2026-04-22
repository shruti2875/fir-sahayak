/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LoginFlow } from './components/LoginFlow';
import { Dashboard } from './components/Dashboard';
import { Language, User } from './types';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [language, setLanguage] = React.useState<Language>('en');

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-primary text-white font-sans selection:bg-accent selection:text-primary">
      {!user ? (
        <LoginFlow onLogin={handleLogin} language={language} />
      ) : (
        <Dashboard 
          user={user} 
          language={language} 
          onLanguageChange={setLanguage} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
