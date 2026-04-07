import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const username = (req.query.username as string) || "exampleuser";
  
  try {
    // For now, return mock/calculated JSON only as requested
    const dataSource: "real" | "mock" = "mock";
    const scrapedTweetCount = 0;
    const followersSource: "scraped" | "fallback" = "fallback";
    const avatarSource: "scraped" | "fallback" = "fallback";
    
    // Fallback to mock data generation
    const tweetTypes: ("original" | "reply" | "repost")[] = ["original", "reply", "repost"];
    const tweetsToAnalyze = Array.from({ length: 20 }).map((_, i) => {
      const type = tweetTypes[Math.floor(Math.random() * tweetTypes.length)];
      return {
        text: `Mock tweet ${i} content for ${username}. Discussing tech, AI, and productivity.`,
        likes: Math.floor(Math.random() * 100),
        replies: Math.floor(Math.random() * 50),
        reposts: Math.floor(Math.random() * 30),
        type,
        createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
      };
    });

    // Calculations
    const totalLikes = tweetsToAnalyze.reduce((sum, t) => sum + t.likes, 0);
    const totalReplies = tweetsToAnalyze.reduce((sum, t) => sum + t.replies, 0);
    const totalReposts = tweetsToAnalyze.reduce((sum, t) => sum + t.reposts, 0);
    const numTweets = tweetsToAnalyze.length;

    const avgLikes = Math.round(totalLikes / numTweets);
    const avgReplies = Math.round(totalReplies / numTweets);
    const totalEngagement = totalLikes + totalReplies + totalReposts;
    const engagementRate = parseFloat(((totalEngagement / numTweets) / 5).toFixed(1));

    const originalTweets = tweetsToAnalyze.filter(t => t.type === "original").length;
    const authenticity = Math.min(100, Math.round((originalTweets / numTweets) * 100 + 20));
    const value = Math.min(100, Math.round((totalReposts / numTweets) * 3 + 40));
    const influence = Math.min(100, Math.round((totalEngagement / 100) + 30));
    const activity = Math.min(100, Math.round(80 + Math.random() * 15));

    const score = Math.round((authenticity + value + influence + activity) / 4);

    // Generate niche using Groq
    let niche = ["Creator", "Educator", "Analyst", "Promoter"]; // Default fallback
    let groqError: string | null = null;
    
    if (process.env.GROQ_API_KEY) {
      try {
        const tweetTexts = tweetsToAnalyze.map(t => t.text).join("\n");
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a social media analyst. Based ONLY on the provided tweet texts, return 4 or 5 one-word labels that describe the user's niche or profile type.
              
Rules:
- Do not infer technical, crypto, or educational identity unless clearly supported by the text.
- If the tweets are too weak, short, or generic, return broad safe labels instead.
- Labels must stay strictly grounded in visible content.
- Avoid overconfident niche guesses.
- Valid broad labels include: Creator, Influencer, Athlete, Entertainer, PublicFigure, Promoter, Commentator, Personality.

Return ONLY the labels separated by commas, no other text.`
            },
            {
              role: "user",
              content: `Analyze these tweets for user ${username}:\n\n${tweetTexts}`
            }
          ],
          model: "llama-3.3-70b-versatile",
        });

        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          const labels = responseText.split(",").map(s => s.trim().replace(/[.]/g, "")).filter(s => s.length > 0);
          if (labels.length >= 3) {
            niche = labels.slice(0, 5);
          }
        }
      } catch (error) {
        console.error("Groq API error:", error);
        groqError = error instanceof Error ? error.message : String(error);
      }
    }

    const finalAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // Final response
    const responseData = {
      username: username,
      avatarUrl: finalAvatarUrl,
      score,
      stats: {
        avgLikes,
        avgReplies,
        engagementRate
      },
      bars: {
        authenticity,
        value,
        influence,
        activity
      },
      niche,
      debug: {
        dataSource,
        scrapedTweetCount,
        followersSource,
        avatarSource,
        profileLoaded: false,
        avatarFound: false,
        followersFound: false,
        timelineFound: false,
        loginWallDetected: false,
        scrapeFailureReason: "Scraping disabled for Vercel deployment verification",
        error: null,
        groqError
      }
    };

    res.status(200).json(responseData);
  } catch (topLevelError) {
    console.error("[Top-level API Error]", topLevelError);
    const emergencyFallback = {
      username: username,
      score: 50,
      stats: {
        avgLikes: 0,
        avgReplies: 0,
        engagementRate: 0
      },
      bars: {
        authenticity: 50,
        value: 50,
        influence: 50,
        activity: 50
      },
      niche: ["Creator", "Influencer", "PublicFigure", "Personality"],
      avatarUrl: null,
      debug: {
        dataSource: "mock",
        scrapedTweetCount: 0,
        followersSource: "fallback",
        avatarSource: "fallback",
        error: "top-level fallback triggered",
        exception: topLevelError instanceof Error ? topLevelError.message : String(topLevelError)
      }
    };
    res.status(200).json(emergencyFallback);
  }
}
