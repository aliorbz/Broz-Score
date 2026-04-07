import { useState, useEffect, useRef, FormEvent, FC, MouseEvent } from "react";
import { Search, AtSign, Heart, MessageCircle, TrendingUp, CheckCircle2, User, Hash, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---

interface AnalysisData {
  username: string;
  avatarUrl?: string;
  score: number;
  stats: {
    avgLikes: number;
    avgReplies: number;
    engagementRate: number;
  };
  bars: {
    authenticity: number;
    value: number;
    influence: number;
    activity: number;
  };
  niche: string[];
  debug?: {
    dataSource: string;
    scrapedTweetCount: number;
    followersSource: string;
    avatarSource: string;
    profileLoaded: boolean;
    avatarFound: boolean;
    followersFound: boolean;
    timelineFound: boolean;
    loginWallDetected: boolean;
    scrapeFailureReason: string | null;
    error?: string | null;
    groqError?: string | null;
    rapidApiUsed?: boolean;
    rapidApiSuccess?: boolean;
  };
}

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

const MobileRestriction = () => (
  <div className="fixed inset-0 bg-bg z-50 flex items-center justify-center p-8 text-center lg:hidden">
    <p className="text-xl font-medium text-off-white/80">
      Broz Score is currently available only on desktop.
    </p>
  </div>
);

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
      className="flex flex-col items-center justify-center h-screen gap-8"
    >
      <form 
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl group"
      >
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-bg/60">
          <AtSign size={32} />
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username..."
          className="w-full bg-red h-24 rounded-full px-20 text-3xl font-condensed text-bg placeholder:text-bg/40 outline-none transition-all focus:ring-4 focus:ring-red/20"
          autoFocus
        />
        <button 
          type="submit"
          className="absolute right-6 top-1/2 -translate-y-1/2 text-bg hover:scale-110 transition-transform cursor-pointer"
        >
          <Search size={40} strokeWidth={2.5} />
        </button>
      </form>
      <p className="text-off-white/60 text-2xl font-condensed tracking-wider">
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
    className="flex items-center justify-center h-screen"
  >
    <div className="w-48 h-48 animate-pulse-logo">
      <img src="/media/logo.svg" alt="Loading..." className="w-full h-full" />
    </div>
  </motion.div>
);

const ResultScreen: FC<{ data: AnalysisData | null }> = ({ data }) => {
  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-screen flex items-center justify-center"
    >
      <div className="relative w-[1000px] h-[560px]">
        {/* Central Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
          <div className="relative w-[251px] h-[251px] rounded-full overflow-hidden shadow-[0_0_21px_10px_rgba(217,217,217,0.6)]">
            <img 
              src={data.avatarUrl || "/media/logo.svg"} 
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
              <Heart size={36} className="text-bg" />
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="text-5xl font-condensed text-bg leading-none">{data.stats.avgLikes}</span>
                <span className="text-xl font-condensed text-bg/60">avg</span>
              </div>
              <TrendingUp size={28} className="text-bg ml-auto mr-10" />
            </div>
            <div className="flex items-center gap-6">
              <MessageCircle size={36} className="text-bg" />
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="text-5xl font-condensed text-bg leading-none">{data.stats.avgReplies}</span>
                <span className="text-xl font-condensed text-bg/60">avg</span>
              </div>
              <TrendingUp size={28} className="text-bg ml-auto mr-10" />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-9 h-9 border-[3px] border-bg rounded flex items-center justify-center">
                 <TrendingUp size={22} className="text-bg" strokeWidth={3} />
              </div>
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="text-5xl font-condensed text-bg leading-none">{data.stats.engagementRate}%</span>
              </div>
              <TrendingUp size={28} className="text-bg ml-auto mr-10" />
            </div>
          </div>
        </div>

        {/* Top Right - SCORE */}
        <div className="absolute top-0 right-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full"></div>
          <div className="absolute inset-0 pl-42 pr-8 flex items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="inline-block text-[184px] font-condensed font-medium text-bg leading-none tracking-tighter scale-y-110">{data.score}</span>
              <span className="text-4xl font-condensed font-bold text-bg">/100</span>
            </div>
          </div>
        </div>

        {/* Bottom Left - TYPE */}
        <div className="absolute bottom-0 left-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-x-[-1] scale-y-[-1]"></div>
          <div className="absolute inset-0 pl-8 pr-42 flex flex-col justify-center gap-6">
            {[
              { width: `${data.bars.authenticity}%`, label: "Authenticity" },
              { width: `${data.bars.value}%`, label: "Value" },
              { width: `${data.bars.influence}%`, label: "Influence" },
              { width: `${data.bars.activity}%`, label: "Activity" }
            ].map((bar, i) => (
              <Bar key={i} width={bar.width} label={bar.label} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom Right - NICHE */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-y-[-1]"></div>
          <div className="absolute inset-0 pl-38 pr-4 py-10 flex flex-row flex-wrap content-center items-center justify-center gap-3">
            {data.niche.map((label, i) => (
              <div key={i} className="bg-bg text-off-white px-5 py-2 rounded-xl text-[26px] font-condensed font-bold leading-none tracking-tight hover:scale-105 transition-transform cursor-default shadow-sm border border-off-white/10">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-off-white/20 pointer-events-none select-none text-right">
        <div>Source: {data.debug?.dataSource} | Tweets: {data.debug?.scrapedTweetCount}</div>
        {data.debug?.rapidApiUsed && (
          <div className={data.debug.rapidApiSuccess ? "text-green-400/40" : "text-yellow-400/40"}>
            RapidAPI: {data.debug.rapidApiSuccess ? "Success" : "Failed"}
          </div>
        )}
        {(data.debug?.scrapeFailureReason || data.debug?.error) && (
          <div className="text-red/40">Reason: {data.debug.scrapeFailureReason || data.debug.error}</div>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<"search" | "loading" | "result">("search");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleSearch = async (username: string) => {
    setScreen("loading");
    try {
      const response = await fetch(`/api/analyze?username=${encodeURIComponent(username)}`);
      
      // Try to parse JSON regardless of status code
      let data;
      try {
        data = await response.json();
        console.log("[API Response]", data);
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        throw new Error("Invalid API response format");
      }

      setAnalysisData(data);
      // Keep loading screen visible for at least 2 seconds for effect
      setTimeout(() => {
        setScreen("result");
      }, 2000);
    } catch (error) {
      console.error("Analysis error:", error);
      setScreen("search");
      alert("Failed to analyze account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center selection:bg-white/20">
      <MobileRestriction />
      
      <div className="hidden lg:block w-full">
        <AnimatePresence mode="wait">
          {screen === "search" && (
            <SearchScreen key="search" onSearch={handleSearch} />
          )}
          {screen === "loading" && (
            <LoadingScreen key="loading" />
          )}
          {screen === "result" && (
            <ResultScreen key="result" data={analysisData} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
