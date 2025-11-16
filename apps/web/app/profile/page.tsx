"use client";

import { useEffect, useState } from "react";
import { getMe, addMedicationLog, getMyMedicationLogs } from "@/lib/api";
import { getToken } from "@/lib/auth";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Record<number, any[]>>({}); // logs per med

  // Fetch user profile on load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    async function load() {
      const me = await getMe();
      setUser(me);

      // fetch logs for each medication
      const logsObj: Record<number, any[]> = {};
      for (const med of me.medications) {
        const medLogs = await getMyMedicationLogs(med.id);
        logsObj[med.id] = medLogs;
      }
      setLogs(logsObj);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">You must sign in first.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Account info</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </section>

      <section className="bg-white p-4 rounded shadow">
  <h2 className="text-xl font-semibold mb-2">Medications</h2>
  <p className="text-gray-700 mb-4">
    You can manage your medications and log doses in your tracker.
  </p>
  <Link href="/tracker" className="inline-block px-4 py-2 rounded bg-blue-600 text-white">
    Open Tracker
  </Link>
</section>

    </div>
  );
}
