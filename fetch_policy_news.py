#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch 정책브리핑 정책뉴스 from data.go.kr API and write static JSON for the site.

Output: dailywell100_static/data/korea_now.json
"""

import json
import os
import sys
import io
import time
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional

# Windows PowerShell 인코딩 문제 해결
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup


API_URL = "https://apis.data.go.kr/1371000/policyNewsService/policyNewsList"
SERVICE_KEY = "4c32274bc908fe60086aea657eedb85f5eceb4b45186fe1e9e570ec12e554528"

def get_recent_dates():
    """최근 3일 날짜 반환 (YYYYMMDD 형식)"""
    today = datetime.now()
    start_date = today - timedelta(days=2)  # 3일치 (오늘 포함)
    return start_date.strftime("%Y%m%d"), today.strftime("%Y%m%d")


def get_text(elem: ET.Element, names: List[str]) -> str:
    for name in names:
        node = elem.find(name)
        if node is not None and (node.text or "").strip():
            return (node.text or "").strip()
    return ""

def extract_first_image_url(html_content: str) -> str:
    """HTML 내용에서 첫 번째 유효한 이미지 URL 추출 (더 정확한 패턴 사용)"""
    if not html_content:
        return ""
    
    # 패턴: <img> 태그에서 src 속성 추출 (더 정확한 매칭)
    # <img src="..." 또는 <img src='...' 또는 <img ... src="..."
    img_patterns = [
        r'<img[^>]+src\s*=\s*["\']([^"\']+)["\']',  # 표준 패턴
        r'<img[^>]+src\s*=\s*([^\s>]+)',  # 따옴표 없는 경우
    ]
    
    for pattern in img_patterns:
        matches = re.finditer(pattern, html_content, re.IGNORECASE)
        for match in matches:
            img_url = match.group(1).strip()
            
            # 빈 URL 스킵
            if not img_url:
                continue
            
            # 이미지 파일 확장자 확인 (data: URL 제외)
            if img_url.startswith('data:'):
                continue
            
            # 상대 경로를 절대 경로로 변환
            if img_url.startswith('/'):
                img_url = f"https://www.korea.kr{img_url}"
            elif not img_url.startswith('http'):
                continue
            
            # URL 정규화: 공백 및 특수문자 제거
            img_url = img_url.replace(' ', '%20')
            
            # 이미지 확장자 확인 (jpg, jpeg, png, gif, webp)
            if re.search(r'\.(jpg|jpeg|png|gif|webp)(\?|$)', img_url, re.IGNORECASE):
                return img_url
            # 확장자가 없어도 korea.kr 도메인이면 반환 (일부는 확장자가 URL 파라미터 뒤에 있을 수 있음)
            elif 'korea.kr' in img_url or 'newsWeb/resources/attaches' in img_url:
                return img_url
    
    return ""


def fetch_article_detail(article_url: str) -> Dict[str, Optional[str]]:
    """
    기사 상세 페이지에서 첫 번째 이미지와 전체 내용 추출
    """
    result = {
        'image': None,
        'full_content': None
    }
    
    if not article_url or not article_url.startswith('http'):
        return result
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.korea.kr/'
        }
        
        resp = requests.get(article_url, headers=headers, timeout=10, allow_redirects=True)
        if resp.status_code != 200:
            return result
        
        soup = BeautifulSoup(resp.content, 'html.parser')
        
        # 1. 전체 내용 추출
        content_selectors = [
            'div.contentArea',
            'div.articleBody', 
            'div.viewContent',
            'div.newsView',
            'article'
        ]
        
        for selector in content_selectors:
            content_div = soup.select_one(selector)
            if content_div:
                # HTML 정리
                html_content = str(content_div)
                result['full_content'] = html_content
                break
        
        # 2. 첫 번째 이미지 추출
        img_selectors = [
            'div.contentArea img',
            'div.articleBody img',
            'div.viewContent img',
            'article img',
            '.imageWrap img',
            '.cardnews img',
            'img[src*="newsWeb/resources/attaches"]',
            'img[src*="korea.kr"]',
        ]
        
        for selector in img_selectors:
            img_tags = soup.select(selector)
            for img in img_tags:
                src = img.get('src') or img.get('data-src') or ''
                if not src or src.startswith('data:'):
                    continue
                
                # 상대 경로를 절대 경로로 변환
                if src.startswith('/'):
                    src = f"https://www.korea.kr{src}"
                elif not src.startswith('http'):
                    continue
                
                # korea.kr 이미지만 사용
                if 'korea.kr' in src or 'newsWeb/resources/attaches' in src:
                    if src.startswith('http://'):
                        src = src.replace('http://', 'https://')
                    result['image'] = src
                    break
            
            if result['image']:
                break
        
        return result
        
    except Exception as e:
        print(f"[WARN] 상세 페이지 추출 실패 ({article_url}): {e}")
        return result


def fetch_policy_news_from_api() -> Dict:
    """
    공공데이터포털 정책뉴스 API 호출
    필수 파라미터: startDate + endDate (3일 이내만 가능)
    여러 페이지를 호출하여 더 많은 뉴스 수집
    """
    items = []
    
    # 최근 3일 날짜 가져오기
    start_date, end_date = get_recent_dates()
    
    try:
        # 여러 페이지를 호출하여 더 많은 뉴스 수집
        max_pages = 5
        page_no = 1
        
        while page_no <= max_pages:
            params = {
                "serviceKey": SERVICE_KEY,
                "pageNo": page_no,
                "numOfRows": 50,
                "startDate": start_date,
                "endDate": end_date
            }
            
            print(f"[API] 호출 중: 최근 3일 ({start_date} ~ {end_date}), 페이지 {page_no}")
            
            resp = requests.get(API_URL, params=params, timeout=15)
            
            if resp.status_code != 200:
                print(f"⚠️ HTTP 오류: {resp.status_code}")
                break
            
            # XML 파싱
            root = ET.fromstring(resp.text)
            
            # 에러 체크
            header = root.find("header")
            if header is not None:
                result_code = header.find("resultCode")
                if result_code is not None and result_code.text not in ["00", "0"]:
                    result_msg = header.find("resultMsg")
                    print(f"⚠️ API 오류: {result_code.text} - {result_msg.text if result_msg is not None else 'N/A'}")
                    break
            
            # 데이터 파싱
            body = root.find("body")
            if body is not None:
                # NewsItem 태그로 검색
                news_items = body.findall("NewsItem")
                
                if len(news_items) == 0:
                    print(f"📄 페이지 {page_no}: 더 이상 뉴스가 없습니다.")
                    break
                
                page_items = []
                for item in news_items:
                    # 실제 태그명 사용
                    title = get_text(item, ["Title"]) or "제목 없음"
                    link = get_text(item, ["OriginalUrl"]) or ""
                    summary = get_text(item, ["DataContents"]) or ""
                    pub_date = get_text(item, ["ApproveDate", "ModifyDate"]) or ""
                    author = get_text(item, ["ApproverName"]) or "대한민국 정책브리핑"
                    
                    # 이미지와 전체 내용 추출
                    thumbnail_url = None
                    full_content = None
                    
                    # 상세 페이지에서 이미지와 전체 내용 추출
                    if link:
                        print(f"  [INFO] 상세 페이지 크롤링: {title[:30]}...")
                        detail = fetch_article_detail(link)
                        thumbnail_url = detail.get('image')
                        full_content = detail.get('full_content')
                        
                        if thumbnail_url:
                            print(f"    [OK] 이미지 발견: {thumbnail_url[:60]}...")
                        if full_content:
                            print(f"    [OK] 전체 내용 추출 완료 ({len(full_content)}자)")
                        
                        time.sleep(0.3)  # 서버 부하 방지

                    # 이미지 백업: summary HTML에서 추출
                    if not thumbnail_url:
                        thumbnail_url = extract_first_image_url(summary)
                        if thumbnail_url:
                            print(f"  [OK] summary에서 이미지 추출: {thumbnail_url[:60]}...")
                    
                    # HTTPS 강제
                    if thumbnail_url and thumbnail_url.startswith('http://'):
                        thumbnail_url = thumbnail_url.replace('http://', 'https://')

                    page_items.append({
                        "title": title,
                        "link": link,
                        "summary": summary,
                        "full_content": full_content or summary,  # 전체 내용 없으면 summary 사용
                        "pub_date": pub_date,
                        "author": author,
                        "thumbnail_url": thumbnail_url or "",
                    })
                
                items.extend(page_items)
                print(f"✅ 페이지 {page_no}: {len(page_items)}개 뉴스 수집 (누적: {len(items)}개)")
                
                # 더 이상 데이터가 없으면 중단
                if len(page_items) < 50:
                    break
            else:
                print(f"⚠️ 페이지 {page_no}: body 태그를 찾을 수 없음")
                break
            
            page_no += 1
            time.sleep(0.5)  # API 호출 간격
            
        print(f"✅ 총 {len(items)}개 뉴스 수집 완료")
            
    except Exception as e:
        print(f"❌ 실패: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"📰 총 파싱된 아이템: {len(items)}개")

    return {
        "items": items,
        "total": len(items),
        "page": 1,
        "page_size": len(items),
        "query": "",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    out_path = os.path.join("dailywell100_static", "data", "korea_now.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    # 기존 데이터 로드 (있다면)
    existing_items = []
    if os.path.exists(out_path):
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                existing_items = existing_data.get("items", [])
                print(f"[INFO] 기존 데이터: {len(existing_items)}개")
        except Exception as e:
            print(f"[WARN] 기존 데이터 로드 실패: {e}")

    try:
        # API에서 새 데이터 가져오기
        new_data = fetch_policy_news_from_api()
        new_items = new_data.get("items", [])
        print(f"[INFO] 새 데이터: {len(new_items)}개")
        
        # 기존 데이터와 병합 (중복 제거 - link 기준)
        existing_links = {item.get("link") for item in existing_items}
        merged_items = new_items + [item for item in existing_items if item.get("link") not in {i.get("link") for i in new_items}]
        
        # 최신 100개만 유지 (pub_date 기준 정렬)
        merged_items.sort(key=lambda x: x.get("pub_date", ""), reverse=True)
        merged_items = merged_items[:100]
        
        print(f"[INFO] 병합 후: {len(merged_items)}개 (최대 100개 유지)")
        
        final = {
            "items": merged_items,
            "total": len(merged_items),
            "query": "",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        
    except Exception as e:
        print(f"[ERROR] 정책뉴스 수집 실패: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    
    print(f"[SUCCESS] 정책뉴스 저장 완료: {out_path} — {len(final['items'])}건")


if __name__ == "__main__":
    main()


