"""
Vercel Serverless Function for OpenAI API Proxy
"""

import json
import os

# OpenAI 클라이언트는 런타임에만 초기화
_openai_client = None

def get_openai_client():
    """OpenAI 클라이언트를 지연 초기화"""
    global _openai_client
    if _openai_client is None:
        try:
            from openai import OpenAI
            OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
            if not OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
            _openai_client = OpenAI(api_key=OPENAI_API_KEY)
        except ImportError:
            raise ImportError("openai 패키지를 설치할 수 없습니다. requirements.txt를 확인하세요.")
    return _openai_client


def handler(req):
    """Vercel 서버리스 함수 핸들러"""
    # 기본 헤더
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    try:
        # 요청 객체 디버깅 정보 수집
        req_type = type(req).__name__
        req_attrs = dir(req) if hasattr(req, '__dir__') else []
        
        # 요청 메서드 추출 (여러 방법 시도)
        method = 'GET'
        if hasattr(req, 'method'):
            method = req.method
        elif isinstance(req, dict):
            method = req.get('method', 'GET')
        elif hasattr(req, 'get'):
            method = req.get('method', 'GET')
        
        # OPTIONS 요청 (CORS preflight)
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # GET 요청 (Health check)
        if method == 'GET':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    "status": "ok",
                    "message": "OpenAI 프록시 서버 정상 작동 중"
                })
            }
        
        # POST 요청 처리
        if method == 'POST':
            # 요청 본문 추출 (여러 방법 시도)
            body_str = None
            
            # 방법 1: req.body 속성
            if hasattr(req, 'body'):
                body_str = req.body
            # 방법 2: 딕셔너리 형태
            elif isinstance(req, dict):
                body_str = req.get('body', '')
            # 방법 3: get 메서드
            elif hasattr(req, 'get'):
                body_str = req.get('body', '')
            
            # 본문이 없거나 빈 경우 처리
            if not body_str:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        "error": "요청 본문이 비어있습니다.",
                        "debug": {
                            "req_type": req_type,
                            "has_body": hasattr(req, 'body') if hasattr(req, '__dir__') else False
                        }
                    })
                }
            
            # 본문 파싱
            try:
                if isinstance(body_str, bytes):
                    body_str = body_str.decode('utf-8')
                elif not isinstance(body_str, str):
                    body_str = str(body_str)
                
                data = json.loads(body_str)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        "error": f"JSON 파싱 오류: {str(e)}",
                        "body_preview": str(body_str)[:100] if body_str else "None"
                    })
                }
            
            # 필수 필드 확인
            messages = data.get('messages', [])
            if not messages:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        "error": "messages 필드가 필요합니다.",
                        "received_data": list(data.keys()) if isinstance(data, dict) else "not a dict"
                    })
                }
            
            # OpenAI API 호출
            try:
                openai_client = get_openai_client()
                response = openai_client.chat.completions.create(
                    model=data.get('model', 'gpt-4o-mini'),
                    messages=messages,
                    temperature=data.get('temperature', 0.9),
                    max_tokens=data.get('max_tokens', 300)
                )
                
                # 응답 생성
                result = {
                    "choices": [{
                        "message": {
                            "role": response.choices[0].message.role,
                            "content": response.choices[0].message.content
                        }
                    }],
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(result)
                }
            except Exception as openai_error:
                import traceback
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({
                        "error": f"OpenAI API 오류: {str(openai_error)}",
                        "type": type(openai_error).__name__,
                        "traceback": traceback.format_exc()
                    })
                }
        
        # 다른 메서드
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({"error": "Method not allowed"})
        }
        
    except Exception as e:
        # 기타 오류 - 상세한 디버깅 정보 포함
        import traceback
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                "error": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc(),
                "req_type": req_type if 'req_type' in locals() else "unknown",
                "req_attrs": req_attrs[:10] if 'req_attrs' in locals() else []
            })
        }
