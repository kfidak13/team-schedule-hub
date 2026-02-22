import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

const UPSTREAM_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new Map(); // url -> { body, contentType, ts }

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry;
}

function setCached(key, body, contentType) {
  cache.set(key, { body, contentType, ts: Date.now() });
}

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Proxy endpoint for fetching any URL
app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const decodedUrl = decodeURIComponent(String(url));

    const hit = getCached(decodedUrl);
    if (hit) {
      console.log(`Cache hit: ${decodedUrl}`);
      if (hit.contentType) res.set('Content-Type', hit.contentType);
      res.set('Cache-Control', 'public, max-age=300');
      return res.send(hit.body);
    }

    console.log(`Proxying: ${decodedUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    
    const response = await fetch(decodedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    const data = await response.text();
    setCached(decodedUrl, data, contentType);

    if (contentType) res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=300');
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    res.status(isTimeout ? 504 : 500).json({
      error: 'Failed to fetch URL',
      message: isTimeout ? `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms` : (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
});

// Specific endpoint for Webb School
app.get('/api/webb', async (req, res) => {
  const { fromId, Team, SeasonLabel, siteId } = req.query;
  
  let url;
  if (fromId && Team && SeasonLabel && siteId) {
    url = `https://www.webb.org/athletic-teams?fromId=${String(fromId)}&Team=${String(Team)}&SeasonLabel=${encodeURIComponent(String(SeasonLabel))}&siteId=${String(siteId)}`;
  } else {
    // Default URL
    url = 'https://www.webb.org/athletic-teams?fromId=295792&Team=171408&SeasonLabel=2025%20-%202026&siteId=1850';
  }
  
  try {
    const hit = getCached(url);
    if (hit) {
      console.log(`Cache hit (Webb): ${url}`);
      res.set('Content-Type', 'text/html');
      res.set('Cache-Control', 'public, max-age=300');
      return res.send(hit.body);
    }

    console.log(`Fetching Webb School: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.text();
    setCached(url, data, 'text/html');

    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(data);
    
  } catch (error) {
    console.error('Webb proxy error:', error);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    res.status(isTimeout ? 504 : 500).json({
      error: 'Failed to fetch Webb School page',
      message: isTimeout ? `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms` : (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  - GET /api/proxy?url=<encoded-url>`);
  console.log(`  - GET /api/webb`);
});
