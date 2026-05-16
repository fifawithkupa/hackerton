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

// ── 공통 유틸 ─────────────────────────────────────────────────────────────────
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

function fetchHTML(reqUrl) {
  return new Promise((resolve, reject) => {
    https.get(reqUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Accept-Encoding': 'identity',
      },
    }, res => {
      // 리다이렉트 처리
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHTML(res.headers.location).then(resolve).catch(reject);
      }
      res.setEncoding('utf8');
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

function cleanText(html) {
  return html
    .replace(/<mark[^>]*>/gi, '').replace(/<\/mark>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Reddit ────────────────────────────────────────────────────────────────────
async function searchReddit(keyword) {
  const q = encodeURIComponent(keyword);
  const data = await fetchJSON(
    `https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=25&type=link`
  );
  return data.data.children.map(c => ({
    title:        c.data.title,
    url:          c.data.url,
    score:        c.data.score || 0,
    num_comments: c.data.num_comments || 0,
    selftext:     c.data.selftext || '',
    source:       'reddit',
  }));
}

// ── Naver ─────────────────────────────────────────────────────────────────────
function parseNaverResults(html, urlFilter) {
  const results = [];
  const seen = new Set();

  // href가 data-heatmap-target 앞에 오는 구조 (블로그, 지식인 공통)
  const re = /<a[^>]*href="([^"]+)"[^>]*data-heatmap-target="\.title"[^>]*>([\s\S]{0,600}?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const link  = m[1].replace(/&amp;/g, '&');
    const title = cleanText(m[2]);
    if (!title || seen.has(link)) continue;
    if (urlFilter && !urlFilter(link)) continue;
    seen.add(link);
    results.push({ title, url: link, score: 0, num_comments: 0, source: 'naver' });
  }

  // 카페: href 패턴으로 직접 추출 (heatmap 없는 경우)
  const cafeRe = /<a[^>]*href="(https?:\/\/cafe\.naver\.com\/[A-Za-z0-9_.-]+\/[0-9]+)[^"]*"[^>]*>([\s\S]{0,600}?)<\/a>/g;
  while ((m = cafeRe.exec(html)) !== null) {
    const link  = m[1];
    const title = cleanText(m[2]);
    if (!title || seen.has(link) || title.length < 5) continue;
    seen.add(link);
    results.push({ title, url: link, score: 0, num_comments: 0, source: 'naver' });
  }

  return results;
}

async function searchNaverBlog(keyword) {
  const q = encodeURIComponent(keyword);
  const html = await fetchHTML(
    `https://search.naver.com/search.naver?where=blog&query=${q}&display=10&sort=0`
  );
  return parseNaverResults(html, link => link.includes('blog.naver.com'));
}

async function searchNaverCafe(keyword) {
  const q = encodeURIComponent(keyword);
  const html = await fetchHTML(
    `https://search.naver.com/search.naver?where=cafeblog&query=${q}&display=10&sort=0`
  );
  return parseNaverResults(html, link => link.includes('cafe.naver.com'));
}

async function searchNaverKin(keyword) {
  const q = encodeURIComponent(keyword);
  const html = await fetchHTML(
    `https://search.naver.com/search.naver?where=kin&query=${q}&display=10`
  );
  return parseNaverResults(html, link => link.includes('kin.naver.com') || link.includes('/detail/'));
}

async function searchNaver(keyword) {
  const [blog, cafe, kin] = await Promise.allSettled([
    searchNaverBlog(keyword),
    searchNaverCafe(keyword),
    searchNaverKin(keyword),
  ]);
  return [
    ...(blog.status  === 'fulfilled' ? blog.value  : []),
    ...(cafe.status  === 'fulfilled' ? cafe.value  : []),
    ...(kin.status   === 'fulfilled' ? kin.value   : []),
  ];
}

// ── PP_DATA builder ───────────────────────────────────────────────────────────
function buildPPData(keyword, redditPosts, naverPosts) {
  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const toSample = p => ({
    src:   p.source,
    title: p.title,
    up:    p.score,
    link:  p.url,
  });

  // Reddit(score 정렬) + Naver를 인터리브해서 각 그룹에 두 소스가 섞이도록
  const rSorted = [...redditPosts].sort((a, b) => b.score - a.score);
  const nSorted = [...naverPosts];
  const interleaved = [];
  const maxLen = Math.max(rSorted.length, nSorted.length);
  for (let i = 0; i < maxLen; i++) {
    if (rSorted[i]) interleaved.push(rSorted[i]);
    if (nSorted[i]) interleaved.push(nSorted[i]);
  }

  // 3개 그룹으로 나눔 (각 그룹 = 1개 페인포인트)
  const groups = [interleaved.slice(0, 3), interleaved.slice(3, 6), interleaved.slice(6, 9)]
    .filter(g => g.length > 0);

  const painpoints = groups.map((group, i) => {
    const title = group[0].title;
    return {
      id:       `pp${i + 1}`,
      rank:     i + 1,
      title:    title.length > 60 ? title.slice(0, 60) + '…' : title,
      summary:  group.map(p => p.selftext || p.title).join(' ').slice(0, 200) + '…',
      severity: i === 0 ? 'high' : 'mid',
      empathy:  group.reduce((a, p) => a + p.score, 0),
      comments: group.reduce((a, p) => a + p.num_comments, 0),
      sources: {
        reddit: group.filter(p => p.source === 'reddit').reduce((a, p) => a + Math.max(p.score, 1), 0),
        naver:  group.filter(p => p.source === 'naver').length * 10,
      },
      emotions: { 관심: 45, 공감: 35, 논쟁: 20 },
      samples:  group.map(toSample),
    };
  });

  const totalCollected = redditPosts.length + naverPosts.length;

  return {
    trendingKeywords: [{ kw: keyword, delta: '실시간', category: 'Reddit+Naver' }],
    sources: [
      { id: 'reddit', name: '레딧',  desc: `Reddit 검색: "${keyword}"`, posts: redditPosts.length, defaultOn: true, free: true },
      { id: 'naver',  name: '네이버', desc: `블로그·카페·지식인: "${keyword}"`, posts: naverPosts.length, defaultOn: true, free: true },
    ],
    result: {
      keyword,
      analyzedAt: now,
      totalCollected,
      afterFilter: Math.floor(totalCollected * 0.85),
      verdict: '분석 완료',
      verdictTone: 'violet',
      log: [
        { src: '레딧',   id: 'reddit', n: redditPosts.length, t: `Reddit 검색: "${keyword}"`,          d: 0.5 },
        { src: '네이버', id: 'naver',  n: naverPosts.length,  t: `네이버 블로그·카페·지식인: "${keyword}"`, d: 1.2 },
      ],
      painpoints,
      ideas: [],
    },
  };
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

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
      // Reddit + Naver 병렬 수집
      const [redditResult, naverResult] = await Promise.allSettled([
        searchReddit(keyword),
        searchNaver(keyword),
      ]);
      const redditPosts = redditResult.status === 'fulfilled' ? redditResult.value : [];
      const naverPosts  = naverResult.status  === 'fulfilled' ? naverResult.value  : [];

      const data = buildPPData(keyword, redditPosts, naverPosts);
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
