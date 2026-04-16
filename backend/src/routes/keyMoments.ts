import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const keyMomentsRouter = Router();

// GET /api/key-moments?event_id=:id
keyMomentsRouter.get("/key-moments", (req: Request, res: Response) => {
  const eventId = req.query.event_id;
  if (!eventId) {
    res.status(400).json({ error: "Missing event_id parameter" });
    return;
  }

  const db = getDb();
  const moments = db
    .prepare(
      `SELECT * FROM event_key_moments WHERE event_id = ? ORDER BY display_order ASC`
    )
    .all(Number(eventId));

  res.json(moments);
});

// GET /api/key_moments_simple?event_id=:id (legacy compat)
keyMomentsRouter.get("/key_moments_simple", (req: Request, res: Response) => {
  const eventId = req.query.event_id;
  if (!eventId) {
    res.status(400).json({ error: "Missing event_id parameter" });
    return;
  }

  const db = getDb();
  const moments = db
    .prepare(
      `SELECT * FROM event_key_moments WHERE event_id = ? ORDER BY display_order ASC`
    )
    .all(Number(eventId));

  res.json(moments);
});

// PUT /api/event/:id/key-moments — bulk sync for an event's key moments.
// Body: { moments: Array<{ id?, year, title, short_description, full_description?, display_order }> }
// Rows absent from body are deleted; rows with id are updated; rows without id are inserted.
keyMomentsRouter.put("/event/:id/key-moments", (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const incoming = Array.isArray(req.body?.moments) ? req.body.moments : [];

  const db = getDb();

  const parent = db
    .prepare(`SELECT id FROM timeline_events WHERE id = ?`)
    .get(eventId);
  if (!parent) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const existing = db
    .prepare(`SELECT id FROM event_key_moments WHERE event_id = ?`)
    .all(eventId) as { id: number }[];
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set<number>(
    incoming
      .filter((m: { id?: number }) => typeof m.id === "number")
      .map((m: { id: number }) => m.id)
  );

  const deleteStmt = db.prepare(
    `DELETE FROM event_key_moments WHERE id = ? AND event_id = ?`
  );
  const updateStmt = db.prepare(
    `UPDATE event_key_moments
     SET year = ?, title = ?, short_description = ?, full_description = ?, display_order = ?
     WHERE id = ? AND event_id = ?`
  );
  const insertStmt = db.prepare(
    `INSERT INTO event_key_moments
       (event_id, year, title, short_description, full_description, display_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const syncTx = db.transaction(
    (rows: Array<Record<string, unknown>>) => {
      for (const existingId of existingIds) {
        if (!keptIds.has(existingId)) {
          deleteStmt.run(existingId, eventId);
        }
      }

      const savedIds: number[] = [];
      for (const row of rows) {
        const year = row.year != null ? Number(row.year) : null;
        const title = (row.title as string) ?? "";
        const shortDesc = (row.short_description as string) ?? "";
        const fullDesc = (row.full_description as string) ?? null;
        const order = Number(row.display_order) || 0;

        if (typeof row.id === "number" && existingIds.has(row.id)) {
          updateStmt.run(year, title, shortDesc, fullDesc, order, row.id, eventId);
          savedIds.push(row.id);
        } else {
          const result = insertStmt.run(eventId, year, title, shortDesc, fullDesc, order);
          savedIds.push(Number(result.lastInsertRowid));
        }
      }
      return savedIds;
    }
  );

  try {
    const savedIds = syncTx(incoming);
    res.json({ success: true, count: savedIds.length, ids: savedIds });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Failed to save key moments" });
  }
});
