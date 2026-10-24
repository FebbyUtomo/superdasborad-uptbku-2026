// Membaca folder Google Drive publik (tanpa API key) untuk Galeri Kegiatan.
const ROOT = '19QVQSmJnXXAu01hJMb7vgvxI3U4bGDlm';
const ent = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
async function list(id) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) return [];
  const html = await r.text();
  const out = [];
  const re = /href="(https:\/\/drive\.google\.com\/[^"]+)"[^>]*>[\s\S]*?flip-entry-title">([\s\S]*?)</g;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1], name = ent(m[2]);
    const f = url.match(/\/folders\/([\w-]+)/), d = url.match(/\/file\/d\/([\w-]+)/);
    if (f) out.push({ type: 'folder', id: f[1], name });
    else if (d) out.push({ type: 'file', id: d[1], name });
  }
  return out;
}
const isImg = (n) => /\.(jpe?g|png|webp|gif|heic)$/i.test(n);
export default async function handler(req, res) {
  try {
    const month = req.query && req.query.month;
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    if (!month) {
      const months = (await list(ROOT)).filter((e) => e.type === 'folder' && /^\d{4}\.\d{2}/.test(e.name))
        .sort((a, b) => b.name.localeCompare(a.name));
      return res.status(200).json({ root: ROOT, months });
    }
    const subs = await list(month);
    const photos = [];
    subs.filter((e) => e.type === 'file' && isImg(e.name)).forEach((f) => photos.push({ ...f, bidang: 'Umum' }));
    await Promise.all(subs.filter((e) => e.type === 'folder').map(async (b) => {
      const inner = await list(b.id);
      inner.filter((e) => e.type === 'file' && isImg(e.name)).forEach((f) => photos.push({ ...f, bidang: b.name }));
      await Promise.all(inner.filter((e) => e.type === 'folder').map(async (s) => {
        (await list(s.id)).filter((e) => e.type === 'file' && isImg(e.name)).forEach((f) => photos.push({ ...f, bidang: b.name }));
      }));
    }));
    photos.sort((a, b) => a.bidang.localeCompare(b.bidang) || a.name.localeCompare(b.name));
    res.status(200).json({ month, bidang: subs.filter((e) => e.type === 'folder').map((e) => e.name).sort(), photos });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
