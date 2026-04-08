import { useState, useEffect, useRef, FormEvent, FC, MouseEvent } from "react";
import { Search, AtSign, Heart, MessageCircle, TrendingUp, TrendingDown, CheckCircle2, User, Hash, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LOGO_BASE64 } from "./constants";

// --- Types ---

interface AnalysisData {
  username: string;
  profile: {
    display_name: string;
    bio: string;
    location: string;
    avatar_url: string;
    followers: number;
    following: number;
    tweet_count: number;
    joined: string;
    verified: boolean;
  };
  engagement: {
    average_likes: number;
    average_comments: number;
    engagement_rate: number;
  };
  score: {
    total: number;
    grade: string;
    breakdown: {
      authenticity: number;
      value: number;
      influence: number;
      activity: number;
    };
    reasoning: string;
  };
  niches: string[];
  scraped_at: string;
  from_cache: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

// --- Components ---

const Bar: FC<{ width: string; label: string; index: number }> = ({ width, label, index }) => {
  const [mousePos, setMousePos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setMousePos(percentage);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="group relative cursor-pointer"
    >
      <div className="w-full h-6 bg-off-white rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
          className="h-full bg-bg rounded-full group-hover:opacity-80 transition-opacity"
        />
      </div>
      <div 
        style={{ left: `${mousePos}%` }}
        className="absolute -top-12 -translate-x-1/2 bg-bg text-off-white px-4 py-1.5 rounded-lg text-xl font-condensed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40 shadow-xl"
      >
        {label}
      </div>
    </div>
  );
};

const SearchScreen: FC<{ onSearch: (username: string) => void }> = ({ onSearch }) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (username.trim()) {
      onSearch(username);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center w-[1000px] h-[560px] relative"
    >
      <form 
        onSubmit={handleSubmit}
        className="relative w-[672px] group"
      >
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-bg/60">
          <AtSign size={24} />
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username..."
          className="w-full bg-red h-16 rounded-full px-16 text-2xl font-condensed text-bg placeholder:text-bg/40 outline-none transition-all focus:ring-4 focus:ring-red/20"
          autoFocus
        />
        <button 
          type="submit"
          className="absolute right-6 top-1/2 -translate-y-1/2 text-bg hover:scale-110 transition-transform cursor-pointer"
        >
          <Search size={32} strokeWidth={2.5} />
        </button>
      </form>
      <p className="absolute bottom-12 text-off-white/60 text-2xl font-condensed tracking-wider">
        type your x username...
      </p>
    </motion.div>
  );
};

const LoadingScreen: FC = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center w-[1000px] h-[560px] relative"
  >
    <div className="w-[66px] h-[66px] animate-spin-pause rounded-lg overflow-hidden">
      <img 
        src={LOGO_BASE64} 
        alt="Loading..." 
        className="w-full h-full object-cover" 
      />
    </div>
    <p className="absolute bottom-12 text-off-white/60 text-2xl font-condensed tracking-wider animate-dots">
      Analyzing
    </p>
  </motion.div>
);

