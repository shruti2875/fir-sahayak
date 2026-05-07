const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data as T;
}

// ── Station ──────────────────────────────────────────────────────────────────

export interface StationPayload {
  station_name: string;
  location: string;
  contact_number: string;
}

export interface StationResult {
  station_id: number;
  station_name: string;
  location: string;
  contact_number: string;
}

export const registerStation = (payload: StationPayload) =>
  request<StationResult>("/station/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getStationByName = (name: string) =>
  request<StationResult>(`/station/by-name?name=${encodeURIComponent(name)}`);

// ── Officer ──────────────────────────────────────────────────────────────────

export interface OfficerPayload {
  name: string;
  email: string;
  password: string;
  rank: string;
  station_id: number;
}

export interface OfficerResult {
  officer_id: number;
  name: string;
  email: string;
  rank: string;
  station_id: number;
}

export const registerOfficer = (payload: OfficerPayload) =>
  request<OfficerResult>("/officer/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginOfficer = (email: string, password: string) =>
  request<OfficerResult>("/officer/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// ── FIR ──────────────────────────────────────────────────────────────────────

export const generateSmartFIR = async (
  description: string,
  language: string = "en",
  complainant_name: string = "",
  complainant_address: string = "",
  complainant_contact: string = "",
  station_name: string = ""
) =>
  request<{
    fir: string;
    missing_info: string;
    suggestions: string;
    confidence: string;
    similar_cases: { description: string }[];
  }>("/ai/generate-smart", {
    method: "POST",
    body: JSON.stringify({
      description,
      language,
      complainant_name,
      complainant_address,
      complainant_contact,
      station_name,
    }),
  });

// ✅ NEW: Image Analysis
export const analyzeImage = async (
  file: File,
  description: string = "",
  language: string = "en"
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);
  formData.append("language", language);

  const res = await fetch(`${BASE_URL}/ai/analyze-image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Image analysis failed");
  return res.json();
};

// ✅ NEW: Download PDF
export const downloadFIRPDF = async (
  fir_text: string,
  complainant_name: string = "",
  incident_date: string = "",
  incident_location: string = ""
) => {
  const res = await fetch(`${BASE_URL}/ai/download-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fir_text,
      complainant_name,
      incident_date,
      incident_location,
    }),
  });

  if (!res.ok) throw new Error("PDF download failed");
  return res.blob();
};
