import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

const UPSTREAM_TIMEOUT_MS = 12000;

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
    console.log(`Proxying: ${decodedUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    
    const response = await fetch(decodedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'close',
      },
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    res.set('Cache-Control', 'no-store');
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.set('Content-Type', contentType);
    }
    
    const data = await response.text();
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
    console.log(`Fetching Webb School: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'close',
      }
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    res.set('Cache-Control', 'no-store');
    const data = await response.text();
    res.set('Content-Type', 'text/html');
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
