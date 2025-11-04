// 가보자고 페이지 JavaScript - API 데이터 기반 최신 디자인

let allTravelItems = [];
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 12;

document.addEventListener('DOMContentLoaded', function() {
  loadCategoriesSidebar();

  const form = document.getElementById('travelSearchForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const q = document.getElementById('travelQuery').value.trim();
      currentFilter = 'all';
      updateFilterTags();
      loadTravelJson(q);
    });
  }

  // 필터 태그 클릭 이벤트
  const filterTags = document.querySelectorAll('.filter-tag');
  filterTags.forEach(tag => {
    tag.addEventListener('click', function() {
      currentFilter = this.dataset.filter;
      updateFilterTags();
      filterAndDisplay();
    });
  });

  loadTravelJson();
});

function updateFilterTags() {
  const filterTags = document.querySelectorAll('.filter-tag');
  filterTags.forEach(tag => {
    if (tag.dataset.filter === currentFilter) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });
}

function loadCategoriesSidebar() {
  fetch('data/categories.json?v=' + Date.now())
    .then(r => r.json())
    .then(list => {
      const ul = document.getElementById('categoryList');
      if (!ul) return;
      ul.innerHTML = list.map(c => `
        <li class="mb-2">
          <a href="${c.slug}.html" class="text-decoration-none d-flex justify-content-between align-items-center">
            <span>
              <i class="fas ${c.icon} me-2 text-primary"></i>${c.name}
            </span>
            <span class="badge bg-secondary">${c.count}</span>
          </a>
        </li>`).join('');
    }).catch(()=>{});
}

async function loadTravelJson(query = '') {
  const el = document.getElementById('travelContainer');
  if (el) {
    el.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">여행 정보를 불러오는 중...</p>
      </div>
    `;
  }
  
  try {
    const res = await fetch('data/go_now.json?v=' + Date.now());
    const data = await res.json();
    allTravelItems = Array.isArray(data.items) ? data.items : [];
    
    // 검색어가 있으면 필터링
    if (query) {
      allTravelItems = allTravelItems.filter(item => {
        const title = (item.title || '').toLowerCase();
        const addr = (item.addr1 || '').toLowerCase();
        const queryLower = query.toLowerCase();
        return title.includes(queryLower) || addr.includes(queryLower);
      });
    }
    
    updateStats();
    filterAndDisplay();
  } catch (e) {
    console.error('데이터 로드 실패:', e);
    if (el) {
      el.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      `;
    }
  }
}

function updateStats() {
  const total = allTravelItems.length;
  const seoul = allTravelItems.filter(item => 
    (item.addr1 || '').includes('서울')
  ).length;
  
  document.getElementById('totalCount').textContent = total.toLocaleString();
  document.getElementById('seoulCount').textContent = seoul.toLocaleString();
}

function filterAndDisplay() {
  let filtered = allTravelItems;
  
  // 지역 필터 적용
  if (currentFilter !== 'all') {
    filtered = filtered.filter(item => {
      const addr = item.addr1 || '';
      return addr.includes(currentFilter);
    });
  }
  
  // 통계 업데이트
  document.getElementById('displayCount').textContent = filtered.length.toLocaleString();
  
  // 페이지네이션
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, endIdx);
  
  renderTravelList(paginatedItems);
  renderPagination(totalPages);
}

function renderTravelList(items) {
  const container = document.getElementById('travelContainer');
  if (!container) return;
  
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        표시할 여행지가 없습니다.
      </div>
    `;
    return;
  }

  const html = `
    <div class="row g-4">
      ${items.map(item => createTravelCard(item)).join('')}
    </div>
  `;

  container.innerHTML = html;
}

function createTravelCard(item) {
  const title = item.title || '제목 없음';
  const thumb = item.firstimage || item.firstimage2 || '';
  const addr = item.addr1 || '';
  const tel = item.tel || '';
  const link = item.detail_link || 
    (title ? `https://search.naver.com/search.naver?query=${encodeURIComponent(title)}` : '#');
  
  // 이미지 HTML
  const imageHtml = thumb
    ? `<img src="${thumb}" alt="${escapeHtml(title)}" class="travel-card-image" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23f5f7fa%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-family=%22Arial%22%3E이미지 없음%3C/text%3E%3C/svg%3E';">`
    : `<div class="travel-card-image d-flex align-items-center justify-content-center bg-light">
         <i class="fas fa-image fa-3x text-muted"></i>
       </div>`;
  
  // 지역 추출 (시/도만)
  const region = addr.split(' ')[0] || '';
  const regionBadge = region ? `<span class="badge bg-primary mb-2">${region}</span>` : '';
  
  return `
    <div class="col-md-6 col-lg-4">
      <div class="travel-card">
        <a href="${link}" target="_blank" rel="noopener" class="text-decoration-none">
          ${imageHtml}
        </a>
        <div class="travel-card-body">
          ${regionBadge}
          <h5 class="travel-card-title">
            <a href="${link}" target="_blank" rel="noopener" class="text-decoration-none text-dark">
              ${escapeHtml(title)}
            </a>
          </h5>
          <div class="travel-card-location">
            <i class="fas fa-map-marker-alt text-danger me-2"></i>
            ${escapeHtml(addr)}
          </div>
          ${tel ? `
          <div class="travel-card-tel">
            <i class="fas fa-phone text-success me-2"></i>
            ${escapeHtml(tel)}
          </div>
          ` : ''}
          <div class="mt-3">
            <a href="${link}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary w-100">
              자세히 보기 <i class="fas fa-external-link-alt ms-1"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPagination(totalPages) {
  const pagination = document.getElementById('travelPagination');
  if (!pagination || totalPages <= 1) {
    if (pagination) pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // 이전 버튼
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  // 페이지 번호
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }
  
  // 다음 버튼
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  pagination.innerHTML = html;
  
  // 페이지네이션 클릭 이벤트
  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page && page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        filterAndDisplay();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function escapeHtml(s) {
  if (s == null) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
