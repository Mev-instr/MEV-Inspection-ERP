import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits to support large file uploads via JSON base64 safely
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Image Proxy route to bypass CORS for Firebase Storage or other public URLs
  app.get("/api/proxy-image", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).send("Missing target url parameter");
      return;
    }

    try {
      console.log(`Server proxy fetching: ${targetUrl}`);
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        console.error(`Remote fetch failed with status: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch from remote: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      // Allow browser and print systems to cache this asset
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Use node-fetch style response handling if available, otherwise arrayBuffer
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error: any) {
      console.error(`Proxy fallback fetch failed for url: ${targetUrl}`, error);
      res.status(500).send(`Proxy fetch failed: ${error.message}`);
    }
  });

  // API healthcheck route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
