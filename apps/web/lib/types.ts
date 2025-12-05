// lib/types.ts

export interface Drug {
  rx_cui: string;
  generic_name: string;
  brand_names: string[];
  synonyms: string[];
  drug_class?: string;
  atc_code?: string;
}

export interface SearchResponse {
  drugs: Drug[];
  total: number;
}

export interface Citation {
  id: number;
  rx_cui?: string | null;
  section?: string | null;
  source_url?: string | null;
  snippet: string;
  used?: boolean;
}

export interface Explanation {
  drugId: string;
  question?: string | null;
  summary: string[];              
  citations: Citation[];
  usedCitationIds?: number[];
  disclaimer: string;
}
