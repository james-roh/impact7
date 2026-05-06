// ============================================================
// 설정
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzVVcmoVGO-sIXMmxDIt0VBhzTmby9jHAY-k8XdkfEzknyQ-GAPeOTGpq5rgj4oWPWZ/exec';

const ALLOWED_ADMINS = [
  'roh@impact7.kr',
  'jon@impact7.kr',
  'nami@impact7.kr'
];

// ============================================================
// 상태 관리
// ============================================================
let currentUser = null;
let allData = [];
let currentRow = null;

// ============================================================
// 로그인 (간이 방식: 이메일 입력)
// ============================================================
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = prompt(
    '관리자 Gmail 주소를 입력하세요.\n\n' +
    '허용 계정:\n' +
    '- roh@impact7.kr\n' +
    '- jon@impact7.kr\n' +
    '- nami@impact7.kr'
  );

  if (!email) return;

  const trimmed = email.trim().toLowerCase();
  if (!ALLOWED_ADMINS.includes(trimmed)) {
    document.getElementById('loginError').textContent = '❌ 접근 권한이 없는 계정입니다.';
    return;
  }

  currentUser = trimmed;
  localStorage.setItem('impact7_user', trimmed);
  showMainScreen();
});

// 로그아웃
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('impact7_user');
  location.reload();
});

// 자동 로그인
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('impact7_user');
  if (saved && ALLOWED_ADMINS.includes(saved)) {
    currentUser = saved;
    showMainScreen();
  }
});

function showMainScreen() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'flex';
  document.getElementById('userInfo').textContent = '👤 ' + currentUser;
  loadList();
}

// ============================================================
// API 호출
// ============================================================
async function callApi(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));

  try {
    // Apps Script 웹앱은 단순 GET 요청에 CORS를 허용함
    // headers/mode/credentials를 일체 지정하지 않아야 함
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('API 오류:', err);
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}



// ============================================================
// 목록 로드
// ============================================================
async function loadList() {
  showLoading(true);
  const res = await callApi('list');
  showLoading(false);

  if (!res.success) {
    showToast('목록 조회 실패: ' + (res.message || res.error), 'error');
    return;
  }

  allData = res.data;
  renderTable();
}

