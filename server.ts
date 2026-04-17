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
  })); // CSP disabled to support Vite dev middleware inline scripts securely

  app.use(cors({
    origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL || "*" : "*",
    methods: ["GET"]
  }));

  // Scoring Formulas (Log Scales)
  function followersLogScale(followers: number): number {
    if (followers <= 0) return 0;
    const rawLog = Math.log10(followers + 1);
    const score = Math.pow(rawLog, 3.2) * 2.1;
    return Math.min(4000, Math.round(score * 100) / 100);
  }

  function postLogScale(count: number): number {
    if (count <= 0) return 0;
    const rawLog = Math.log10(count + 1);
    const score = Math.pow(rawLog, 2.8) * 1.2;
    return Math.min(50, Math.round(score * 100) / 100);
  }

  function ageLogScale(ageDays: number): number {
    if (ageDays <= 0) return 0;
    const rawLog = Math.log10(ageDays + 1);
    const score = Math.pow(rawLog, 2.5) * 5.5;
    return Math.min(100, Math.round(score * 100) / 100);
  }

  // API Routes
  app.get("/api/analyze", async (req, res) => {
    try {
      const parsedQuery = AnalyzeQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({ error: true, code: "INVALID_INPUT", message: parsedQuery.error.errors[0].message });
      }
      
      const { username } = parsedQuery.data;
      const cachedData = profileCache.get(username.toLowerCase());
      if (cachedData) return res.json({ ...cachedData, from_cache: true });

      // Default variables (Sandbox Fallback)
      let finalAvatarUrl = `https://unavatar.io/x/${username}`;
      let displayName = username;
      let bio = "An enigmatic digital presence.";
      let location = "The Internet";
      let followers = Math.floor(Math.random() * 5000);
      let following = Math.floor(Math.random() * 500);
      let tweetCount = Math.floor(Math.random() * 1000);
      let joinedDate = "January 2023";
      let verified = false;

      let avgLikes = 0;
      let avgReplies = 0;
      let engagementRate = 0.5;
      let niches: string[] = ["Creator", "Explorer", "Digital"];
      let scoreReasoning = "This profile shows consistent digital activity.";
      let contentQuality = 5;

      // API Grounding with Exponential Backoff / Retry
      async function fetchWithRetry(username: string, retries = 1, delay = 2000) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Search explicitly for the real, current Twitter/X profile @${username}. 
                  You must find and return the latest:
                  - Exact Follower count
                  - Exact Following count
                  - Bio
                  - Location
                  - Display Name
                  - Joined Date
                  - Verified status
                  - Total Tweet/Post Count
                  
                  Also, analyze recent activity for:
                  - Average likes per tweet
                  - 3-5 specific interest niches
                  - Aura summary (one sentence)
                  
                  Return ONLY a JSON object: 
                  {"followers": number, "following": number, "posts": number, "bio": "string", "location": "string", "displayName": "string", "joined": "string", "verified": boolean, "metrics": {"likes": number, "replies": number}, "niches": ["tag1", "tag2", "tag3"], "analysis": {"quality": number, "reasoning": "string"}}`
                }]
              }],
              tools: [{ googleSearch: {} }]
            })
          });

          if (response.status === 429 && retries > 0) {
            console.log(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(username, retries - 1, delay * 2);
          }
          return response;
        } catch (e) {
          console.error("Fetch implementation error:", e);
          throw e;
        }
      }

      // Gemini Search Grounding & Analysis
      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiResponse = await fetchWithRetry(username);
          
          if (geminiResponse.ok) {
            const result = await geminiResponse.json();
            const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (textContent) {
              console.log(`[Gemini Raw Output for @${username}]:`, textContent);
              
              // Robust JSON Extraction
              let cleanJson = textContent;
              const jsonMatch = textContent.match(/\{[\s\S]*\}/); // Regex to find the first JSON object
              if (jsonMatch) cleanJson = jsonMatch[0];
              
              try {
                const parsed = JSON.parse(cleanJson);
                console.log(`[Parsed Stats for @${username}]:`, { followers: parsed.followers, posts: parsed.posts });
                
                followers = parsed.followers ?? followers;
                following = parsed.following ?? following;
                tweetCount = parsed.posts ?? tweetCount;
                bio = parsed.bio ?? bio;
                location = parsed.location ?? location;
                displayName = parsed.displayName ?? displayName;
                joinedDate = parsed.joined ?? joinedDate;
                verified = !!parsed.verified;
                
                if (parsed.metrics) {
                  avgLikes = parsed.metrics.likes || 10;
                  avgReplies = parsed.metrics.replies || 2;
                  const totalEng = avgLikes + avgReplies;
                  engagementRate = followers > 0 ? parseFloat(((totalEng / followers) * 100).toFixed(2)) : 0.5;
                }
                
                if (parsed.niches) niches = parsed.niches.slice(0, 5);
                if (parsed.analysis) {
                  contentQuality = parsed.analysis.quality || 5;
                  scoreReasoning = parsed.analysis.reasoning || scoreReasoning;
                }
              } catch (e) { 
                console.error("JSON Parse Error for @${username}. Raw content was:", cleanJson); 
              }
            }
          } else if (geminiResponse.status === 429) {
            return res.status(429).json({ error: true, code: "RATE_LIMITED", message: "Intelligence engines are cooling down. Please wait a minute." });
          }
        } catch (error) { console.error("Gemini Error:", error); }
      }

      // Calculate Scores
      const ageDays = Math.max(1, Math.floor((Date.now() - new Date(joinedDate).getTime()) / (1000 * 60 * 60 * 24)));
      const ageScore = ageLogScale(ageDays);
      const followerScore = followersLogScale(followers);
      const postScore = postLogScale(tweetCount);
      
      const ratio = following > 0 ? followers / following : followers;
      let ratioScore = ratio < 0.5 ? 5 : ratio < 1 ? 15 : ratio < 3 ? 30 : ratio < 10 ? 40 : 50;

      let rawTotal = 50 + followerScore + ratioScore + postScore + ageScore;
      if (verified) rawTotal *= 1.05;
      const totalScore = Math.min(9999, Math.max(0, Math.round(rawTotal)));

      // Detailed Breakdown (0-25 per category)
      let authenticity = 5;
      if (!finalAvatarUrl.includes("default")) authenticity += 5;
      if (bio.length > 5) authenticity += 5;
      if (ageDays > 365) authenticity += 5;
      if (!/\d/.test(username)) authenticity += 5;

      const value = Math.min(25, 10 + contentQuality * 1.5);
      
      let influence = (followers >= 1000 ? 10 : followers >= 100 ? 5 : 2) + 
                      (ratio > 3 ? 5 : ratio > 1 ? 3 : 1) + 
                      (verified ? 10 : 0);
      influence = Math.min(25, influence);

      const activity = Math.min(25, 10 + (tweetCount / Math.max(ageDays, 1)) * 5);

      const responseData = {
        username,
        profile: { 
          display_name: displayName || username, 
          bio: bio || "", 
          location: location || "", 
          avatar_url: finalAvatarUrl, 
          followers: Number(followers) || 0, 
          following: Number(following) || 0, 
          tweet_count: Number(tweetCount) || 0, 
          joined: joinedDate || "", 
          verified 
        },
        engagement: { 
          average_likes: Number(avgLikes) || 0, 
          average_comments: Number(avgReplies) || 0, 
          engagement_rate: Number(engagementRate) || 0 
        },
        card2_score: totalScore || 0,
        breakdown: { authenticity, value, influence, activity },
        niches: niches || [],
        score_reasoning: scoreReasoning || "",
        from_cache: false,
        scored_at: new Date().toISOString()
      };

      profileCache.set(username.toLowerCase(), responseData);
      return res.json(responseData);

    } catch (topLevelError) {
      console.error("[Fatal API Error]", topLevelError);
      return res.status(500).json({ error: true, code: "INTERNAL_SERVER_ERROR", message: "An anomaly occurred during analysis." });
    }
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
    console.log(`Server strictly enforcing domain logic on port: ${PORT}`);
  });
}

startServer();
