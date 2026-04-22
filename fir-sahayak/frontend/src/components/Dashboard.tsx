import React from 'react';
import {
  Plus, Send, User, Shield, LogOut
} from 'lucide-react';
import { Language, Message, User as UserType } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateResponse } from '../services/geminiService';

interface DashboardProps {
  user: UserType;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, language, onLanguageChange, onLogout }) => {

  const [messages, setMessages] = React.useState<Message[]>([
  {
    id: '1',
    role: 'assistant',
    content: `Hello Officer ${user.officerName}. I am FIR Sahayak. How can I assist you today?`,
    timestamp: new Date()
  }
]);
  
  

  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const t = TRANSLATIONS[language];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const response = await generateResponse([...messages, userMessage], language);

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: response || "Unable to process.",
        timestamp: new Date()
      }
    ]);

    setIsTyping(false);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Hello Officer ${user.officerName}. ${t.appName} ready.`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-[30%] hidden md:flex flex-col bg-white border-r border-gray-200 p-4">

        <button
          onClick={handleNewChat}
          className="bg-orange-500 text-white py-2 rounded-lg mb-4 flex items-center justify-center gap-2"
        >
          <Plus /> {t.newChat}
        </button>

        <div className="flex-1 text-gray-500 text-sm">
          No chat history
        </div>

        <div className="border-t pt-4 mt-4 flex items-center gap-2">
          <User />
          <div>
            <p className="text-gray-800 font-semibold">{user.officerName}</p>
            <p className="text-gray-500 text-xs">{user.stationName}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-4 text-red-500 flex items-center gap-2"
        >
          <LogOut /> Logout
        </button>

      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white">

          <div className="flex items-center gap-2">
            <Shield className="text-orange-500" />
            <div>
              <h2 className="font-bold text-gray-800">{t.appName}</h2>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Language Switch */}
          <div className="flex gap-2">
            {(['en', 'hi', 'mr'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={
                  language === lang
                    ? "bg-orange-500 text-white px-2 py-1 rounded"
                    : "text-gray-500 hover:text-gray-800 px-2 py-1"
                }
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">

          {messages.map(msg => (
            <div
              key={msg.id}
              className={msg.role === 'user' ? "text-right" : "text-left"}
            >
              <div
                className={
                  msg.role === 'user'
                    ? "bg-orange-500 text-white inline-block px-4 py-2 rounded-lg"
                    : "bg-gray-100 text-gray-800 inline-block px-4 py-2 rounded-lg"
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <p className="text-gray-400 text-sm">Typing...</p>
          )}

        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white flex gap-2 fixed bottom-0 left-0 right-0 md:left-[30%]">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type FIR details..."
            className="flex-1 border border-gray-300 bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400"
          />

          <button
            onClick={handleSend}
            className="bg-orange-500 text-white px-4 rounded-lg"
          >
            <Send />
          </button>

        </div>

      </div>
    </div>
  );
};