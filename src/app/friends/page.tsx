"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  collection, doc, getDocs, getDoc, query, where, setDoc, deleteDoc 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// --- TYPES ---
type Friend = {
  uid: string;
  username: string;
  email: string;
};

// --- AVATAR PALETTE ---
const AVATAR_PALETTE = [
  "#6366F1", "#8B5CF6", "#EC4899", "#06B6D4", 
  "#10B981", "#F59E0B", "#EF4444", "#3B82F6"
];

function getAvatarColor(uid: string) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export default function FriendsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null);

  // --- AUTH GUARD ---
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  // --- LOAD FRIENDS ---
  const loadFriends = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "friends"));
      const list: Friend[] = [];
      
      for (const d of snap.docs) {
        const uid = d.id;
        const uDoc = await getDoc(doc(db, "users", uid));
        if (uDoc.exists()) {
          list.push({
            uid,
            username: uDoc.data().username || "User",
            email: uDoc.data().email || "",
          });
        }
      }
      setFriends(list.sort((a, b) => a.username.localeCompare(b.username)));
    } catch (error) {
      console.error("Failed to load friends", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  // --- REMOVE FRIEND ---
  const handleRemoveFriend = async () => {
    if (!user || !friendToDelete) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "friends", friendToDelete.uid));
      setFriends((prev) => prev.filter((f) => f.uid !== friendToDelete.uid));
      setFriendToDelete(null);
    } catch (error) {
      console.error("Failed to remove friend", error);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen relative bg-[#f8fafc] dark:bg-[#0b0f19] overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* --- BACKGROUND ORBS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, 28, 0], opacity: [0.05, 0.13, 0.05] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -left-10 w-[380px] h-[380px] bg-indigo-500 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ y: [0, -22, 0], opacity: [0.04, 0.10, 0.04] }}
          transition={{ duration: 7.1, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-purple-500 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pb-24">
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-30 bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                Friends
              </h1>
            </div>
            
            <div className="bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/50">
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {friends.length} / 10
              </span>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="max-w-3xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 space-y-6">
          
          {/* SEARCH BAR */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* LIST */}
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingState key="loading" />
            ) : filteredFriends.length === 0 ? (
              <EmptyState key="empty" hasSearch={searchQuery.length > 0} />
            ) : (
              <motion.div key="list" className="space-y-3">
                {filteredFriends.map((friend, i) => (
                  <FriendCard 
                    key={friend.uid} 
                    friend={friend} 
                    index={i} 
                    onDelete={() => setFriendToDelete(friend)} 
                    onClick={() => router.push(`/friends/${friend.uid}`)} 
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- FLOATING ACTION BUTTON --- */}
      <AnimatePresence>
        {!loading && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowAddDialog(true)}
            className="fixed bottom-8 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-transform active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <span className="font-bold hidden sm:block">Add Friend</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- DIALOGS --- */}
      <AnimatePresence>
        {showAddDialog && (
          <AddFriendDialog
            currentCount={friends.length}
            existingUids={new Set(friends.map(f => f.uid))}
            currentUser={user}
            onClose={() => setShowAddDialog(false)}
            onSuccess={() => {
              setShowAddDialog(false);
              loadFriends();
            }}
          />
        )}
        
        {friendToDelete && (
          <ConfirmDeleteDialog
            friend={friendToDelete}
            onClose={() => setFriendToDelete(null)}
            onConfirm={handleRemoveFriend}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ================== UI COMPONENTS ================== */

function FriendCard({ friend, index, onClick, onDelete }: any) {
  const avatarColor = getAvatarColor(friend.uid);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
      className="group relative flex items-center bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/50 rounded-[22px] p-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-inner shrink-0"
        style={{ background: `linear-gradient(135deg, ${avatarColor}CC, ${avatarColor})` }}
      >
        {friend.username.charAt(0).toUpperCase()}
      </div>

      <div className="ml-4 flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
          {friend.username}
        </h3>
        {friend.email && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {friend.email}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pl-2">
        {/* Delete Button (Visible on Hover for Desktop / Always for Mobile) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-[22px] p-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="ml-4 space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center py-20 px-4"
    >
      <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {hasSearch ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          )}
        </svg>
      </div>
      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
        {hasSearch ? "No Results Found" : "No Friends Yet"}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-xs">
        {hasSearch ? "Try searching with a different name or email" : "Tap the Add Friend button below to find and connect with your classmates."}
      </p>
    </motion.div>
  );
}

/* ================== DIALOGS ================== */

function AddFriendDialog({ currentCount, existingUids, currentUser, onClose, onSuccess }: any) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const slotsLeft = 10 - currentCount;

  const handleAdd = async () => {
    if (!input.trim() || input.length < 2) {
      setError("Please enter a valid username or email");
      return;
    }
    if (currentCount >= 10) {
      setError("Friend limit reached (10 max).");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const isEmail = input.includes("@");
      const usersRef = collection(db, "users");
      const q = isEmail 
        ? query(usersRef, where("email", "==", input.trim().toLowerCase()))
        : query(usersRef, where("username_lower", "==", input.trim().toLowerCase()));

      const snap = await getDocs(q);

      if (snap.empty) {
        setError("No user found with that username or email");
        setSearching(false);
        return;
      }

      const friendDoc = snap.docs[0];
      const friendUid = friendDoc.id;
      const friendName = friendDoc.data().username || "User";

      if (friendUid === currentUser.uid) {
        setError("You can't add yourself 😄");
      } else if (existingUids.has(friendUid)) {
        setError(`${friendName} is already your friend`);
      } else {
        await setDoc(doc(db, "users", currentUser.uid, "friends", friendUid), {
          addedAt: Date.now()
        });
        onSuccess();
      }
    } catch (e) {
      setError("Something went wrong. Check your connection.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add a Friend</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-2 ${slotsLeft <= 2 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
          {slotsLeft} slot{slotsLeft === 1 ? '' : 's'} remaining
        </span>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Username or Email"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {searching && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
             <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-sm text-gray-600 dark:text-gray-300">Looking up user...</span>
          </div>
        )}

        {error && <p className="text-red-500 text-sm font-medium pl-1">{error}</p>}
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <button
          onClick={handleAdd}
          disabled={searching}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {searching ? "Adding..." : "Add Friend"}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function ConfirmDeleteDialog({ friend, onClose, onConfirm }: any) {
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remove Friend?</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          <strong>{friend.username}</strong> will be removed from your list. You can always add them back later.
        </p>
      </div>
      <div className="flex flex-col gap-3 mt-8">
        <button onClick={onConfirm} className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors">
          Remove
        </button>
        <button onClick={onClose} className="w-full py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-colors">
          Keep Friend
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#121827] rounded-[32px] p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}