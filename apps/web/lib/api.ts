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
  try {
    // Try method 1: Direct endpoint (if exists)
    try {
      const res = await fetch(`${API_BASE}/drug/${rxCui}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (_e) {
      // Fall through to method 2
    }

    // Method 2: Search with exact CUI
    const res = await fetch(`${API_BASE}/drug?query=${rxCui}&limit=1`);

    if (!res.ok) {
      throw new Error(`Drug not found: ${res.status}`);
    }

    const data = await res.json();

    // Extract first result
    if (Array.isArray(data)) {
      if (data.length === 0) throw new Error("Drug not found");
      return data[0];
    }

    if (data.drugs && data.drugs.length > 0) {
      return data.drugs[0];
    }

    throw new Error("Drug not found");
  } catch (error) {
    console.error("Get drug error:", error);
    throw error;
  }
}

export async function getExplanation(drugId: string): Promise<Explanation> {
  try {
    const res = await fetch(`${API_BASE}/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ drugId }),
    });

    if (!res.ok) {
      throw new Error(`Explanation failed: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Explanation error:", error);
    throw error;
  }
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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/me/medications/overview`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Med list overview failed: ${res.status}`);
  }

  return res.json();
}

export interface ParsedPillLabel {
  drugName: string | null;
  strength: string | null;
  rawSig: string | null;
  directionsSummary: string | null;
  notes: string | null;
  confidence: number | null;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}



export async function parsePillLabel(ocrText: string): Promise<ParsedPillLabel> {
  const res = await fetch(`${API_BASE}/ai/parse-pill-label`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ ocrText }),
  });

  if (!res.ok) {
    throw new Error(`parsePillLabel failed: ${res.status}`);
  }

  return res.json();
}