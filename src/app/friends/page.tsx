"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { 
  collection, doc, getDocs, getDoc, query, where, setDoc, deleteDoc 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import { Users, UserPlus, Search, UserMinus, ShieldAlert, X, ChevronRight } from "lucide-react";

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
    <ProfessionalPageLayout>
      <div className="content-container p-4 sm:p-10 lg:p-16 space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-10 border-b border-gray-100 dark:border-white/5">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3 text-primary">
              <div className="flex -space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-pulse delay-75" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Community Hub</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-black text-foreground tracking-tight leading-none uppercase">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-rose-500">Friends</span>
            </h1>
            <p className="text-gray-400 font-bold text-base sm:text-lg max-w-xl leading-relaxed">
              Connect with your classmates and compare your attendance progress.
            </p>
          </div>
          
          <div className="flex items-center gap-5 premium-glass px-8 py-5 rounded-[2rem] border-primary/5 shadow-2xl premium-card group shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Users className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-2">Total Friends</p>
              <p className="text-3xl font-black text-foreground tracking-tight">{friends.length} <span className="text-sm text-gray-400 font-bold">/ 10</span></p>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <div className="space-y-8">
          
          {/* SEARCH BAR */}
          <div className="relative group max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="System alias or communication link..."
              className="w-full pl-16 pr-14 py-5 bg-white/5 border border-white/10 rounded-[1.8rem] text-sm text-foreground font-black tracking-widest placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all uppercase"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
                aria-label="Clear Search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* LIST */}
          <div>
            {loading ? (
              <LoadingState />
            ) : filteredFriends.length === 0 ? (
              <EmptyState hasSearch={searchQuery.length > 0} />
            ) : (
              <div className="space-y-3">
                {filteredFriends.map((friend, i) => (
                  <FriendCard 
                    key={friend.uid} 
                    friend={friend} 
                    index={i} 
                    onDelete={() => setFriendToDelete(friend)} 
                    onClick={() => router.push(`/friends/${friend.uid}`)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ADD FRIEND FAB --- */}
        {!loading && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-medium text-sm hidden sm:block">Add Friend</span>
          </button>
        )}

      {/* --- DIALOGS --- */}
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
    </ProfessionalPageLayout>
  );
}

/* ================== UI COMPONENTS ================== */

function FriendCard({ friend, index, onClick, onDelete }: any) {
  const avatarColor = getAvatarColor(friend.uid);

  return (
    <div
      className="group relative flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
        style={{ background: `linear-gradient(135deg, ${avatarColor}CC, ${avatarColor})` }}
      >
        {friend.username.charAt(0).toUpperCase()}
      </div>

      <div className="ml-4 flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
          {friend.username}
        </h3>
        {friend.email && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {friend.email}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pl-4">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Remove Friend"
        >
          <UserMinus className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="ml-4 space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div 
      className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[300px]"
    >
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {hasSearch ? "No Results Found" : "No Friends Yet"}
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto text-sm">
        {hasSearch ? "Try searching with a different name or email" : "Tap the Add Friend button below to find and connect with your classmates."}
      </p>
    </div>
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
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
          <UserPlus className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Add a Friend</h3>
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full mt-3 border ${slotsLeft <= 2 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>

          {slotsLeft} slot{slotsLeft === 1 ? '' : 's'} remaining
        </span>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Username or Email"
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] text-xs text-foreground font-black tracking-widest placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all uppercase"
          />
        </div>

        {searching && (
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
             <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Looking up user...</span>
          </div>
        )}

        {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mt-2">{error}</p>}
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={searching}
          className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {searching ? "Adding..." : "Add Friend"}
        </button>
      </div>
    </Modal>
  );
}

function ConfirmDeleteDialog({ friend, onClose, onConfirm }: any) {
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 mx-auto mb-8 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Remove Friend?</h3>
        <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">
          <span className="text-foreground">{friend.username}</span> will be removed from your list. You can always add them back later.
        </p>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={onClose} 
          className="flex-1 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Keep
        </button>
        <button 
          onClick={onConfirm} 
          className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
        >
          Remove
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}