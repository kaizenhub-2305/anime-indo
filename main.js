import './style.css';

const API = 'https://graphql.anilist.co';
const app = document.querySelector('#app');
let currentTab = 'home';
let searchTimer;
let favorites = JSON.parse(localStorage.getItem('kaizen-favorites') || '[]');

const query = `
query ($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $genre: String) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: $sort, search: $search, genre_in: [$genre], isAdult: false) {
      id
      title { romaji english native }
      coverImage { extraLarge large }
      bannerImage
      averageScore
      episodes
      seasonYear
      format
      status
      genres
      description(asHtml: false)
      siteUrl
      externalLinks { site url type }
    }
  }
}`;
const popularQuery = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id title { romaji english native }
      coverImage { extraLarge large }
      bannerImage averageScore episodes seasonYear format status genres
      description(asHtml: false) siteUrl externalLinks { site url type }
    }
  }
}`;

function titleOf(a) { return a.title?.english || a.title?.romaji || a.title?.native || 'Anime'; }
function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function api(q, variables={}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {'Content-Type':'application/json', 'Accept':'application/json'},
    body: JSON.stringify({query:q, variables})
  });
  if (!res.ok) throw new Error(`API error (${res.status})`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'API gagal');
  return json.data;
}
function header() {
  return `<header class="topbar"><button class="brand" data-tab="home"><span class="brand-mark">K</span><span>KAIZEN<span class="purple">ANIME</span></span></button><button class="icon-btn" id="search-toggle" aria-label="Cari anime">⌕</button></header>
  <div class="search-wrap" id="search-wrap"><input id="search-input" placeholder="Cari judul anime..." autocomplete="off"/><button id="search-clear">✕</button></div>`;
}
function nav() {
  return `<nav class="bottom-nav">
    <button data-tab="home" class="${currentTab==='home'?'active':''}"><span>⌂</span>Beranda</button>
    <button data-tab="popular" class="${currentTab==='popular'?'active':''}"><span>✦</span>Populer</button>
    <button data-tab="favorites" class="${currentTab==='favorites'?'active':''}"><span>♡</span>Favorit</button>
  </nav>`;
}
function card(a) {
  const image = a.coverImage?.large || a.coverImage?.extraLarge || '';
  return `<button class="anime-card" data-anime="${a.id}">
    <div class="poster">${image ? `<img loading="lazy" src="${escapeHtml(image)}" alt="">` : '<div class="poster-fallback">KAIZEN</div>'}
      ${a.averageScore ? `<span class="score">★ ${(a.averageScore/10).toFixed(1)}</span>` : ''}
      <span class="poster-play">▶</span></div>
    <span class="card-title">${escapeHtml(titleOf(a))}</span>
    <span class="card-meta">${escapeHtml(a.seasonYear || 'Anime')} · ${escapeHtml(a.format || 'TV')}</span>
  </button>`;
}
function section(title, items, id='') {
  return `<section class="section" ${id ? `id="${id}"` : ''}><div class="section-heading"><h2>${title}</h2><span>${items.length} judul</span></div><div class="anime-grid">${items.map(card).join('')}</div></section>`;
}
function skeletons() {
  return `<div class="anime-grid">${Array.from({length:8},()=>'<div class="skeleton"></div>').join('')}</div>`;
}
function renderShell(content) {
  app.innerHTML = `${header()}<main>${content}</main>${nav()}`;
  bindGlobal();
}
function bindGlobal() {
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    currentTab = b.dataset.tab; loadTab();
  }));
  document.querySelector('#search-toggle')?.addEventListener('click', () => {
    const wrap = document.querySelector('#search-wrap');
    wrap.classList.toggle('visible');
    if (wrap.classList.contains('visible')) document.querySelector('#search-input').focus();
  });
  document.querySelector('#search-clear')?.addEventListener('click', () => {
    const input = document.querySelector('#search-input'); input.value=''; loadTab();
  });
  document.querySelector('#search-input')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    const val = e.target.value.trim();
    searchTimer = setTimeout(() => val ? searchAnime(val) : loadTab(), 350);
  });
  document.querySelectorAll('[data-anime]').forEach(b => b.addEventListener('click', () => showDetail(Number(b.dataset.anime))));
}
async function loadTab() {
  renderShell(`<div class="welcome"><div class="eyebrow">ANIME DISCOVERY</div><h1>Temukan dunia<br><span class="gradient">anime favoritmu.</span></h1><p>Jelajahi ribuan judul, cari cerita baru, dan simpan anime favoritmu.</p></div><div id="results">${skeletons()}</div>`);
  try {
    if (currentTab === 'favorites') {
      if (!favorites.length) { document.querySelector('#results').innerHTML = `<div class="empty"><div>♡</div><h2>Belum ada favorit</h2><p>Ketuk anime lalu simpan ke daftar favoritmu.</p></div>`; return; }
      const data = await api(query, {page:1,perPage:50,sort:['POPULARITY_DESC']});
      const all = data.Page.media.filter(a => favorites.includes(a.id));
      document.querySelector('#results').innerHTML = all.length ? section('Favorit kamu', all) : `<div class="empty">Anime favorit belum bisa dimuat. Coba lagi nanti.</div>`;
    } else {
      const data = await api(popularQuery, {page:1,perPage:24});
      const items = data.Page.media;
      const hero = items[0];
      document.querySelector('#results').innerHTML = `<div class="hero" style="background-image:linear-gradient(90deg,#100b1c 0%,rgba(16,11,28,.84) 48%,rgba(16,11,28,.25) 100%),linear-gradient(0deg,#100b1c,transparent),url('${escapeHtml(hero?.bannerImage || hero?.coverImage?.extraLarge || '')}')">
        <div class="hero-copy"><span class="pill">✦ PILIHAN HARI INI</span><h2>${escapeHtml(titleOf(hero || {}))}</h2><p>${escapeHtml((hero?.description || 'Jelajahi anime favoritmu di Kaizen Anime.').replace(/<[^>]*>/g,'').slice(0,130))}…</p><button class="primary-btn" data-anime="${hero?.id || ''}">Lihat detail <span>→</span></button></div></div>
        ${section('Lagi populer', items.slice(0,12))}
        ${section('Pilihan buat kamu', items.slice(12,24))}`;
      bindGlobal();
    }
  } catch (e) {
    document.querySelector('#results').innerHTML = `<div class="error"><div>⚠</div><h2>Belum bisa memuat anime</h2><p>${escapeHtml(e.message)}. Periksa koneksi internet lalu coba lagi.</p><button class="primary-btn" id="retry">Coba lagi</button></div>`;
    document.querySelector('#retry')?.addEventListener('click', loadTab);
  }
}
async function searchAnime(term) {
  const results = document.querySelector('#results');
  if (!results) return;
  results.innerHTML = `<div class="loading">Mencari “${escapeHtml(term)}”...</div>`;
  try {
    const data = await api(query, {page:1,perPage:30,sort:['SEARCH_MATCH'],search:term});
    results.innerHTML = data.Page.media.length ? section(`Hasil: ${escapeHtml(term)}`, data.Page.media) : `<div class="empty"><h2>Anime tidak ditemukan</h2><p>Coba kata kunci lain.</p></div>`;
    bindGlobal();
  } catch(e) { results.innerHTML = `<div class="error">Pencarian gagal: ${escapeHtml(e.message)}</div>`; }
}
async function showDetail(id) {
  if (!id) return;
  const previousTab = currentTab;
  app.innerHTML = `${header()}<main><div class="loading">Memuat detail anime...</div></main>${nav()}`;
  try {
    const data = await api(`query ($id: Int) { Media(id:$id,type:ANIME) { id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore episodes seasonYear format status genres description(asHtml:false) siteUrl externalLinks { site url type } } }`, {id});
    const a = data.Media;
    const links = (a.externalLinks || []).filter(l => l.url && /Crunchyroll|Netflix|Hulu|Disney|Bilibili|Muse Asia|Ani-One|Amazon|official/i.test(l.site || '')).slice(0,8);
    app.innerHTML = `${header()}<main><button class="back-btn" id="back">← Kembali</button><div class="detail-banner" style="background-image:linear-gradient(0deg,#100b1c 0%,rgba(16,11,28,.45) 100%),url('${escapeHtml(a.bannerImage || a.coverImage?.extraLarge || '')}')"></div><div class="detail-layout"><img class="detail-poster" src="${escapeHtml(a.coverImage?.extraLarge || '')}" alt=""><div class="detail-info"><div class="eyebrow">DETAIL ANIME</div><h1>${escapeHtml(titleOf(a))}</h1><div class="detail-meta">${a.averageScore ? `★ ${(a.averageScore/10).toFixed(1)}` : 'Belum ada skor'} · ${escapeHtml(a.seasonYear || 'Tahun tidak diketahui')} · ${escapeHtml(a.format || 'Anime')} · ${a.episodes || '?'} episode</div><div class="chips">${(a.genres||[]).slice(0,5).map(g=>`<span>${escapeHtml(g)}</span>`).join('')}</div><p class="description">${escapeHtml((a.description || 'Deskripsi belum tersedia.').replace(/<[^>]*>/g,'').replace(/\n/g,' '))}</p><div class="detail-actions"><button class="primary-btn" id="favorite">${favorites.includes(a.id) ? '♥ Tersimpan' : '♡ Tambah favorit'}</button><button class="secondary-btn" id="anilist">Info lengkap ↗</button></div></div></div><section class="section provider-section"><div class="section-heading"><h2>Tonton secara resmi</h2></div><p class="provider-note">Ketersediaan tergantung wilayah dan lisensi. Pilih penyedia resmi yang tersedia.</p><div class="provider-list">${links.length ? links.map(l=>`<a class="provider-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(l.site)}</span><span>↗</span></a>`).join('') : `<a class="provider-link" href="${escapeHtml(a.siteUrl)}" target="_blank" rel="noopener noreferrer"><span>Buka halaman anime AniList untuk info tautan resmi</span><span>↗</span></a>`}</div></section></main>${nav()}`;
    bindGlobal();
    document.querySelector('#back').addEventListener('click', () => { currentTab=previousTab; loadTab(); });
    document.querySelector('#favorite').addEventListener('click', () => {
      favorites = favorites.includes(a.id) ? favorites.filter(x=>x!==a.id) : [...favorites,a.id];
      localStorage.setItem('kaizen-favorites',JSON.stringify(favorites));
      document.querySelector('#favorite').textContent = favorites.includes(a.id) ? '♥ Tersimpan' : '♡ Tambah favorit';
    });
    document.querySelector('#anilist').addEventListener('click', () => window.open(a.siteUrl,'_blank','noopener'));
  } catch(e) {
    app.innerHTML = `${header()}<main><div class="error">Gagal memuat detail: ${escapeHtml(e.message)} <button id="back" class="primary-btn">Kembali</button></div></main>${nav()}`;
    document.querySelector('#back')?.addEventListener('click', loadTab);
  }
}
loadTab();