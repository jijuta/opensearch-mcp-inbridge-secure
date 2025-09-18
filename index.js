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
    console.error(`🔧 opensearch-mcp-inbridge v1.1.0 - Streamable HTTP mode`);
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

    // Streamable HTTP 프로토콜에 맞게 /mcp 엔드포인트 사용
    const endpoint = `${MCP_SERVER_URL}/mcp`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // 세션 ID가 있으면 헤더에 추가
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    console.error(`📤 Request to: ${endpoint} | Method: ${request.method} | Session: ${sessionId || 'none'}`);

    const response = await axios.post(endpoint, request, {
      headers,
      timeout: 30000
    });

    // 응답에서 세션 ID 추출 (initialize 응답에서)
    if (response.headers['mcp-session-id'] && !sessionId) {
      sessionId = response.headers['mcp-session-id'];
      console.error(`✅ Session established: ${sessionId}`);
    }

    console.log(JSON.stringify(response.data));
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
      await axios.delete(`${MCP_SERVER_URL}/mcp`, {
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
      await axios.delete(`${MCP_SERVER_URL}/mcp`, {
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