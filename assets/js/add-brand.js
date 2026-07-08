// ---- tabs ----
function initTabs(tabsId) {
  document.getElementById(tabsId).addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll(`#${tabsId} .tab-btn`).forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
  });
}

function currentSlug() {
  return document.getElementById('f-slug').value.trim();
}

// ---- single image field (logo) ----
function createImageField(containerId, initialValue) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'image-field-row';

  const preview = document.createElement('img');
  preview.className = 'image-field-preview';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = '이미지 경로 또는 URL (파일 업로드시 자동 입력)';

  const fileLabel = document.createElement('label');
  fileLabel.className = 'btn btn-sm file-upload-btn';
  fileLabel.textContent = '파일 선택';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileLabel.appendChild(fileInput);

  const status = document.createElement('span');
  status.className = 'hint';

  function setValue(v) {
    textInput.value = v || '';
    if (v) { preview.src = v; preview.style.display = 'block'; }
    else { preview.style.display = 'none'; }
  }
  setValue(initialValue);

  textInput.addEventListener('input', () => setValue(textInput.value));
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    status.textContent = '업로드 중...';
    try {
      const path = await uploadImageFile(file, currentSlug());
      setValue(path);
      status.textContent = '업로드 완료';
      setTimeout(() => { status.textContent = ''; }, 1500);
    } catch (e) {
      status.textContent = '업로드 실패: ' + e.message;
    }
    fileInput.value = '';
  });

  row.append(preview, textInput, fileLabel, status);
  container.appendChild(row);
  return { getValue: () => textInput.value.trim() };
}

