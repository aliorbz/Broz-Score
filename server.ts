import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { z } from "zod";
import { LRUCache } from "lru-cache";

dotenv.config();

// Global LRU Cache Instance - Max 500 users, 24-Hour TTL
const profileCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 60 * 24, 
});

// Zod Schema for strict input validation
const AnalyzeQuerySchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .max(20, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must only contain letters, numbers, and underscores"),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
    origin: "*",
    methods: ["GET"]
  }));

  // Normalized Scoring Model Components
  function calculateFollowerComponent(followers: number): number {
    if (followers <= 0) return 0;
    const log = Math.log10(followers);
    const score = (log / 8) * 40; // 100M = 40pts
    return Math.min(40, Math.max(2, score));
  }

  function calculatePostComponent(count: number): number {
    if (count <= 0) return 0;
    const log = Math.log10(count);
    const score = (log / 5) * 15; // 100k = 15pts
    return Math.min(15, Math.max(1, score));
  }

  function calculateAgeComponent(joinedDate: string): { score: number, days: number } {
    try {
      let date = new Date(joinedDate);
      if (isNaN(date.getTime())) {
        const yearMatch = joinedDate.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0]) : 2022;
        date = new Date(`${year}-01-01`);
      }
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const ageYears = days / 365;
      const score = Math.min(15, Math.max(1, (ageYears / 15) * 15));
      return { score, days: Math.max(1, days) };
    } catch (e) { return { score: 5, days: 365 }; }
  }

  function calculateEngagementComponent(rate: number): number {
    if (rate <= 0) return 2;
    const score = Math.max(0, Math.log10(rate * 100 + 1) * 12); // ~5% = 30pts
    return Math.min(30, score);
  }

  // API Fetch with Grounding
  async function fetchWithRetry(username: string, retries = 1, delay = 2000) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Search for the real Twitter profile @${username}. Return EXACT: followers, following, posts, bio, location, displayName, joined, verified status. Also analyze for metrics: likes, replies (averages), niches (3-5), and content quality (1-10). Return ONLY JSON: {"followers": number, "following": number, "posts": number, "bio": "string", "location": "string", "displayName": "string", "joined": "string", "verified": boolean, "metrics": {"likes": number, "replies": number}, "niches": ["tag1", "tag2"], "analysis": {"quality": number, "reasoning": "string"}}`
            }]
          }],
          tools: [{ googleSearch: {} }]
        })
      });

      if (response.status === 429 && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(username, retries - 1, delay * 2);
      }
      return response;
    } catch (e) { throw e; }
  }

  app.get("/api/analyze", async (req, res) => {
    try {
      const parsedQuery = AnalyzeQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) return res.status(400).json({ error: true, message: "Invalid input" });
      
      const { username } = parsedQuery.data;
      const cached = profileCache.get(username.toLowerCase());
      if (cached) return res.json({ ...cached, from_cache: true });

      let followers = 0, following = 0, tweetCount = 0, verified = false;
      let displayName = username, bio = "", location = "", joinedDate = "2023-01-01";
      let avgLikes = 0, avgReplies = 0, engagementRate = 1.0, quality = 5, reasoning = "", niches = ["Digital"];

      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiRes = await fetchWithRetry(username);
          if (geminiRes.ok) {
            const result = await geminiRes.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
              followers = Number(data.followers) || 0;
              following = Number(data.following) || 0;
              tweetCount = Number(data.posts) || 0;
              verified = !!data.verified;
              displayName = data.displayName || username;
              bio = data.bio || "";
              location = data.location || "";
              joinedDate = data.joined || "2023-01-01";
              if (data.metrics) {
                avgLikes = Number(data.metrics.likes) || 0;
                avgReplies = Number(data.metrics.replies) || 0;
                engagementRate = followers > 0 ? ((avgLikes + avgReplies) / followers) * 100 : 1.0;
              }
              if (data.niches) niches = data.niches.slice(0, 5);
              if (data.analysis) {
                quality = data.analysis.quality || 5;
                reasoning = data.analysis.reasoning || "";
              }
            }
          } else if (geminiRes.status === 429) {
            return res.status(429).json({ error: true, message: "Engines cooling down..." });
          }
        } catch (e) { console.error("Gemini failed"); }
      }

      const reach = calculateFollowerComponent(followers);
      const activityScore = calculatePostComponent(tweetCount);
      const { score: ageScore, days: ageDays } = calculateAgeComponent(joinedDate);
      const impact = calculateEngagementComponent(engagementRate);
      
      let total = reach + activityScore + ageScore + impact;
      if (verified) total += 5;
      const finalScore = Math.min(100, Math.max(1, Math.round(total)));
      const ratio = following > 0 ? followers / following : followers;

      // Breakdown calculations
      const authenticity = Math.min(25, 10 + (verified ? 10 : 0) + (bio ? 5 : 0));
      const value = Math.min(25, 5 + quality * 2);
      const influence = Math.min(25, (reach / 40) * 25);
      const activity = Math.min(25, (activityScore / 15) * 10 + (ageScore / 15) * 15);

      const response = {
        username,
        profile: { display_name: displayName, bio, location, avatar_url: `https://unavatar.io/x/${username}`, followers, following, tweet_count: tweetCount, joined: joinedDate, verified },
        engagement: { average_likes: avgLikes, average_comments: avgReplies, engagement_rate: engagementRate },
        card2_score: finalScore,
        breakdown: { authenticity, value, influence, activity },
        niches,
        score_reasoning: reasoning,
        from_cache: false,
        scored_at: new Date().toISOString()
      };

      profileCache.set(username.toLowerCase(), response);
      return res.json(response);
    } catch (e) {
      return res.status(500).json({ error: true, message: "Anomaly detected" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server on :${PORT}`));
}

startServer();
