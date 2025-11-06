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
        # 요청 메서드 추출
        method = 'GET'
        if hasattr(req, 'method'):
            method = req.method
        elif isinstance(req, dict):
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
            # 요청 본문 추출
            body_str = None
            if hasattr(req, 'body'):
                body_str = req.body
            elif isinstance(req, dict):
                body_str = req.get('body', '')
            
            # 본문 파싱
            if body_str:
                if isinstance(body_str, bytes):
                    body_str = body_str.decode('utf-8')
                data = json.loads(body_str)
            else:
                data = {}
            
            # 필수 필드 확인
            messages = data.get('messages', [])
            if not messages:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({"error": "messages 필드가 필요합니다."})
                }
            
            # OpenAI API 호출
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
        
        # 다른 메서드
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({"error": "Method not allowed"})
        }
        
    except ValueError as e:
        # 환경 변수 오류
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({"error": str(e)})
        }
    except ImportError as e:
        # 패키지 오류
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({"error": str(e)})
        }
    except json.JSONDecodeError as e:
        # JSON 파싱 오류
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({"error": f"Invalid JSON: {str(e)}"})
        }
    except Exception as e:
        # 기타 오류
        import traceback
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                "error": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc()
            })
        }
