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
