
export interface RapidTweet {
  text: string;
  likes: number;
  replies: number;
  reposts: number;
  createdAt: string;
  type: "original";
}

export async function fetchTweetsFromRapidAPI(username: string): Promise<RapidTweet[] | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error("[RapidAPI] Missing RAPIDAPI_KEY");
    return null;
  }

  try {
    console.log(`[RapidAPI] Fetching tweets for ${username}`);
    const response = await fetch(`https://twitter241.p.rapidapi.com/user-tweets?username=${username}&count=20`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`[RapidAPI] Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    const tweets: RapidTweet[] = [];
    const instructions = data?.result?.timeline?.instructions || [];
    
    for (const instruction of instructions) {
      if (instruction.type === "TimelineAddEntries") {
        const entries = instruction.entries || [];
        
        for (const entry of entries) {
          // Check for tweet content in the specified nested structure
          const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
          
          if (tweetResult && tweetResult.legacy) {
            const legacy = tweetResult.legacy;
            
            // Skip if it's an ad or missing essential text
            if (!legacy.full_text) continue;

            tweets.push({
              text: legacy.full_text,
              likes: legacy.favorite_count || 0,
              replies: legacy.reply_count || 0,
              reposts: legacy.retweet_count || 0,
              createdAt: legacy.created_at || new Date().toISOString(),
              type: "original"
            });
          }

          if (tweets.length >= 20) break;
        }
      }
      if (tweets.length >= 20) break;
    }

    console.log(`[RapidAPI] Extracted Tweets: ${tweets.length}`);
    return tweets.length > 0 ? tweets : null;
  } catch (error) {
    console.error("[RapidAPI] Exception:", error);
    return null;
  }
}
