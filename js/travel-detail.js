// 여행지 상세 페이지 JavaScript

const API_BASE = 'https://apis.data.go.kr/B551011/KorService2';
const API_KEY = '4c32274bc908fe60086aea657eedb85f5eceb4b45186fe1e9e570ec12e554528';

let currentContentId = null;
let currentContentTypeId = null;
let currentItem = null;

document.addEventListener('DOMContentLoaded', function() {
  // URL에서 contentid와 contentTypeId 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const contentid = urlParams.get('contentid') || urlParams.get('contentId');
  const contenttypeid = urlParams.get('contenttypeid') || urlParams.get('contentTypeId');
  
  if (!contentid) {
    showError('여행지 정보를 찾을 수 없습니다.');
    return;
  }
  
  currentContentId = contentid;
  currentContentTypeId = contenttypeid || '12'; // 기본값: 관광지
  
  // 먼저 기본 정보 로드
  loadBasicInfo();
});

async function loadBasicInfo() {
  // 기본 정보는 go_now.json에서 가져오기
  try {
    const response = await fetch('data/go_now.json?v=' + Date.now());
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    
    // contentid로 항목 찾기
    const item = items.find(it => 
      (it.contentid && it.contentid.toString() === currentContentId.toString()) ||
      (it.contentId && it.contentId.toString() === currentContentId.toString())
    );
    
    if (item) {
      currentItem = item;
      currentContentTypeId = item.contenttypeid || item.contentTypeId || currentContentTypeId;
      displayBasicInfo(item);
      // 상세 정보 로드
      await loadDetailInfo();
    } else {
      // 기본 정보가 없으면 API에서 직접 가져오기
      await loadFromAPI();
    }
  } catch (error) {
    console.error('기본 정보 로드 실패:', error);
    await loadFromAPI();
  }
}

async function loadFromAPI() {
  // areaBasedList2 API에서 항목 찾기
  try {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: 'ETC',
      MobileApp: 'DW100',
      _type: 'json',
      contentId: currentContentId,
      numOfRows: 1,
    });
    
    const response = await fetch(`${API_BASE}/areaBasedList2?${params}`);
    const data = await response.json();
    
    if (data.response && data.response.body && data.response.body.items) {
      const items = data.response.body.items.item;
      if (items && (Array.isArray(items) ? items.length > 0 : true)) {
        const item = Array.isArray(items) ? items[0] : items;
        currentItem = item;
        currentContentTypeId = item.contenttypeid || currentContentTypeId;
        displayBasicInfo(item);
        await loadDetailInfo();
        return;
      }
    }
    
    showError('여행지 정보를 찾을 수 없습니다.');
  } catch (error) {
    console.error('API 로드 실패:', error);
    showError('정보를 불러오는 중 오류가 발생했습니다.');
  }
}

function displayBasicInfo(item) {
  // 기본 정보 표시
  document.getElementById('detailTitle').textContent = item.title || '제목 없음';
  document.getElementById('detailAddress').textContent = item.addr1 || '';
  document.getElementById('detailAddr1').textContent = item.addr1 || '-';
  
  if (item.addr2) {
    document.getElementById('detailAddr2').textContent = item.addr2;
    document.getElementById('detailAddr2').style.display = 'block';
  }
  
  // 이미지
  const mainImage = document.getElementById('detailMainImage');
  if (item.firstimage) {
    mainImage.src = item.firstimage;
    mainImage.alt = item.title || '여행지 이미지';
  } else if (item.firstimage2) {
    mainImage.src = item.firstimage2;
    mainImage.alt = item.title || '여행지 이미지';
  } else {
    mainImage.style.display = 'none';
  }
  
  // 이미지 갤러리
  const images = [];
  if (item.firstimage) images.push(item.firstimage);
  if (item.firstimage2) images.push(item.firstimage2);
  
  if (images.length > 1) {
    displayImageGallery(images);
  }
  
  // 전화번호
  if (item.tel) {
    document.getElementById('detailTel').textContent = item.tel;
    document.getElementById('telItem').style.display = 'flex';
  }
  
  // 지도 표시
  if (item.mapx && item.mapy) {
    displayMap(item.mapx, item.mapy, item.title);
  }
  
  // 로딩 숨기기, 상세 정보 표시
  document.getElementById('loadingContainer').style.display = 'none';
  document.getElementById('detailContainer').style.display = 'block';
}

