import { GoogleGenAI, Type } from '@google/genai';

export type ProfileData = {
  username: string;
  avatar: string;
  likes: string;
  comments: string;
  engagementRate: string;
  score: number;
  archetypes: { label: string; width: string }[];
  niches: string[];
};

export async function analyzeProfile(username: string): Promise<ProfileData> {
  // First attempt to grab EXACT true stats from an open syndication API
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}`);
    const json = await res.json();
    
    if (json.code === 200 && json.user) {
      const u = json.user;
      return generateRealProfile(u);
    }
  } catch (e) {
    console.warn("Real stats API failed (possible CORS/Rate Limit) - falling back to GenAI/Seeded", e);
  }

  // Fallback 1: Gemini AI if Key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are evaluating the X/Twitter profile for @${username}. First, use Google Search to look up their current Twitter stats, follower counts, and recent tweets to base your evaluation on real data! Generate a fun, somewhat satirical 'Broz Score' and profile stats based on their actual online presence. Provide highly realistic-looking stats based on your search insights. The score should be an integer between 1 and 100. Provide 4 archetypes (e.g., 'Reply Guy', 'Thought Leader') with a percentage width (e.g. '85%'). Provide 4 distinct niche hashtags (e.g., '#Crypto', '#TechBro').`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              likes: { type: Type.STRING, description: "e.g. '45', '1.2K'" },
              comments: { type: Type.STRING, description: "e.g. '12', '300'" },
              engagementRate: { type: Type.STRING, description: "e.g. '5.4%'" },
              score: { type: Type.INTEGER, description: "0 to 100" },
              archetypes: {
                type: Type.ARRAY,
                description: "Exactly 4 items",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    width: { type: Type.STRING }
                  }
                }
              },
              niches: {
                type: Type.ARRAY,
                description: "Exactly 4 hashtag strings",
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        return {
          username,
          avatar: `https://unavatar.io/twitter/${username}`,
          likes: data.likes || "0",
          comments: data.comments || "0",
          engagementRate: data.engagementRate || "0%",
          score: data.score || 0,
          archetypes: Array.isArray(data.archetypes) && data.archetypes.length === 4 
            ? data.archetypes 
            : [
                { label: "Creator", width: "85%" },
                { label: "Storyteller", width: "40%" },
                { label: "Promoter", width: "65%" },
                { label: "Reply Guy", width: "75%" }
              ],
          niches: Array.isArray(data.niches) && data.niches.length === 4
            ? data.niches
            : ["#Opinion Leader", "#Educational Explainer", "#Project Promotion", "#Personal Reflection"]
        };
      }
    } catch (error: any) {
      console.error("Gemini AI failed:", error);
    }
  }

  // Fallback 2: Algorithmic Seeded
  return getFallbackData(username);
}

function generateRealProfile(user: any): ProfileData {
  const followers = user.followers || 0;
  const following = user.following || 1;
  const tweets = user.tweets || 0;
  
  const score = Math.min(100, Math.floor((followers / (following + 1)) * 10 + (followers > 10000 ? 50 : 0)));
  const formatNumber = (num: number) => num > 1000000 ? (num/1000000).toFixed(1) + "M" : num > 1000 ? (num/1000).toFixed(1) + "K" : num.toString();

  const rawAvatar = user.avatar_url || `https://unavatar.io/twitter/${user.screen_name}`;
  const hdAvatar = rawAvatar.replace('_normal', '_400x400');

  return {
    username: user.screen_name,
    avatar: hdAvatar,
    likes: formatNumber(Math.floor(followers * 0.05)) + " est",
    comments: formatNumber(Math.floor(followers * 0.005)) + " est",
    engagementRate: ((followers > 0 ? (tweets / followers) : 0) * 10).toFixed(1) + "%",
    score: score > 100 ? 99 : score === 0 ? 15 : score,
    archetypes: [
      { label: "Followers", width: Math.min(100, Math.max(10, (followers / 5000) * 100)) + "%" },
      { label: "Following", width: Math.min(100, Math.max(10, (following / 1000) * 100)) + "%" },
      { label: "Tweets", width: Math.min(100, Math.max(10, (tweets / 5000) * 100)) + "%" },
      { label: "Ratio", width: Math.min(100, Math.max(20, (followers/(following+1))*5)) + "%" }
    ],
    niches: generateTags(user.screen_name, user.description, user.verified, followers)
  };
}

