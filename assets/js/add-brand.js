// ---- generic repeatable-row helper ----
function makeRepeater(containerId, addBtnId, fields, initialRows = []) {
  const container = document.getElementById(containerId);
  let rows = initialRows.length ? initialRows.map(r => ({ ...r })) : [];

  function renderRow(row) {
    const div = document.createElement('div');
    div.className = 'repeat-row';
    fields.forEach(f => {
      const input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
      if (f.type && f.type !== 'textarea') input.type = f.type;
      input.placeholder = f.placeholder || '';
      input.value = row[f.key] ?? '';
      input.dataset.field = f.key;
      input.addEventListener('input', () => { row[f.key] = input.value; });
      div.appendChild(input);
    });
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      rows = rows.filter(r => r !== row);
      renderAll();
    });
    div.appendChild(removeBtn);
    return div;
  }

  function renderAll() {
    container.innerHTML = '';
    rows.forEach(row => container.appendChild(renderRow(row)));
  }

  document.getElementById(addBtnId).addEventListener('click', () => {
    const blank = {};
    fields.forEach(f => blank[f.key] = '');
    rows.push(blank);
    renderAll();
  });

  renderAll();
  return {
    getRows: () => rows.filter(r => Object.values(r).some(v => String(v).trim() !== '')),
  };
}

// ---- field definitions (shared by create + edit) ----
const COLOR_FIELDS = [
  { key: 'name', placeholder: '색상 이름 (예: 다크우드)' },
  { key: 'hex', placeholder: '#4A3728', type: 'color' },
  { key: 'usage', placeholder: '용도 (예: 메인 배경)' },
];
const SUB_FIELDS = [{ key: 'text', placeholder: '보조 카피 문구' }];
const MENU_FIELDS = [
  { key: 'name', placeholder: '메뉴명' },
  { key: 'price', placeholder: '판매가', type: 'number' },
  { key: 'cost', placeholder: '원가', type: 'number' },
  { key: 'desc', placeholder: '설명' },
  { key: 'image', placeholder: '이미지 경로/URL' },
];
const SEASON_FIELDS = [
  { key: 'season', placeholder: '지역/테마' },
  { key: 'name', placeholder: '메뉴명' },
  { key: 'period', placeholder: '운영 시기 (예: 2026-08)' },
  { key: 'desc', placeholder: '설명' },
  { key: 'image', placeholder: '이미지 경로/URL' },
];
const EVENT_FIELDS = [
  { key: 'title', placeholder: '이벤트명' },
  { key: 'period', placeholder: '기간 (예: 2026-08)' },
  { key: 'desc', placeholder: '설명' },
];

const urlParams = new URLSearchParams(location.search);
const editSlug = urlParams.get('edit');
let repeaters = {};
let existingCreatedAt = null; // preserved from the original file when editing

