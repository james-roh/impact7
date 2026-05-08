const API_URL = 'https://script.google.com/macros/s/AKfycbzVVcmoVGO-sIXMmxDIt0VBhzTmby9jHAY-k8XdkfEzknyQ-GAPeOTGpq5rgj4oWPWZ/exec';

let currentUser = null;
let signaturePad = null;

// DOM 요소
const loginScreen = document.getElementById('loginScreen');
const formScreen = document.getElementById('formScreen');
const successScreen = document.getElementById('successScreen');
const loading = document.getElementById('loading');

// 페이지 로드 시 자동 로그인 체크
window.addEventListener('load', () => {
  const savedEmail = localStorage.getItem('resignUserEmail');
  if (savedEmail && savedEmail.endsWith('@impact7.kr')) {
    currentUser = savedEmail;
    showFormScreen();
  } else {
    showLoginScreen();
  }
});

// 로그인 버튼
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const errorEl = document.getElementById('loginError');

  if (!email) {
    errorEl.textContent = '이메일을 입력하세요.';
    return;
  }

  if (!email.endsWith('@impact7.kr')) {
    errorEl.textContent = 'impact7.kr 이메일만 사용 가능합니다.';
    return;
  }

  currentUser = email;
  localStorage.setItem('resignUserEmail', email);
  errorEl.textContent = '';
  showFormScreen();
});

// 로그아웃 버튼
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('resignUserEmail');
  currentUser = null;
  document.getElementById('loginEmail').value = '';
  showLoginScreen();
});

// 화면 전환
function showLoginScreen() {
  loginScreen.style.display = 'block';
  formScreen.style.display = 'none';
  successScreen.style.display = 'none';
}

function showFormScreen() {
  loginScreen.style.display = 'none';
  formScreen.style.display = 'block';
  successScreen.style.display = 'none';
  document.getElementById('loggedEmail').textContent = currentUser;
  initSignaturePad();
}

function showSuccessScreen(pdfUrl) {
  loginScreen.style.display = 'none';
  formScreen.style.display = 'none';
  successScreen.style.display = 'block';
  document.getElementById('pdfLink').href = pdfUrl;
}

// 서명 패드 초기화
function initSignaturePad() {
  const canvas = document.getElementById('signatureCanvas');
  resizeCanvas(canvas);
  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255,255,255)',
    penColor: 'rgb(0,0,0)'
  });

  window.addEventListener('resize', () => {
    const data = signaturePad.toData();
    resizeCanvas(canvas);
    signaturePad.clear();
    signaturePad.fromData(data);
  });
}

function resizeCanvas(canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);
}

// 서명 지우기
document.getElementById('clearSignature').addEventListener('click', () => {
  if (signaturePad) signaturePad.clear();
});

// 폼 제출
document.getElementById('resignForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (signaturePad.isEmpty()) {
    alert('서명을 입력해주세요.');
    return;
  }

  const ssn = document.getElementById('ssn').value;
  if (!/^\d{6}-[1-4]$/.test(ssn)) {
    alert('주민등록번호 형식을 확인해주세요. (예: 000101-3)');
    return;
  }

  if (!confirm('사직서를 제출하시겠습니까?\n제출 후에는 수정할 수 없습니다.')) {
    return;
  }

  const data = {
    name: document.getElementById('name').value.trim(),
    ssn: ssn,
    hireDate: document.getElementById('hireDate').value,
    address: document.getElementById('address').value.trim(),
    branch: document.getElementById('branch').value,
    position: document.getElementById('position').value,
    resignDate: document.getElementById('resignDate').value,
    reason: document.getElementById('reason').value.trim(),
    signature: signaturePad.toDataURL('image/png'),
    userEmail: currentUser
  };

  showLoading(true);
  try {
    const result = await submitResign(data);
    showLoading(false);
    if (result.success) {
      showSuccessScreen(result.pdfUrl);
    } else {
      alert('제출 실패: ' + (result.message || result.error || '알 수 없는 오류'));
    }
  } catch (err) {
    showLoading(false);
    alert('제출 중 오류가 발생했습니다: ' + err.message);
  }
});

// 백엔드 호출 (POST 방식 - 서명 데이터가 크기 때문)
async function submitResign(data) {
  const formData = new FormData();
  formData.append('action', 'submitResign');
  Object.keys(data).forEach(k => formData.append(k, data[k]));

  const res = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
}

function showLoading(show) {
  loading.style.display = show ? 'flex' : 'none';
}
