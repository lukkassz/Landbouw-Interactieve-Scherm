import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const puzzleScoresRouter = Router();

const MAX_LEADERBOARD = 10;

// GET /api/puzzle_scores — top 10 scores (optional ?difficulty=easy|hard)
puzzleScoresRouter.get("/puzzle_scores", (req: Request, res: Response) => {
  const db = getDb();
  const { difficulty } = req.query;

  let scores;
  if (difficulty) {
    scores = db
      .prepare(
        `SELECT * FROM puzzle_scores WHERE difficulty = ? ORDER BY moves ASC LIMIT ?`
      )
      .all(String(difficulty), MAX_LEADERBOARD);
  } else {
    scores = db
      .prepare(`SELECT * FROM puzzle_scores ORDER BY moves ASC LIMIT ?`)
      .all(MAX_LEADERBOARD);
  }

  res.json(scores);
});

// POST /api/puzzle_scores — submit a score
puzzleScoresRouter.post("/puzzle_scores", (req: Request, res: Response) => {
  const { player_name, moves, difficulty } = req.body;

  if (!player_name || moves === undefined) {
    res.status(400).json({ error: "Missing required fields: player_name, moves" });
    return;
  }

  const diff = difficulty || "easy";
  const db = getDb();

  const count = (
    db.prepare(`SELECT COUNT(*) as cnt FROM puzzle_scores WHERE difficulty = ?`).get(diff) as { cnt: number }
  ).cnt;

  if (count >= MAX_LEADERBOARD) {
    const worst = db
      .prepare(
        `SELECT id, moves FROM puzzle_scores WHERE difficulty = ? ORDER BY moves DESC LIMIT 1`
      )
      .get(diff) as { id: number; moves: number } | undefined;

    if (worst && moves >= worst.moves) {
      res.json({ message: "Score not high enough for leaderboard", qualified: false });
      return;
    }

    if (worst) {
      db.prepare(`DELETE FROM puzzle_scores WHERE id = ?`).run(worst.id);
    }
  }

  db.prepare(
    `INSERT INTO puzzle_scores (player_name, moves, difficulty) VALUES (?, ?, ?)`
  ).run(player_name, moves, diff);

  res.status(201).json({ message: "Score saved", qualified: true });
});
