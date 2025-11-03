document.addEventListener('DOMContentLoaded', function() {
  loadCategoriesSidebar();

  const form = document.getElementById('travelSearchForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const q = document.getElementById('travelQuery').value.trim();
      loadTravelJson(1, q);
    });
  }

  loadTravelJson();
});

function loadCategoriesSidebar() {
  fetch('data/categories.json?v=' + Date.now())
    .then(r => r.json())
    .then(list => {
      const ul = document.getElementById('categoryList');
      if (!ul) return;
      ul.innerHTML = list.map(c => `
        <li class="mb-2">
          <a href="${c.slug}.html" class="text-decoration-none">
            <i class="fas ${c.icon} me-2"></i>${c.name}
            <span class="float-end badge bg-secondary">${c.count}</span>
          </a>
        </li>`).join('');
    }).catch(()=>{});
}

async function loadTravelJson(page = 1, q = '') {
  const el = document.getElementById('travelContainer');
  if (el) {
    el.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3">여행 정보를 불러오는 중...</p></div>`;
  }
  try {
    const res = await fetch('data/go_now.json?v=' + Date.now());
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const filtered = q ? items.filter(x => (x.title||'').includes(q) || (x.addr1||'').includes(q)) : items;
    renderTravelList(filtered, el);
  } catch (e) {
    if (el) el.innerHTML = `<div class="alert alert-warning">데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>`;
  }
}

function renderTravelList(items, container) {
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="alert alert-info"><i class="fas fa-info-circle"></i> 표시할 여행지가 없습니다.</div>`;
    return;
  }

  let html = '';
  items.forEach(it => {
    const title = it.title || '';
    const thumb = it.firstimage || it.firstimage2 || '';
    const addr = it.addr1 || '';
    const tel = it.tel || '';
    const link = it.detail_link || (title ? `https://search.naver.com/search.naver?query=${encodeURIComponent(title)}` : '#');

    // 프레임 284x191, 원본 비율 유지 (contain)
    const imageHtml = thumb
      ? `<div class="post-card-thumb"><img src="${thumb}" alt="${escapeHtml(title)}" class="post-card-image-inner" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'d-flex align-items-center justify-content-center\\' style=\\'width:284px;height:191px;background:#f8f9fa\\'><i class=\\'fas fa-image fa-2x text-muted\\'></i></div>';"></div>`
      : `<div class="post-card-thumb d-flex align-items-center justify-content-center"><i class="fas fa-image fa-2x text-muted"></i></div>`;

    html += `
      <article class="post-card">
        ${imageHtml}
        <div class="post-card-body">
          <a href="${link}" target="_blank" rel="noopener" class="post-title">${escapeHtml(title)}</a>
          <div class="post-meta"><i class="fas fa-location-dot"></i> ${escapeHtml(addr)} ${tel ? `<span class='mx-2'>|</span><i class='fas fa-phone'></i> ${escapeHtml(tel)}` : ''}</div>
          <a href="${link}" target="_blank" rel="noopener" class="read-more">자세히 보기 <i class="fas fa-arrow-right"></i></a>
        </div>
      </article>`;
  });

  container.innerHTML = html;
}

function escapeHtml(s){
  if (s == null) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}


