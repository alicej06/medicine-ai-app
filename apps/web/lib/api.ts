// apps/web/src/lib/api.ts

import { Drug, SearchResponse, Explanation } from "./types";
import { getToken, clearToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function api(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");


    if (res.status === 401) {
      // Token is missing/invalid/expired
      clearToken();
      const err = new Error("Unauthorized");
      // @ts-ignore 
      err.status = 401;
      throw err;
    }
    console.error("API error:", res.status, text);
    const err = new Error(`API error ${res.status}`);
    // @ts-ignore  
    err.status = res.status;
    throw err;

  }

  if (res.status === 204) return null;

  return res.json();
}


export async function searchDrugs(
  query: string,
  limit = 10,
  offset = 0
): Promise<SearchResponse> {
  try {
    const res = await fetch(
      `${API_BASE}/drug?query=${encodeURIComponent(
        query
      )}&limit=${limit}&offset=${offset}`
    );

    if (!res.ok) {
      throw new Error(`Search failed: ${res.status}`);
    }

    const data = await res.json();

    // Handle both array and object responses
    if (Array.isArray(data)) {
      return { drugs: data, total: data.length };
    }

    return data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

export async function getDrugById(rxCui: string): Promise<Drug> {
  const paths = [`/drug/${rxCui}`, `/drugs/${rxCui}`];

  for (const path of paths) {
    try {
      const data: any = await api(path);

      if (!data) continue;

      // If backend returns { drug: {...} }
      if (data.drug) {
        return data.drug as Drug;
      }

      // If backend returns a single object
      if (!Array.isArray(data) && typeof data === "object") {
        return data as Drug;
      }

      // If backend returns an array
      if (Array.isArray(data)) {
        if (data.length === 0) continue;
        return data[0] as Drug;
      }
    } catch (err: any) {
      // If this path 404s, try the next one; otherwise rethrow
      if (err?.status === 404) continue;
      throw err;
    }
  }

  // Final fallback: search by rxCui
  const searchResult = await searchDrugs(rxCui, 1, 0);
  if (!searchResult.drugs || searchResult.drugs.length === 0) {
    throw new Error("Drug not found");
  }
  return searchResult.drugs[0];
}


export async function getExplanation(drugId: string): Promise<Explanation> {
  return api("/explain", {
    method: "POST",
    body: JSON.stringify({ drugId }),
  }) as Promise<Explanation>;
}


export async function login(email: string, password: string) {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string, name: string) {
  return api("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function getMe() {
  return api("/auth/me");
}

export async function getMyMedications() {
  return api("/me/medications");
}

export async function addMedication(rxCui: string, displayName: string) {
  return api("/me/medications", {
    method: "POST",
    body: JSON.stringify({ rx_cui: rxCui, display_name: displayName }),
  });
}


export async function addMedicationLog(medicationId: number) {
  return api(`/me/medications/${medicationId}/log`, {
    method: "POST",
    body: JSON.stringify({}), // empty body means "taken now"
  });
}

export async function getMyMedicationLogs(medicationId: number) {
  return api(`/me/medications/${medicationId}/log`);
}

export interface MedOverviewPerDrug {
  medicationId: number;
  name: string;
  rxCui?: string | null;
  summary: string;
  usedCitationIds: number[];
}

export interface MedOverviewCitation {
  id: number;
  rxCui?: string | null;
  section?: string | null;
  sourceUrl?: string | null;
  snippet: string;
  used: boolean;
}

export interface MedListOverview {
  overviewBullets: string[];
  perDrug: MedOverviewPerDrug[];
  citations: MedOverviewCitation[];
  usedCitationIds: number[];
  disclaimer: string;
}

export async function getMedListOverview(): Promise<MedListOverview> {
  return api("/me/medications/overview") as Promise<MedListOverview>;
}


export interface ParsedPillLabel {
  drugName: string | null;
  strength: string | null;
  rawSig: string | null;
  directionsSummary: string | null;
  notes: string | null;
  confidence: number | null;
}


export async function parsePillLabel(
  ocrText: string
): Promise<ParsedPillLabel> {
  return api("/ai/parse-pill-label", {
    method: "POST",
    body: JSON.stringify({ ocrText }),
  }) as Promise<ParsedPillLabel>;
}
