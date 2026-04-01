import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { getDb } from "./database.js";
import { eventsRouter } from "./routes/events.js";
import { eventMediaRouter } from "./routes/eventMedia.js";
import { eventSectionsRouter } from "./routes/eventSections.js";
import { keyMomentsRouter } from "./routes/keyMoments.js";
import { memoryScoresRouter } from "./routes/memoryScores.js";
import { puzzleScoresRouter } from "./routes/puzzleScores.js";
import { quizQuestionsRouter } from "./routes/quizQuestions.js";
import { quizScoresRouter } from "./routes/quizScores.js";
import { puzzleImagesRouter } from "./routes/puzzleImages.js";
import { proxyImageRouter } from "./routes/proxyImage.js";
import { uploadsRouter } from "./routes/uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
getDb();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api", eventsRouter);
app.use("/api", eventMediaRouter);
app.use("/api", eventSectionsRouter);
app.use("/api", keyMomentsRouter);
app.use("/api", memoryScoresRouter);
app.use("/api", puzzleScoresRouter);
app.use("/api", quizQuestionsRouter);
app.use("/api", quizScoresRouter);
app.use("/api", puzzleImagesRouter);
app.use("/api", proxyImageRouter);
app.use("/api", uploadsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
