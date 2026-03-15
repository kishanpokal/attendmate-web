"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  X, 
  MessageSquare, 
  Mic, 
  MicOff,
  User,
  Bot,
  Terminal,
  BrainCircuit,
  Settings,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, addDoc } from "firebase/firestore";
import { OfflineAiEngine } from "@/lib/ai/engine";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "card" | "prediction" | "summary" | "trend";
  data?: any;
}

// Singleton instances for the component
const aiEngine = new OfflineAiEngine();

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AttendMate Pro AI. I can now handle bulk marking (e.g., 'mark all present till 4pm') and have full timetable awareness. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Expose toggle to window for Navigation integration
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener("toggleAICopilot", handleToggle);
    return () => window.removeEventListener("toggleAICopilot", handleToggle);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const userUid = user?.uid || "";
      
      // 1. Parallel Fetch for Engine
      const [subjectsSnap, timetableSnap] = await Promise.all([
        getDocs(collection(db, "users", userUid, "subjects")),
        getDocs(collection(db, "users", userUid, "timetable"))
      ]);

      const subjectNames = subjectsSnap.docs.map(d => d.data().name);
      aiEngine.setSubjects(subjectNames);
      
      const timetableData = timetableSnap.docs.map(d => ({
        subjectName: d.data().subjectName,
        subjectId: d.data().subjectId,
        startTime: d.data().startTime,
        endTime: d.data().endTime,
        day: d.data().day
      }));
      aiEngine.setTimetable(timetableData);

      const allRecords: any[] = [];
      for (const sDoc of subjectsSnap.docs) {
        const aSnap = await getDocs(collection(sDoc.ref, "attendance"));
        aSnap.forEach(ad => allRecords.push({ subject: sDoc.data().name, ...ad.data() }));
      }

      // 2. Process locally
      const reply = await aiEngine.processRequest(input, allRecords);

      // 3. Handle Special Actions
      if (reply.startsWith("ACTION_REQUIRED:MARK_ATTENDANCE:")) {
        const [,, subject, status] = reply.split(":");
        await handleMarkAttendanceAction(subject, status);
        
        addBotMessage(`Successfully marked **${status}** for **${subject}**.`, "card", { title: "Attendance Updated", icon: "check" });
      } else if (reply.startsWith("ACTION_REQUIRED:BULK_MARK:")) {
        const [,, status, time, subjectsStr] = reply.split(":");
        const subjects = subjectsStr.split(",");
        await handleBulkMarkAction(subjects, status);
        
        addBotMessage(`Mass update complete! Marked ${subjects.length} lectures as **${status}** (all sessions before ${time}).`, "card", { title: "Bulk Update Done", icon: "check" });
      } else {
        // Determine type based on patterns
        let type: Message["type"] = "text";
        if (reply.includes("Safe") || reply.includes("Critical")) type = "prediction";
        if (reply.includes("Weekly") || reply.includes("Snapshot")) type = "summary";
        if (reply.includes("worst day") || reply.includes("Pattern")) type = "trend";

        addBotMessage(reply, type);
      }
    } catch (error) {
      console.error("AI Error:", error);
      addBotMessage("I encountered an error processing your request. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const addBotMessage = (content: string, type: Message["type"] = "text", data: any = null) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
      type,
      data
    }]);
  };

  const handleMarkAttendanceAction = async (subjectName: string, status: string) => {
    if (!user) return;
    const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
    const subjectDoc = subjectsSnap.docs.find(d => d.data().name.toLowerCase() === subjectName.toLowerCase());
    if (subjectDoc) {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(subjectDoc.ref, "attendance"), {
        date: today,
        status: status.toUpperCase(),
        timestamp: Timestamp.now()
      });
    }
  };

  const handleBulkMarkAction = async (subjectNames: string[], status: string) => {
    if (!user) return;
    const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
    const today = new Date().toISOString().split('T')[0];

    for (const name of subjectNames) {
      const subjectDoc = subjectsSnap.docs.find(d => d.data().name.toLowerCase() === name.toLowerCase());
      if (subjectDoc) {
        await addDoc(collection(subjectDoc.ref, "attendance"), {
          date: today,
          status: status.toUpperCase(),
          timestamp: Timestamp.now()
        });
      }
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice recognition not supported.");
    if (isListening) { setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <>
      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-40 right-6 md:bottom-28 md:right-8 z-[100] w-[calc(100vw-3rem)] sm:w-96 h-[500px] bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">AI Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-indigo-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-indigo-500"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                        msg.role === "user" 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800"
                      }`}>
                        {msg.content}
                      </div>
                      {/* Special Card Rendering */}
                      {msg.type && <AiResponseCard type={msg.type} data={msg.data} />}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg shrink-0 bg-gray-100 dark:bg-gray-800 text-indigo-500 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 flex gap-1 items-center rounded-tl-none">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
              {/* Suggestions */}
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                {["Predict score", "Am I safe?", "Weekly summary", "Motivation"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setInput(s); }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-[10px] font-bold text-gray-500 hover:text-indigo-500 border border-gray-100 dark:border-gray-800 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pl-4 pr-24 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none max-h-32 text-gray-900 dark:text-white"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button 
                    onClick={toggleVoice}
                    className={`p-2 rounded-xl transition-colors ${isListening ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3 text-center">
                Secure On-Device AI Intelligence
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AiResponseCard({ type, data }: { type: string, data?: any }) {
  switch (type) {
    case "prediction":
      return (
        <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Forecasting Engine</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} className="h-full bg-indigo-500" />
          </div>
        </div>
      );
    case "summary":
      return (
        <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Weekly Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-white dark:bg-black/20 text-center">
              <span className="text-sm font-black text-gray-900 dark:text-white">88%</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-black/20 text-center">
              <span className="text-sm font-black text-emerald-500">Safe</span>
            </div>
          </div>
        </div>
      );
    case "trend":
      return (
        <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pattern Insight</span>
          </div>
          <p className="text-[10px] font-bold text-gray-500">Consistency is improving by 12% week-over-week.</p>
        </div>
      );
    case "card":
      return (
        <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{data?.title || "Action Confirmed"}</span>
        </div>
      );
    default:
      return null;
  }
}
