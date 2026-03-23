import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const eventsRouter = Router();

// GET /api/events — list all active events
eventsRouter.get("/events", (_req: Request, res: Response) => {
  const db = getDb();
  const events = db
    .prepare(
      `SELECT * FROM timeline_events WHERE is_active = 1 ORDER BY sort_order ASC, year ASC`
    )
    .all() as Record<string, unknown>[];

  const enriched = events.map((event) => ({
    ...event,
    gallery_images: parseJson(event.gallery_images as string),
    related_events: parseJson(event.related_events as string),
    use_detailed_modal: Boolean(event.use_detailed_modal),
    has_key_moments: Boolean(event.has_key_moments),
    has_puzzle: Boolean(event.has_puzzle),
    is_active: Boolean(event.is_active),
    has_video: Boolean(event.has_video),
  }));

  res.json(enriched);
});

// GET /api/admin/events — list ALL events (including inactive) for admin panel
eventsRouter.get("/admin/events", (_req: Request, res: Response) => {
  const db = getDb();
  const events = db
    .prepare(
      `SELECT * FROM timeline_events ORDER BY sort_order ASC, year ASC`
    )
    .all() as Record<string, unknown>[];

  const enriched = events.map((event) => ({
    ...event,
    gallery_images: parseJson(event.gallery_images as string),
    related_events: parseJson(event.related_events as string),
    use_detailed_modal: Boolean(event.use_detailed_modal),
    has_key_moments: Boolean(event.has_key_moments),
    has_puzzle: Boolean(event.has_puzzle),
    is_active: Boolean(event.is_active),
    has_video: Boolean(event.has_video),
  }));

  res.json(enriched);
});

// GET /api/timeline/events — alias
eventsRouter.get("/timeline/events", (_req: Request, res: Response) => {
  const db = getDb();
  const events = db
    .prepare(
      `SELECT * FROM timeline_events WHERE is_active = 1 ORDER BY sort_order ASC, year ASC`
    )
    .all() as Record<string, unknown>[];

  const enriched = events.map((event) => ({
    ...event,
    gallery_images: parseJson(event.gallery_images as string),
    related_events: parseJson(event.related_events as string),
    use_detailed_modal: Boolean(event.use_detailed_modal),
    has_key_moments: Boolean(event.has_key_moments),
    has_puzzle: Boolean(event.has_puzzle),
    is_active: Boolean(event.is_active),
    has_video: Boolean(event.has_video),
  }));

  res.json(enriched);
});

// GET /api/event?id=:id — get single event
eventsRouter.get("/event", (req: Request, res: Response) => {
  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Missing id parameter" });
    return;
  }

  const db = getDb();
  const event = db
    .prepare(`SELECT * FROM timeline_events WHERE id = ?`)
    .get(Number(id)) as Record<string, unknown> | undefined;

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json({
    ...event,
    gallery_images: parseJson(event.gallery_images as string),
    related_events: parseJson(event.related_events as string),
    use_detailed_modal: Boolean(event.use_detailed_modal),
    has_key_moments: Boolean(event.has_key_moments),
    has_puzzle: Boolean(event.has_puzzle),
    is_active: Boolean(event.is_active),
    has_video: Boolean(event.has_video),
  });
});

// POST /api/event — create new event
eventsRouter.post("/event", (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;

  const stmt = db.prepare(`
    INSERT INTO timeline_events (
      year, title, subtitle, description, icon, gradient, museum_gradient,
      stage, use_detailed_modal, historical_context, has_key_moments,
      has_puzzle, puzzle_image_url, game_type, category, sort_order,
      image_url, video_url, gallery_images, model_3d_url,
      importance_level, fun_fact, related_events, location, is_active, has_video,
      scrubber_label, infobox_title, infobox_subtitle, icon_name
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const result = stmt.run(
    body.year,
    body.title,
    body.subtitle || null,
    body.description || null,
    body.icon || null,
    body.gradient || null,
    body.museum_gradient || null,
    body.stage || null,
    body.use_detailed_modal ? 1 : 0,
    body.historical_context || null,
    body.has_key_moments ? 1 : 0,
    body.has_puzzle ? 1 : 0,
    body.puzzle_image_url || null,
    body.game_type || "none",
    body.category || null,
    body.sort_order || 0,
    body.image_url || null,
    body.video_url || null,
    body.gallery_images ? JSON.stringify(body.gallery_images) : null,
    body.model_3d_url || null,
    body.importance_level || null,
    body.fun_fact || null,
    body.related_events ? JSON.stringify(body.related_events) : null,
    body.location || null,
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    body.has_video ? 1 : 0,
    body.scrubber_label || null,
    body.infobox_title || null,
    body.infobox_subtitle || null,
    body.icon_name || null
  );

  res.status(201).json({ id: result.lastInsertRowid, message: "Event created" });
});

// PUT /api/event — update event
eventsRouter.put("/event", (req: Request, res: Response) => {
  const body = req.body;
  if (!body.id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowedFields = [
    "year", "title", "subtitle", "description", "icon", "gradient",
    "museum_gradient", "stage", "historical_context", "puzzle_image_url",
    "game_type", "category", "sort_order", "image_url", "video_url",
    "model_3d_url", "importance_level", "fun_fact", "location",
    "scrubber_label", "infobox_title", "infobox_subtitle", "icon_name"
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  // Boolean fields
  const boolFields = [
    "use_detailed_modal", "has_key_moments", "has_puzzle", "is_active", "has_video",
  ];
  for (const field of boolFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(body[field] ? 1 : 0);
    }
  }

  // JSON fields
  const jsonFields = ["gallery_images", "related_events"];
  for (const field of jsonFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(JSON.stringify(body[field]));
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  fields.push("updated_at = datetime('now')");
  values.push(body.id);

  db.prepare(`UPDATE timeline_events SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );

  res.json({ message: "Event updated" });
});

// DELETE /api/event?id=:id — soft delete event
eventsRouter.delete("/event", (req: Request, res: Response) => {
  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Missing id parameter" });
    return;
  }

  const db = getDb();
  db.prepare(`UPDATE timeline_events SET is_active = 0 WHERE id = ?`).run(Number(id));
  res.json({ message: "Event deleted" });
});

function parseJson(value: string | null | undefined): unknown {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
