const ownerEl = document.getElementById('gh-owner');
const repoEl = document.getElementById('gh-repo');
const branchEl = document.getElementById('gh-branch');
const tokenEl = document.getElementById('gh-token');
const statusEl = document.getElementById('settings-status');

function loadIntoForm() {
  const cfg = getGithubConfig();
  if (!cfg) return;
  ownerEl.value = cfg.owner || '';
  repoEl.value = cfg.repo || '';
  branchEl.value = cfg.branch || 'main';
  tokenEl.value = cfg.token || '';
}

function readForm() {
  return {
    owner: ownerEl.value.trim(),
    repo: repoEl.value.trim(),
    branch: branchEl.value.trim() || 'main',
    token: tokenEl.value.trim(),
  };
}

document.getElementById('btn-save').addEventListener('click', () => {
  const cfg = readForm();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    statusEl.textContent = '사용자명, 저장소, 토큰은 필수입니다.';
    return;
  }
  saveGithubConfig(cfg);
  statusEl.textContent = '저장되었습니다.';
});

document.getElementById('btn-test').addEventListener('click', async () => {
  const cfg = readForm();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    statusEl.textContent = '사용자명, 저장소, 토큰을 먼저 입력하세요.';
    return;
  }
  statusEl.textContent = '연결 확인 중...';
  try {
    await ghTestConnection(cfg);
    statusEl.textContent = '✅ 연결 성공! 쓰기 권한이 확인되었습니다.';
  } catch (e) {
    statusEl.textContent = '❌ ' + e.message;
  }
});

document.getElementById('btn-clear').addEventListener('click', () => {
  clearGithubConfig();
  ownerEl.value = '';
  repoEl.value = '';
  branchEl.value = 'main';
  tokenEl.value = '';
  statusEl.textContent = '연결 정보를 삭제했습니다.';
});

loadIntoForm();
