function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

async function loadBrands() {
  const listEl = document.getElementById('brand-list');

  // instant-view cache from a just-completed add/edit, so the new/updated
  // card shows immediately without waiting for GitHub Pages to rebuild.
  const cached = sessionStorage.getItem('index-cache');
  if (cached) {
    try {
      const brands = JSON.parse(cached);
      sessionStorage.removeItem('index-cache');
      renderList(brands);
      return;
    } catch (e) { /* fall through to fetch */ }
  }

  try {
    const res = await fetch('data/brands/index.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('index not found');
    const brands = await res.json();
    renderList(brands);
  } catch (e) {
    listEl.innerHTML = '<p class="empty-msg">아직 등록된 브랜드가 없습니다. "브랜드 추가" 버튼으로 첫 브랜드를 등록해보세요.</p>';
    console.error(e);
  }
}

function renderList(brands) {
  const listEl = document.getElementById('brand-list');
  if (!brands || !brands.length) {
    listEl.innerHTML = '<p class="empty-msg">아직 등록된 브랜드가 없습니다. "브랜드 추가" 버튼으로 첫 브랜드를 등록해보세요.</p>';
    return;
  }
  listEl.innerHTML = brands.map(b => `
    <a class="brand-card" href="brand.html?brand=${encodeURIComponent(b.slug)}">
      <div class="swatch-bar" style="background:${escapeHtml(b.color || '#8B3A2F')}"></div>
      <h3>${escapeHtml(b.name)}</h3>
      <p>${escapeHtml(b.tagline || '')}</p>
    </a>
  `).join('');
}

loadBrands();
