import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MessageSquare, 
  Send, 
  Mic, 
  User, 
  Shield, 
  Calendar,
  Brain,
  FileText,
  AlertTriangle,
  MapPin,
  BookOpen,
  LogOut,
  MoreVertical,
  Languages
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Language, Message, ChatHistory, User as UserType } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateResponse } from '../services/geminiService';

interface DashboardProps {
  user: UserType;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

const SidebarContent = ({ t, history, user, onLogout, onNewChat }: any) => (
  <>
    <div className="p-6 border-b border-white/10">
      <button 
        onClick={onNewChat}
        className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-accent/10"
      >
        <Plus className="w-5 h-5" />
        {t.newChat}
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest px-2 mb-4">{t.history}</h3>
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-white/20 space-y-2">
          <MessageSquare className="w-10 h-10 opacity-20" />
          <p className="text-sm">{t.noChats}</p>
        </div>
      ) : (
        history.map((chat: any) => (
          <button key={chat.id} className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors text-left group">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-white/80 truncate pr-4">{chat.title}</h4>
              <span className="text-[10px] text-white/30 whitespace-nowrap">{chat.date.toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-white/40 mt-1 truncate">{chat.lastMessage}</p>
          </button>
        ))
      )}
    </div>
    <div className="p-6 border-t border-white/10">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
          <User className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold truncate">{user.officerName}</p>
          <p className="text-[10px] text-white/40 truncate">{user.stationName}</p>
        </div>
        <button onClick={onLogout} className="text-white/30 hover:text-danger transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, language, onLanguageChange, onLogout }) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello Officer ${user.officerName}. I am FIR Sahayak. How can I assist you today? You can describe an incident, and I will help you draft a structured FIR.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [history] = React.useState<ChatHistory[]>([]);
  const [showModal, setShowModal] = React.useState<string | null>(null);

  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);

  const t = TRANSLATIONS[language];
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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

    try {
      const response = await generateResponse([...messages, userMessage], language);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'I apologize, I could not process that.',
        timestamp: new Date(),
        actions: ['solveCase', 'downloadFIR', 'checkMissing', 'findJurisdiction', 'knowRights']
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const ActionIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'solveCase': return <Brain className="w-4 h-4" />;
      case 'downloadFIR': return <FileText className="w-4 h-4" />;
      case 'checkMissing': return <AlertTriangle className="w-4 h-4" />;
      case 'findJurisdiction': return <MapPin className="w-4 h-4" />;
      case 'knowRights': return <BookOpen className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      {/* Sidebar History (30%) */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
            <div className="relative w-[80%] h-full bg-secondary border-r border-white/10 flex flex-col">
              <SidebarContent 
                t={t} 
                history={history} 
                user={user} 
                onLogout={onLogout} 
                onNewChat={() => {
                  setMessages([{ id: '1', role: 'assistant', content: `Hello Officer ${user.officerName}. I am FIR Sahayak. How can I assist you today?`, timestamp: new Date() }]);
                  setShowMobileSidebar(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:flex flex-col w-[30%] border-r border-white/10 bg-secondary/20">
        <SidebarContent t={t} history={history} user={user} onLogout={onLogout} onNewChat={() => setMessages([{ id: '1', role: 'assistant', content: `Hello Officer ${user.officerName}. I am FIR Sahayak. How can I assist you today?`, timestamp: new Date() }])} />
      </div>

      {/* Main Chat Area (70%) */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-primary/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 mr-2"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Shield className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{t.appName}</h2>
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl">
              {(['en', 'hi', 'mr'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    language === lang ? "bg-accent text-primary" : "text-white/40 hover:text-white/60"
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="md:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col max-w-[85%] md:max-w-[70%]",
                msg.role === 'user' ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
                msg.role === 'user' 
                  ? "bg-accent text-primary font-medium rounded-tr-none" 
                  : "glass text-white/90 rounded-tl-none"
              )}>
                {msg.content}
              </div>
              <span className="text-[10px] text-white/30 mt-2 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {msg.role === 'assistant' && msg.actions && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {msg.actions.map(action => (
                    <motion.button
                      key={action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowModal(action)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                      <ActionIcon type={action} />
                      {t[action]}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-white/30 text-xs font-medium">
              <div className="flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/30 rounded-full" />
              </div>
              AI is thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-primary via-primary to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="glass rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
              <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40 transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.inputPlaceholder}
                className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm text-white/90 placeholder:text-white/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-8 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                  <ActionIcon type={showModal} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t[showModal]}</h3>
                  <p className="text-sm text-white/40">Detailed guidance and information</p>
                </div>
              </div>

              <div className="space-y-4 text-white/80 leading-relaxed">
                {showModal === 'downloadFIR' && (
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 font-mono text-xs space-y-4">
                    <div className="text-center border-b border-white/10 pb-4 mb-4">
                      <p className="font-bold text-sm">FIRST INFORMATION REPORT</p>
                      <p>(Under Section 154 Cr.P.C.)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-white/40">District:</span> {user.location.split(',')[1] || '---'}</div>
                      <div><span className="text-white/40">P.S.:</span> {user.stationName}</div>
                      <div><span className="text-white/40">FIR No:</span> 2026/03/001</div>
                      <div><span className="text-white/40">Date:</span> {new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="pt-4">
                      <p className="font-bold mb-2">Details of Incident:</p>
                      <p className="text-white/60 italic">"The complainant reported a theft of mobile phone at the central market around 2:00 PM today..."</p>
                    </div>
                    <button className="w-full bg-accent text-primary font-bold py-3 rounded-xl mt-6 flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5" />
                      Download PDF
                    </button>
                  </div>
                )}

                {showModal === 'solveCase' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-bold text-accent mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Immediate Action
                      </h4>
                      <p className="text-sm">Secure the crime scene and collect any available CCTV footage from nearby shops.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-bold text-accent mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Witness Statements
                      </h4>
                      <p className="text-sm">Identify and record statements of at least two independent witnesses present at the scene.</p>
                    </div>
                  </div>
                )}

                {showModal === 'checkMissing' && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">To make this FIR stronger, please provide:</p>
                    <ul className="space-y-2">
                      {['Exact time of incident', 'Description of suspect', 'Serial number of stolen item'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="w-2 h-2 bg-warning rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showModal === 'knowRights' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-bold text-accent mb-1">Right to a Copy</h4>
                      <p className="text-xs">The informant is entitled to receive a copy of the FIR free of cost immediately.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-bold text-accent mb-1">Right to Information</h4>
                      <p className="text-xs">The police must inform the informant about the progress of the investigation.</p>
                    </div>
                  </div>
                )}

                {showModal === 'findJurisdiction' && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <MapPin className="w-12 h-12 text-accent animate-bounce" />
                    <p className="text-center text-sm">Detecting nearest police station based on incident location...</p>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowModal(null)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl mt-8 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
