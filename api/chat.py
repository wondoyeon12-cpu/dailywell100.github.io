"""
Vercel Serverless Function for OpenAI API Proxy
GitHub 저장소와 연동되어 자동 배포됩니다.
"""

import json
import os
from openai import OpenAI

# OpenAI API 키 (Vercel 환경 변수에서 가져옴)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    # 배포 시 오류가 발생하므로, 런타임에만 체크
    pass

# OpenAI 클라이언트는 런타임에 초기화
def get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
    return OpenAI(api_key=OPENAI_API_KEY)


def handler(req):
    """Vercel 서버리스 함수 핸들러"""
    try:
        # CORS 헤더 설정
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
        
        # 요청 메서드 가져오기
        method = 'GET'
        if hasattr(req, 'method'):
            method = req.method
        elif isinstance(req, dict):
            method = req.get('method', 'GET')
        elif hasattr(req, 'get'):
            method = req.get('method', 'GET')
        
        # OPTIONS 요청 처리 (CORS preflight)
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # GET 요청 처리 (Health check)
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
            try:
                # OpenAI 클라이언트 초기화
                openai_client = get_openai_client()
                
                # 요청 본문 파싱
                body = None
                if hasattr(req, 'body'):
                    body = req.body
                elif isinstance(req, dict):
                    body = req.get('body', '')
                elif hasattr(req, 'get'):
                    body = req.get('body', '')
                
                # 본문 파싱
                if body:
                    if isinstance(body, str):
                        data = json.loads(body)
                    elif isinstance(body, bytes):
                        data = json.loads(body.decode('utf-8'))
                    else:
                        data = body if isinstance(body, dict) else {}
                else:
                    data = {}
                
                # 필수 필드 확인
                messages = data.get('messages')
                if not messages:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({"error": "messages 필드가 필요합니다."})
                    }
                
                # OpenAI API 호출
                response = openai_client.chat.completions.create(
                    model=data.get('model', 'gpt-4o-mini'),
                    messages=messages,
                    temperature=data.get('temperature', 0.9),
                    max_tokens=data.get('max_tokens', 300)
                )
                
                # 응답 반환
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
                
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({
                        "error": str(e),
                        "traceback": error_details
                    })
                }
        
        # 다른 메서드 처리
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({"error": "Method not allowed"})
        }
        
    except Exception as e:
        import traceback
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                "error": str(e),
                "traceback": traceback.format_exc()
            })
        }

