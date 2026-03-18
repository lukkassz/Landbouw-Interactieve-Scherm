import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const memoryScoresRouter = Router();

const MAX_LEADERBOARD = 10;

// GET /api/memory_scores — top 10 scores
memoryScoresRouter.get("/memory_scores", (_req: Request, res: Response) => {
  const db = getDb();
  const scores = db
    .prepare(
      `SELECT * FROM memory_scores ORDER BY moves ASC, time_seconds ASC LIMIT ?`
    )
    .all(MAX_LEADERBOARD);

  res.json(scores);
});

// POST /api/memory_scores — submit a score
memoryScoresRouter.post("/memory_scores", (req: Request, res: Response) => {
  const { player_name, moves, time_seconds } = req.body;

  if (!player_name || moves === undefined || time_seconds === undefined) {
    res.status(400).json({ error: "Missing required fields: player_name, moves, time_seconds" });
    return;
  }

  const db = getDb();
  const count = (
    db.prepare(`SELECT COUNT(*) as cnt FROM memory_scores`).get() as { cnt: number }
  ).cnt;

  if (count >= MAX_LEADERBOARD) {
    // Check if this score qualifies for leaderboard
    const worst = db
      .prepare(
        `SELECT id, moves, time_seconds FROM memory_scores ORDER BY moves DESC, time_seconds DESC LIMIT 1`
      )
      .get() as { id: number; moves: number; time_seconds: number } | undefined;

    if (worst && (moves > worst.moves || (moves === worst.moves && time_seconds >= worst.time_seconds))) {
      res.json({ message: "Score not high enough for leaderboard", qualified: false });
      return;
    }

    // Remove worst score to make room
    if (worst) {
      db.prepare(`DELETE FROM memory_scores WHERE id = ?`).run(worst.id);
    }
  }

  db.prepare(
    `INSERT INTO memory_scores (player_name, moves, time_seconds) VALUES (?, ?, ?)`
  ).run(player_name, moves, time_seconds);

  res.status(201).json({ message: "Score saved", qualified: true });
});
