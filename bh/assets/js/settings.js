function fillForm() {
  const cfg = getGithubConfig();
  if (!cfg) return;
  document.getElementById('f-owner').value = cfg.owner || '';
  document.getElementById('f-repo').value = cfg.repo || '';
  document.getElementById('f-branch').value = cfg.branch || 'main';
  document.getElementById('f-token').value = cfg.token || '';
}

function readForm() {
  return {
    owner: document.getElementById('f-owner').value.trim(),
    repo: document.getElementById('f-repo').value.trim(),
    branch: document.getElementById('f-branch').value.trim() || 'main',
    token: document.getElementById('f-token').value.trim(),
  };
}

function setStatus(msg, ok) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.style.color = ok === true ? 'var(--ok)' : ok === false ? 'var(--danger)' : '';
}

document.getElementById('btn-test').addEventListener('click', async () => {
  const cfg = readForm();
  if (!cfg.owner || !cfg.repo || !cfg.token) { setStatus('아이디, 저장소, 토큰을 모두 입력해주세요.', false); return; }
  setStatus('연결 확인 중...');
  try {
    await ghTestConnection(cfg);
    setStatus('연결 성공! 쓰기 권한도 확인했습니다.', true);
  } catch (e) {
    setStatus(e.message, false);
  }
});

document.getElementById('btn-save').addEventListener('click', () => {
  const cfg = readForm();
  if (!cfg.owner || !cfg.repo || !cfg.token) { setStatus('아이디, 저장소, 토큰을 모두 입력해주세요.', false); return; }
  saveGithubConfig(cfg);
  setStatus('저장했습니다. 이제 "새 브랜드 추가"에서 바로 등록할 수 있어요.', true);
});

document.getElementById('btn-clear').addEventListener('click', () => {
  clearGithubConfig();
  document.getElementById('f-owner').value = '';
  document.getElementById('f-repo').value = '';
  document.getElementById('f-branch').value = 'main';
  document.getElementById('f-token').value = '';
  setStatus('연결 정보를 삭제했습니다.', true);
});

fillForm();