function generateTags(username: string, bio: string, verified: boolean, followers: number): string[] {
  const tags = new Set<string>();
  
  // 1. Literal extraction from authentic bio
  if (bio) {
    const rawWords = bio.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/);
    const ignoreList = ['about', 'there', 'their', 'which', 'where', 'because', 'other', 'these', 'would', 'could', 'should', 'https', 'email', 'contact', 'business'];
    const goodWords = rawWords.filter(w => w.length > 4 && !ignoreList.includes(w.toLowerCase()));
    
    // add up to 2 unique bio words as tags
    for (const w of goodWords) {
      if (tags.size < 2) tags.add("#" + w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
  }
  
  // 2. Real metrics flags
  if (verified && tags.size < 3) tags.add("#Verified");
  if (followers > 50000 && tags.size < 4) tags.add("#Influencer");

  // 3. Deterministic Seed if we still need tags
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  const seeded = (s: number) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  
  const pool = ["#Founder", "#Creative", "#TechBro", "#Degen", "#Solopreneur", "#Visionary", "#Analyst", "#Web3", "#Creator", "#ReplyGuy", "#Invest"];
  let offset = 0;
  while (tags.size < 4) {
    tags.add(pool[Math.floor(seeded(hash + offset) * pool.length)]);
    offset++;
  }

  return Array.from(tags).slice(0, 4);
}

function getFallbackData(username: string): ProfileData {
  // Simple deterministic hash based on username
  let hash = 0;
  const normalized = username.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Seeded random number generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const seed1 = seededRandom(hash);
  const seed2 = seededRandom(hash + 1);
  const seed3 = seededRandom(hash + 2);

  // Generate deterministic but dynamic looking numbers
  const mockScore = Math.floor(seed1 * 100);
  const mockLikes = (Math.floor(seed2 * 500) / 10).toFixed(1) + "K";
  const mockComments = Math.floor(seed3 * 800) + " avg";
  const mockEng = (seededRandom(hash + 3) * 20).toFixed(1) + "%";

  const allNiches = [
    "#Opinion Leader", "#Educational Explainer", "#Project Promotion", "#Personal Reflection", 
    "#TechBro", "#CryptoWhale", "#Web3Builder", "#FitnessGuru", 
    "#DesignThinker", "#StartupFounder", "#VentureCap", "#AIEthics", "#Shitposter"
  ];
  
  // Scramble and pick 4 unique niche tags deterministically
  const shuffledNiches = [...allNiches].sort((a, b) => seededRandom(hash + a.length) - 0.5);
  const uniqueNiches = shuffledNiches.slice(0, 4);

  const allArchetypes = ["Creator", "Storyteller", "Promoter", "Reply Guy", "Visionary", "Troll", "Lurker", "Analyst"];
  const shuffledArchetypes = [...allArchetypes].sort((a, b) => seededRandom(hash * b.length) - 0.5);
  
  return {
    username,
    avatar: `https://unavatar.io/twitter/${username}`,
    likes: mockLikes,
    comments: mockComments,
    engagementRate: mockEng,
    score: mockScore,
    archetypes: [
      { label: shuffledArchetypes[0], width: Math.floor(seededRandom(hash + 8) * 80 + 20) + "%" },
      { label: shuffledArchetypes[1], width: Math.floor(seededRandom(hash + 9) * 80 + 20) + "%" },
      { label: shuffledArchetypes[2], width: Math.floor(seededRandom(hash + 10) * 80 + 20) + "%" },
      { label: shuffledArchetypes[3], width: Math.floor(seededRandom(hash + 11) * 80 + 20) + "%" }
    ],
    niches: uniqueNiches
  };
}
