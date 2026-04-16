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

// GET /api/event/:id/quiz-questions — admin view (raw rows, no shuffle, reveals correct_answer).
// Used by the admin panel so editors see what they saved.
quizQuestionsRouter.get("/event/:id/quiz-questions", (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM quiz_questions WHERE event_id = ? ORDER BY id ASC`
    )
    .all(eventId) as Record<string, unknown>[];

  res.json(
    rows.map((q) => ({
      ...q,
      is_active: Boolean(q.is_active),
    }))
  );
});

// PUT /api/event/:id/quiz-questions — bulk sync for quiz questions.
// Body: { questions: Array<{ id?, question, image_url?, correct_answer, option_1..option_4, difficulty?, category? }> }
// Rows absent from body are deleted; rows with id are updated; rows without id are inserted.
quizQuestionsRouter.put("/event/:id/quiz-questions", (req: Request, res: Response) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const incoming = Array.isArray(req.body?.questions) ? req.body.questions : [];

  const db = getDb();

  const parent = db
    .prepare(`SELECT id FROM timeline_events WHERE id = ?`)
    .get(eventId);
  if (!parent) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const existing = db
    .prepare(`SELECT id FROM quiz_questions WHERE event_id = ?`)
    .all(eventId) as { id: number }[];
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set<number>(
    incoming
      .filter((q: { id?: number }) => typeof q.id === "number")
      .map((q: { id: number }) => q.id)
  );

  const deleteStmt = db.prepare(
    `DELETE FROM quiz_questions WHERE id = ? AND event_id = ?`
  );
  const updateStmt = db.prepare(
    `UPDATE quiz_questions
     SET question = ?, image_url = ?, correct_answer = ?,
         option_1 = ?, option_2 = ?, option_3 = ?, option_4 = ?,
         category = ?, difficulty = ?
     WHERE id = ? AND event_id = ?`
  );
  const insertStmt = db.prepare(
    `INSERT INTO quiz_questions
       (event_id, question, image_url, correct_answer,
        option_1, option_2, option_3, option_4,
        category, difficulty, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
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
        const question = (row.question as string) ?? "";
        const imageUrl = (row.image_url as string) ?? null;
        const correct = (row.correct_answer as string) ?? "";
        const opt1 = (row.option_1 as string) ?? "";
        const opt2 = (row.option_2 as string) ?? "";
        const opt3 = (row.option_3 as string) ?? "";
        const opt4 = (row.option_4 as string) ?? "";
        const category = (row.category as string) ?? null;
        const difficulty = (row.difficulty as string) ?? "easy";

        if (typeof row.id === "number" && existingIds.has(row.id)) {
          updateStmt.run(
            question, imageUrl, correct,
            opt1, opt2, opt3, opt4,
            category, difficulty,
            row.id, eventId
          );
          savedIds.push(row.id);
        } else {
          const result = insertStmt.run(
            eventId, question, imageUrl, correct,
            opt1, opt2, opt3, opt4,
            category, difficulty
          );
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
      .json({ error: err instanceof Error ? err.message : "Failed to save quiz questions" });
  }
});
