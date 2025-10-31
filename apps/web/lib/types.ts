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

export interface Explanation {
  purpose: string;
  mechanism: string;
  warnings: string[];
  side_effects: string[];
  sources?: string[];
}