// ---- generic repeatable-row helper (supports text / number / color / textarea / image / file fields) ----
function makeRepeater(containerId, addBtnId, fields, initialRows = []) {
  const container = document.getElementById(containerId);
  let rows = initialRows.length ? initialRows.map(r => ({ ...r })) : [];

  function renderImageMiniField(row, f) {
    const wrap = document.createElement('div');
    wrap.className = 'image-field-mini';
    const preview = document.createElement('img');
    preview.className = 'image-field-preview-sm';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = f.placeholder || '이미지 경로/URL';
    input.value = row[f.key] ?? '';

    function refresh() {
      if (input.value) { preview.src = input.value; preview.style.display = 'block'; }
      else { preview.style.display = 'none'; }
    }
    refresh();

    input.addEventListener('input', () => { row[f.key] = input.value; refresh(); });

    const fileLabel = document.createElement('label');
    fileLabel.className = 'btn btn-sm file-upload-btn';
    fileLabel.textContent = '파일';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileLabel.appendChild(fileInput);

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      fileLabel.textContent = '업로드중...';
      try {
        const path = await uploadImageFile(file, currentSlug());
        row[f.key] = path;
        input.value = path;
        refresh();
      } catch (e) {
        alert('이미지 업로드 실패: ' + e.message);
      }
      fileLabel.textContent = '파일';
      fileInput.value = '';
    });

    const labelEl = document.createElement('label');
    labelEl.textContent = f.label || '이미지';
    wrap.append(labelEl, preview, input, fileLabel);
    return wrap;
  }

  function renderFileMiniField(row, f) {
    const wrap = document.createElement('div');
    wrap.className = 'file-field-mini';

    const labelEl = document.createElement('label');
    labelEl.textContent = f.label || '파일';

    const info = document.createElement('div');
    info.className = 'file-field-info';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = f.placeholder || '파일 경로/URL';
    input.value = row[f.key] ?? '';

    function refresh() {
      if (input.value) {
        const name = decodeURIComponent(input.value.split('/').pop());
        info.innerHTML = `📄 <a href="${input.value}" target="_blank" rel="noopener">${name}</a>`;
      } else {
        info.textContent = '등록된 파일 없음';
      }
    }
    refresh();

    input.addEventListener('input', () => { row[f.key] = input.value; refresh(); });

    const fileLabel = document.createElement('label');
    fileLabel.className = 'btn btn-sm file-upload-btn';
    fileLabel.textContent = '파일 선택';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = f.accept || '';
    fileInput.style.display = 'none';
    fileLabel.appendChild(fileInput);

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      fileLabel.textContent = '업로드중...';
      try {
        const path = await uploadPresentationFile(file, currentSlug());
        row[f.key] = path;
        input.value = path;
        refresh();
      } catch (e) {
        alert('파일 업로드 실패: ' + e.message);
      }
      fileLabel.textContent = '파일 선택';
      fileInput.value = '';
    });

    wrap.append(labelEl, info, input, fileLabel);
    return wrap;
  }

  function renderRow(row) {
    const div = document.createElement('div');
    div.className = 'repeat-row';
    fields.forEach(f => {
      if (f.type === 'image') {
        div.appendChild(renderImageMiniField(row, f));
        return;
      }
      if (f.type === 'file') {
        div.appendChild(renderFileMiniField(row, f));
        return;
      }
      const wrap = document.createElement('div');
      wrap.className = 'labeled-input';
      const labelEl = document.createElement('label');
      labelEl.textContent = f.label || f.placeholder || '';
      const input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
      if (f.type && f.type !== 'textarea') input.type = f.type;
      input.placeholder = f.placeholder || '';
      input.value = row[f.key] ?? '';
      input.addEventListener('input', () => { row[f.key] = input.value; });
      wrap.append(labelEl, input);
      div.appendChild(wrap);
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
  { key: 'name', label: '색상 이름', placeholder: '예: 다크우드' },
  { key: 'hex', label: '색상값', placeholder: '#4A3728', type: 'color' },
  { key: 'usage', label: '용도', placeholder: '예: 메인 배경' },
];
const SUB_FIELDS = [{ key: 'text', label: '보조 카피', placeholder: '보조 카피 문구' }];
const MENU_FIELDS = [
  { key: 'name', label: '메뉴명', placeholder: '예: 보쌈쟁반' },
  { key: 'price', label: '판매가(원)', placeholder: '예: 12900', type: 'number' },
  { key: 'cost', label: '원가(원)', placeholder: '예: 4600', type: 'number' },
  { key: 'desc', label: '설명', placeholder: '메뉴 구성 설명' },
  { key: 'image', label: '메뉴 사진', type: 'image' },
];
const SEASON_FIELDS = [
  { key: 'season', label: '지역/테마', placeholder: '예: 강원' },
  { key: 'name', label: '메뉴명', placeholder: '예: 강원 메밀감자 쟁반' },
  { key: 'period', label: '운영 시기', placeholder: '예: 2026-08' },
  { key: 'desc', label: '설명', placeholder: '메뉴 설명' },
  { key: 'image', label: '메뉴 사진', type: 'image' },
];
const EVENT_FIELDS = [
  { key: 'title', label: '이벤트명', placeholder: '예: 오픈 기념 이벤트' },
  { key: 'period', label: '기간', placeholder: '예: 2026-08' },
  { key: 'desc', label: '설명', placeholder: '이벤트 설명' },
];
const BRANDIMAGE_FIELDS = [
  { key: 'image', label: '이미지', type: 'image' },
  { key: 'caption', label: '설명/캡션', placeholder: '예: 매장 전경' },
];
const PRESENTATION_FIELDS = [
  { key: 'title', label: '자료명', placeholder: '예: 쟁반집 사업계획서' },
  { key: 'path', label: 'PPT 파일', type: 'file', accept: '.ppt,.pptx' },
];

const urlParams = new URLSearchParams(location.search);
const editSlug = urlParams.get('edit');
let repeaters = {};
let logoField = null;
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
  initTabs('form-tabs');
  renderGhBanner();
  const existing = await loadExisting();
  if (existing) fillBasicFields(existing);

  logoField = createImageField('logo-field', existing?.logo || '');

  repeaters.presentations = makeRepeater('presentations-list', 'add-presentation', PRESENTATION_FIELDS, existing?.presentations || []);
  repeaters.brandImages = makeRepeater('brandimages-list', 'add-brandimage', BRANDIMAGE_FIELDS, existing?.brandImages || []);
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
    logo: logoField ? logoField.getValue() : '',
    brandImages: repeaters.brandImages ? repeaters.brandImages.getRows() : [],
    presentations: repeaters.presentations ? repeaters.presentations.getRows() : [],
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

    if (!isEdit) {
      const already = await ghGetFileRaw(cfg, filePath);
      if (already) throw new Error('이미 같은 슬러그의 브랜드가 있습니다. 슬러그를 다르게 입력해주세요.');
    }

    // ghPutTextSmart always fetches a fresh sha right before writing (and retries
    // once if GitHub still rejects it as stale), so this is safe even right after
    // an image/PPT upload touched other files in the repo.
    await ghPutTextSmart(cfg, filePath, JSON.stringify(data, null, 2), isEdit ? `브랜드 수정: ${data.name}` : `새 브랜드 추가: ${data.name}`);

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
    await ghPutTextSmart(cfg, idxPath, JSON.stringify(idxArr, null, 2), `브랜드 목록 업데이트: ${data.name}`);

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