function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const branch = document.getElementById('branchFilter').value;

  const filtered = allData.filter(row => {
    if (search && !(row.name + row.branch).toLowerCase().includes(search)) return false;
    if (status && row.status !== status) return false;
    if (branch && row.branch !== branch) return false;
    return true;
  });

  const tbody = document.getElementById('tableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">신청 내역이 없습니다.</td></tr>';
  } else {
    tbody.innerHTML = filtered.map(row => `
      <tr onclick="openDetail(${row.rowIndex})">
        <td>${formatDate(row.timestamp)}</td>
        <td><b>${escapeHtml(row.name)}</b></td>
        <td>${escapeHtml(row.branch || '-')}</td>
        <td>${escapeHtml(row.docType || '-')}</td>
        <td>${escapeHtml(row.purpose || '-')}</td>
        <td>
          ${row.status === '발급완료'
            ? '<span class="badge badge-done">발급완료</span>'
            : '<span class="badge badge-pending">대기</span>'}
          ${row.emailSent ? '<span class="badge badge-sent">메일발송</span>' : ''}
        </td>
        <td class="action-col">
          <button class="btn-detail" onclick="event.stopPropagation(); openDetail(${row.rowIndex})">
            상세
          </button>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('totalCount').textContent = allData.length;
  document.getElementById('pendingCount').textContent =
    allData.filter(r => r.status === '대기').length;
}

// ============================================================
// 상세 모달
// ============================================================
async function openDetail(rowIndex) {
  currentRow = rowIndex;
  const row = allData.find(r => r.rowIndex === rowIndex);
  if (!row) return;

  document.getElementById('modalBody').innerHTML = `
    <div class="detail-row"><div class="detail-label">신청일시</div>
      <div class="detail-value">${row.timestamp || '-'}</div></div>
    <div class="detail-row"><div class="detail-label">서류종류</div>
      <div class="detail-value">${escapeHtml(row.docType)}</div></div>
    <div class="detail-row"><div class="detail-label">이름</div>
      <div class="detail-value"><b>${escapeHtml(row.name)}</b></div></div>
    <div class="detail-row"><div class="detail-label">주민등록번호</div>
      <div class="detail-value">${escapeHtml(row.ssn)}</div></div>
    <div class="detail-row"><div class="detail-label">주소</div>
      <div class="detail-value">${escapeHtml(row.address)}</div></div>
    <div class="detail-row"><div class="detail-label">소속</div>
      <div class="detail-value">${escapeHtml(row.branch)}</div></div>
    <div class="detail-row"><div class="detail-label">직위</div>
      <div class="detail-value">${escapeHtml(row.position || '강사')}</div></div>
    <div class="detail-row"><div class="detail-label">입사일</div>
      <div class="detail-value">${row.hireDate || '-'}</div></div>
    <div class="detail-row"><div class="detail-label">이메일</div>
      <div class="detail-value">${escapeHtml(row.email)}</div></div>
    <div class="detail-row"><div class="detail-label">용도</div>
      <div class="detail-value">${escapeHtml(row.purpose)}</div></div>
    <div class="detail-row"><div class="detail-label">상태</div>
      <div class="detail-value">${
        row.status === '발급완료'
          ? '<span class="badge badge-done">발급완료</span>'
          : '<span class="badge badge-pending">대기</span>'
      }</div></div>
    ${row.issueDate ? `
    <div class="detail-row"><div class="detail-label">발급일시</div>
      <div class="detail-value">${row.issueDate}</div></div>` : ''}
    ${row.emailSent ? `
    <div class="detail-row"><div class="detail-label">메일발송</div>
      <div class="detail-value">${row.emailSent}</div></div>` : ''}
    ${row.handler ? `
    <div class="detail-row"><div class="detail-label">처리자</div>
      <div class="detail-value">${escapeHtml(row.handler)}</div></div>` : ''}
  `;

  const issueBtn = document.getElementById('issueBtn');
  const emailBtn = document.getElementById('emailBtn');
  const viewBtn = document.getElementById('viewPdfBtn');

  if (row.status === '발급완료') {
    issueBtn.textContent = '📄 재발급';
    emailBtn.disabled = false;
    viewBtn.style.display = 'inline-block';
    viewBtn.onclick = () => window.open(row.pdfUrl, '_blank');
  } else {
    issueBtn.textContent = '📄 발급하기';
    emailBtn.disabled = true;
    viewBtn.style.display = 'none';
  }

  document.getElementById('detailModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
  currentRow = null;
}

// ============================================================
// 발급
// ============================================================
document.getElementById('issueBtn').addEventListener('click', async () => {
  if (!currentRow) return;
  if (!confirm('재직증명서를 발급하시겠습니까?')) return;

  const btn = document.getElementById('issueBtn');
  btn.disabled = true;
  btn.textContent = '⏳ 발급 중...';

  const res = await callApi('issue', { row: currentRow });

  btn.disabled = false;

  if (res.success) {
    showToast(`✅ 발급 완료 (${res.docNumber})`, 'success');
    closeModal();
    await loadList();
  } else {
    showToast('❌ 발급 실패: ' + (res.message || res.error), 'error');
    btn.textContent = '📄 발급하기';
  }
});

// ============================================================
// 이메일 발송
// ============================================================
document.getElementById('emailBtn').addEventListener('click', async () => {
  if (!currentRow) return;
  const row = allData.find(r => r.rowIndex === currentRow);
  if (!row) return;

  if (!confirm(`${row.email} 으로 PDF를 발송하시겠습니까?`)) return;

  const btn = document.getElementById('emailBtn');
  btn.disabled = true;
  btn.textContent = '⏳ 발송 중...';

  const res = await callApi('sendEmail', { row: currentRow });

  btn.disabled = false;
  btn.textContent = '📧 이메일 발송';

  if (res.success) {
    showToast(`✅ 이메일 발송 완료 (${res.sentTo})`, 'success');
    closeModal();
    await loadList();
  } else {
    showToast('❌ 발송 실패: ' + (res.message || res.error), 'error');
  }
});

// ============================================================
// 필터 / 검색 / 새로고침
// ============================================================
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('statusFilter').addEventListener('change', renderTable);
document.getElementById('branchFilter').addEventListener('change', renderTable);
document.getElementById('refreshBtn').addEventListener('click', loadList);

// ============================================================
// 유틸
// ============================================================
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.className = 'toast', 3000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(str) {
  if (!str) return '-';
  return String(str).split(' ')[0];
}
