// ---- shared GitHub Contents API helper ----
// Config saved in localStorage as: { owner, repo, branch, token }

const GH_CONFIG_KEY = 'brandhub-gh-config';

function getGithubConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem(GH_CONFIG_KEY));
    if (cfg && cfg.owner && cfg.repo && cfg.token) return cfg;
    return null;
  } catch (e) {
    return null;
  }
}

function saveGithubConfig(cfg) {
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
}

function clearGithubConfig() {
  localStorage.removeItem(GH_CONFIG_KEY);
}

function ghAuthHeaders(cfg) {
  return {
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github+json',
  };
}

// UTF-8 safe base64 encode/decode (for text content like JSON)
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

// GET the raw file record (sha + base64 content) from the repo. Returns null if it doesn't exist yet.
// Always bypasses HTTP caching so we never work off a stale sha (which causes 409 "does not match" errors on save).
async function ghGetFileRaw(cfg, path) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch || 'main')}&_=${Date.now()}`;
  const res = await fetch(url, { headers: ghAuthHeaders(cfg), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub에서 파일을 불러오지 못했습니다 (${res.status})`);
  }
  return res.json();
}

// GET a text file's current content (decoded) + sha. Returns null if it doesn't exist yet.
async function ghGetFile(cfg, path) {
  const json = await ghGetFileRaw(cfg, path);
  if (!json) return null;
  const text = b64DecodeUnicode(json.content.replace(/\n/g, ''));
  return { sha: json.sha, text };
}

// Create or update a file from an already-base64-encoded payload (used for binary files like images/PPT).
async function ghPutFileRaw(cfg, path, base64Content, message, sha) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const body = {
    message,
    content: base64Content,
    branch: cfg.branch || 'main',
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...ghAuthHeaders(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.message || `GitHub 저장에 실패했습니다 (${res.status})`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

// Create or update a text file (JSON etc). If sha is provided, it's an update; otherwise a create.
async function ghPutFile(cfg, path, contentText, message, sha) {
  return ghPutFileRaw(cfg, path, b64EncodeUnicode(contentText), message, sha);
}

// Create or update a text file, automatically re-fetching the sha and retrying once
// if GitHub rejects the write because our sha was stale (409 conflict). This is the
// safe entry point to use whenever you're not 100% sure your sha is fresh.
async function ghPutTextSmart(cfg, path, contentText, message) {
  let existing = await ghGetFileRaw(cfg, path);
  try {
    return await ghPutFileRaw(cfg, path, b64EncodeUnicode(contentText), message, existing ? existing.sha : undefined);
  } catch (e) {
    if (e.status === 409) {
      existing = await ghGetFileRaw(cfg, path);
      return await ghPutFileRaw(cfg, path, b64EncodeUnicode(contentText), message, existing ? existing.sha : undefined);
    }
    throw e;
  }
}

// quick check that owner/repo/token are valid and writable
async function ghTestConnection(cfg) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
  const res = await fetch(url, { headers: ghAuthHeaders(cfg), cache: 'no-store' });
  if (res.status === 404) throw new Error('저장소를 찾을 수 없습니다. 아이디/저장소 이름을 확인하세요.');
  if (res.status === 401) throw new Error('토큰이 유효하지 않습니다.');
  if (!res.ok) throw new Error(`연결 실패 (${res.status})`);
  const json = await res.json();
  if (json.permissions && json.permissions.push === false) {
    throw new Error('이 토큰에는 쓰기 권한이 없습니다. Contents 권한을 Read and write로 설정하세요.');
  }
  return json;
}

// ---- file upload helpers ----
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

function sanitizeFileName(name) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  return `${Date.now()}-${base || 'file'}${ext}`;
}

// Uploads an image file to images/{slug}/{filename} in the repo and returns the relative path.
async function uploadImageFile(file, slug) {
  const cfg = getGithubConfig();
  if (!cfg) throw new Error('먼저 GitHub 연결 설정을 해주세요.');
  if (!slug) throw new Error('브랜드명(슬러그)을 먼저 입력해주세요.');
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있어요.');
  if (file.size > 5 * 1024 * 1024) throw new Error('5MB 이하 이미지만 업로드할 수 있어요.');

  const base64 = await fileToBase64(file);
  const filename = sanitizeFileName(file.name);
  const path = `images/${slug}/${filename}`;
  const existing = await ghGetFileRaw(cfg, path);
  await ghPutFileRaw(cfg, path, base64, `이미지 업로드: ${path}`, existing ? existing.sha : undefined);
  return path;
}

// Uploads a PPT file to files/{slug}/{filename} in the repo and returns the relative path.
// Anyone who visits the published GitHub Pages site can then download it via a plain link.
async function uploadPresentationFile(file, slug) {
  const cfg = getGithubConfig();
  if (!cfg) throw new Error('먼저 GitHub 연결 설정을 해주세요.');
  if (!slug) throw new Error('브랜드명(슬러그)을 먼저 입력해주세요.');
  const validExt = ['.ppt', '.pptx'];
  const dot = file.name.lastIndexOf('.');
  const ext = dot > 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!validExt.includes(ext)) throw new Error('PPT 파일(.ppt 또는 .pptx)만 업로드할 수 있어요.');
  if (file.size > 25 * 1024 * 1024) throw new Error('25MB 이하 PPT 파일만 업로드할 수 있어요.');

  const base64 = await fileToBase64(file);
  const filename = sanitizeFileName(file.name);
  const path = `files/${slug}/${filename}`;
  const existing = await ghGetFileRaw(cfg, path);
  await ghPutFileRaw(cfg, path, base64, `PPT 업로드: ${path}`, existing ? existing.sha : undefined);
  return path;
}
