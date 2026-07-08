async function loadBrands() {
  const grid = document.getElementById('brand-grid');

  // instant-view cache: right after registering a brand we stash the fresh
  // index list here so it shows up immediately without waiting for GitHub
  // Pages to rebuild.
  const cached = sessionStorage.getItem('index-cache');
  if (cached) {
    sessionStorage.removeItem('index-cache');
    try {
      renderBrands(JSON.parse(cached));
      return;
    } catch (e) { /* fall through to fetch */ }
  }

  try {
    const res = await fetch('data/brands/index.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('index.json not found');
    const brands = await res.json();
    renderBrands(brands);
  } catch (e) {
    grid.innerHTML = '<p class="empty-msg">브랜드 목록을 불러오지 못했습니다. data/brands/index.json 파일을 확인하세요.</p>';
    console.error(e);
  }
}

function renderBrands(brands) {
  const grid = document.getElementById('brand-grid');
  if (!brands.length) {
    grid.innerHTML = '<p class="empty-msg">등록된 브랜드가 없습니다. 상단의 "새 브랜드 추가"로 시작하세요.</p>';
    return;
  }
  grid.innerHTML = brands.map(b => `
    <a class="brand-card" href="brand.html?brand=${encodeURIComponent(b.slug)}" style="--brand-color:${escapeAttr(b.color || '#8B3A2F')}">
      <div class="brand-card-color"></div>
      <div class="brand-card-body">
        <h2>${escapeHtml(b.name)}</h2>
        <p class="tagline">${escapeHtml(b.tagline || '')}</p>
        <p class="summary">${escapeHtml(b.summary || '')}</p>
      </div>
    </a>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
function escapeAttr(str) { return escapeHtml(str); }

loadBrands();
