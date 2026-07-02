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
// 자동 로그인 (로그인 생략 - 통합 페이지에서 사용)
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  currentUser = ALLOWED_ADMINS[0];
  showMainScreen();
});

function showMainScreen() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'none';

  const mainScreen = document.getElementById('mainScreen');
  if (mainScreen) mainScreen.style.display = 'block';

  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) userInfoEl.textContent = '👤 ' + currentUser;

  loadList();
  if (window.lucide) {
    document.querySelectorAll('svg.lucide').forEach(svg => {
      const cls = (svg.getAttribute('class') || '').match(/lucide-([\w-]+)/);
      const name = cls ? cls[1] : null;
      if (name) {
        const i = document.createElement('i');
        i.setAttribute('data-lucide', name);
        svg.replaceWith(i);
      }
    });
    lucide.createIcons();
  }
}

// ============================================================
// API 호출
// ============================================================
async function callApi(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
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
    const effectiveStatus = (row.sheetType === 'resign') ? '발급완료' : row.status;
    if (status && effectiveStatus !== status) return false;
    if (branch && row.branch !== branch) return false;
    return true;
  });

  const tbody = document.getElementById('tableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">신청 내역이 없습니다.</td></tr>';
  } else {
    tbody.innerHTML = filtered.map(row => {
      const isResign = (row.sheetType === 'resign');
      const sheetTypeAttr = row.sheetType || '';
      const statusBadge = isResign
        ? '<span class="badge badge-done">발급완료</span>'
        : (row.status === '발급완료'
            ? '<span class="badge badge-done">발급완료</span>'
            : '<span class="badge badge-pending">대기</span>');
      return `
        <tr onclick="openDetail(${row.rowIndex}, '${sheetTypeAttr}')">
          <td>${formatDate(row.timestamp)}</td>
          <td><b>${escapeHtml(row.name)}</b></td>
          <td>${escapeHtml(row.branch||'-')}</td>
          <td>${escapeHtml(row.docType||'-')}</td>
          <td>${escapeHtml(row.purpose||'-')}</td>
          <td>
            ${statusBadge}
            ${row.emailSent ? '<span class="badge badge-sent">메일발송</span>' : ''}
          </td>
          <td class="action-col"><button class="btn-detail" onclick="event.stopPropagation(); openDetail(${row.rowIndex}, '${sheetTypeAttr}')">상세</button></td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('totalCount').textContent = allData.length;
  document.getElementById('pendingCount').textContent =
    allData.filter(r => r.sheetType !== 'resign' && r.status === '대기').length;

  if (window.lucide) {
    document.querySelectorAll('svg.lucide').forEach(svg => {
      const cls = (svg.getAttribute('class') || '').match(/lucide-([\w-]+)/);
      const name = cls ? cls[1] : null;
      if (name) {
        const i = document.createElement('i');
        i.setAttribute('data-lucide', name);
        svg.replaceWith(i);
      }
    });
    lucide.createIcons();
  }
}

// ============================================================
// 상세 모달
// ============================================================
async function openDetail(rowIndex, sheetType) {
  currentRow = rowIndex;
  const row = allData.find(r => r.rowIndex === rowIndex && (r.sheetType||'') === (sheetType||''));
  if (!row) return;

  const isResign = (row.sheetType === 'resign');

  if (isResign) {
    document.getElementById('modalBody').innerHTML = `
      <div class="detail-row"><div class="detail-label">제출일시</div><div class="detail-value">${row.timestamp || '-'}</div></div>
      <div class="detail-row"><div class="detail-label">서류종류</div><div class="detail-value">${escapeHtml(row.docType)}</div></div>
      <div class="detail-row"><div class="detail-label">이름</div><div class="detail-value"><b>${escapeHtml(row.name)}</b></div></div>
      <div class="detail-row"><div class="detail-label">주민등록번호</div><div class="detail-value">${escapeHtml(row.ssn)}</div></div>
      <div class="detail-row"><div class="detail-label">주소</div><div class="detail-value">${escapeHtml(row.address)}</div></div>
      <div class="detail-row"><div class="detail-label">소속</div><div class="detail-value">${escapeHtml(row.branch)}</div></div>
      <div class="detail-row"><div class="detail-label">직위</div><div class="detail-value">${escapeHtml(row.position || '-')}</div></div>
      <div class="detail-row"><div class="detail-label">입사일</div><div class="detail-value">${row.hireDate || '-'}</div></div>
      <div class="detail-row"><div class="detail-label">사직일</div><div class="detail-value">${row.resignDate || '-'}</div></div>
      <div class="detail-row"><div class="detail-label">사유</div><div class="detail-value">${escapeHtml(row.reason || '-')}</div></div>
      <div class="detail-row"><div class="detail-label">제출자</div><div class="detail-value">${escapeHtml(row.email || '-')}</div></div>
      <div class="detail-row"><div class="detail-label">상태</div><div class="detail-value"><span class="badge badge-done">발급완료</span></div></div>
    `;

    const issueBtn = document.getElementById('issueBtn');
    const emailBtn = document.getElementById('emailBtn');
    const viewBtn = document.getElementById('viewPdfBtn');

    issueBtn.style.display = 'none';
    emailBtn.style.display = 'none';
    viewBtn.style.display = 'inline-block';
    viewBtn.onclick = () => window.open(row.pdfUrl, '_blank');

    if (window.lucide) {
      document.querySelectorAll('svg.lucide').forEach(svg => {
        const cls = (svg.getAttribute('class') || '').match(/lucide-([\w-]+)/);
        const name = cls ? cls[1] : null;
        if (name) {
          const i = document.createElement('i');
          i.setAttribute('data-lucide', name);
          svg.replaceWith(i);
        }
      });
      lucide.createIcons();
    }
    document.getElementById('detailModal').style.display = 'flex';
    return;
  }

  // ✅ 여기가 수정된 부분 — 퇴사일 조건부 추가
  document.getElementById('modalBody').innerHTML = `
    <div class="detail-row"><div class="detail-label">신청일시</div><div class="detail-value">${row.timestamp || '-'}</div></div>
    <div class="detail-row"><div class="detail-label">서류종류</div><div class="detail-value">${escapeHtml(row.docType)}</div></div>
    <div class="detail-row"><div class="detail-label">이름</div><div class="detail-value"><b>${escapeHtml(row.name)}</b></div></div>
    <div class="detail-row"><div class="detail-label">주민등록번호</div><div class="detail-value">${escapeHtml(row.ssn)}</div></div>
    <div class="detail-row"><div class="detail-label">주소</div><div class="detail-value">${escapeHtml(row.address)}</div></div>
    <div class="detail-row"><div class="detail-label">소속</div><div class="detail-value">${escapeHtml(row.branch)}</div></div>
    <div class="detail-row"><div class="detail-label">직위</div><div class="detail-value">${escapeHtml(row.position || '강사')}</div></div>
    <div class="detail-row"><div class="detail-label">입사일</div><div class="detail-value">${row.hireDate || '-'}</div></div>
${row.resignDate ? `
<div class="detail-row"><div class="detail-label">퇴사일</div><div class="detail-value">${escapeHtml(row.resignDate)}</div></div>
` : ''}

    <div class="detail-row"><div class="detail-label">이메일</div><div class="detail-value">${escapeHtml(row.email)}</div></div>
    <div class="detail-row"><div class="detail-label">용도</div><div class="detail-value">${escapeHtml(row.purpose)}</div></div>
    <div class="detail-row"><div class="detail-label">상태</div><div class="detail-value">${row.status === '발급완료' ? '<span class="badge badge-done">발급완료</span>' : '<span class="badge badge-pending">대기</span>'}</div></div>
  `;

  const issueBtn = document.getElementById('issueBtn');
  const emailBtn = document.getElementById('emailBtn');
  const viewBtn = document.getElementById('viewPdfBtn');

  issueBtn.style.display = 'inline-block';
  emailBtn.style.display = 'inline-block';

  if (row.status === '발급완료') {
    issueBtn.innerHTML = '<i data-lucide="file-text"></i> 재발급';
    emailBtn.disabled = false;
    viewBtn.style.display = 'inline-block';
    viewBtn.onclick = () => window.open(row.pdfUrl, '_blank');
  } else {
    issueBtn.innerHTML = '<i data-lucide="file-text"></i> 발급하기';
    emailBtn.disabled = true;
    viewBtn.style.display = 'none';
  }

  if (window.lucide) {
    document.querySelectorAll('svg.lucide').forEach(svg => {
      const cls = (svg.getAttribute('class') || '').match(/lucide-([\w-]+)/);
      const name = cls ? cls[1] : null;
      if (name) {
        const i = document.createElement('i');
        i.setAttribute('data-lucide', name);
        svg.replaceWith(i);
      }
    });
    lucide.createIcons();
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
  if (!confirm('요청하신 서류를 발급하시겠습니까?')) return;

  const btn = document.getElementById('issueBtn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> 발급 중...';

  const res = await callApi('issue', { row: currentRow });
  btn.disabled = false;

  if (res.success) {
    showToast('✅ 발급 완료 (' + res.docNumber + ')', 'success');
    closeModal();
    await loadList();
  } else {
    showToast('❌ 발급 실패: ' + (res.message || res.error), 'error');
    btn.innerHTML = '<i data-lucide="file-text"></i> 발급하기';
  }
});

// ============================================================
// 이메일 발송
// ============================================================
document.getElementById('emailBtn').addEventListener('click', async () => {
  if (!currentRow) return;
  const row = allData.find(r => r.rowIndex === currentRow);
  if (!row) return;

  if (!confirm(row.email + ' 으로 PDF를 발송하시겠습니까?')) return;

  const btn = document.getElementById('emailBtn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> 발송 중...';

  const res = await callApi('sendEmail', { row: currentRow });
  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="mail"></i> 이메일 발송';

  if (res.success) {
    showToast('✅ 이메일 발송 완료 (' + res.sentTo + ')', 'success');
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

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + (type || '');
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
