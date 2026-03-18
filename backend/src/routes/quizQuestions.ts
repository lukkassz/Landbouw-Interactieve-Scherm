import { Router, Request, Response } from "express";
import { getDb } from "../database.js";

export const quizQuestionsRouter = Router();

// GET /api/quiz_questions — get questions (optional ?event_id)
quizQuestionsRouter.get("/quiz_questions", (req: Request, res: Response) => {
  const db = getDb();
  const { event_id } = req.query;

  let questions;
  if (event_id) {
    questions = db
      .prepare(
        `SELECT * FROM quiz_questions WHERE is_active = 1 AND event_id = ? ORDER BY RANDOM()`
      )
      .all(Number(event_id));
  } else {
    questions = db
      .prepare(`SELECT * FROM quiz_questions WHERE is_active = 1 ORDER BY RANDOM()`)
      .all();
  }

  // Shuffle options for each question
  const shuffled = (questions as Record<string, unknown>[]).map((q) => {
    const options = [q.option_1, q.option_2, q.option_3, q.option_4].sort(
      () => Math.random() - 0.5
    );
    return {
      ...q,
      is_active: Boolean(q.is_active),
      options,
    };
  });

  res.json(shuffled);
});
