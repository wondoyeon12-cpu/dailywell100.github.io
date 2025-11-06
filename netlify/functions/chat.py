"""
Netlify Serverless Function for OpenAI API Proxy
"""

import json
import os

def handler(event, context):
    """Netlify 서버리스 함수 핸들러"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    # OPTIONS 요청 (CORS preflight) - Netlify는 자동 처리하지만 명시적으로 처리
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # GET 요청 (Health check)
    if event['httpMethod'] == 'GET':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                "status": "ok",
                "message": "OpenAI 프록시 서버 정상 작동 중"
            })
        }
    
    # POST 요청
    if event['httpMethod'] == 'POST':
        try:
            # 요청 본문 파싱
            body = json.loads(event.get('body', '{}'))
            
            # 필수 필드 확인
            messages = body.get('messages', [])
            if not messages:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({"error": "messages 필드가 필요합니다."})
                }
            
            # OpenAI API 호출
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
                model=body.get('model', 'gpt-4o-mini'),
                messages=messages,
                temperature=body.get('temperature', 0.9),
                max_tokens=body.get('max_tokens', 300)
            )
            
            # 응답 반환
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
    
    # 다른 메서드
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({"error": "Method not allowed"})
    }

