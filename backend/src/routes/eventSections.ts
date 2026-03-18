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
