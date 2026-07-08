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

// UTF-8 safe base64 encode/decode
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

// GET a file's current content + sha. Returns null if the file doesn't exist yet.
async function ghGetFile(cfg, path) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch || 'main')}`;
  const res = await fetch(url, { headers: ghAuthHeaders(cfg) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub에서 파일을 불러오지 못했습니다 (${res.status})`);
  }
  const json = await res.json();
  const text = b64DecodeUnicode(json.content.replace(/\n/g, ''));
  return { sha: json.sha, text };
}

// Create or update a file. If sha is provided, it's an update; otherwise a create.
async function ghPutFile(cfg, path, contentText, message, sha) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const body = {
    message,
    content: b64EncodeUnicode(contentText),
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
    throw new Error(err.message || `GitHub 저장에 실패했습니다 (${res.status})`);
  }
  return res.json();
}

// quick check that owner/repo/token are valid and writable
async function ghTestConnection(cfg) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
  const res = await fetch(url, { headers: ghAuthHeaders(cfg) });
  if (res.status === 404) throw new Error('저장소를 찾을 수 없습니다. 아이디/저장소 이름을 확인하세요.');
  if (res.status === 401) throw new Error('토큰이 유효하지 않습니다.');
  if (!res.ok) throw new Error(`연결 실패 (${res.status})`);
  const json = await res.json();
  if (json.permissions && json.permissions.push === false) {
    throw new Error('이 토큰에는 쓰기 권한이 없습니다. Contents 권한을 Read and write로 설정하세요.');
  }
  return json;
}
