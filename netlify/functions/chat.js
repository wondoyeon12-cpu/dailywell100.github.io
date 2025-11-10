/**
 * Netlify Serverless Function for OpenAI API Proxy
 * Node.js 버전
 */

const OpenAI = require('openai');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // OPTIONS 요청 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // GET 요청 (Health check)
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        message: 'OpenAI 프록시 서버 정상 작동 중'
      })
    };
  }

  // POST 요청
  if (event.httpMethod === 'POST') {
    try {
      // 요청 본문 파싱
      const body = JSON.parse(event.body || '{}');

      // 필수 필드 확인
      const messages = body.messages;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'messages 필드가 필요합니다.' })
        };
      }

      // OpenAI API 키 확인
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' })
        };
      }

      // OpenAI API 호출
      const client = new OpenAI({ apiKey });

      const response = await client.chat.completions.create({
        model: body.model || 'gpt-4o-mini',
        messages: messages,
        temperature: body.temperature || 0.9,
        max_tokens: body.max_tokens || 300
      });

      // 응답 반환
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          choices: [{
            message: {
              role: response.choices[0].message.role,
              content: response.choices[0].message.content
            }
          }],
          usage: {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens
          }
        })
      };

    } catch (error) {
      console.error('❌ OpenAI API 오류:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: error.message,
          type: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
      };
    }
  }

  // 다른 메서드
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

