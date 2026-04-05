<div align="center">
  
  <br />
  <br />

  <h1 align="center">🔥 Broz-Score Dashboard 🔥</h1>
  <p align="center">
    <strong>A high-performance, dynamic X/Twitter analysis dashboard built entirely in React.</strong><br/>
    <em>Utilizes native API aggregators and Gemini AI Grounding to evaluate profiles and calculate bespoke engagement metrics in real-time.</em>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini API" />
  </p>
</div>

<hr />

## ✨ Features

- 🕵️ **True-Stats Extraction:** Bypasses massive API paywalls. Utilizes open syndication APIs like `fxtwitter` to pull live, granular metrics (Exact Followers, Following Ratios, Tweet Volume).
- 🧠 **Google Search Grounding:** Fully integrated with `@google/genai` (Gemini 2.5 Flash). Leverages AI context to semantically crawl recent tweets and establish highly realistic internet sentiment tracking.
- 🧮 **Algorithmic Cryptography:** Built-in offline deterministic fallbacks ensure the app *never* crashes. Missing your API keys? The backend calculates an entirely mathematical identity hash mapping unique hashtags, scores, and variables to every username flawlessly.
- 🖼️ **Crystal Clear Avatars:** Uses regex interceptors to bypass standard 48x48 web blobs, automatically serving crisp `_400x400` High-Definition original format pictures directly from Twitter's CDN.
- 🚀 **Hardware Accelerated UI:** Framer Motion (Motion/React) powers completely seamless, asynchronous 60fps animations.

<br />

## 🛠️ Architecture

Instead of traditional databases, this project is designed as a fully ephemeral **Backend-For-Frontend (BFF)** pipeline. 
When a search is initiated:
1. `App.tsx` dispatches an async request to `api.ts` alongside a synchronized visual transition delay.
2. `api.ts` attempts to hit open data layers. If blocked by rate-limits or CORS, the app falls back into an AI-based web-crawl. 
3. Text is cleansed via strict arrays and Regex expressions to extract the highest-quality semantic `#Niches` specific to the requested author.

<br />

## 🚀 Quick Start & Installation

Getting the application running locally is extremely lightweight.

#### Prerequisites
- **Node.js**
- Optional: A [Google Gemini API Key](https://aistudio.google.com/) for AI-grounded internet scraping features.

#### Setup Commands

```bash
# 1. Clone the repository
git clone https://github.com/aliorbz/Broz-Score.git
cd Broz-Score

# 2. Install dependencies
npm install

# 3. Handle your environment variables
# Create a .env file and paste in your Gemini Key. 
# (You can run the app without this, but AI grounding will be disabled).
echo "GEMINI_API_KEY=your_key_here" > .env

# 4. Boot the Vite Dev Server
npm run dev
```

Visit the dashboard live at `http://localhost:3000/`.

<hr />

<div align="center">
  <h2>👥 Contributors</h2>
  <p>
    <strong>Frontend:</strong> <a href="https://github.com/HemachandRavulapalli">@HemachandRavulapalli</a><br/>
    <strong>Backend:</strong> <a href="https://github.com/aliorbz">@aliorbz</a>
  </p>
</div>
