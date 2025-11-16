// app/tracker/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getMyMedications,
  addMedication,
  addMedicationLog,
  getMyMedicationLogs,
} from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Medication {
  id: number; // backend user_medications.id
  name: string; // display_name
  rxCui: string; // rx_cui (for now we just reuse name)
  dosage: string; // UI-only for now
  frequency: string;
  timeOfDay: string[];
  startDate: string;
  notes: string;
  lastTaken?: string | null; // ISO datetime string from logs
}

interface MedLog {
  id: number;
  medication_id: number;
  taken_at: string; // ISO string from backend
}

function normalizeDateKey(date: Date): string {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function summarizeLogs(logs: MedLog[], daysWindow = 7) {
  if (!logs || logs.length === 0) {
    return {
      totalDoses: 0,
      daysWithDose: 0,
      adherencePercent: 0,
      streak: 0,
      dosesPerDay: {} as Record<string, number>,
    };
  }

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - (daysWindow - 1));

  const dosesPerDay: Record<string, number> = {};

  for (const log of logs) {
    const d = new Date(log.taken_at);
    if (d >= start && d <= now) {
      const key = normalizeDateKey(d);
      dosesPerDay[key] = (dosesPerDay[key] || 0) + 1;
    }
  }

  const daysWithDose = Object.keys(dosesPerDay).length;
  const totalDoses = Object.values(dosesPerDay).reduce((a, b) => a + b, 0);
  const adherencePercent =
    daysWindow > 0 ? Math.round((daysWithDose / daysWindow) * 100) : 0;

  // Streak: consecutive days (up to window) ending today with at least one dose
  let streak = 0;
  for (let i = 0; i < daysWindow; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = normalizeDateKey(d);
    if (dosesPerDay[key]) {
      streak += 1;
    } else {
      break;
    }
  }

  return {
    totalDoses,
    daysWithDose,
    adherencePercent,
    streak,
    dosesPerDay,
  };
}

function buildMedCalendar(logs: MedLog[], daysToShow = 14) {
  const takenSet = new Set(
    logs.map((l) => normalizeDateKey(new Date(l.taken_at)))
  );
  const days: { key: string; label: string; taken: boolean }[] = [];

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = normalizeDateKey(d);
    days.push({
      key,
      label: key.slice(5), // "MM-DD"
      taken: takenSet.has(key),
    });
  }

  return days;
}

type SelectedMedId = "all" | number;

