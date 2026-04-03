import { useState, useEffect, FormEvent, FC } from "react";
import { Search, AtSign, Heart, MessageCircle, TrendingUp, CheckCircle2, User, Hash, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Components ---

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

const ResultScreen: FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-screen flex items-center justify-center"
    >
      <div className="relative w-[1000px] h-[560px]">
        {/* Central Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
          <div className="relative w-64 h-64 rounded-full bg-bg flex items-center justify-center hub-glow shadow-2xl">
            <div className="w-[92%] h-[92%] rounded-full bg-off-white flex items-center justify-center">
              <div className="w-[88%] h-[88%] rounded-full overflow-hidden border-[4px] border-bg">
                <img 
                  src="https://picsum.photos/seed/broz/500/500" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          
          {/* Connection Icons - Positioned precisely at intersections */}
          <div className="absolute -top-32 left-4 w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[4px] border-bg shadow-lg">
            <User size={34} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-32 right-4 w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[4px] border-bg shadow-lg">
            <CheckCircle2 size={34} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="absolute -bottom-32 left-4 w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[4px] border-bg shadow-lg">
            <AlignLeft size={34} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="absolute -bottom-32 right-4 w-[66px] h-[66px] bg-off-white rounded-full flex items-center justify-center border-[4px] border-bg shadow-lg">
            <Hash size={34} className="text-bg" strokeWidth={2.5} />
          </div>
        </div>

        {/* Top Left - STATS */}
        <div className="absolute top-0 left-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-x-[-1]"></div>
          <div className="absolute inset-0 pl-14 pr-36 py-10 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-6">
              <Heart size={36} className="text-bg" fill="currentColor" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-condensed text-bg leading-none">30</span>
                <span className="text-xl font-condensed text-bg/60 uppercase">avg</span>
              </div>
              <TrendingUp size={28} className="text-bg/30 ml-auto" />
            </div>
            <div className="flex items-center gap-6">
              <MessageCircle size={36} className="text-bg" fill="currentColor" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-condensed text-bg leading-none">30</span>
                <span className="text-xl font-condensed text-bg/60 uppercase">avg</span>
              </div>
              <TrendingUp size={28} className="text-bg/30 ml-auto" />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-9 h-9 border-[3px] border-bg rounded flex items-center justify-center">
                 <TrendingUp size={22} className="text-bg" strokeWidth={3} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-condensed text-bg leading-none">12.3%</span>
              </div>
              <TrendingUp size={28} className="text-bg/30 ml-auto" />
            </div>
          </div>
        </div>

        {/* Top Right - SCORE */}
        <div className="absolute top-0 right-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full"></div>
          <div className="absolute inset-0 pl-36 pr-14 py-10 flex items-center justify-center gap-1">
            <span className="text-[180px] font-condensed font-bold text-bg leading-none tracking-tighter">66</span>
            <span className="text-4xl font-condensed font-bold text-bg mt-20">/100</span>
          </div>
        </div>

        {/* Bottom Left - TYPE */}
        <div className="absolute bottom-0 left-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-x-[-1] scale-y-[-1]"></div>
          <div className="absolute inset-0 pl-14 pr-36 py-10 flex flex-col justify-center gap-4">
            {[
              { width: "85%", label: "Creator" },
              { width: "40%", label: "Storyteller" },
              { width: "65%", label: "Promoter" },
              { width: "75%", label: "Reply Guy" }
            ].map((bar, i) => (
              <div key={i} className="group relative cursor-pointer">
                <div className="w-full h-8 bg-off-white rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: bar.width }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className="h-full bg-bg rounded-full group-hover:opacity-80 transition-opacity"
                  />
                </div>
                <div className="absolute left-1/2 -top-12 -translate-x-1/2 bg-bg text-off-white px-4 py-1.5 rounded-lg text-xl font-condensed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40 shadow-xl">
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Right - NICHE */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[260px] overflow-hidden">
          <div className="card-shape w-full h-full scale-y-[-1]"></div>
          <div className="absolute inset-0 pl-36 pr-14 py-10 flex flex-col justify-center gap-1">
            {[
              "#Opinion Leader",
              "#Educational Explainer",
              "#Project Promotion",
              "#Personal Reflection"
            ].map((niche, i) => (
              <div key={i} className="text-[32px] font-condensed font-bold text-bg leading-tight tracking-tight hover:translate-x-2 transition-transform cursor-default">
                {niche}
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

  const handleSearch = (username: string) => {
    console.log("Searching for:", username);
    setScreen("loading");
  };

  useEffect(() => {
    if (screen === "loading") {
      const timer = setTimeout(() => {
        setScreen("result");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

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
            <ResultScreen key="result" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