async function loadDetailInfo() {
  if (!currentContentId || !currentContentTypeId) return;
  
  try {
    // detailIntro2 API 호출
    const introParams = new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: 'ETC',
      MobileApp: 'DW100',
      _type: 'json',
      contentId: currentContentId,
      contentTypeId: currentContentTypeId,
    });
    
    const introResponse = await fetch(`${API_BASE}/detailIntro2?${introParams}`);
    const introData = await introResponse.json();
    
    if (introData.response && introData.response.body && introData.response.body.items) {
      const introItem = introData.response.body.items.item;
      if (introItem) {
        const intro = Array.isArray(introItem) ? introItem[0] : introItem;
        displayDetailIntro(intro);
      }
    }
    
    // detailInfo2 API 호출
    const infoParams = new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: 'ETC',
      MobileApp: 'DW100',
      _type: 'json',
      contentId: currentContentId,
      contentTypeId: currentContentTypeId,
    });
    
    const infoResponse = await fetch(`${API_BASE}/detailInfo2?${infoParams}`);
    const infoData = await infoResponse.json();
    
    if (infoData.response && infoData.response.body && infoData.response.body.items) {
      const infoItems = infoData.response.body.items.item;
      if (infoItems) {
        const infos = Array.isArray(infoItems) ? infoItems : [infoItems];
        displayDetailInfo(infos);
      }
    }
  } catch (error) {
    console.error('상세 정보 로드 실패:', error);
  }
}

function displayDetailIntro(intro) {
  // 개요
  if (intro.overview) {
    document.getElementById('detailOverview').textContent = intro.overview;
    document.getElementById('overviewSection').style.display = 'block';
  }
  
  // 이용시간
  if (intro.usetime) {
    document.getElementById('detailUsetime').textContent = intro.usetime;
    document.getElementById('usetimeItem').style.display = 'flex';
    document.getElementById('infoSection').style.display = 'block';
  }
  
  // 휴무일
  if (intro.restdate) {
    document.getElementById('detailRestdate').textContent = intro.restdate;
    document.getElementById('restdateItem').style.display = 'flex';
    document.getElementById('infoSection').style.display = 'block';
  }
  
  // 문의
  if (intro.infocenter) {
    document.getElementById('detailInfocenter').textContent = intro.infocenter;
    document.getElementById('infocenterItem').style.display = 'flex';
    document.getElementById('infoSection').style.display = 'block';
  }
}

function displayDetailInfo(infos) {
  if (!infos || infos.length === 0) return;
  
  const listContainer = document.getElementById('detailInfoList');
  listContainer.innerHTML = '';
  
  infos.forEach(info => {
    if (info.infoname && info.infotext) {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${escapeHtml(info.infoname)}</strong>
        <div>${escapeHtml(info.infotext)}</div>
      `;
      listContainer.appendChild(li);
    }
  });
  
  if (listContainer.children.length > 0) {
    document.getElementById('detailInfoSection').style.display = 'block';
  }
}

function displayImageGallery(images) {
  const galleryContainer = document.getElementById('galleryContainer');
  galleryContainer.innerHTML = '';
  
  images.forEach(imageUrl => {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'gallery-image';
    img.alt = '여행지 이미지';
    img.loading = 'lazy';
    img.onerror = function() {
      this.style.display = 'none';
    };
    galleryContainer.appendChild(img);
  });
  
  document.getElementById('imageGallery').style.display = 'block';
}

function displayMap(mapx, mapy, title) {
  const mapContainer = document.getElementById('mapContainer');
  
  // 카카오맵 API 사용 (간단한 버전)
  // 실제로는 카카오맵 API 키가 필요하지만, 여기서는 네이버 지도 링크 사용
  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(title)}`;
  
  mapContainer.innerHTML = `
    <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
      <div class="text-center">
        <i class="fas fa-map-marked-alt fa-3x text-primary mb-3"></i>
        <p class="mb-2"><strong>${escapeHtml(title)}</strong></p>
        <p class="text-muted mb-3">위도: ${mapy}, 경도: ${mapx}</p>
        <a href="${naverMapUrl}" target="_blank" rel="noopener" class="btn btn-primary">
          <i class="fas fa-external-link-alt me-2"></i>네이버 지도에서 보기
        </a>
      </div>
    </div>
  `;
  
  // 카카오맵을 사용하려면 아래 주석을 해제하고 카카오맵 API 키를 설정하세요
  /*
  if (typeof kakao !== 'undefined' && kakao.maps) {
    const mapOption = {
      center: new kakao.maps.LatLng(mapy, mapx),
      level: 3
    };
    const map = new kakao.maps.Map(mapContainer, mapOption);
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(mapy, mapx)
    });
    marker.setMap(map);
  }
  */
}

function showError(message) {
  document.getElementById('loadingContainer').innerHTML = `
    <div class="alert alert-danger text-center">
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${escapeHtml(message)}
      <br>
      <a href="go-now.html" class="btn btn-primary mt-3">목록으로 돌아가기</a>
    </div>
  `;
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

