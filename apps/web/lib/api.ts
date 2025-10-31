// lib/api.ts

import { Drug, SearchResponse, Explanation } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function searchDrugs(
  query: string, 
  limit = 10, 
  offset = 0
): Promise<SearchResponse> {
  try {
    const res = await fetch(
      `${API_BASE}/drug?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
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
    console.error('Search error:', error);
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
    } catch (e) {
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
      if (data.length === 0) throw new Error('Drug not found');
      return data[0];
    }
    
    if (data.drugs && data.drugs.length > 0) {
      return data.drugs[0];
    }
    
    throw new Error('Drug not found');
  } catch (error) {
    console.error('Get drug error:', error);
    throw error;
  }
}

export async function getExplanation(drugId: string): Promise<Explanation> {
  try {
    const res = await fetch(`${API_BASE}/explain?drug_id=${drugId}`);
    
    if (!res.ok) {
      throw new Error(`Explanation failed: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Explanation error:', error);
    throw error;
  }
}