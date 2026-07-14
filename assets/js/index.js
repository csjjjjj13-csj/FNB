function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

let currentBrands = [];

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
    } catch (e) { /* fall through */ }
  }

  // If GitHub credentials are configured (i.e. this is the owner's own browser),
  // read the list straight from the GitHub API instead of the published
  // GitHub Pages copy. The API always reflects the very latest commit, whereas
  // Pages can take anywhere from a few seconds to a couple of minutes to
  // rebuild — reading from the API makes your own edits show up instantly.
  const cfg = getGithubConfig();
  if (cfg) {
    try {
      const file = await ghGetFile(cfg, 'data/brands/index.json');
      const brands = file ? JSON.parse(file.text) : [];
      renderList(brands);
      return;
    } catch (e) {
      console.error('GitHub API 목록 조회 실패, 배포된 사이트 데이터로 대체합니다.', e);
    }
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
  currentBrands = brands || [];
  const listEl = document.getElementById('brand-list');
  if (!currentBrands.length) {
    listEl.innerHTML = '<p class="empty-msg">아직 등록된 브랜드가 없습니다. "브랜드 추가" 버튼으로 첫 브랜드를 등록해보세요.</p>';
    return;
  }
  listEl.innerHTML = currentBrands.map(b => `
    <div class="brand-card-wrap">
      <a class="brand-card" href="brand.html?brand=${encodeURIComponent(b.slug)}">
        <div class="swatch-bar" style="background:${escapeHtml(b.color || '#8B3A2F')}"></div>
        <h3>${escapeHtml(b.name)}</h3>
        <p>${escapeHtml(b.tagline || '')}</p>
      </a>
      <button type="button" class="brand-delete-btn" data-slug="${escapeHtml(b.slug)}" data-name="${escapeHtml(b.name)}" title="브랜드 삭제">✕</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.brand-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      deleteBrand(btn.dataset.slug, btn.dataset.name);
    });
  });
}

async function deleteBrand(slug, name) {
  const cfg = getGithubConfig();
  if (!cfg) {
    alert('먼저 설정 페이지에서 GitHub 연결 정보를 저장해주세요.');
    return;
  }
  if (!confirm(`"${name}" 브랜드를 삭제할까요?\n브랜드 데이터가 저장소에서 삭제되며 되돌릴 수 없습니다.\n(업로드된 이미지·PPT 파일은 함께 삭제되지 않습니다.)`)) {
    return;
  }
  try {
    const brandPath = `data/brands/${slug}.json`;
    const existing = await ghGetFileRaw(cfg, brandPath);
    if (existing) {
      await ghDeleteFile(cfg, brandPath, existing.sha, `브랜드 삭제: ${name}`);
    }

    const idxPath = 'data/brands/index.json';
    const idxExisting = await ghGetFile(cfg, idxPath);
    let indexArr = [];
    if (idxExisting) {
      try { indexArr = JSON.parse(idxExisting.text); } catch (e) { indexArr = []; }
    }
    indexArr = indexArr.filter(b => b.slug !== slug);
    await ghPutTextSmart(cfg, idxPath, JSON.stringify(indexArr, null, 2), `브랜드 목록 갱신 (삭제): ${name}`);

    sessionStorage.removeItem(`brand-cache-${slug}`);
    renderList(indexArr);
  } catch (e) {
    alert('삭제 실패: ' + e.message);
    console.error(e);
  }
}

loadBrands();
