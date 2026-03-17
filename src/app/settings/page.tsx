"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ProfessionalPageLayout from "@/components/ProfessionalPageLayout";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Users, 
  Lock, 
  ShieldCheck, 
  Mail,
  Zap,
  Activity,
  Plus,
  Trash2,
  X
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [showUsername, setShowUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* AUTH GUARD */
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  /* LOAD USER */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      setUsername(snap.data()?.username ?? "User");
      setEmail(user.email ?? "");
      setLoading(false);
    };

    load();
  }, [user]);

  /* LOGOUT */
  const logout = async () => {
    await auth.signOut();
    router.replace("/login");
  };

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
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Account & Preferences</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-black text-foreground tracking-tight leading-none uppercase">
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-rose-500">Settings</span>
            </h1>
            <p className="text-gray-400 font-bold text-base sm:text-lg max-w-xl leading-relaxed">
              Manage your account details, security settings, and app preferences.
            </p>
          </div>
          
          <div className="flex items-center gap-5 premium-glass px-8 py-5 rounded-[2rem] border-primary/5 shadow-2xl premium-card group shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Settings className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-2">Build Version</p>
              <p className="text-3xl font-black text-foreground tracking-tight">V2.4.0</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
          
          {/* PROFILE CARD */}
          <div className="xl:col-span-1 space-y-8">
            {loading ? (
              <div className="premium-glass rounded-[3.5rem] p-10 border-primary/5 animate-pulse">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-32 bg-primary/10 rounded-full" />
                    <div className="h-4 w-48 bg-primary/5 rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group h-full"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-rose-500 rounded-[3.8rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                <div className="relative premium-glass rounded-[3.5rem] p-10 border-white/10 shadow-3xl premium-card overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-colors" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-br from-primary to-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 animate-pulse" />
                      <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-purple-600 p-1.5 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-bg-subtle flex items-center justify-center text-primary border-4 border-white/10 overflow-hidden">
                          <span className="text-4xl font-black uppercase tracking-tighter">
                            {username.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-bg-subtle shadow-lg" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] leading-none">User Profile</p>
                      <h2 className="text-3xl font-black text-foreground tracking-tight leading-none uppercase">{username}</h2>
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 mx-auto w-fit">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[180px]">{email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-10 relative z-10">
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 text-center transition-transform hover:scale-105 duration-500">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Premium</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 text-center transition-transform hover:scale-105 duration-500">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Plan</p>
                      <p className="text-xs font-black text-primary uppercase tracking-widest">Optimized</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* MAIN SETTINGS GRID */}
          <div className="xl:col-span-2 space-y-12">
            
            {/* ACCOUNT SECTION */}
            <SettingsSection title="Configuration" icon={<User className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsItem
                  icon={<ShieldCheck className="w-6 h-6" />}
                  title="Modify Alias"
                  subtitle="Update your display name"
                  onClick={() => setShowUsername(true)}
                />
                <SettingsItem
                  icon={<Lock className="w-6 h-6" />}
                  title="Password"
                  subtitle="Change your password"
                  onClick={() => setShowPassword(true)}
                />
              </div>
            </SettingsSection>

            {/* ENGINE SECTION */}
            <SettingsSection title="App Structure" icon={<Activity className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsItem
                  icon={<BookOpen className="w-6 h-6" />}
                  title="Manage Subjects"
                  subtitle="Add or remove your academic subjects"
                  onClick={() => router.push("/subjects")}
                />
                <SettingsItem
                  icon={<Clock className="w-6 h-6" />}
                  title="Manage Timetable"
                  subtitle="Set up your weekly class schedule"
                  onClick={() => router.push("/timetable")}
                />
              </div>
            </SettingsSection>

            {/* NETWORK SECTION */}
            <SettingsSection title="Community" icon={<Users className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsItem
                  icon={<Zap className="w-6 h-6" />}
                  title="Find Friends"
                  subtitle="Connect with your classmates"
                  onClick={() => router.push("/friends")}
                />
              </div>
            </SettingsSection>

            {/* TERMINATION SECTION */}
            <SettingsSection title="Account Access" icon={<LogOut className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsItem
                  icon={<LogOut className="w-6 h-6" />}
                  title="Sign Out"
                  subtitle="Log out of your account"
                  destructive
                  onClick={() => setShowLogout(true)}
                />
              </div>
            </SettingsSection>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <AnimatePresence>
        {showUsername && (
          <UsernameDialog
            initial={username}
            onClose={() => setShowUsername(false)}
            onSave={async (value: string) => {
              await updateDoc(doc(db, "users", user!.uid), {
                username: value,
                username_lower: value.toLowerCase(),
                updatedAt: Date.now(),
              });
              setUsername(value);
              setShowUsername(false);
            }}
          />
        )}

        {showPassword && (
          <PasswordDialog
            email={email}
            onClose={() => setShowPassword(false)}
          />
        )}

        {showLogout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              onClick={() => setShowLogout(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md premium-glass rounded-[3.5rem] p-10 border border-primary/10 shadow-3xl text-center premium-card"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                <LogOut className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">Sign Out?</h3>
              <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">
                Are you sure you want to sign out of AttendMate? You will need to log back in to access your data.
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={logout}
                  className="flex-1 py-5 rounded-[1.8rem] bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-rose-500/30 transition-all border border-white/10"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </ProfessionalPageLayout>
  );
}

/* ================= COMPONENTS ================= */

function SettingsSection({ title, icon, children }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
          {icon}
        </div>
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border-color/50 to-transparent" />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsItem({ icon, title, subtitle, onClick, destructive = false }: any) {
  return (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group w-full relative overflow-hidden flex items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all shadow-2xl premium-glass premium-card ${
        destructive
          ? "border-rose-500/10 hover:border-rose-500/30"
          : "border-primary/5 hover:border-primary/30"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border ${
        destructive
          ? "bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white"
          : "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white"
      } transition-all duration-500`}>
        {icon}
      </div>
      
      <div className="relative z-10 flex-1 text-left min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 leading-none ${
          destructive ? "text-rose-400" : "text-gray-500"
        }`}>
          {subtitle}
        </p>
        <p className="font-black text-xl text-foreground tracking-tight leading-none uppercase">
          {title}
        </p>
      </div>
      
      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors border border-white/5 ${
        destructive ? "group-hover:text-rose-500" : ""
      }`}>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
}

/* ================= DIALOGS ================= */

function UsernameDialog({ initial, onSave, onClose }: any) {
  const [value, setValue] = useState<string>(initial);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (value.trim().length < 3) {
      setError("Minimum 3 characters required");
      return;
    }
    setLoading(true);
    await onSave(value.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md premium-glass rounded-[3.5rem] p-10 border border-primary/10 shadow-3xl premium-card"
      >
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Change Display Name</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Update your handle</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.8rem] text-sm text-foreground font-black tracking-widest placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all uppercase"
              placeholder="Enter new display name"
            />
          </div>
          {error && (
            <p className="text-rose-500 font-black text-[9px] uppercase tracking-widest text-center">{error}</p>
          )}

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[0.3em] transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-5 rounded-[1.8rem] bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all border border-white/10"
            >
              {loading ? "Committing..." : "Update"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordDialog({ email, onClose }: any) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = async () => {
    if (newPass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cred = EmailAuthProvider.credential(email, oldPass);
      await reauthenticateWithCredential(auth.currentUser!, cred);
      await updatePassword(auth.currentUser!, newPass);
      onClose();
    } catch (e: any) {
      setError(e.code === "auth/wrong-password" ? "Incorrect current password" : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md premium-glass rounded-[3.5rem] p-10 border border-primary/10 shadow-3xl premium-card"
      >
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner border border-rose-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Update Password</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Create a new password</p>
          </div>
        </div>

        <div className="space-y-4">
          <PasswordInput value={oldPass} onChange={setOldPass} placeholder="Current password" show={showOld} onToggle={() => setShowOld(!showOld)} />
          <PasswordInput value={newPass} onChange={setNewPass} placeholder="New password" show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="Confirm new password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
          
          {error && (
            <p className="text-rose-500 font-black text-[9px] uppercase tracking-widest text-center mt-2">{error}</p>
          )}

          <div className="flex gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-[0.3em] transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={update}
              disabled={loading || !oldPass || !newPass || !confirm}
              className="flex-1 py-5 rounded-[1.8rem] bg-foreground text-background font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all border border-white/10 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Password"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, show, onToggle }: any) {
  return (
    <div className="relative group/input">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.8rem] text-sm text-foreground font-black tracking-widest placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all uppercase"
        placeholder={placeholder}
      />
      <button 
        type="button" 
        onClick={onToggle} 
        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors p-2"
      >
        {show ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  );
}