const ResultScreen: FC<{ 
  data: AnalysisData | null;
  trends: {
    likes: 'up' | 'down' | 'neutral';
    comments: 'up' | 'down' | 'neutral';
    rate: 'up' | 'down' | 'neutral';
  } | null;
}> = ({ data, trends }) => {
  if (!data) return null;

  const getTrendIcon = (type: 'up' | 'down' | 'neutral', size: number = 28) => {
    const Icon = type === 'down' ? TrendingDown : TrendingUp;
    return <Icon size={size} className="text-bg shrink-0" />;
  };

  const formatRate = (rate: number) => {
    if (rate > 0 && rate < 0.01) return "<0.01%";
    return `${rate.toFixed(2)}%`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-[1000px] h-screen flex items-center justify-center mx-auto"
    >
      <div className="relative w-[1000px] h-[560px]">
        {/* Central Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
          <div className="relative w-[251px] h-[251px] rounded-full overflow-hidden shadow-[0_0_21px_10px_rgba(217,217,217,0.6)]">
            <img 
              src={data.profile.avatar_url || LOGO_BASE64} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Connection Icons - Positioned precisely at intersections */}
          <div className="absolute top-[-125.5px] left-[17px] w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[2px] border-bg shadow-[0_4px_6.6px_3px_rgba(0,0,0,0.25)] scale-115">
            <User size={34} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="absolute top-[-125.5px] right-[17px] w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[2px] border-bg shadow-[0_4px_6.6px_3px_rgba(0,0,0,0.25)] scale-115">
            <CheckCircle2 size={34} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="absolute bottom-[-125.5px] left-[17px] w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[2px] border-bg shadow-[0_4px_6.6px_3px_rgba(0,0,0,0.25)] scale-115">
            <AlignLeft size={34} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="absolute bottom-[-125.5px] right-[17px] w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[2px] border-bg shadow-[0_4px_6.6px_3px_rgba(0,0,0,0.25)] scale-115">
            <Hash size={34} className="text-bg" strokeWidth={2.5} />
          </div>
        </div>

        {/* Top Left - STATS */}
        <div className="absolute top-0 left-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-x-[-1]"></div>
          <div className="absolute inset-0 pl-14 pr-36 py-10 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-6">
              <Heart size={36} className="text-bg shrink-0" />
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="text-5xl font-condensed text-bg leading-none">{data.engagement.average_likes}</span>
                <span className="text-xl font-condensed text-bg/60">avg</span>
              </div>
              {getTrendIcon(trends?.likes || 'neutral')}
            </div>
            <div className="flex items-center gap-6">
              <MessageCircle size={36} className="text-bg shrink-0" />
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="text-5xl font-condensed text-bg leading-none">{data.engagement.average_comments}</span>
                <span className="text-xl font-condensed text-bg/60">avg</span>
              </div>
              {getTrendIcon(trends?.comments || 'neutral')}
            </div>
            <div className="flex items-center gap-6">
              <div className="w-9 h-9 border-[3px] border-bg rounded flex items-center justify-center shrink-0">
                 <TrendingUp size={22} className="text-bg" strokeWidth={3} />
              </div>
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="text-5xl font-condensed text-bg leading-none">{formatRate(data.engagement.engagement_rate)}</span>
              </div>
              {getTrendIcon(trends?.rate || 'neutral')}
            </div>
          </div>
        </div>

        {/* Top Right - SCORE */}
        <div className="absolute top-0 right-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full"></div>
          <div className="absolute inset-0 pl-42 pr-8 flex items-center justify-center">
            <div className="flex items-baseline gap-4">
              <span className="inline-block text-[184px] font-condensed font-medium text-bg leading-none tracking-tighter scale-y-110">{data.score.total}</span>
              <div className="flex flex-col">
                <span className="text-4xl font-condensed font-bold text-bg">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left - TYPE */}
        <div className="absolute bottom-0 left-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-x-[-1] scale-y-[-1]"></div>
          <div className="absolute inset-0 pl-8 pr-42 flex flex-col justify-center gap-6">
            {[
              { val: data.score.breakdown.authenticity, label: "Authenticity" },
              { val: data.score.breakdown.value, label: "Value" },
              { val: data.score.breakdown.influence, label: "Influence" },
              { val: data.score.breakdown.activity, label: "Activity" }
            ].map((bar, i) => (
              <Bar key={i} width={`${(bar.val / 25) * 100}%`} label={bar.label} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom Right - NICHE */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-y-[-1]"></div>
          <div className="absolute inset-0 pl-38 pr-4 py-10 flex flex-row flex-wrap content-center items-center justify-center gap-3">
            {data.niches.map((label, i) => (
              <div key={i} className="bg-bg text-off-white px-5 py-2 rounded-xl text-[26px] font-condensed font-bold leading-none tracking-tight hover:scale-105 transition-transform cursor-default shadow-sm border border-off-white/10">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<"search" | "loading" | "result">("search");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [trends, setTrends] = useState<{
    likes: 'up' | 'down' | 'neutral';
    comments: 'up' | 'down' | 'neutral';
    rate: 'up' | 'down' | 'neutral';
  } | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1000) {
        setScale(width / 1000);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cleanUsername = (input: string) => {
    let cleaned = input.trim();
    // Remove URL prefix if present
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//, '');
    // Remove @ if present
    cleaned = cleaned.replace(/^@/, '');
    // Remove trailing slashes or query params
    cleaned = cleaned.split(/[/?#]/)[0];
    return cleaned;
  };

  const handleSearch = async (input: string) => {
    const username = cleanUsername(input);
    if (!username) return;

    setAnalysisData(null);
    setScreen("loading");

    try {
      const baseUrl = "https://750b83d6-882c-457a-a53e-3efb317fce41-00-xbx811ydhsvz.riker.replit.dev/api";
      const response = await fetch(`${baseUrl}/score/${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }

      const data: AnalysisData = await response.json();
      
      // Calculate trends
      const prevDataStr = localStorage.getItem("previous_twitter_score");
      const prevData = prevDataStr ? JSON.parse(prevDataStr) : null;

      if (prevData) {
        setTrends({
          likes: data.engagement.average_likes > prevData.average_likes ? 'up' : data.engagement.average_likes < prevData.average_likes ? 'down' : 'neutral',
          comments: data.engagement.average_comments > prevData.average_comments ? 'up' : data.engagement.average_comments < prevData.average_comments ? 'down' : 'neutral',
          rate: data.engagement.engagement_rate > prevData.engagement_rate ? 'up' : data.engagement.engagement_rate < prevData.engagement_rate ? 'down' : 'neutral',
        });
      } else {
        setTrends({ likes: 'neutral', comments: 'neutral', rate: 'neutral' });
      }

      // Save to localStorage
      localStorage.setItem("previous_twitter_score", JSON.stringify({
        username: data.username,
        average_likes: data.engagement.average_likes,
        average_comments: data.engagement.average_comments,
        engagement_rate: data.engagement.engagement_rate
      }));

      setAnalysisData(data);
      setScreen("result");
    } catch (err) {
      console.error("Analysis error:", err);
      setScreen("search");
      alert("Failed to analyze account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center selection:bg-white/20 overflow-hidden">
      <div 
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '1000px',
          height: '560px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <AnimatePresence mode="wait">
          {screen === "search" && (
            <SearchScreen 
              key="search" 
              onSearch={handleSearch} 
            />
          )}
          {screen === "loading" && (
            <LoadingScreen key="loading" />
          )}
          {screen === "result" && (
            <ResultScreen key="result" data={analysisData} trends={trends} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