function toSlug(str) {
  return str.trim().toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function renderGhBanner() {
  const cfg = getGithubConfig();
  const el = document.getElementById('gh-banner');
  if (cfg) {
    el.innerHTML = `<div class="gh-banner ok"><span>✅ GitHub 연결됨: <b>${cfg.owner}/${cfg.repo}</b> (${cfg.branch})</span><a class="btn btn-sm" href="settings.html">연결 변경</a></div>`;
  } else {
    el.innerHTML = `<div class="gh-banner warn"><span>⚠️ 아직 GitHub 연결이 안 되어 있습니다. 등록하려면 먼저 연결하세요.</span><a class="btn btn-primary btn-sm" href="settings.html">연결 설정하기</a></div>`;
  }
}

async function loadExisting() {
  if (!editSlug) return null;
  try {
    const res = await fetch(`data/brands/${encodeURIComponent(editSlug)}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('not found');
    return await res.json();
  } catch (e) {
    alert('기존 브랜드 데이터를 불러오지 못했습니다.');
    return null;
  }
}

function fillBasicFields(existing) {
  existingCreatedAt = existing.createdAt || new Date().toISOString().slice(0, 10);
  document.getElementById('page-heading').textContent = '브랜드 수정';
  document.getElementById('doc-title').textContent = '브랜드 수정 - 브랜드 허브';
  document.getElementById('submit-btn').textContent = '브랜드 수정하기';
  document.getElementById('f-name').value = existing.name || '';
  const slugField = document.getElementById('f-slug');
  slugField.value = existing.slug || '';
  slugField.disabled = true;
  slugField.dataset.touched = '1';
  document.getElementById('f-color').value = existing.color || '#8B3A2F';
  document.getElementById('f-tagline').value = existing.tagline || '';
  document.getElementById('f-oneliner').value = existing.overview?.oneLiner || '';
  document.getElementById('f-story').value = existing.overview?.story || '';
  document.getElementById('f-concept').value = existing.overview?.concept || '';
  document.getElementById('f-target').value = existing.overview?.targetCustomer || '';
  document.getElementById('f-diff').value = existing.overview?.differentiation || '';
  document.getElementById('f-main-slogan').value = existing.copywriting?.mainSlogan || '';
}

async function init() {
  renderGhBanner();
  const existing = await loadExisting();
  if (existing) fillBasicFields(existing);

  repeaters.colors = makeRepeater('colors-list', 'add-color', COLOR_FIELDS,
    existing?.brandColors?.length ? existing.brandColors : [{ name: '', hex: '#8B3A2F', usage: '' }]);
  repeaters.subslogans = makeRepeater('subslogans-list', 'add-subslogan', SUB_FIELDS,
    (existing?.copywriting?.subSlogans || []).map(t => ({ text: t })));
  repeaters.lunch = makeRepeater('lunch-list', 'add-lunch', MENU_FIELDS, existing?.menu?.lunch || []);
  repeaters.dinner = makeRepeater('dinner-list', 'add-dinner', MENU_FIELDS, existing?.menu?.dinner || []);
  repeaters.season = makeRepeater('season-list', 'add-season', SEASON_FIELDS, existing?.seasonMenu || []);
  repeaters.events = makeRepeater('events-list', 'add-event', EVENT_FIELDS, existing?.events || []);

  document.getElementById('f-name').addEventListener('input', e => {
    const slugField = document.getElementById('f-slug');
    if (!slugField.dataset.touched) slugField.value = toSlug(e.target.value);
  });
  document.getElementById('f-slug').addEventListener('input', e => { e.target.dataset.touched = '1'; });

  document.getElementById('submit-btn').addEventListener('click', () => submitBrand(!!existing));
  document.getElementById('btn-preview').addEventListener('click', showPreview);
  document.getElementById('btn-download').addEventListener('click', downloadJson);
}

function numifyMenuRow(r) { return { ...r, price: Number(r.price) || 0, cost: Number(r.cost) || 0 }; }

function buildBrandData() {
  const name = document.getElementById('f-name').value.trim();
  const slug = document.getElementById('f-slug').value.trim() || toSlug(name);
  const color = document.getElementById('f-color').value;
  const tagline = document.getElementById('f-tagline').value.trim();

  return {
    slug,
    name,
    tagline,
    color,
    createdAt: editSlug ? existingCreatedAt : new Date().toISOString().slice(0, 10),
    overview: {
      oneLiner: document.getElementById('f-oneliner').value.trim(),
      story: document.getElementById('f-story').value.trim(),
      concept: document.getElementById('f-concept').value.trim(),
      targetCustomer: document.getElementById('f-target').value.trim(),
      differentiation: document.getElementById('f-diff').value.trim(),
    },
    brandColors: repeaters.colors.getRows(),
    copywriting: {
      mainSlogan: document.getElementById('f-main-slogan').value.trim(),
      subSlogans: repeaters.subslogans.getRows().map(r => r.text).filter(Boolean),
    },
    menu: {
      lunch: repeaters.lunch.getRows().map(numifyMenuRow),
      dinner: repeaters.dinner.getRows().map(numifyMenuRow),
    },
    seasonMenu: repeaters.season.getRows(),
    events: repeaters.events.getRows(),
  };
}

function currentJson() {
  const data = buildBrandData();
  return { data, text: JSON.stringify(data, null, 2) };
}

function showPreview() {
  const { text } = currentJson();
  const pre = document.getElementById('json-preview');
  pre.textContent = text;
  pre.style.display = 'block';
}

function downloadJson() {
  const { data, text } = currentJson();
  if (!data.slug) { alert('브랜드명 또는 슬러그를 입력해주세요.'); return; }
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${data.slug}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function setSubmitStatus(msg, state) {
  const el = document.getElementById('submit-status');
  el.textContent = msg;
  el.className = 'submit-status' + (state ? ' ' + state : '');
}

async function submitBrand(isEdit) {
  const cfg = getGithubConfig();
  if (!cfg) { setSubmitStatus('먼저 GitHub 연결 설정을 해주세요.', 'err'); return; }

  const data = buildBrandData();
  if (!data.name || !data.slug) { setSubmitStatus('브랜드명을 입력해주세요.', 'err'); return; }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  setSubmitStatus(isEdit ? '수정 내용을 GitHub에 저장하는 중...' : 'GitHub에 새 브랜드를 등록하는 중...');

  try {
    const filePath = `data/brands/${data.slug}.json`;
    const existingFile = await ghGetFile(cfg, filePath);
    if (!isEdit && existingFile) {
      throw new Error('이미 같은 슬러그의 브랜드가 있습니다. 슬러그를 다르게 입력해주세요.');
    }
    await ghPutFile(
      cfg, filePath, JSON.stringify(data, null, 2),
      isEdit ? `브랜드 수정: ${data.name}` : `새 브랜드 추가: ${data.name}`,
      existingFile ? existingFile.sha : undefined
    );

    // update index.json
    const idxPath = 'data/brands/index.json';
    const idxFile = await ghGetFile(cfg, idxPath);
    let idxArr = [];
    try { idxArr = idxFile ? JSON.parse(idxFile.text) : []; } catch (e) { idxArr = []; }
    const entry = {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      color: data.color,
      summary: data.overview.oneLiner || data.overview.concept || '',
    };
    const pos = idxArr.findIndex(b => b.slug === data.slug);
    if (pos >= 0) idxArr[pos] = entry; else idxArr.push(entry);
    await ghPutFile(cfg, idxPath, JSON.stringify(idxArr, null, 2), `브랜드 목록 업데이트: ${data.name}`, idxFile ? idxFile.sha : undefined);

    // instant local cache so the next page shows the fresh data right away,
    // without waiting for GitHub Pages to rebuild.
    sessionStorage.setItem(`brand-cache-${data.slug}`, JSON.stringify(data));
    sessionStorage.setItem('index-cache', JSON.stringify(idxArr));

    setSubmitStatus('저장 완료! 이동합니다...', 'ok');
    location.href = `brand.html?brand=${encodeURIComponent(data.slug)}`;
  } catch (e) {
    console.error(e);
    setSubmitStatus('저장 실패: ' + e.message, 'err');
    btn.disabled = false;
  }
}

init();
