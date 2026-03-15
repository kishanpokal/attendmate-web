"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff,
  User,
  Bot,
  BrainCircuit,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, addDoc, query, where, limit, orderBy, doc, getDoc } from "firebase/firestore";
import { OfflineAiEngine } from "@/lib/ai/engine";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";

const MESH_GRADIENT = `
  .mesh-gradient {
    background-color: #0f172a;
    background-image: 
      radial-gradient(at 0% 0%, hsla(253,80%,20%,1) 0, transparent 50%), 
      radial-gradient(at 50% 0%, hsla(225,80%,25%,1) 0, transparent 50%), 
      radial-gradient(at 100% 0%, hsla(339,80%,25%,1) 0, transparent 50%),
      radial-gradient(at 0% 100%, hsla(253,80%,15%,1) 0, transparent 50%), 
      radial-gradient(at 100% 100%, hsla(225,80%,15%,1) 0, transparent 50%);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  .bot-bubble {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #f8fafc;
  }
  .neural-glow {
    box-shadow: 0 0 50px -12px rgba(99, 102, 241, 0.4);
  }
`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "card" | "prediction" | "summary" | "trend";
  data?: any;
}

const aiEngine = new OfflineAiEngine();

export default function AIPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AttendMate Pro AI. How can I assist you today? You can ask me to mark attendance, predict your scores, or give you study tips.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

      const reply = await aiEngine.processRequest(input, allRecords);

      if (reply.startsWith("ACTION_REQUIRED:MARK_ATTENDANCE:")) {
        const [,, subject, status] = reply.split(":");
        await handleMarkAttendanceAction(subject, status);
        addBotMessage(`Successfully marked **${status}** for **${subject}**.`, "card", { title: "Attendance Updated", icon: "check" });
      } else if (reply.startsWith("ACTION_REQUIRED:BULK_MARK:")) {
        const [,, status, time, subjectsStr] = reply.split(":");
        const subjects = subjectsStr.split(",");
        await handleBulkMarkAction(subjects, status);
        addBotMessage(`Mass update complete! Marked ${subjects.length} lectures as **${status}** (all sessions before ${time}).`, "card", { title: "Bulk Update Done", icon: "check" });
      } else if (reply.startsWith("ACTION_REQUIRED:GET_FRIEND_DATA:")) {
        const [, , friendName] = reply.split(":");
        await handleFriendQueryAction(friendName);
      } else {
        let type: Message["type"] = "text";
        let data: any = null;

        if (reply.includes("Safe") || reply.includes("Critical")) {
          type = "prediction";
          const match = reply.match(/(\d+\.?\d*)%/);
          data = { percentage: match ? match[1] : 75 };
        } else if (reply.includes("By") && reply.includes("Best Case")) {
          type = "prediction"; // Reuse prediction style or add new
          const bestMatch = reply.match(/Best Case\*\*: Attending all will bring you to \*\*(\d+\.?\d*)%/);
          data = { percentage: bestMatch ? bestMatch[1] : 75, subtitle: "Future Forecast" };
        } else if (reply.includes("Weekly") || reply.includes("Snapshot") || reply.includes("Quick Stats")) {
          type = "summary";
          const match = reply.match(/(\d+\.?\d*)%/);
          data = { percentage: match ? match[1] : 0 };
        } else if (reply.includes("worst day") || reply.includes("Pattern")) {
          type = "trend";
        }
        
        addBotMessage(reply, type, data);
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

  const handleFriendQueryAction = async (friendName: string) => {
    if (!user || !friendName) {
      if (!friendName) addBotMessage("I need a friend's name to search. Example: 'How is Kishan?'");
      return;
    }
    setIsTyping(true);
    try {
      // 1. Search friend subcollection for matches
      const friendsSnap = await getDocs(collection(db, "users", user.uid, "friends"));
      let targetFriend: any = null;

      for (const fDoc of friendsSnap.docs) {
        const uDoc = await getDoc(doc(db, "users", fDoc.id));
        if (uDoc.exists()) {
          const uData = uDoc.data();
          if (uData.username?.toLowerCase().includes(friendName.toLowerCase()) || 
              uData.email?.toLowerCase().includes(friendName.toLowerCase())) {
            targetFriend = { uid: fDoc.id, ...uData };
            break;
          }
        }
      }

      if (!targetFriend) {
        addBotMessage(`I couldn't find a friend named **${friendName}** in your list. Make sure you've added them in the Friends page first!`);
        return;
      }

      // 2. Fetch latest snapshot (Today first, then past)
      const todayDate = new Date().toISOString().split('T')[0];
      const snapshotRef = collection(db, "users", targetFriend.uid, "dailySnapshot");
      const todaySnap = await getDoc(doc(snapshotRef, todayDate));
      
      let data: any = null;
      let isFallback = false;

      if (todaySnap.exists()) {
        data = todaySnap.data();
      } else {
        const pastSnap = await getDocs(query(snapshotRef, orderBy("date", "desc"), limit(1)));
        if (!pastSnap.empty) {
          data = pastSnap.docs[0].data();
          isFallback = true;
        }
      }

      if (data) {
        addBotMessage(
          `Found records for **${targetFriend.username}** ${isFallback ? `(from ${data.date})` : "(Today)"}. ${targetFriend.username}'s current attendance is **${data.percentage}%**.`,
          "summary",
          { percentage: data.percentage, subtitle: "Friend Standing", friend: targetFriend.username }
        );
      } else {
        addBotMessage(`I found **${targetFriend.username}**, but they haven't logged any attendance data yet.`);
      }
    } catch (e) {
      console.error("Friend Query Error:", e);
      addBotMessage("I had trouble fetching your friend's data. Please check your connection.");
    } finally {
      setIsTyping(false);
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
    <ProfessionalPageLayout>
      <style dangerouslySetInnerHTML={{ __html: MESH_GRADIENT }} />
      <div className="h-screen w-full flex flex-col mesh-gradient overflow-hidden relative inset-0">
        {/* Header */}
        <div className="p-6 md:p-8 bg-black/40 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:scale-105 transition-all md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">AttendMate Pro AI</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Neural System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-4 max-w-[90%] md:max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-md ${
                  msg.role === "user" ? "bg-indigo-500 text-white" : "bg-white dark:bg-gray-800 text-indigo-500 border border-gray-100 dark:border-gray-700"
                }`}>
                  {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className="flex flex-col gap-3">
                  <div className={`p-5 md:p-6 rounded-[2rem] text-sm md:text-base font-semibold leading-relaxed glass-card ${
                    msg.role === "user" 
                    ? "bg-indigo-600/90 text-white rounded-tr-none border-indigo-400/40" 
                    : "bot-bubble rounded-tl-none shadow-xl"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.type && <AiResponseCard type={msg.type} data={msg.data} />}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[75%]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shrink-0 bg-white dark:bg-gray-800 text-indigo-500 flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-gray-800/50 flex gap-2 items-center rounded-tl-none border border-indigo-100 dark:border-gray-700">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-10 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
            {["Predict my attendance", "How many classes can I skip?", "Show my insights", "How is my friend doing?"].map(s => (
              <button 
                key={s} 
                onClick={() => setInput(s)}
                className="shrink-0 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black text-gray-400 hover:text-white border border-white/10 transition-all uppercase tracking-widest backdrop-blur-md"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-300" />
            <div className="relative flex items-end gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-3 focus-within:bg-white dark:focus-within:bg-gray-900 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent px-4 py-3 text-base font-semibold focus:outline-none resize-none max-h-40 min-h-[56px] text-gray-900 dark:text-white"
                rows={1}
              />
              <div className="flex items-center gap-2 pr-2">
                <button 
                  onClick={toggleVoice}
                  className={`p-3.5 rounded-2xl transition-all ${isListening ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-gray-700'}`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-3.5 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-600 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-6 text-center">
            Encrypted Local AI Processing Unit
          </p>
        </div>
      </div>
    </ProfessionalPageLayout>
  );
}

function AiResponseCard({ type, data }: { type: string, data?: any }) {
  switch (type) {
    case "prediction":
      return (
        <div className="p-6 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl border border-indigo-500/20 space-y-4 glass-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">{data?.subtitle || "Forecasting Unit"}</span>
            </div>
            <span className="text-xl font-black text-indigo-500 line-clamp-1">{data?.percentage}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: `${data?.percentage || 0}%` }} transition={{ duration: 1 }} className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Likelihood of maintaining threshold</p>
        </div>
      );
    case "summary":
      return (
        <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20 space-y-4 glass-card">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">
              {data?.friend ? `${data.friend}'s Insight` : "Attendance Insight"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 text-center border border-emerald-500/10 shadow-sm backdrop-blur-md">
              <span className="text-xl font-black text-gray-900 dark:text-white">{data?.percentage || "0"}%</span>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Average</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 text-center border border-emerald-500/10 shadow-sm backdrop-blur-md">
              <span className={`text-xl font-black uppercase ${(data?.percentage || 0) >= 75 ? "text-emerald-500" : "text-rose-500"}`}>
                {(data?.percentage || 0) >= 75 ? "Pro" : "Risk"}
              </span>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status</p>
            </div>
          </div>
        </div>
      );
    case "trend":
      return (
        <div className="p-6 bg-purple-500/5 dark:bg-purple-500/10 rounded-3xl border border-purple-500/20 space-y-3 glass-card">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-500">Pattern Detected</span>
          </div>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">Your consistency has improved by **14%** this week compared to last. Optimal attendance hours identified: **9:00 AM - 12:00 PM**.</p>
        </div>
      );
    case "card":
      return (
        <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4 shadow-sm glass-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{data?.title || "System Update"}</span>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Action Executed Successfully</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}
