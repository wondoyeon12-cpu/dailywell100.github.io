"""
Vercel Serverless Function for OpenAI API Proxy
"""

import json
import os

def handler(req):
    """Vercel 서버리스 함수 핸들러"""
    # CORS 헤더 (항상 설정)
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    }
    
    try:
        # 요청 메서드 추출 (여러 방법 시도)
        method = None
        if hasattr(req, 'method'):
            method = req.method
        elif isinstance(req, dict):
            method = req.get('method')
        elif hasattr(req, 'get'):
            method = req.get('method')
        
        # 기본값
        if not method:
            method = 'GET'
        
        method = method.upper() if isinstance(method, str) else 'GET'
        
        # OPTIONS 요청 (CORS preflight) - 최우선 처리
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
        
        # POST 요청
        if method == 'POST':
            # 본문 추출
            body = getattr(req, 'body', None)
            if not body and isinstance(req, dict):
                body = req.get('body', '')
            
            if not body:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({"error": "요청 본문이 없습니다."})
                }
            
            # 본문 파싱
            if isinstance(body, bytes):
                body = body.decode('utf-8')
            
            try:
                data = json.loads(body) if isinstance(body, str) else body
            except:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({"error": "JSON 파싱 실패"})
                }
            
            # 필수 필드 확인
            messages = data.get('messages', [])
            if not messages:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({"error": "messages 필드가 필요합니다."})
                }
            
            # OpenAI API 호출
            try:
                from openai import OpenAI
                
                api_key = os.environ.get('OPENAI_API_KEY')
                if not api_key:
                    return {
                        'statusCode': 500,
                        'headers': headers,
                        'body': json.dumps({"error": "OPENAI_API_KEY가 설정되지 않았습니다."})
                    }
                
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=data.get('model', 'gpt-4o-mini'),
                    messages=messages,
                    temperature=data.get('temperature', 0.9),
                    max_tokens=data.get('max_tokens', 300)
                )
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
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
                    })
                }
            except Exception as e:
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
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({"error": "Method not allowed"})
        }
        
    except Exception as e:
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
