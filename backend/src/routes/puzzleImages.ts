import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const puzzleImagesRouter = Router();

// GET /api/puzzle-images — get all events that have puzzle images
puzzleImagesRouter.get("/puzzle-images", (_req: Request, res: Response) => {
  const db = getDb();
  const images = db
    .prepare(
      `SELECT id, title, puzzle_image_url FROM timeline_events
       WHERE is_active = 1 AND puzzle_image_url IS NOT NULL AND puzzle_image_url != ''`
    )
    .all();

  res.json(images);
});

// GET /api/puzzle_image_direct?filename=:name — resolve puzzle image URL
puzzleImagesRouter.get("/puzzle_image_direct", (req: Request, res: Response) => {
  const { filename } = req.query;
  if (!filename) {
    res.status(400).json({ error: "Missing filename parameter" });
    return;
  }

  // Return the URL to the uploads directory
  res.json({ url: `/uploads/${filename}` });
});
