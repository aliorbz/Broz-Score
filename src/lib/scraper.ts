import { chromium } from "playwright";

export interface ScrapedData {
  avatarUrl?: string;
  followers?: number;
  tweets: {
    text: string;
    likes: number;
    replies: number;
    reposts: number;
    type: "original" | "reply" | "repost";
    createdAt: string;
  }[];
  debug: {
    profileLoaded: boolean;
    avatarFound: boolean;
    followersFound: boolean;
    timelineFound: boolean;
    loginWallDetected: boolean;
    scrapeFailureReason: string | null;
  };
}

/**
 * Helper to scrape a public X/Twitter profile.
 * Currently in "verification" mode - launches browser but falls back to mock if needed.
 */
export async function scrapeXProfile(username: string): Promise<ScrapedData | null> {
  let browser;
  const debug: ScrapedData['debug'] = {
    profileLoaded: false,
    avatarFound: false,
    followersFound: false,
    timelineFound: false,
    loginWallDetected: false,
    scrapeFailureReason: null
  };

  try {
    console.log(`[Scraper] Starting for user: ${username}`);
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1920,1080",
      ]
    });
    
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      javaScriptEnabled: true,
    });
    
    const page = await context.newPage();
    
    // Navigate with domcontentloaded for faster initial check
    console.log(`[Scraper] Navigating to https://x.com/${username}`);
    const response = await page.goto(`https://x.com/${username}`, { 
      waitUntil: "domcontentloaded",
      timeout: 20000 
    });

    if (!response) {
      console.log("[Scraper] Failed to get response from X");
      debug.scrapeFailureReason = "No response from X";
      return { tweets: [], debug };
    }

    const status = response.status();
    console.log(`[Scraper] Page status: ${status}`);

    if (status === 404) {
      console.log(`[Scraper] Profile not found (404): ${username}`);
      debug.scrapeFailureReason = "Profile not found (404)";
      return { tweets: [], debug };
    }

    if (status !== 200) {
      debug.scrapeFailureReason = `HTTP Status ${status}`;
    }

    // Wait a bit for JS to execute and elements to appear
    await page.waitForTimeout(3000);

    // Check for login wall or block
    const pageContent = await page.content();
    const isLoginWall = pageContent.includes("Log in to X") || pageContent.includes("Sign in to X") || page.url().includes("/login");
    const isRateLimited = pageContent.includes("Rate limit exceeded") || status === 429;
    
    debug.loginWallDetected = isLoginWall;
    if (isLoginWall) {
      console.log("[Scraper] Login wall detected. X is blocking public view.");
      debug.scrapeFailureReason = "Login wall detected";
    }
    if (isRateLimited) {
      console.log("[Scraper] Rate limit detected.");
      debug.scrapeFailureReason = "Rate limit detected";
    }

    // Check if profile elements are present
    const hasProfile = await page.$('div[data-testid="UserProfileHeader_Items"]');
    debug.profileLoaded = !!hasProfile;
    console.log(`[Scraper] Profile header found: ${!!hasProfile}`);

    // Scrape Avatar
    let avatarUrl: string | undefined;
    try {
      const avatarSelector = 'img[src*="profile_images"]';
      const avatarElement = await page.$(avatarSelector);
      if (avatarElement) {
        avatarUrl = await avatarElement.getAttribute('src') || undefined;
        if (avatarUrl) {
          avatarUrl = avatarUrl.replace('_normal.', '_400x400.');
          console.log("[Scraper] Avatar found");
          debug.avatarFound = true;
        }
      } else {
        console.log("[Scraper] Avatar selector not found");
      }
    } catch (e) {
      console.log("[Scraper] Error finding avatar");
    }

    // Scrape Followers
    let followers: number | undefined;
    try {
      const followersText = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/verified_followers"], a[href*="/followers"]'));
        const followersLink = links.find(l => l.textContent?.includes('Followers'));
        return followersLink ? followersLink.textContent : null;
      });

      if (followersText) {
        console.log(`[Scraper] Followers text found: ${followersText}`);
        debug.followersFound = true;
        const match = followersText.match(/([\d,.]+)([KMB]?)/i);
        if (match) {
          let num = parseFloat(match[1].replace(/,/g, ''));
          const suffix = match[2].toUpperCase();
          if (suffix === 'K') num *= 1000;
          if (suffix === 'M') num *= 1000000;
          if (suffix === 'B') num *= 1000000000;
          followers = Math.round(num);
        }
      } else {
        console.log("[Scraper] Followers selector not found");
      }
    } catch (e) {
      console.log("[Scraper] Error finding followers");
    }

    // Scrape Tweets
    const tweets: ScrapedData['tweets'] = [];
    try {
      const tweetSelector = 'article[data-testid="tweet"]';
      const hasTweets = await page.$(tweetSelector);
      debug.timelineFound = !!hasTweets;
      console.log(`[Scraper] Tweets found on page: ${!!hasTweets}`);

      if (hasTweets) {
        const tweetData = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('article[data-testid="tweet"]')).slice(0, 20);
          return items.map(item => {
            const textEl = item.querySelector('div[data-testid="tweetText"]');
            const timeEl = item.querySelector('time');
            
            const getStat = (testId: string) => {
              const el = item.querySelector(`button[data-testid="${testId}"], div[data-testid="${testId}"]`);
              const text = el?.getAttribute('aria-label') || '';
              const match = text.match(/(\d+)/);
              return match ? parseInt(match[1]) : 0;
            };

            const likes = getStat('like');
            const replies = getStat('reply');
            const reposts = getStat('retweet');
            
            const isReply = !!item.querySelector('div[data-testid="tweetText"]')?.previousElementSibling?.textContent?.includes('Replying to');

            return {
              text: textEl?.textContent || '',
              likes,
              replies,
              reposts,
              type: (isReply ? "reply" : "original") as "reply" | "original",
              createdAt: timeEl?.getAttribute('datetime') || new Date().toISOString()
            };
          });
        });

        tweets.push(...tweetData);
        console.log(`[Scraper] Successfully scraped ${tweets.length} tweets`);
      }
    } catch (e) {
      console.log("[Scraper] Error scraping tweets");
    }

    return {
      avatarUrl,
      followers,
      tweets,
      debug
    }; 
  } catch (error) {
    console.error("[Scraper] Fatal error:", error);
    debug.scrapeFailureReason = error instanceof Error ? error.message : String(error);
    return { tweets: [], debug };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
