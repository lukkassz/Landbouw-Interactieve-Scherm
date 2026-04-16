import axios from "axios";
import type { TimelineEvent, EventSection, KeyMoment, QuizQuestion } from "./types";

const client = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ── Events ──────────────────────────────────────────────
export async function fetchAllEvents(): Promise<TimelineEvent[]> {
  const { data } = await client.get<TimelineEvent[]>("/admin/events");
  return data;
}

export async function fetchEvent(id: number): Promise<TimelineEvent> {
  const { data } = await client.get<TimelineEvent>("/event", { params: { id } });
  return data;
}

export async function createEvent(body: Partial<TimelineEvent>): Promise<{ id: number }> {
  const { data } = await client.post("/event", body);
  return data;
}

export async function updateEvent(body: Partial<TimelineEvent> & { id: number }): Promise<void> {
  await client.put("/event", body);
}

export async function deleteEvent(id: number): Promise<void> {
  await client.delete("/event", { params: { id } });
}

export interface UploadedMedia {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await client.post<UploadedMedia>("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

// ── Sections ────────────────────────────────────────────
export async function fetchSections(eventId: number): Promise<EventSection[]> {
  const { data } = await client.get("/event_sections_direct", { params: { event_id: eventId } });
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function saveSections(
  eventId: number,
  sections: EventSection[]
): Promise<void> {
  await client.put(`/event/${eventId}/sections`, { sections });
}

// ── Key Moments ────────────────────────────────────────
export async function fetchKeyMoments(eventId: number): Promise<KeyMoment[]> {
  const { data } = await client.get("/key_moments_simple", { params: { event_id: eventId } });
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function saveKeyMoments(
  eventId: number,
  moments: KeyMoment[]
): Promise<void> {
  await client.put(`/event/${eventId}/key-moments`, { moments });
}

// ── Quiz Questions ──────────────────────────────────────
// Admin uses the dedicated admin endpoint so the response is stable (no shuffle,
// preserves IDs and ordering). The public /quiz_questions endpoint is for the
// game front-end.
export async function fetchQuizQuestions(eventId: number): Promise<QuizQuestion[]> {
  const { data } = await client.get(`/event/${eventId}/quiz-questions`);
  return Array.isArray(data) ? data : [];
}

export async function saveQuizQuestions(
  eventId: number,
  questions: QuizQuestion[]
): Promise<void> {
  await client.put(`/event/${eventId}/quiz-questions`, { questions });
}
