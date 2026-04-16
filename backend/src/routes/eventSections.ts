import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const eventSectionsRouter = Router();

// GET /api/event/:id/sections
eventSectionsRouter.get("/event/:id/sections", (req: Request, res: Response) => {
  const db = getDb();
  const sections = db
    .prepare(
      `SELECT * FROM event_sections WHERE event_id = ? ORDER BY section_order ASC`
    )
    .all(Number(req.params.id)) as Record<string, unknown>[];

  const enriched = sections.map((s) => ({
    ...s,
    has_border: Boolean(s.has_border),
  }));

  res.json(enriched);
});

// GET /api/event_sections_direct?event_id=:id (legacy compat)
eventSectionsRouter.get("/event_sections_direct", (req: Request, res: Response) => {
  const eventId = req.query.event_id;
  if (!eventId) {
    res.status(400).json({ error: "Missing event_id parameter" });
    return;
  }

  const db = getDb();
  const sections = db
    .prepare(
      `SELECT * FROM event_sections WHERE event_id = ? ORDER BY section_order ASC`
    )
    .all(Number(eventId)) as Record<string, unknown>[];

  const enriched = sections.map((s) => ({
    ...s,
    has_border: Boolean(s.has_border),
  }));

  res.json(enriched);
});

// PUT /api/event/:id/sections — bulk sync (replace-and-reconcile) for an event.
// Body: { sections: Array<{ id?, section_title, section_content, section_order, has_border? }> }
// Rows absent from body are deleted; rows with id are updated; rows without id are inserted.
// Entire operation is atomic via better-sqlite3 transaction.
eventSectionsRouter.put("/event/:id/sections", (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const incoming = Array.isArray(req.body?.sections) ? req.body.sections : [];

  const db = getDb();

  // Make sure the parent event exists — otherwise FK constraint will fail anyway,
  // but returning 404 up front is more helpful for the admin UI.
  const parent = db
    .prepare(`SELECT id FROM timeline_events WHERE id = ?`)
    .get(eventId);
  if (!parent) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const existing = db
    .prepare(`SELECT id FROM event_sections WHERE event_id = ?`)
    .all(eventId) as { id: number }[];
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set<number>(
    incoming
      .filter((s: { id?: number }) => typeof s.id === "number")
      .map((s: { id: number }) => s.id)
  );

  const deleteStmt = db.prepare(
    `DELETE FROM event_sections WHERE id = ? AND event_id = ?`
  );
  const updateStmt = db.prepare(
    `UPDATE event_sections
     SET section_title = ?, section_content = ?, section_order = ?, has_border = ?
     WHERE id = ? AND event_id = ?`
  );
  const insertStmt = db.prepare(
    `INSERT INTO event_sections
       (event_id, section_title, section_content, section_order, has_border)
     VALUES (?, ?, ?, ?, ?)`
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
        const title = (row.section_title as string) ?? "";
        const content = (row.section_content as string) ?? "";
        const order = Number(row.section_order) || 0;
        const border = row.has_border ? 1 : 0;

        if (typeof row.id === "number" && existingIds.has(row.id)) {
          updateStmt.run(title, content, order, border, row.id, eventId);
          savedIds.push(row.id);
        } else {
          const result = insertStmt.run(eventId, title, content, order, border);
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
      .json({ error: err instanceof Error ? err.message : "Failed to save sections" });
  }
});
