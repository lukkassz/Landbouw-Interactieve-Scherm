import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const eventMediaRouter = Router();

// GET /api/event/:id/media
eventMediaRouter.get("/event/:id/media", (req: Request, res: Response) => {
  const db = getDb();
  const media = db
    .prepare(
      `SELECT * FROM event_media WHERE event_id = ? ORDER BY display_order ASC`
    )
    .all(Number(req.params.id));

  res.json(media);
});

// GET /api/event_media_direct?event_id=:id (legacy compat)
eventMediaRouter.get("/event_media_direct", (req: Request, res: Response) => {
  const eventId = req.query.event_id;
  if (!eventId) {
    res.status(400).json({ error: "Missing event_id parameter" });
    return;
  }

  const db = getDb();
  const media = db
    .prepare(
      `SELECT * FROM event_media WHERE event_id = ? ORDER BY display_order ASC`
    )
    .all(Number(eventId));

  res.json(media);
});
