"""
Vercel Serverless Function for OpenAI API Proxy
GitHub 저장소와 연동되어 자동 배포됩니다.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
from openai import OpenAI

# OpenAI API 키 (Vercel 환경 변수에서 가져옴)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")

openai_client = OpenAI(api_key=OPENAI_API_KEY)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """POST 요청 처리"""
        if self.path != '/api/chat':
            self.send_error(404)
            return
        
        try:
            # 요청 본문 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # 필수 필드 확인
            messages = data.get('messages')
            if not messages:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "messages 필드가 필요합니다."}).encode())
                return
            
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
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Health check"""
        if self.path == '/api/chat' or self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "message": "OpenAI 프록시 서버 정상 작동 중"
            }).encode())
        else:
            self.send_error(404)

