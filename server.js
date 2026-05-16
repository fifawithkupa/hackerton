const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT       = 3000;
const STATIC_DIR = path.join(__dirname, 'painpoint');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.jsx':  'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// ── Reddit fetch ─────────────────────────────────────────────────────────────
function fetchJSON(reqUrl) {
  return new Promise((resolve, reject) => {
    https.get(reqUrl, { headers: { 'User-Agent': 'ssatis_crawler/1.0' } }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('JSON parse failed')); }
      });
    }).on('error', reject);
  });
}

async function searchReddit(keyword) {
  const q = encodeURIComponent(keyword);
  const data = await fetchJSON(
    `https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=25&type=link`
  );
  return data.data.children.map(c => c.data);
}

// ── PP_DATA builder ───────────────────────────────────────────────────────────
function buildPPData(keyword, posts) {
  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const sorted = [...posts].sort((a, b) => b.score - a.score);

  const toSample = p => ({
    src:   'reddit',
    title: p.title,
    up:    p.score,
    link:  p.url,
  });

  // 게시물을 score 기준으로 3그룹으로 나눔
  const g = [sorted.slice(0, 3), sorted.slice(3, 6), sorted.slice(6, 9)].filter(g => g.length);

  const painpoints = g.map((group, i) => ({
    id:       `pp${i + 1}`,
    rank:     i + 1,
    title:    group[0].title.length > 60
                ? group[0].title.slice(0, 60) + '…'
                : group[0].title,
    summary:  group.map(p => p.selftext || p.title).join(' ').slice(0, 200) + '…',
    severity: i === 0 ? 'high' : 'mid',
    empathy:  group.reduce((a, p) => a + p.score, 0),
    comments: group.reduce((a, p) => a + (p.num_comments || 0), 0),
    sources:  { reddit: group.reduce((a, p) => a + p.score, 0) },
    emotions: { 관심: 45, 공감: 35, 논쟁: 20 },
    samples:  group.map(toSample),
  }));

  return {
    trendingKeywords: [{ kw: keyword, delta: '실시간', category: 'Reddit' }],
    sources: [{
      id: 'reddit', name: '레딧',
      desc: `Reddit 검색: "${keyword}"`,
      posts: posts.length, defaultOn: true, free: true,
    }],
    result: {
      keyword,
      analyzedAt: now,
      totalCollected: posts.length,
      afterFilter: Math.floor(posts.length * 0.85),
      verdict: '분석 완료',
      verdictTone: 'violet',
      log: [
        { src: '레딧', id: 'reddit', n: posts.length,
          t: `Reddit 검색: "${keyword}"`, d: 0.5 },
      ],
      painpoints,
      ideas: [],
    },
  };
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // API: /api/search?q=keyword
  if (parsed.pathname === '/api/search') {
    const keyword = (parsed.query.q || '').trim();
    if (!keyword) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'keyword required' }));
    }
    try {
      const posts = await searchReddit(keyword);
      const data  = buildPPData(keyword, posts);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Static files
  let p = parsed.pathname;
  if (p === '/') p = '/index.html';
  const filePath = path.join(STATIC_DIR, p);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
