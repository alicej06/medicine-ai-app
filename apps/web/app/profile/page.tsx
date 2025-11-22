// app/profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getMe,
  getMyMedications,
  getMyMedicationLogs,
} from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedDate: string;      // ISO string
  medications: any[];      // backend /me/medications objects
  totalDosesTaken?: number;
  adherenceRate?: number;
}

interface MedLog {
  id: number;
  medication_id: number;
  taken_at: string;        // ISO datetime string
}

// Helper to normalize a date to YYYY-MM-DD
function normalizeDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Compute a simple 7-day adherence rate across all logs
function computeAdherence(allLogs: MedLog[], daysWindow = 7): number {
  if (!allLogs || allLogs.length === 0) {
    return 0;
  }

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - (daysWindow - 1));

  const dosesPerDay: Record<string, boolean> = {};

  for (const log of allLogs) {
    const d = new Date(log.taken_at);
    if (d >= start && d <= now) {
      const key = normalizeDateKey(d);
      dosesPerDay[key] = true;
    }
  }

  const daysWithDose = Object.keys(dosesPerDay).length;
  return daysWindow > 0
    ? Math.round((daysWithDose / daysWindow) * 100)
    : 0;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const token = getToken();
      if (!token) {
        router.push("/signin");
        return;
      }

      try {
        // 1) Fetch user info
        const me: any = await getMe();
        // Expecting something like: { id, email, name, created_at, ... }

        // 2) Fetch medications
        const meds: any[] = await getMyMedications();

        // 3) Fetch logs for each medication and aggregate
        let allLogs: MedLog[] = [];

        for (const m of meds) {
          try {
            const logs: any[] = await getMyMedicationLogs(m.id);
            const mapped: MedLog[] = logs.map((log: any) => ({
              id: log.id,
              medication_id: m.id,
              taken_at: log.taken_at,
            }));
            allLogs = allLogs.concat(mapped);
          } catch (e) {
            console.error("Failed to load logs for medication", m.id, e);
          }
        }

        const totalDosesTaken = allLogs.length;
        const adherenceRate = computeAdherence(allLogs, 7);

        // 4) Split name into first/last for UI
        const fullName: string = me.name || "";
        const parts = fullName.trim().split(" ");
        const firstName = parts[0] || "User";
        const lastName = parts.slice(1).join(" ");

        // 5) Joined date from backend (fallback to now if missing)
        const joined =
          me.created_at || me.createdAt || new Date().toISOString();

        const profile: UserProfile = {
          id: String(me.id),
          firstName,
          lastName,
          email: me.email,
          joinedDate: joined,
          medications: meds,
          totalDosesTaken,
          adherenceRate,
        };

        setUser(profile);
        setEditForm({
          firstName,
          lastName,
          email: me.email,
        });
      } catch (error: any) {
        console.error("Failed to load profile:", error);
        if (error?.message === "Unauthorized") {
          clearToken();
          router.push("/signin");
        } else {
          // For now, treat other errors similarly
          clearToken();
          router.push("/signin");
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    // Currently no backend route for updating profile – keep changes local.
    setUser((prev) =>
      prev
        ? {
            ...prev,
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            email: editForm.email,
          }
        : null
    );
    setIsEditing(false);

    /* When backend update profile endpoint exists:
    try {
      await updateProfile({
        name: `${editForm.firstName} ${editForm.lastName}`.trim(),
        email: editForm.email,
      });
      setUser(prev => prev ? {
        ...prev,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email
      } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
    */
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    router.push("/signin");
  };

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
          <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-200">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
          <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-8">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Please Sign In
          </h2>
          <p className="text-cyan-200 mb-8">
            You need to be logged in to view your profile
          </p>
          <Link
            href="/signin"
            className="inline-block bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-8 rounded-lg transition-all"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="px-8 md:px-16 lg:px-24 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-200 transition-colors group"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
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
            <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)]">
              Back to Home
            </span>
          </Link>
        </header>

        {/* Main Content */}
        <div className="px-8 md:px-16 lg:px-24 pb-20">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="flex items-center gap-6 mb-6 md:mb-0">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {user.firstName[0]}
                {user.lastName[0] || ""}
              </div>

              <div>
                <h1 className="text-4xl font-bold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-cyan-200/80 font-[family-name:var(--font-ibm-plex-mono)]">
                  Member since{" "}
                  {new Date(user.joinedDate).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-6 py-3 border border-red-400/50 text-red-300 hover:bg-red-900/20 rounded-lg transition-colors font-[family-name:var(--font-ibm-plex-mono)]"
            >
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Medications */}
            <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300/60 text-sm uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                  Medications
                </span>
                <span className="text-3xl">💊</span>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {user.medications?.length || 0}
              </div>
              <p className="text-cyan-200/70 text-sm">Active prescriptions</p>
            </div>

            {/* Adherence Rate */}
            <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300/60 text-sm uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                  Adherence (7 days)
                </span>
                <span className="text-3xl">📊</span>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {user.adherenceRate || 0}%
              </div>
              <p className="text-cyan-200/70 text-sm">
                Days with at least one dose
              </p>
            </div>

            {/* Total Doses */}
            <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300/60 text-sm uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                  Doses Taken
                </span>
                <span className="text-3xl">✅</span>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {user.totalDosesTaken || 0}
              </div>
              <p className="text-cyan-200/70 text-sm">Total recorded</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Information */}
            <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                  Account Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email,
                        });
                      }}
                      className="px-6 py-3 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900/20 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-cyan-300/60 text-sm uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                      Full Name
                    </span>
                    <p className="text-white text-lg mt-1">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>

                  <div>
                    <span className="text-cyan-300/60 text-sm uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                      Email Address
                    </span>
                    <p className="text-white text-lg mt-1">{user.email}</p>
                  </div>

                  <div>
                    <span className="text-cyan-300/60 text-sm uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
                      User ID
                    </span>
                    <p className="text-cyan-300/70 text-sm mt-1 font-mono">
                      {user.id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Medication Tracker Card */}
              <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
                  Medication Tracker
                </h2>
                <p className="text-cyan-200/80 mb-6">
                  Manage your medications and track your daily schedule
                </p>
                <Link
                  href="/tracker"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  <span>Open Tracker</span>
                  <svg
                    className="w-5 h-5"
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
                </Link>
              </div>

              {/* Other Quick Links */}
              <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
                  Quick Links
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/search"
                    className="flex items-center justify-between p-3 rounded-lg border border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-900/20 transition-all group"
                  >
                    <span className="text-cyan-100">Drug Information</span>
                    <svg
                      className="w-5 h-5 text-cyan-400 transition-transform group-hover:translate-x-1"
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
                  </Link>

                  <Link
                    href="/interactions"
                    className="flex items-center justify-between p-3 rounded-lg border border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-900/20 transition-all group"
                  >
                    <span className="text-cyan-100">
                      Interaction Checker
                    </span>
                    <svg
                      className="w-5 h-5 text-cyan-400 transition-transform group-hover:translate-x-1"
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
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-red-400/30 hover:border-red-400/60 hover:bg-red-900/20 transition-all text-red-300 group"
                  >
                    <span>Logout</span>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
