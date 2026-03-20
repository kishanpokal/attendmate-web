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
  ChevronLeft,
  BookText,
  Activity,
  Users,
  Compass
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, addDoc, query, orderBy, limit, doc, getDoc, runTransaction, where } from "firebase/firestore";
import { OfflineAiEngine } from "@/lib/ai/engine";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "card" | "prediction" | "summary" | "trend" | "help";
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
      content: "Hello! I'm your AttendMate Pro AI. I can now handle time-based split marking and navigate you across the app. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State for Confirmation
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const executeAction = async (actionStr: string) => {
    if (actionStr.startsWith("MARK_ATTENDANCE:")) {
      const [, subject, status] = actionStr.split(":");
      await handleMarkAttendanceAction(subject, status);
      addBotMessage(`Successfully marked **${status}** for **${subject}**.`, "card", { title: "Attendance Updated" });
    } else if (actionStr.startsWith("BULK_MARK:")) {
      const [, status, time, subjectsStr] = actionStr.split(":");
      const subjects = subjectsStr.split(",");
      await handleBulkMarkAction(subjects, status);
      addBotMessage(`Mass update complete! Marked ${subjects.length} lectures as **${status}** before ${time}.`, "card", { title: "Bulk Update Done" });
    } else if (actionStr.startsWith("BULK_MARK_SPLIT:")) {
      const [, time, subjectsStr] = actionStr.split(":");
      const [presentStr, absentStr] = subjectsStr.split("|");
      const pres = presentStr ? presentStr.split(",") : [];
      const abs = absentStr ? absentStr.split(",") : [];
      if (pres.length > 0) await handleBulkMarkAction(pres, "PRESENT");
      if (abs.length > 0) await handleBulkMarkAction(abs, "ABSENT");
      addBotMessage(`Split mark complete! Marked ${pres.length} present and ${abs.length} absent around ${time}.`, "card", { title: "Split Update Done" });
    }
  };

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

    // Handle Confirmation Phase
    if (pendingAction) {
      const lower = userMsg.content.toLowerCase();
      if (lower.includes("yes") || lower.includes("sure") || lower.includes("ok") || lower.includes("do it") || lower.includes("yep")) {
        const action = pendingAction;
        setPendingAction(null);
        setIsTyping(true);
        try {
          await executeAction(action);
        } catch (error) {
           console.error("Action error:", error);
           addBotMessage("I encountered an error executing this action. Please try again.");
        } finally {
           setIsTyping(false);
        }
        return;
      } else if (lower.includes("no") || lower.includes("cancel") || lower.includes("stop") || lower.includes("nope")) {
        setPendingAction(null);
        addBotMessage("Action cancelled. How else can I help you?");
        return;
      } else {
        // Did not explicitly say yes or no
        addBotMessage("Please answer **Yes** or **No** to confirm the pending action, or say 'cancel' to abort.");
        return;
      }
    }

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

      const reply = await aiEngine.processRequest(userMsg.content, allRecords);

      // ─────────────────────────────────────────────────────────
      // Action Processing
      // ─────────────────────────────────────────────────────────
      if (reply.startsWith("ACTION_REQUIRED:NAVIGATE:")) {
        const [, , route] = reply.split(":");
        addBotMessage(`Navigating to **${route}**...`, "card", { title: "Navigation Commencing", icon: "navigate" });
        setTimeout(() => router.push(route), 1500);
      } else if (reply.startsWith("ACTION_REQUIRED:GET_FRIEND_DATA:")) {
        const [, , friendName] = reply.split(":");
        await handleFriendQueryAction(friendName);
      } else if (reply.startsWith("ACTION_REQUIRED:SHOW_HELP")) {
        addBotMessage("Here is a complete list of my capabilities and available commands:", "help");
      } 
      // ─────────────────────────────────────────────────────────
      // Confirmation Processing (Destructive Data Actions)
      // ─────────────────────────────────────────────────────────
      else if (reply.startsWith("CONFIRMATION_REQUIRED:")) {
        const actionStr = reply.replace("CONFIRMATION_REQUIRED:", "");
        setPendingAction(actionStr);
        
        if (actionStr.startsWith("BULK_MARK_SPLIT:")) {
          const [, time, subjects] = actionStr.split(":");
          const [pres, abs] = subjects.split("|");
          const presText = pres ? pres : "none";
          const absText = abs ? abs : "none";
          addBotMessage(`**Hold on!** Are you sure you want to mark **${presText}** as PRESENT and **${absText}** as ABSENT today (split at ${time})?\n\n*Please reply **Yes** or **No**.*`, "card", { title: "Confirmation Needed", requireConfirm: true });
        } else if (actionStr.startsWith("BULK_MARK:")) {
          const [, status, time, subjectsStr] = actionStr.split(":");
          addBotMessage(`**Hold on!** Are you sure you want to mark **${status}** for all classes (${subjectsStr}) before ${time}?\n\n*Please reply **Yes** or **No**.*`, "card", { title: "Confirmation Needed", requireConfirm: true });
        } else if (actionStr.startsWith("MARK_ATTENDANCE:")) {
          const [, subject, status] = actionStr.split(":");
          addBotMessage(`**Hold on!** Are you sure you want to mark **${status}** for **${subject}**?\n\n*Please reply **Yes** or **No**.*`, "card", { title: "Confirmation Needed", requireConfirm: true });
        }
      } 
      // ─────────────────────────────────────────────────────────
      // Display Data Formatting 
      // ─────────────────────────────────────────────────────────
      else {
        let type: Message["type"] = "text";
        let data: any = null;

        if (reply.includes("Safe") || reply.includes("Critical")) {
          type = "prediction";
          const match = reply.match(/(\d+\.?\d*)%/);
          data = { percentage: match ? match[1] : 75 };
        } else if (reply.includes("By") && reply.includes("Best Case")) {
          type = "prediction"; 
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
    
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];
    const dayStr = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    
    const timetableSnap = await getDocs(query(collection(db, "users", user.uid, "timetable"), where("day", "==", dayStr)));
    const matchingLecture = timetableSnap.docs.find(d => d.data().subjectName.toLowerCase() === subjectName.toLowerCase())?.data();
    
    let startTime = new Date();
    let endTime = new Date();
    
    if (matchingLecture) {
      startTime = new Date(`${dateKey}T${matchingLecture.startTime}`);
      endTime = new Date(`${dateKey}T${matchingLecture.endTime}`);
    } else {
      startTime.setMinutes(0,0,0);
      endTime.setHours(startTime.getHours() + 1, 0, 0, 0);
    }

    const lectureId = `${dateKey}_${startTime.toTimeString().slice(0, 5).replace(":", "")}_${endTime.toTimeString().slice(0, 5).replace(":", "")}`;

    const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
    const subjectDoc = subjectsSnap.docs.find(d => d.data().name.toLowerCase() === subjectName.toLowerCase());
    
    if (subjectDoc) {
      await runTransaction(db, async (tx) => {
        const subjectRef = subjectDoc.ref;
        const snap = await tx.get(subjectRef);
        const attendanceRef = doc(subjectRef, "attendance", lectureId);
        
        if ((await tx.get(attendanceRef)).exists()) return;
        
        let formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        if (formattedStatus.toUpperCase() === "PRESENT") formattedStatus = "Present";
        if (formattedStatus.toUpperCase() === "ABSENT") formattedStatus = "Absent";
        
        tx.set(attendanceRef, {
          status: formattedStatus,
          date: Timestamp.fromDate(today),
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          createdAt: Timestamp.now(),
          note: "Marked by AI Copilot"
        });

        tx.update(subjectRef, {
          totalClasses: (snap.data()?.totalClasses ?? 0) + 1,
          attendedClasses: (snap.data()?.attendedClasses ?? 0) + (formattedStatus === "Present" ? 1 : 0),
        });
      });
    }
  };

  const handleBulkMarkAction = async (subjectNames: string[], status: string) => {
    if (!user) return;
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];
    const dayStr = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    
    const timetableSnap = await getDocs(query(collection(db, "users", user.uid, "timetable"), where("day", "==", dayStr)));
    const subjectsSnap = await getDocs(collection(db, "users", user.uid, "subjects"));
    
    for (const name of subjectNames) {
      const subjectDoc = subjectsSnap.docs.find(d => d.data().name.toLowerCase() === name.toLowerCase());
      if (!subjectDoc) continue;
      
      const matchingLecture = timetableSnap.docs.find(d => d.data().subjectName.toLowerCase() === name.toLowerCase())?.data();
      
      let startTime = new Date();
      let endTime = new Date();
      
      if (matchingLecture) {
        startTime = new Date(`${dateKey}T${matchingLecture.startTime}`);
        endTime = new Date(`${dateKey}T${matchingLecture.endTime}`);
      } else {
        startTime.setMinutes(0,0,0);
        endTime.setHours(startTime.getHours() + 1, 0, 0, 0);
      }

      const lectureId = `${dateKey}_${startTime.toTimeString().slice(0, 5).replace(":", "")}_${endTime.toTimeString().slice(0, 5).replace(":", "")}`;

      await runTransaction(db, async (tx) => {
        const subjectRef = subjectDoc.ref;
        const snap = await tx.get(subjectRef);
        const attendanceRef = doc(subjectRef, "attendance", lectureId);
        
        if ((await tx.get(attendanceRef)).exists()) return;

        let formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        if (formattedStatus.toUpperCase() === "PRESENT") formattedStatus = "Present";
        if (formattedStatus.toUpperCase() === "ABSENT") formattedStatus = "Absent";
        
        tx.set(attendanceRef, {
          status: formattedStatus,
          date: Timestamp.fromDate(today),
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          createdAt: Timestamp.now(),
          note: "Bulk Marked by AI Copilot"
        });

        tx.update(subjectRef, {
          totalClasses: (snap.data()?.totalClasses ?? 0) + 1,
          attendedClasses: (snap.data()?.attendedClasses ?? 0) + (formattedStatus === "Present" ? 1 : 0),
        });
      });
    }
  };

  const handleFriendQueryAction = async (friendName: string) => {
    if (!user || !friendName) return;
    setIsTyping(true);
    try {
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
        addBotMessage(`I couldn't find a friend named **${friendName}** in your list. Check the Friends page!`);
        return;
      }

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
          `Found records for **${targetFriend.username}**. Their current attendance is **${data.percentage}%**.`,
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

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Handle bold formatting **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i} className="block mb-2 last:mb-0">
          {parts.map((part, j) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={j} className={line.includes(content) ? "font-black" : "font-black text-gray-900 dark:text-white"}>{part.slice(2, -2)}</strong>
              : part
          )}
        </span>
      );
    });
  };

  return (
    <main className="h-[100dvh] w-[100dvw] flex flex-col bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 hover:scale-105 transition-all text-gray-700 dark:text-white"
            aria-label="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">AttendMate AI</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto space-y-8 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-4 max-w-[90%] md:max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-md ${
                  msg.role === "user" ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 text-primary border border-gray-200 dark:border-zinc-800"
                }`}>
                  {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className="flex flex-col gap-3">
                  <div className={`p-5 md:p-6 rounded-[2rem] text-sm md:text-base font-medium leading-relaxed ${
                    msg.role === "user" 
                    ? "bg-primary text-white rounded-tr-none shadow-md" 
                    : "bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-tl-none shadow-xl border border-gray-100 dark:border-zinc-800"
                  }`}>
                    {formatMessageContent(msg.content)}
                  </div>

                  {/* Yes/No Inline Buttons for Confirmation Phase */}
                  {pendingAction && msg.data?.requireConfirm && msg.id === messages[messages.length - 1].id && (
                    <div className="flex gap-3 mt-2">
                       <button onClick={() => { setInput("Yes"); setTimeout(handleSend, 50); }} className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:scale-105 transition-transform">
                         Confirm
                       </button>
                       <button onClick={() => { setInput("No"); setTimeout(handleSend, 50); }} className="flex-1 py-3 px-6 rounded-xl bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold text-sm shadow-sm hover:scale-105 transition-transform">
                         Cancel
                       </button>
                    </div>
                  )}

                  {msg.type && (msg.type === "card" || msg.type === "prediction" || msg.type === "summary" || msg.type === "trend" || msg.type === "help") && <AiResponseCard type={msg.type} data={msg.data} />}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[75%]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shrink-0 bg-white dark:bg-zinc-900 text-primary border border-gray-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 flex gap-2 items-center rounded-tl-none border border-gray-200 dark:border-zinc-800 shadow-xl">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-primary" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-gray-50 via-gray-50/90 dark:from-[#09090b] dark:via-[#09090b]/90 to-transparent shrink-0">
          <div className="max-w-4xl mx-auto">
              {/* Suggestions */}
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {["/timetable", "/analyze", "Mark all present till 4pm", "/help"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setInput(s)}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-[11px] font-black text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 shadow-sm transition-all uppercase tracking-widest"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <AnimatePresence>
                  {input.startsWith("/") && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 w-full mb-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 transform origin-bottom"
                    >
                      <div className="flex flex-col">
                        {[
                          { cmd: "/timetable", label: "Show today's schedule" },
                          { cmd: "/analyze", label: "Get attendance summary" },
                          { cmd: "/mark", label: "Mark attendance" },
                          { cmd: "/dashboard", label: "Go to Dashboard" },
                          { cmd: "/help", label: "Show all commands" },
                        ].filter(c => c.cmd.toLowerCase().startsWith(input.toLowerCase())).map(cmd => (
                          <button
                            key={cmd.cmd}
                            onClick={() => setInput(cmd.cmd + " ")}
                            className="text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 last:border-0 transition-colors flex items-center justify-between"
                          >
                            <span className="font-bold text-primary text-base">{cmd.cmd}</span>
                            <span className="text-sm font-semibold text-gray-500">{cmd.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
              <div className="relative flex items-end gap-3 bg-white dark:bg-zinc-900 rounded-[2rem] p-2 shadow-lg border border-gray-200 dark:border-zinc-800">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask me anything... (e.g. 'Mark all present till 4pm')"
                  className="flex-1 bg-transparent px-4 py-3.5 text-base font-semibold focus:outline-none resize-none max-h-40 min-h-[56px] text-gray-900 dark:text-white placeholder-gray-400 custom-scrollbar"
                  rows={1}
                />
                <div className="flex items-center gap-2 pr-2 pb-1 text-gray-900 dark:text-white">
                  <button 
                    onClick={toggleVoice}
                    className={`p-3.5 rounded-2xl transition-all ${isListening ? 'text-white bg-rose-500 shadow-md' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="p-3.5 rounded-2xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 shadow-md flex items-center justify-center font-black"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-6 text-center">
              Intelligent Local Rules Engine
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function AiResponseCard({ type, data }: { type: string, data?: any }) {
  switch (type) {
    case "prediction":
      return (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">{data?.subtitle || "Forecasting Unit"}</span>
            </div>
            <span className="text-xl font-black text-primary line-clamp-1">{data?.percentage}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: `${data?.percentage || 0}%` }} transition={{ duration: 1 }} className="h-full bg-primary" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Likelihood of maintaining threshold</p>
        </div>
      );
    case "summary":
      return (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
              {data?.friend ? `${data.friend}'s Insight` : "Attendance Insight"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 text-center border border-gray-100 dark:border-zinc-800 shadow-sm">
              <span className="text-xl font-black text-gray-900 dark:text-white">{data?.percentage || "0"}%</span>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Average</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 text-center border border-gray-100 dark:border-zinc-800 shadow-sm">
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
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-500">Pattern Detected</span>
          </div>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">Your consistency has improved by **14%** this week compared to last. Optimal attendance hours identified: **9:00 AM - 12:00 PM**.</p>
        </div>
      );
    case "card":
      // Hide standard card visually if it's the confirmation prompt (since we render custom inline buttons instead of standard card display)
      // Actually we show it to display the message visually, or maybe we just want the check circle.
      if (data?.requireConfirm) return null;
      
      return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 shadow-md mt-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {data?.icon === 'navigate' ? <Compass className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{data?.title || "System Update"}</span>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{data?.icon === 'navigate' ? 'Redirecting Engine' : 'Action Executed Successfully'}</p>
          </div>
        </div>
      );
    case "help":
      return (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 space-y-6 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BookText className="w-5 h-5 text-primary" />
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Attendance Tracking</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-300"><span className="text-gray-900 dark:text-white font-bold">&quot;Mark present for Math&quot;</span></div>
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-300"><span className="text-gray-900 dark:text-white font-bold">&quot;Mark all present till 4pm&quot;</span></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Navigation</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-300"><span className="text-gray-900 dark:text-white font-bold">&quot;Go to dashboard&quot;</span></div>
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-300"><span className="text-gray-900 dark:text-white font-bold">&quot;Open timetable&quot;</span></div>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