export default function TrackerPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logsByMed, setLogsByMed] = useState<Record<number, MedLog[]>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedId, setSelectedMedId] = useState<SelectedMedId>("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "daily",
    timeOfDay: [] as string[],
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [showCustomFrequency, setShowCustomFrequency] = useState(false);
  const [customFreqNumber, setCustomFreqNumber] = useState("1");
  const [customFreqUnit, setCustomFreqUnit] = useState("times-per-day");

  const frequencyOptions = [
    { value: "daily", label: "Once Daily" },
    { value: "twice-daily", label: "Twice Daily" },
    { value: "three-times-daily", label: "Three Times Daily" },
    { value: "weekly", label: "Once Weekly" },
    { value: "as-needed", label: "As Needed" },
    { value: "custom", label: "+ Custom Frequency" },
  ];

  const customUnits = [
    { value: "times-per-day", label: "time(s) per day" },
    { value: "times-per-week", label: "time(s) per week" },
    { value: "every-x-days", label: "every X day(s)" },
    { value: "every-x-weeks", label: "every X week(s)" },
    { value: "every-x-hours", label: "every X hour(s)" },
  ];

  const timeOptions = [
    { value: "morning", label: "Morning", icon: "🌅" },
    { value: "afternoon", label: "Afternoon", icon: "☀️" },
    { value: "evening", label: "Evening", icon: "🌆" },
    { value: "night", label: "Night", icon: "🌙" },
  ];

  // 🔹 Load medications + logs from backend on mount
  useEffect(() => {
    async function load() {
      try {
        const backendMeds: any[] = await getMyMedications();
        const medsWithMeta: Medication[] = [];
        const logsMap: Record<number, MedLog[]> = {};

        for (const m of backendMeds) {
          const logs: any[] = await getMyMedicationLogs(m.id);
          const sortedLogs = logs.sort(
            (a, b) =>
              new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
          );
          logsMap[m.id] = sortedLogs;

          const lastTaken =
            sortedLogs.length > 0 ? sortedLogs[0].taken_at : null;

          medsWithMeta.push({
            id: m.id,
            name: m.display_name,
            rxCui: m.rx_cui,
            dosage: "", // UI-only for now
            frequency: "daily",
            timeOfDay: [],
            startDate: new Date(m.created_at).toISOString().split("T")[0],
            notes: "",
            lastTaken,
          });
        }

        setMedications(medsWithMeta);
        setLogsByMed(logsMap);
      } catch (err) {
        console.error("Failed to load medications", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleFrequencyChange = (value: string) => {
    if (value === "custom") {
      setShowCustomFrequency(true);
    } else {
      setShowCustomFrequency(false);
      setFormData({ ...formData, frequency: value });
    }
  };

  const applyCustomFrequency = () => {
    let customFreq = "";
    const num = parseInt(customFreqNumber) || 1;

    switch (customFreqUnit) {
      case "times-per-day":
        customFreq = `${num}-times-daily`;
        break;
      case "times-per-week":
        customFreq = `${num}-times-weekly`;
        break;
      case "every-x-days":
        customFreq = `every-${num}-days`;
        break;
      case "every-x-weeks":
        customFreq = `every-${num}-weeks`;
        break;
      case "every-x-hours":
        customFreq = `every-${num}-hours`;
        break;
    }

    setFormData({ ...formData, frequency: customFreq });
    setShowCustomFrequency(false);
  };

  const formatFrequencyDisplay = (freq: string): string => {
    const preset = frequencyOptions.find((opt) => opt.value === freq);
    if (preset && preset.value !== "custom") return preset.label;

    if (freq.includes("times-daily")) {
      const num = freq.split("-")[0];
      return `${num} time${num !== "1" ? "s" : ""} per day`;
    }
    if (freq.includes("times-weekly")) {
      const num = freq.split("-")[0];
      return `${num} time${num !== "1" ? "s" : ""} per week`;
    }
    if (freq.includes("every") && freq.includes("days")) {
      const num = freq.match(/\d+/)?.[0];
      return `Every ${num} day${num !== "1" ? "s" : ""}`;
    }
    if (freq.includes("every") && freq.includes("weeks")) {
      const num = freq.match(/\d+/)?.[0];
      return `Every ${num} week${num !== "1" ? "s" : ""}`;
    }
    if (freq.includes("every") && freq.includes("hours")) {
      const num = freq.match(/\d+/)?.[0];
      return `Every ${num} hour${num !== "1" ? "s" : ""}`;
    }

    return freq.replace(/-/g, " ");
  };

  const handleTimeToggle = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      timeOfDay: prev.timeOfDay.includes(time)
        ? prev.timeOfDay.filter((t) => t !== time)
        : [...prev.timeOfDay, time],
    }));
  };

  // 🔹 Add / update medication (creates backend record when adding)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId !== null) {
      setMedications((prev) =>
        prev.map((med) =>
          med.id === editingId
            ? {
                ...med,
                name: formData.name,
                dosage: formData.dosage,
                frequency: formData.frequency,
                timeOfDay: formData.timeOfDay,
                startDate: formData.startDate,
                notes: formData.notes,
              }
            : med
        )
      );
      setEditingId(null);
    } else {
      try {
        const backendMed: any = await addMedication(
          formData.name,
          formData.name
        );

        const newMed: Medication = {
          id: backendMed.id,
          name: backendMed.display_name,
          rxCui: backendMed.rxCui ?? backendMed.rx_cui,
          dosage: formData.dosage,
          frequency: formData.frequency,
          timeOfDay: formData.timeOfDay,
          startDate: formData.startDate,
          notes: formData.notes,
          lastTaken: null,
        };

        setMedications((prev) => [...prev, newMed]);
        setLogsByMed((prev) => ({ ...prev, [newMed.id]: [] }));
      } catch (err) {
        console.error("Failed to add medication", err);
        alert(
          "Failed to save medication. Please make sure you are signed in and try again."
        );
      }
    }

    setFormData({
      name: "",
      dosage: "",
      frequency: "daily",
      timeOfDay: [],
      startDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowAddForm(false);
    setShowCustomFrequency(false);
    setCustomFreqNumber("1");
    setCustomFreqUnit("times-per-day");
  };

  const handleEdit = (med: Medication) => {
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      timeOfDay: med.timeOfDay,
      startDate: med.startDate,
      notes: med.notes,
    });
    setEditingId(med.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this medication from your tracker view?")) {
      setMedications((prev) => prev.filter((med) => med.id !== id));
      setLogsByMed((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "daily",
      timeOfDay: [],
      startDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditingId(null);
    setShowAddForm(false);
    setShowCustomFrequency(false);
    setCustomFreqNumber("1");
    setCustomFreqUnit("times-per-day");
  };

  const handleMarkTakenNow = async (med: Medication) => {
    try {
      await addMedicationLog(med.id);
      const logs: any[] = await getMyMedicationLogs(med.id);
      const sortedLogs = logs.sort(
        (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
      );
      const lastTaken =
        sortedLogs.length > 0
          ? sortedLogs[0].taken_at
          : new Date().toISOString();

      setLogsByMed((prev) => ({
        ...prev,
        [med.id]: sortedLogs,
      }));

      setMedications((prev) =>
        prev.map((m) =>
          m.id === med.id
            ? {
                ...m,
                lastTaken,
              }
            : m
        )
      );
    } catch (err) {
      console.error("Failed to log intake", err);
      alert("Failed to log this dose. Please try again.");
    }
  };

  // 🔹 Global chart data (doses per day, last 7 days, optionally filtered by med)
  const dosesChartData = useMemo(() => {
    const daysWindow = 7;
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - (daysWindow - 1));

    const counts: Record<string, number> = {};

    Object.entries(logsByMed).forEach(([medIdStr, logs]) => {
      const medId = Number(medIdStr);
      if (selectedMedId !== "all" && medId !== selectedMedId) return;

      logs.forEach((log) => {
        const d = new Date(log.taken_at);
        if (d >= start && d <= now) {
          const key = normalizeDateKey(d);
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const data: { date: string; doses: number }[] = [];
    for (let i = 0; i < daysWindow; i++) {
      const d = new Date();
      d.setDate(now.getDate() - (daysWindow - 1 - i));
      const key = normalizeDateKey(d);
      data.push({
        date: key.slice(5), // "MM-DD"
        doses: counts[key] || 0,
      });
    }

    return data;
  }, [logsByMed, selectedMedId]);

  const visibleMeds =
    selectedMedId === "all"
      ? medications
      : medications.filter((m) => m.id === selectedMedId);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1127] via-[#164357] via-[#1E5A6B] to-[#2E8080] to-[#5AAF9E]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#5AAF9E]/40 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="px-8 md:px-16 lg:px-24 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

          {/* Filter by medication */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-cyan-200/70 uppercase tracking-wider font-[family-name:var(--font-ibm-plex-mono)]">
              Filter
            </span>
            <select
              value={selectedMedId === "all" ? "all" : String(selectedMedId)}
              onChange={(e) =>
                setSelectedMedId(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="bg-[#0B1127]/80 border border-cyan-400/40 text-cyan-100 px-3 py-2 rounded-md text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All medications</option>
              {medications.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-8 md:px-16 lg:px-24 pb-20">
          {/* Title & Add Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
                Drug Tracker
              </h1>
              <p className="text-cyan-200/80 text-lg font-[family-name:var(--font-ibm-plex-mono)]">
                Manage your medication schedule, history, and adherence
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="mt-6 md:mt-0 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 font-[family-name:var(--font-ibm-plex-mono)] tracking-wider"
            >
              {showAddForm ? "✕ CANCEL" : "+ ADD MEDICATION"}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 font-[family-name:var(--font-space-grotesk)]">
                {editingId ? "Edit Medication" : "Add New Medication"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Medication Name */}
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Lisinopril"
                    className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Dosage & Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dosage}
                      onChange={(e) =>
                        setFormData({ ...formData, dosage: e.target.value })
                      }
                      placeholder="e.g., 10mg"
                      className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                      Frequency *
                    </label>
                    <select
                      required={!showCustomFrequency}
                      value={
                        showCustomFrequency ? "custom" : formData.frequency
                      }
                      onChange={(e) => handleFrequencyChange(e.target.value)}
                      className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    >
                      {frequencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {showCustomFrequency && (
                      <div className="mt-3 p-4 bg-cyan-900/20 border border-cyan-400/30 rounded-lg space-y-3">
                        <div className="text-cyan-200 text-sm font-medium mb-2">
                          Build Custom Frequency
                        </div>
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min="1"
                            value={customFreqNumber}
                            onChange={(e) =>
                              setCustomFreqNumber(e.target.value)
                            }
                            className="w-20 bg-[#1E5A6B]/30 border border-cyan-400/40 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                            placeholder="1"
                          />
                          <select
                            value={customFreqUnit}
                            onChange={(e) =>
                              setCustomFreqUnit(e.target.value)
                            }
                            className="flex-1 bg-[#1E5A6B]/30 border border-cyan-400/40 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          >
                            {customUnits.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={applyCustomFrequency}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomFrequency(false);
                              setFormData({
                                ...formData,
                                frequency: "daily",
                              });
                            }}
                            className="px-4 py-2 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/20 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="text-cyan-300/60 text-xs">
                          Preview:{" "}
                          {formatFrequencyDisplay(
                            `${customFreqNumber}-${customFreqUnit}`
                          )}
                        </div>
                      </div>
                    )}

                    {!showCustomFrequency &&
                      formData.frequency &&
                      !frequencyOptions.find(
                        (opt) => opt.value === formData.frequency
                      ) && (
                        <div className="mt-2 text-cyan-200 text-sm">
                          Current:{" "}
                          {formatFrequencyDisplay(formData.frequency)}
                        </div>
                      )}
                  </div>
                </div>

                {/* Time of Day */}
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-3 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Time of Day *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {timeOptions.map((time) => (
                      <button
                        key={time.value}
                        type="button"
                        onClick={() => handleTimeToggle(time.value)}
                        className={`
                          p-4 rounded-lg border-2 transition-all duration-200
                          ${
                            formData.timeOfDay.includes(time.value)
                              ? "border-cyan-400 bg-cyan-900/40 text-cyan-100"
                              : "border-cyan-400/30 bg-[#1E5A6B]/20 text-cyan-300/60 hover:border-cyan-400/50"
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{time.icon}</div>
                        <div className="text-sm font-medium">
                          {time.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase font-[family-name:var(--font-ibm-plex-mono)]">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Special instructions, side effects to watch for, etc."
                    rows={3}
                    className="w-full bg-[#1E5A6B]/30 border border-cyan-400/40 rounded-md px-4 py-3 text-white placeholder-cyan-300/40 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg"
                  >
                    {editingId ? "UPDATE MEDICATION" : "ADD MEDICATION"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900/20 rounded-lg transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Medications List */}
          {loading ? (
            <div className="text-center py-20 text-cyan-100">
              Loading your medications...
            </div>
          ) : visibleMeds.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">💊</div>
              <h3 className="text-2xl text-cyan-100 mb-4 font-[family-name:var(--font-space-grotesk)]">
                No medications tracked yet
              </h3>
              <p className="text-cyan-300/60 mb-6">
                Add your first medication to start tracking your schedule
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                + ADD MEDICATION
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleMeds.map((med) => {
                const medLogs = logsByMed[med.id] || [];
                const stats = summarizeLogs(medLogs, 7);
                const calendar = buildMedCalendar(medLogs, 14);

                return (
                  <div
                    key={med.id}
                    className="bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6 hover:border-cyan-400/50 transition-all duration-200"
                  >
                    {/* Medication Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1 font-[family-name:var(--font-space-grotesk)]">
                          {med.name}
                        </h3>
                        <p className="text-cyan-300 text-lg">{med.dosage}</p>
                        <p className="text-xs text-cyan-300/60 mt-1">
                          ID: {med.rxCui}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(med)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                          title="Edit"
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
                        <button
                          onClick={() => handleDelete(med.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Remove from view"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="mb-3 pb-3 border-b border-cyan-400/20">
                      <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                        Frequency
                      </span>
                      <p className="text-cyan-100 text-sm mt-1">
                        {formatFrequencyDisplay(med.frequency)}
                      </p>
                    </div>

                    {/* Time of Day */}
                    <div className="mb-3">
                      <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                        Time of Day
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {med.timeOfDay.map((time) => {
                          const timeOption = timeOptions.find(
                            (t) => t.value === time
                          );
                          return (
                            <span
                              key={time}
                              className="px-3 py-1 bg-cyan-900/30 border border-cyan-400/30 rounded-full text-cyan-100 text-xs flex items-center gap-1"
                            >
                              <span>{timeOption?.icon}</span>
                              <span>{timeOption?.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="mb-3">
                      <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                        Started
                      </span>
                      <p className="text-cyan-100 text-sm mt-1">
                        {new Date(med.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Last Taken */}
                    <div className="mb-3">
                      <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                        Last Taken
                      </span>
                      <p className="text-cyan-100 text-sm mt-1">
                        {med.lastTaken
                          ? new Date(med.lastTaken).toLocaleString()
                          : "Not logged yet"}
                      </p>
                    </div>

                    {/* Analytics */}
                    <div className="mt-3 pt-3 border-t border-cyan-400/20">
                      <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                        Last 7 days
                      </span>
                      <p className="text-cyan-100 text-sm mt-1">
                        Streak:{" "}
                        <span className="font-semibold">
                          {stats.streak}
                        </span>{" "}
                        day{stats.streak === 1 ? "" : "s"}
                      </p>
                      <p className="text-cyan-100 text-sm">
                        Adherence:{" "}
                        <span className="font-semibold">
                          {stats.adherencePercent}%
                        </span>{" "}
                        of days
                      </p>
                      <p className="text-cyan-100 text-sm">
                        Doses logged:{" "}
                        <span className="font-semibold">
                          {stats.totalDoses}
                        </span>
                      </p>
                    </div>

                    {/* Mini calendar (last 14 days) */}
                    <div className="mt-3">
                      <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                        Last 14 days
                      </span>
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {calendar.map((day) => (
                          <div
                            key={day.key}
                            className={`h-6 w-6 rounded text-[10px] flex items-center justify-center ${
                              day.taken
                                ? "bg-cyan-500 text-white"
                                : "bg-cyan-900/30 text-cyan-400/60"
                            }`}
                            title={day.label}
                          >
                            {day.label.split("-")[1]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {med.notes && (
                      <div className="mt-3 pt-3 border-t border-cyan-400/20">
                        <span className="text-cyan-300/60 text-xs uppercase tracking-wider">
                          Notes
                        </span>
                        <p className="text-cyan-100/80 text-sm mt-1 line-clamp-2">
                          {med.notes}
                        </p>
                      </div>
                    )}

                    {/* Mark taken */}
                    <div className="mt-4">
                      <button
                        onClick={() => handleMarkTakenNow(med)}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Mark dose taken now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Global History & Insights */}
          {!loading && medications.length > 0 && (
            <div className="mt-12 bg-[#0B1127]/80 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
                History & Insights
              </h2>
              <p className="text-cyan-200/80 text-sm mb-4">
                Doses logged in the last 7 days{" "}
                {selectedMedId === "all"
                  ? "across all medications."
                  : "for the selected medication."}
              </p>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dosesChartData}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="doses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {medications.length > 0 && !loading && (
            <div className="mt-12 p-4 bg-cyan-900/20 border border-cyan-400/30 rounded-lg">
              <p className="text-sm text-cyan-200/70 text-center font-[family-name:var(--font-ibm-plex-mono)]">
                ⚕️ This tracker is for personal reference only. Always follow
                your doctor&apos;s instructions and consult healthcare
                professionals about your medications.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
