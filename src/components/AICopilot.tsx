"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  X,
  Mic, 
  MicOff,
  User,
  Bot,
  BrainCircuit,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  BookText,
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

export default function AICopilot() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener("toggleAICopilot", handleToggle);
    return () => window.removeEventListener("toggleAICopilot", handleToggle);
  }, []);

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
        setTimeout(() => {
          setIsOpen(false);
          router.push(route);
        }, 1500);
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
        <span key={i} className="block mb-1.5 last:mb-0">
          {parts.map((part, j) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={j} className="text-gray-900 dark:text-white font-black">{part.slice(2, -2)}</strong>
              : part
          )}
        </span>
      );
    });
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
            // Height constrained, bottom adjusted
            className="fixed bottom-[100px] right-6 md:bottom-8 md:right-8 z-[100] w-[calc(100vw-3rem)] sm:w-[400px] h-[550px] max-h-[80vh] bg-white dark:bg-[#09090b] rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 flex items-center justify-between shadow-sm relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">AI Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400 dark:text-gray-300" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 scroll-smooth relative z-0"
            >
              <div className="space-y-6 pb-2">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-primary"}`}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-md ${
                          msg.role === "user" 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-tl-none border border-gray-100 dark:border-zinc-800"
                        }`}>
                          {formatMessageContent(msg.content)}
                        </div>

                        {/* Yes/No Inline Buttons for Confirmation Phase */}
                        {pendingAction && msg.data?.requireConfirm && msg.id === messages[messages.length - 1].id && (
                          <div className="flex gap-2 mt-1">
                             <button onClick={() => { setInput("Yes"); setTimeout(handleSend, 50); }} className="flex-1 py-2 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:scale-105 transition-transform">
                               Confirm
                             </button>
                             <button onClick={() => { setInput("No"); setTimeout(handleSend, 50); }} className="flex-1 py-2 px-4 rounded-xl bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold text-xs shadow-sm hover:scale-105 transition-transform">
                               Cancel
                             </button>
                          </div>
                        )}

                        {/* Special Card Rendering */}
                        {msg.type && !msg.data?.requireConfirm && <AiResponseCard type={msg.type} data={msg.data} />}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-xl shrink-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-primary flex items-center justify-center shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl flex gap-1.5 items-center rounded-tl-none">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-white/10 shrink-0">
              {/* Suggestions */}
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                {["/timetable", "/analyze", "Mark present till 4pm", "/help"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setInput(s); }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-[10px] font-black text-gray-500 hover:text-primary border border-gray-200 dark:border-zinc-800 uppercase tracking-wider transition-colors shadow-sm"
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
                            className="text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 last:border-0 transition-colors flex items-center justify-between"
                          >
                            <span className="font-bold text-primary text-sm">{cmd.cmd}</span>
                            <span className="text-xs font-semibold text-gray-500">{cmd.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
                <div className="relative flex items-end gap-2 bg-white dark:bg-zinc-900 rounded-[1.5rem] p-1.5 shadow-md border border-gray-200 dark:border-zinc-800">
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
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold focus:outline-none resize-none max-h-24 min-h-[44px] text-gray-900 dark:text-white placeholder-gray-400 custom-scrollbar"
                    rows={1}
                  />
                  <div className="flex items-center gap-1.5 pr-1 pb-0.5">
                    <button 
                      onClick={toggleVoice}
                      className={`p-2.5 rounded-xl transition-all ${isListening ? 'text-white bg-rose-500 shadow-md' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 shadow-md flex items-center justify-center font-black"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
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
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-3 mt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{data?.subtitle || "Forecast"}</span>
            </div>
            <span className="text-sm font-black text-primary">{data?.percentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: `${data?.percentage || 0}%` }} transition={{ duration: 1 }} className="h-full bg-primary" />
          </div>
        </div>
      );
    case "summary":
      return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-3 mt-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Insight</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-950 text-center border border-gray-100 dark:border-zinc-800">
              <span className="text-sm font-black text-gray-900 dark:text-white">{data?.percentage || "0"}%</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-950 text-center border border-gray-100 dark:border-zinc-800">
              <span className={`text-sm font-black uppercase ${(data?.percentage || 0) >= 75 ? "text-emerald-500" : "text-rose-500"}`}>
                {(data?.percentage || 0) >= 75 ? "Pro" : "Risk"}
              </span>
            </div>
          </div>
        </div>
      );
    case "trend":
      return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-2 mt-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Pattern Insight</span>
          </div>
          <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Consistency is improving. Optimal hours identified.</p>
        </div>
      );
    case "card":
      // Do not duplicate generic card visually if confirmation is requested.
      if (data?.requireConfirm) return null;
      
      return (
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3 shadow-sm mt-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {data?.icon === 'navigate' ? <Compass className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{data?.title || "Action Confirmed"}</span>
        </div>
      );
    case "help":
      return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4 shadow-sm mt-1 flex flex-col gap-2">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest"><BookText className="w-3 h-3 inline mr-1"/> Marking</span>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">"Mark present for Math"</span>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">"Mark all present till 4pm"</span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest"><Compass className="w-3 h-3 inline mr-1"/> Navigation</span>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">"Go to dashboard"</span>
           </div>
        </div>
      );
    default:
      return null;
  }
}
