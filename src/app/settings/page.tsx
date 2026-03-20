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
  X,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [showUsername, setShowUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  /* AUTH GUARD */
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  /* LOAD USER */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setUsername(snap.data()?.username ?? "User");
        setEmail(user.email ?? "");
      } catch (error) {
        console.error("Error loading user data", error);
      } finally {
        setLoading(false);
      }
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
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight mb-2">
              Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Manage your account details, security settings, and app preferences.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
            <Settings className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Version 2.4.0</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR: PROFILE CARD */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6 animate-pulse space-y-4">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto" />
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2 mx-auto" />
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mx-auto" />
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 border-4 border-white dark:border-zinc-900 shadow-md flex items-center justify-center">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {username.charAt(0)}
                      </span>
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-1">{username}</h2>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{email}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1 uppercase tracking-wider">Status</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">Active</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1 uppercase tracking-wider">Plan</p>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Student</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: SETTINGS LIST */}
          <div className="lg:col-span-8 space-y-8">

            {/* ACCOUNT */}
            <SettingsSection title="Account Security" icon={<User className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  title="Display Name"
                  subtitle="Change how others see you"
                  onClick={() => setShowUsername(true)}
                />
                <SettingsCard
                  icon={<Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  title="Password"
                  subtitle="Update your credentials"
                  onClick={() => setShowPassword(true)}
                />
              </div>
            </SettingsSection>

            {/* APP PREFERENCES */}
            <SettingsSection title="Application configuration" icon={<Activity className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  title="Subjects"
                  subtitle="Manage academic courses"
                  onClick={() => router.push("/subjects")}
                />
                <SettingsCard
                  icon={<Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  title="Timetable"
                  subtitle="Configure weekly schedule"
                  onClick={() => router.push("/timetable")}
                />
                <SettingsCard
                  icon={<GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  title="College Data Sync"
                  subtitle="Scrape & compare college attendance"
                  onClick={() => router.push("/dashboard/sync")}
                />
              </div>
            </SettingsSection>

            {/* COMMUNITY */}
            <SettingsSection title="Community" icon={<Users className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
                  title="Friends"
                  subtitle="Connect with classmates"
                  onClick={() => router.push("/friends")}
                />
              </div>
            </SettingsSection>

            {/* DANGER ZONE */}
            <SettingsSection title="Danger Zone" icon={<AlertCircle className="w-4 h-4 text-red-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  title="Sign Out"
                  subtitle="End your current session"
                  destructive
                  onClick={() => setShowLogout(true)}
                />
              </div>
            </SettingsSection>

          </div>
        </div>
      </div>

      {/* MODALS */}
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
          <LogoutDialog
            onClose={() => setShowLogout(false)}
            onConfirm={logout}
          />
        )}
      </AnimatePresence>
    </ProfessionalPageLayout>
  );
}

/* ================= COMPONENTS ================= */

function SettingsSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SettingsCard({ icon, title, subtitle, onClick, destructive = false }: any) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-zinc-900 text-left transition-all ${destructive
          ? "border-red-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10"
          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm"
        }`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${destructive
          ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50"
          : "bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700"
        }`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-base font-semibold mb-0.5 ${destructive ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-zinc-100"}`}>
          {title}
        </h4>
        <p className={`text-sm truncate ${destructive ? "text-red-600/70 dark:text-red-400/70" : "text-gray-500 dark:text-zinc-400"}`}>
          {subtitle}
        </p>
      </div>

      <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${destructive ? "text-red-400" : "text-gray-400"}`} />
    </button>
  );
}

/* ================= DIALOGS ================= */

function UsernameDialog({ initial, onSave, onClose }: { initial: string, onSave: (v: string) => Promise<void>, onClose: () => void }) {
  const [value, setValue] = useState<string>(initial);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (value.trim().length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }
    setLoading(true);
    await onSave(value.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-zinc-800"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Change Name</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Display Name</label>
            <input
              autoFocus
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Enter your name"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordDialog({ email, onClose }: { email: string, onClose: () => void }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = async () => {
    if (newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPass !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");

    try {
      const cred = EmailAuthProvider.credential(email, oldPass);
      await reauthenticateWithCredential(auth.currentUser!, cred);
      await updatePassword(auth.currentUser!, newPass);
      onClose();
    } catch (e: any) {
      setError(e.code === "auth/wrong-password" ? "Incorrect current password" : "Failed to update password. Try re-logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-zinc-800"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Update Password</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <PasswordInput label="Current Password" value={oldPass} onChange={setOldPass} />
          <div className="h-px bg-gray-200 dark:bg-zinc-800 w-full" />
          <PasswordInput label="New Password" value={newPass} onChange={setNewPass} />
          <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} />
          {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            Cancel
          </button>
          <button onClick={update} disabled={loading || !oldPass || !newPass || !confirm} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function LogoutDialog({ onClose, onConfirm }: { onClose: () => void, onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 text-center border border-gray-200 dark:border-zinc-800"
      >
        <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-2">Sign Out</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
          Are you sure you want to log out? You will need to enter your credentials to access your account again.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}