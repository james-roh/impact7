(function () {
    // CSS 삽입
    const style = document.createElement('style');
    style.textContent = `
        body {
            margin: 0;
            padding: 0;
            display: flex;
        }

        .sidebar {
            width: 220px;
            min-width: 220px;
            min-height: 100vh;
            background-color: #D6D2C8;
            display: flex;
            flex-direction: column;
            padding: 0;
            box-sizing: border-box;
            position: sticky;
            top: 0;
            height: 100vh;
            flex-shrink: 0;
        }

        .sidebar-logo {
            padding: 28px 20px 20px 20px;
            letter-spacing: -0.3px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            line-height: 1.4;
        }

        .sidebar-logo-sub {
            font-size: 11px;
            font-weight: 600;
            color: #1B1B1B;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .sidebar-logo-main {
            font-size: 18px;
            font-weight: 800;
            color: #1B6B45;
            letter-spacing: -0.5px;
        }

        .sidebar-menu {
            display: flex;
            flex-direction: column;
            padding: 16px 12px;
            gap: 4px;
        }

        .sidebar-menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 11px 14px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 600;
            color: rgba(0,0,0,0.5);
            cursor: pointer;
            transition: background-color 0.18s, color 0.18s;
            user-select: none;
        }

        .sidebar-menu-item:hover {
            background-color: rgba(0,0,0,0.07);
            color: #2C2C2C;
        }

        .sidebar-menu-item.active {
            background-color: #D4BC96;
            color: #1B1B1B;
            font-weight: 700;
        }

        .sidebar-menu-item i {
            width: 18px;
            text-align: center;
            font-size: 13px;
        }

        .content-area {
            flex: 1;
            overflow-y: auto;
            min-height: 100vh;
            background-color: #EDEAE3;
            min-width: 0;
        }
    `;
    document.head.appendChild(style);

    // 사이드바 HTML 삽입
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <div class="sidebar-logo-sub">IMPACT7</div>
            <div class="sidebar-logo-main">행정업무 MATE</div>
        </div>
        <div class="sidebar-menu">
            <div class="sidebar-menu-item" id="menu-admission" onclick="window.location.href='text.html'">
                <i class="fas fa-envelope-open-text"></i> 입학문자 생성기
            </div>
            <div class="sidebar-menu-item" id="menu-refund" onclick="window.location.href='refund.html'">
                <i class="fas fa-calculator"></i> 수강료 환불 계산기
            </div>
<div class="sidebar-menu-item" id="menu-inventory" onclick="window.location.href='재고관리.html'">
    <i class="fas fa-boxes-stacked"></i> 교재 재고 관리
</div>
<div class="sidebar-menu-item" id="menu-coming2" onclick="window.location.href='impact7book.html'">
    <i class="fas fa-book"></i> impact7 교재
</div>

            <div class="sidebar-menu-item" id="menu-coming3" onclick="alert('준비중')">
                <i class="fas fa-clock"></i> 준비중3
            </div>
        </div>
    `;

// 현재 페이지 메뉴 active 표시
const path = window.location.pathname;
if (path.includes('text.html')) {
    sidebar.querySelector('#menu-admission').classList.add('active');
} else if (path.includes('refund.html')) {
    sidebar.querySelector('#menu-refund').classList.add('active');
} else if (path.includes('재고관리.html')) {
    sidebar.querySelector('#menu-inventory').classList.add('active');
} else if (path.includes('impact7book.html')) {
    sidebar.querySelector('#menu-coming2').classList.add('active');
}

    // body 첫 번째 자식으로 사이드바 삽입
       document.addEventListener('DOMContentLoaded', function () {
        document.body.insertBefore(sidebar, document.body.firstChild);

        const contentArea = document.createElement('div');
           contentArea.className = 'content-area';
    contentArea.style.padding = '0';




        while (document.body.children.length > 1) {
            contentArea.appendChild(document.body.children[1]);
        }
        document.body.appendChild(contentArea);
    });

})();
