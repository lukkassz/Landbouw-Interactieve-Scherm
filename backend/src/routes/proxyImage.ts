import { Router, Request, Response } from "express";

export const proxyImageRouter = Router();

// GET /api/proxy_image?url=:encodedUrl — CORS image proxy
proxyImageRouter.get("/proxy_image", async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  try {
    // Validate URL to prevent SSRF
    const parsed = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      res.status(400).json({ error: "Invalid URL protocol" });
      return;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch image" });
      return;
    }

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(500).json({ error: "Failed to proxy image" });
  }
});
