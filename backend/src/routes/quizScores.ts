import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const quizScoresRouter = Router();

const MAX_LEADERBOARD = 10;

// GET /api/quiz_scores — leaderboard (optional ?event_id, ?difficulty, ?limit)
quizScoresRouter.get("/quiz_scores", (req: Request, res: Response) => {
  const db = getDb();
  const { event_id, difficulty, limit } = req.query;
  const maxResults = limit ? Number(limit) : MAX_LEADERBOARD;

  let sql = `SELECT * FROM quiz_scores WHERE 1=1`;
  const params: unknown[] = [];

  if (event_id) {
    sql += ` AND event_id = ?`;
    params.push(Number(event_id));
  }

  if (difficulty) {
    sql += ` AND difficulty = ?`;
    params.push(String(difficulty));
  }

  sql += ` ORDER BY percentage DESC, score DESC LIMIT ?`;
  params.push(maxResults);

  const scores = db.prepare(sql).all(...params);
  res.json(scores);
});

// POST /api/quiz_scores — submit a score
quizScoresRouter.post("/quiz_scores", (req: Request, res: Response) => {
  const { player_name, score, total_questions, event_id, difficulty } = req.body;

  if (!player_name || score === undefined || !total_questions) {
    res.status(400).json({
      error: "Missing required fields: player_name, score, total_questions",
    });
    return;
  }

  const percentage = Math.round((score / total_questions) * 100);
  const db = getDb();

  // Build filter for this specific leaderboard context
  let countSql = `SELECT COUNT(*) as cnt FROM quiz_scores WHERE 1=1`;
  const countParams: unknown[] = [];

  if (event_id) {
    countSql += ` AND event_id = ?`;
    countParams.push(event_id);
  }
  if (difficulty) {
    countSql += ` AND difficulty = ?`;
    countParams.push(difficulty);
  }

  const count = (db.prepare(countSql).get(...countParams) as { cnt: number }).cnt;

  if (count >= MAX_LEADERBOARD) {
    let worstSql = `SELECT id, percentage FROM quiz_scores WHERE 1=1`;
    const worstParams: unknown[] = [];

    if (event_id) {
      worstSql += ` AND event_id = ?`;
      worstParams.push(event_id);
    }
    if (difficulty) {
      worstSql += ` AND difficulty = ?`;
      worstParams.push(difficulty);
    }

    worstSql += ` ORDER BY percentage ASC, score ASC LIMIT 1`;
    const worst = db.prepare(worstSql).get(...worstParams) as
      | { id: number; percentage: number }
      | undefined;

    if (worst && percentage <= worst.percentage) {
      res.json({ message: "Score not high enough for leaderboard", qualified: false });
      return;
    }

    if (worst) {
      db.prepare(`DELETE FROM quiz_scores WHERE id = ?`).run(worst.id);
    }
  }

  db.prepare(
    `INSERT INTO quiz_scores (player_name, score, total_questions, percentage, event_id, difficulty) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(player_name, score, total_questions, percentage, event_id || null, difficulty || null);

  res.status(201).json({ message: "Score saved", qualified: true });
});
