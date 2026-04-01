import fs from "fs";
import path from "path";
import { Router, Request, Response } from "express";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRootDir = path.join(__dirname, "..", "..", "uploads");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

function ensureUploadDir(mediaType: "images" | "videos"): string {
  const dir = path.join(uploadsRootDir, mediaType);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeBaseName(fileName: string): string {
  const baseName = path.parse(fileName).name;
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const mediaType = file.mimetype.startsWith("video/") ? "videos" : "images";
    cb(null, ensureUploadDir(mediaType));
  },
  filename: (_req, file, cb) => {
    const safeBaseName = sanitizeBaseName(file.originalname);
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Unsupported file type"));
  },
});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/uploads",
  (req: Request, res: Response) => {
    upload.single("file")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Missing file upload" });
        return;
      }

      const mediaType = req.file.mimetype.startsWith("video/") ? "videos" : "images";
      const fileUrl = `/uploads/${mediaType}/${req.file.filename}`;

      res.status(201).json({
        url: fileUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    });
  }
);
