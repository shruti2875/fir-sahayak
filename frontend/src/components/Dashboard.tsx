import React from "react";
import { createPortal } from "react-dom";
import { Plus, Send, User, Shield, LogOut, X, Trash2, Pin, PinOff, Upload, Image as ImageIcon } from "lucide-react";
import jsPDF from "jspdf";
import { Language, Message, Chat, User as UserType, ImageAnalysisResult } from "../types";
import { TRANSLATIONS } from "../constants";
import { generateSmartFIR, analyzeImage, downloadFIRPDF } from "../services/firService";

interface DashboardProps {
  user: UserType;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onChangeStation: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function splitToItems(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n]|\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalise backend value (array or string) into a string[] */
function toList(value: string[] | string | undefined | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return splitToItems(value);
}

function makeWelcome(officerName: string): Message {
  return {
    id: uid(),
    role: "assistant",
    content: `Hello Officer ${officerName}. I am FIR Sahayak. How can I assist you today?`,
    timestamp: new Date(),
  };
}

function makeChat(officerName: string, title?: string): Chat {
  return {
    id: uid(),
    title: title ?? "New Chat",
    messages: [makeWelcome(officerName)],
    pinned: false,
    createdAt: new Date(),
  };
}

// ── Pure updater helpers (no stale closure risk) ──────────────────────────────

function addMessageToChat(
  prev: Record<string, Chat>,
  chatId: string,
  msg: Message
): Record<string, Chat> {
  const chat = prev[chatId];
  if (!chat) return prev;
  const isFirstUserMsg = msg.role === "user" && chat.title === "New Chat";
  return {
    ...prev,
    [chatId]: {
      ...chat,
      messages: [...chat.messages, msg],
      title: isFirstUserMsg
        ? msg.content.slice(0, 40) + (msg.content.length > 40 ? "…" : "")
        : chat.title,
    },
  };
}

// ── Modal (portal) ────────────────────────────────────────────────────────────

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) =>
  createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );

// ── Confidence color ──────────────────────────────────────────────────────────

