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
import AttendMateBottomNav from "@/components/navigation/AttendMateBottomNav";

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-28">
      {/* HEADER */}
      <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          >
            <svg
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
        </div>
      </div>

      <div className={`px-6 py-6 space-y-6 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* PROFILE CARD */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-white">{username}</p>
                <p className="text-indigo-100 text-sm">{email}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACCOUNT SECTION */}
        <Section title="Account" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }>
          <SettingItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Change Username"
            subtitle="Update your display name"
            onClick={() => setShowUsername(true)}
          />
          <SettingItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            title="Change Password"
            subtitle="Keep your account secure"
            onClick={() => setShowPassword(true)}
          />
        </Section>

        {/* SUBJECTS SECTION */}
        <Section title="Subjects" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        }>
          <SettingItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="Manage Subjects"
            subtitle="Add, edit or remove subjects"
            onClick={() => router.push("/subjects")}
          />
        </Section>

        {/* TIMETABLE SECTION */}
        <Section title="Attendance Automation" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }>
          <SettingItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title="Smart Timetable"
            subtitle="Lecture reminders & auto attendance"
            onClick={() => router.push("/timetable")}
          />
        </Section>

        {/* SESSION SECTION */}
        <Section title="Session" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        }>
          <SettingItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
            title="Logout"
            subtitle="Sign out from this device"
            destructive
            onClick={() => setShowLogout(true)}
          />
        </Section>
      </div>

      {/* DIALOGS */}
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
        <ConfirmDialog
          title="Logout?"
          message="Are you sure you want to logout?"
          action="Logout"
          onConfirm={logout}
          onCancel={() => setShowLogout(false)}
        />
      )}

      <AttendMateBottomNav />
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, icon, children }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SettingItem({ icon, title, subtitle, onClick, destructive = false }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 ${
        destructive ? "border-red-200 dark:border-red-900/50" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          destructive
            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        }`}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <p className={`font-semibold ${
            destructive
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-gray-100"
          }`}>
            {title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
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
    <Modal onClose={onClose}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Change Username
      </h3>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
        }}
        className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
        placeholder="Username"
      />
      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>
      )}
      <Actions>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors font-medium disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </Actions>
    </Modal>
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
    <Modal onClose={onClose}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Change Password
      </h3>
      <div className="space-y-3">
        <PasswordInput
          value={oldPass}
          onChange={setOldPass}
          placeholder="Current password"
          show={showOld}
          onToggle={() => setShowOld(!showOld)}
        />
        <PasswordInput
          value={newPass}
          onChange={setNewPass}
          placeholder="New password"
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />
        <PasswordInput
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirm new password"
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />
      </div>
      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>
      )}
      <Actions>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={update}
          disabled={loading || !oldPass || !newPass || !confirm}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors font-medium disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </Actions>
    </Modal>
  );
}

function PasswordInput({ value, onChange, placeholder, show, onToggle }: any) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 pr-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {show ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function ConfirmDialog({ title, message, action, onConfirm, onCancel }: any) {
  return (
    <Modal onClose={onCancel}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <Actions>
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white transition-colors font-medium"
        >
          {action}
        </button>
      </Actions>
    </Modal>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Actions({ children }: any) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>;
}