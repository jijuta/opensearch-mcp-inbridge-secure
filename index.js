#!/usr/bin/env node

const readline = require('readline');
const axios = require('axios');

// MCP_SERVER_URL은 필수 환경변수
const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

if (!MCP_SERVER_URL) {
  console.error('❌ MCP_SERVER_URL environment variable is required');
  console.error('');
  console.error('Please set the MCP server URL in your Claude Desktop configuration:');
  console.error('{');
  console.error('  "mcpServers": {');
  console.error('    "opensearch": {');
  console.error('      "command": "opensearch-mcp-inbridge",');
  console.error('      "env": {');
  console.error('        "MCP_SERVER_URL": "http://your-server:your-port"');
  console.error('      }');
  console.error('    }');
  console.error('  }');
  console.error('}');
  console.error('');
  console.error('Contact your system administrator for the correct MCP_SERVER_URL value.');
  process.exit(1);
}

// 세션 관리
let sessionId = null;

// 헬스체크
async function healthCheck() {
  try {
    await axios.get(`${MCP_SERVER_URL}/health`, { timeout: 5000 });
    console.error(`✅ MCP Server connected: ${MCP_SERVER_URL}`);
    console.error(`🔧 opensearch-mcp-inbridge v1.3.3 - 202 응답 처리 개선, Zod 에러 수정`);
  } catch (error) {
    console.error(`❌ Cannot connect to MCP server: ${MCP_SERVER_URL}`);
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Please check:');
    console.error('- Server URL is correct');
    console.error('- MCP server is running');
    console.error('- Network connectivity');
    process.exit(1);
  }
}

// 시작 시 헬스체크
healthCheck();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  let request = null;
  try {
    request = JSON.parse(line);

    // Streamable HTTP 프로토콜에 맞게 /mcp/ 엔드포인트 사용 (trailing slash 필요)
    const endpoint = `${MCP_SERVER_URL}/mcp/`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'User-Agent': 'opensearch-mcp-inbridge/1.3.3',
      'Connection': 'keep-alive'
    };

    // 세션 ID가 있으면 헤더에 추가
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    console.error(`📤 Request to: ${endpoint} | Method: ${request.method} | Session: ${sessionId || 'none'} | v1.3.3`);

    const response = await axios.post(endpoint, request, {
      headers,
      timeout: 60000,
      maxRetries: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // 4xx 에러도 허용해서 디버깅
      }
    });

    // 응답에서 세션 ID 추출 (initialize 응답에서)
    if (response.headers['mcp-session-id'] && !sessionId) {
      sessionId = response.headers['mcp-session-id'];
      console.error(`✅ Session established: ${sessionId}`);
    }

    console.error(`📥 Response status: ${response.status} | Type: ${typeof response.data} | Content: ${JSON.stringify(response.data).substring(0, 200)}...`);

    // 202 Accepted (빈 응답) 처리
    if (response.status === 202) {
      console.error(`⚠️ 202 Accepted - sending empty JSON response`);
      console.log('{}'); // 빈 JSON 객체 전송
      return;
    }

    // SSE (Server-Sent Events) 형식 파싱
    let responseData = response.data;
    if (typeof response.data === 'string') {
      // SSE 형식인지 확인 (event: message\r\ndata: {...} 형태)
      if (response.data.includes('event:') && response.data.includes('data:')) {
        try {
          // SSE 형식에서 JSON 데이터 추출
          const lines = response.data.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              const jsonStr = line.substring(line.indexOf('data:') + 5).trim();
              responseData = JSON.parse(jsonStr);
              console.error(`🔄 SSE format parsed successfully`);
              break;
            }
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse SSE format: ${parseError.message}`);
          // SSE 파싱 실패 시 일반 JSON 파싱 시도
          try {
            responseData = JSON.parse(response.data);
            console.error(`🔄 Fallback: String response parsed to JSON successfully`);
          } catch (fallbackError) {
            console.error(`❌ Failed to parse as JSON: ${fallbackError.message}`);
          }
        }
      } else {
        // 일반 JSON 문자열 파싱 시도
        try {
          responseData = JSON.parse(response.data);
          console.error(`🔄 String response parsed to JSON successfully`);
        } catch (parseError) {
          console.error(`❌ Failed to parse string response as JSON: ${parseError.message}`);
        }
      }
    }

    console.log(JSON.stringify(responseData));
  } catch (error) {
    let requestId = null;
    try {
      if (request && typeof request.id !== 'undefined') {
        requestId = request.id;
      }
    } catch {
      requestId = null;
    }

    const errorResponse = {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error.message
      },
      id: requestId
    };
    console.log(JSON.stringify(errorResponse));
  }
});

// 프로세스 종료 시 세션 정리
process.on('SIGINT', async () => {
  if (sessionId) {
    try {
      await axios.delete(`${MCP_SERVER_URL}/mcp/`, {
        headers: { 'Mcp-Session-Id': sessionId },
        timeout: 5000
      });
      console.error('✅ Session terminated');
    } catch (error) {
      console.error('⚠️ Failed to terminate session');
    }
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (sessionId) {
    try {
      await axios.delete(`${MCP_SERVER_URL}/mcp/`, {
        headers: { 'Mcp-Session-Id': sessionId },
        timeout: 5000
      });
      console.error('✅ Session terminated');
    } catch (error) {
      console.error('⚠️ Failed to terminate session');
    }
  }
  process.exit(0);
});