function confidenceColor(c: string) {
  const v = c?.toLowerCase() ?? "";
  if (v.includes("high")) return "bg-green-100 text-green-700 border-green-200";
  if (v.includes("low")) return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

// ── Suggestions bullet list ───────────────────────────────────────────────────

const SuggestionsContent: React.FC<{ value: string[] | string }> = ({ value }) => {
  const items = toList(value);
  if (!items.length)
    return <p className="text-sm text-gray-400">No suggestions available.</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 items-start text-sm text-gray-700">
          <span className="mt-0.5 text-blue-500 font-bold shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

// ── Missing info form with image analysis ────────────────────────────────────

const MissingInfoForm: React.FC<{
  value: string[] | string;
  language: Language;
  onSubmit: (combined: string) => void;
  onClose: () => void;
}> = ({ value, language, onSubmit, onClose }) => {
  const fields = toList(value);
  // Key by index to avoid collisions when two fields have the same label
  const [formData, setFormData] = React.useState<Record<number, string>>(
    () => Object.fromEntries(fields.map((_, i) => [i, ""]))
  );
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [extractedInfo, setExtractedInfo] = React.useState<string>("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [imageDescription, setImageDescription] = React.useState("");

  if (!fields.length && !imageFile && !extractedInfo)
    return <p className="text-sm text-gray-400">No missing information detected.</p>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      const result = await analyzeImage(imageFile, imageDescription, language);
      setExtractedInfo(result.extracted_info);
    } catch (err) {
      console.error("Image analysis failed:", err);
      setExtractedInfo("Failed to analyze image. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const fieldParts = fields
      .map((label, i) => formData[i]?.trim() ? `${label}: ${formData[i].trim()}` : "")
      .filter(Boolean)
      .join(", ");
    const extraInfo = extractedInfo ? `\nExtracted Evidence: ${extractedInfo}` : "";
    const combined = fieldParts + extraInfo;
    if (!combined.trim()) return;
    onSubmit(combined);
    onClose();
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <p className="text-xs text-gray-400">Fill in the missing details and/or upload evidence images.</p>

      {/* Image Upload Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={16} className="text-blue-600" />
          <label className="text-sm font-medium text-blue-900">Upload Evidence Image</label>
        </div>
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-blue-300 rounded px-3 py-2 text-sm bg-white cursor-pointer"
          />
          {imagePreview && (
            <>
              <img src={imagePreview} alt="Preview" className="w-full max-h-32 object-contain rounded border border-blue-200" />
              <input
                type="text"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Describe what you see in the image (optional)..."
                className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAnalyzeImage}
                disabled={analyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded transition flex items-center justify-center gap-2"
              >
                <Upload size={14} /> {analyzing ? "Analyzing..." : "Analyze Image"}
              </button>
            </>
          )}
          {extractedInfo && (
            <div className="bg-blue-100 border border-blue-300 rounded p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">Extracted Information:</p>
              <p className="text-xs text-blue-800">{extractedInfo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Missing Info Fields — one input per field, properly spaced */}
      {fields.length > 0 && (
        <div className="flex flex-col gap-3">
          {fields.map((field, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {field}
              </label>
              <input
                type="text"
                value={formData[i] ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [i]: e.target.value }))
                }
                placeholder={`Enter ${field.toLowerCase()}...`}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-300"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg transition"
      >
        Submit & Refine FIR
      </button>
    </div>
  );
};

// ── Similar cases list ────────────────────────────────────────────────────────

const SimilarCasesContent: React.FC<{
  cases: { description: string }[];
  onSelect: (desc: string) => void;
  onClose: () => void;
}> = ({ cases, onSelect, onClose }) => {
  if (!cases?.length)
    return <p className="text-sm text-gray-400">No similar cases found.</p>;
  return (
    <ul className="space-y-3">
      {cases.map((c, i) => (
        <li key={i}>
          <button
            onClick={() => {
              onSelect(c.description);
              onClose();
            }}
            className="w-full text-left bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 rounded-xl px-4 py-3 text-sm text-gray-700 transition"
          >
            <span className="text-purple-400 font-bold mr-2">#{i + 1}</span>
            {c.description}
          </button>
        </li>
      ))}
    </ul>
  );
};

// ── FIR message bubble ────────────────────────────────────────────────────────

const FIRMessage: React.FC<{
  msg: Message;
  language: Language;
  onSendInChat: (text: string) => void;
  onOpenNewChat: (text: string) => void;
}> = ({ msg, language, onSendInChat, onOpenNewChat }) => {
  const [modal, setModal] = React.useState<null | "suggestions" | "missing" | "similar">(null);
  const [downloadingPDF, setDownloadingPDF] = React.useState(false);

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const pdf = await downloadFIRPDF(msg.content);
      
      // Validate blob
      if (!pdf || pdf.size === 0) {
        throw new Error("PDF is empty or invalid");
      }
      
      const url = window.URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FIR_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Delay revoke to ensure download completes
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const meta = msg.meta;

  const suggestionsList = toList(meta?.suggestions);
  const missingList     = toList(meta?.missing_info);
  const similarCases    = meta?.similar_cases ?? [];
  const hasMeta = meta && (suggestionsList.length || missingList.length || similarCases.length);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm max-w-2xl">
        <p className="text-xs font-semibold text-orange-500 mb-2 uppercase tracking-wide">
          FIR Draft
        </p>
        <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

        {hasMeta && (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestionsList.length > 0 && (
              <button
                onClick={() => setModal("suggestions")}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
              >
                💡 How to Solve
              </button>
            )}
            {missingList.length > 0 && (
              <button
                onClick={() => setModal("missing")}
                className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
              >
                ⚠️ Missing Info
              </button>
            )}
            <button
              onClick={downloadPDF}
              disabled={downloadingPDF}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 transition"
            >
              📥 {downloadingPDF ? "Generating..." : "Download FIR"}
            </button>
            {similarCases.length > 0 && (
              <button
                onClick={() => setModal("similar")}
                className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
              >
                🔍 Similar Cases
              </button>
            )}
            {meta!.confidence?.trim() && (
              <span className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${confidenceColor(meta!.confidence)}`}>
                Confidence: {meta!.confidence}
              </span>
            )}
          </div>
        )}
      </div>

      {modal === "suggestions" && meta && (
        <Modal title="💡 How to Solve This Case" onClose={() => setModal(null)}>
          <SuggestionsContent value={meta.suggestions} />
        </Modal>
      )}

      {modal === "missing" && meta && (
        <Modal title="⚠️ Missing Information" onClose={() => setModal(null)}>
          <MissingInfoForm
            value={meta.missing_info}
            language={language}
            onSubmit={onSendInChat}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === "similar" && meta && (
        <Modal title="🔍 Similar Cases" onClose={() => setModal(null)}>
          <SimilarCasesContent
            cases={meta.similar_cases}
            onSelect={(desc) => {
              onOpenNewChat(desc);
              setModal(null);
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  language,
  onLanguageChange,
  onLogout,
  onChangeStation,
}) => {
  const t = TRANSLATIONS[language];

  // Refs to always have latest language/user inside sendMessage without re-creating it
  const languageRef = React.useRef(language);
  const userRef = React.useRef(user);
  React.useEffect(() => { languageRef.current = language; }, [language]);
  React.useEffect(() => { userRef.current = user; }, [user]);

  // Stable initial chat — created once via useRef so it never re-runs
  const initialChatRef = React.useRef<Chat>(makeChat(user.officerName));

  const [chats, setChats] = React.useState<Record<string, Chat>>(() => {
    try {
      const saved = localStorage.getItem("fir_chats");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Record<string, Chat>;
          console.log("📂 Loaded chats from localStorage:", Object.keys(parsed).length);
          // Revive Date objects which JSON.parse turns into strings
          Object.values(parsed).forEach((chat) => {
            chat.createdAt = new Date(chat.createdAt);
            chat.messages.forEach((m) => {
              m.timestamp = new Date(m.timestamp);
            });
          });
          if (Object.keys(parsed).length > 0) {
            console.log("✅ Successfully restored chats");
            return parsed;
          }
        } catch (err) {
          console.error("❌ Error parsing localStorage chats:", err);
        }
      }
    } catch (err) {
      console.error("❌ localStorage initialization error:", err);
      // corrupted storage — fall through to fresh chat
    }
    const fresh = makeChat(user.officerName);
    initialChatRef.current = fresh;
    console.log("🆕 Created fresh chat");
    return { [fresh.id]: fresh };
  });

  const [activeChatId, setActiveChatId] = React.useState<string>(() => {
    const saved = localStorage.getItem("fir_active_chat");
    const chatsRaw = localStorage.getItem("fir_chats");
    if (saved && chatsRaw) {
      try {
        const parsed = JSON.parse(chatsRaw) as Record<string, Chat>;
        if (parsed[saved]) {
          console.log("✅ Restored active chat:", saved);
          return saved;
        }
      } catch (err) {
        console.warn("⚠️ Could not restore active chat ID:", err);
      }
    }
    return initialChatRef.current.id;
  });
  const [input, setInput] = React.useState("");
  const [typingChatId, setTypingChatId] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const activeChat = chats[activeChatId] ?? Object.values(chats)[0];
  const messages = activeChat?.messages ?? [];
  const isTyping = typingChatId === activeChatId;

  React.useEffect(() => {
    if (activeChatId && !chats[activeChatId]) {
      const firstChatId = Object.keys(chats)[0];
      if (firstChatId) {
        console.warn("⚠️ activeChatId invalid, switching to first available chat", activeChatId);
        setActiveChatId(firstChatId);
      }
    }
  }, [activeChatId, chats]);

  const sortedChats = React.useMemo<Chat[]>(
    () =>
      Object.values(chats as Record<string, Chat>).sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }),
    [chats]
  );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Persist chats to localStorage whenever they change
  React.useEffect(() => {
    try {
      const serialized = JSON.stringify(chats);
      localStorage.setItem("fir_chats", serialized);
      console.log("💾 Chats persisted to localStorage");
    } catch (err) {
      console.error("❌ localStorage error:", err);
      // Could be quota exceeded or other serialization error
      if (err instanceof Error && err.name === "QuotaExceededError") {
        console.warn("⚠️ localStorage quota exceeded - chats may not persist");
      }
    }
  }, [chats]);

  // Persist active chat id
  React.useEffect(() => {
    try {
      localStorage.setItem("fir_active_chat", activeChatId);
    } catch (err) {
      console.warn("⚠️ Could not persist active chat ID:", err);
    }
  }, [activeChatId]);

  // ── sendMessage: all setChats calls use functional updater → no stale closure ──

  const sendMessage = React.useCallback(async (text: string, targetChatId: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setChats((prev) => addMessageToChat(prev, targetChatId, userMsg));
    setTypingChatId(targetChatId);

    try {
      // Read latest values from refs — no stale closure, no need to re-create
      const lang = languageRef.current;
      const u = userRef.current;

      console.log("📤 Sending FIR request with:", {
        text: text.substring(0, 50) + "...",
        language: lang,
        officer: u.officerName,
        station: u.stationName,
      });

      const data = await generateSmartFIR(
        text,
        lang,
        u.officerName,
        u.location,
        u.contact,
        u.stationName
      );

      console.log("📥 FIR Response:", data);

      // ✅ VALIDATE RESPONSE STRUCTURE
      if (!data) {
        throw new Error("API returned no data");
      }

      if (!data.fir || typeof data.fir !== "string") {
        throw new Error(`Invalid FIR format: ${JSON.stringify(data)}`);
      }

      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: data.fir,
        meta: {
          fir: data.fir,
          missing_info: Array.isArray(data.missing_info)
            ? data.missing_info
            : toList(data.missing_info ?? ""),
          suggestions: Array.isArray(data.suggestions)
            ? data.suggestions
            : toList(data.suggestions ?? ""),
          confidence: data.confidence ?? "Unknown",
          similar_cases: Array.isArray(data.similar_cases) ? data.similar_cases : [],
        },
        timestamp: new Date(),
      };

      console.log("✅ Adding assistant message to chat");
      setChats((prev) => addMessageToChat(prev, targetChatId, assistantMsg));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("❌ FIR generation error:", errorMsg);

      // ✅ ADD ERROR MESSAGE TO CHAT SO USER SEES IT
      setChats((prev) =>
        addMessageToChat(prev, targetChatId, {
          id: uid(),
          role: "assistant",
          content: `⚠️ Error: ${errorMsg}\n\nPlease check:\n1. Backend is running\n2. All required fields are filled\n3. Try again`,
          timestamp: new Date(),
        })
      );
    } finally {
      setTypingChatId(null);
    }
  }, []); // stable forever — reads language/user via refs, state via functional updaters

  // ── Chat management ───────────────────────────────────────────────────────

  const createChat = React.useCallback(
    (firstMessage?: string): string => {
      const chat = makeChat(
        user.officerName,
        firstMessage
          ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "…" : "")
          : "New Chat"
      );
      setChats((prev) => ({ ...prev, [chat.id]: chat }));
      setActiveChatId(chat.id);
      return chat.id;
    },
    [user.officerName]
  );

  const deleteChat = React.useCallback(
    (id: string) => {
      setChats((prev) => {
        const next = { ...prev };
        delete next[id];
        // If deleting active chat, pick another or create fresh
        if (id === activeChatId) {
          const remaining = Object.keys(next);
          if (remaining.length > 0) {
            setActiveChatId(remaining[0]);
          } else {
            const fresh = makeChat(user.officerName);
            next[fresh.id] = fresh;
            setActiveChatId(fresh.id);
          }
        }
        return next;
      });
    },
    [activeChatId, user.officerName]
  );

  const togglePin = React.useCallback((id: string) => {
    setChats((prev) => ({
      ...prev,
      [id]: { ...prev[id], pinned: !prev[id].pinned },
    }));
  }, []);

  const handleSend = (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;
    if (!overrideText) setInput("");
    sendMessage(text, activeChatId);
  };

  const handleOpenNewChat = (desc: string) => {
    // Build the new chat object here so we can pass its id directly
    // without relying on setTimeout to wait for state to flush
    const chat = makeChat(
      userRef.current.officerName,
      desc.slice(0, 40) + (desc.length > 40 ? "\u2026" : "")
    );
    setChats((prev) => ({ ...prev, [chat.id]: chat }));
    setActiveChatId(chat.id);
    // sendMessage is stable ([] deps) and uses setChats functional updater,
    // so it safely appends to the chat we just added above
    sendMessage(desc, chat.id);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <div className="w-72 hidden md:flex flex-col bg-white border-r border-gray-200">

        <div className="p-4 border-b shrink-0">
          <button
            onClick={() => createChat()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium"
          >
            <Plus size={16} /> {t.newChat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {sortedChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition select-none ${
                chat.id === activeChatId
                  ? "bg-orange-50 border border-orange-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              {chat.pinned && <Pin size={11} className="text-orange-400 shrink-0" />}

              <span
                className={`flex-1 text-sm truncate ${
                  chat.id === activeChatId ? "text-orange-700 font-medium" : "text-gray-700"
                }`}
              >
                {chat.title}
              </span>

              <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}
                  title={chat.pinned ? "Unpin" : "Pin"}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-orange-500 transition"
                >
                  {chat.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                  title="Delete"
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {sortedChats.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-6">No chats yet</p>
          )}
        </div>

        <div className="border-t p-4 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <User size={15} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-gray-800 font-semibold text-sm truncate">{user.officerName}</p>
              <p className="text-gray-400 text-xs truncate">{user.stationName}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-red-500 hover:text-red-600 flex items-center gap-2 text-sm py-1"
          >
            <LogOut size={15} /> Logout
          </button>
          <button
            onClick={onChangeStation}
            className="w-full text-gray-400 hover:text-gray-600 text-xs"
          >
            Change Station
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        <div className="flex justify-between items-center px-5 py-3 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="text-orange-500" size={20} />
            <div>
              <h2 className="font-bold text-gray-800 text-sm">{t.appName}</h2>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {(["en", "hi", "mr"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={
                  language === lang
                    ? "bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium"
                    : "text-gray-500 hover:text-gray-800 px-2 py-1 text-xs"
                }
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              {msg.role === "user" ? (
                <div className="bg-orange-500 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-xl leading-relaxed">
                  {msg.content}
                </div>
              ) : msg.meta ? (
                <FIRMessage
                  msg={msg}
                  language={language}
                  onSendInChat={(text) => handleSend(text)}
                  onOpenNewChat={handleOpenNewChat}
                />
              ) : (
                <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-xl shadow-sm leading-relaxed">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-5 py-4 border-t bg-white flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Describe the incident..."
            className="flex-1 border border-gray-300 bg-white text-black rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 rounded-xl transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
