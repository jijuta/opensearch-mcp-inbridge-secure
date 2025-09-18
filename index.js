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

// 헬스체크
async function healthCheck() {
  try {
    await axios.get(`${MCP_SERVER_URL}/health`, { timeout: 5000 });
    console.error(`✅ MCP Server connected: ${MCP_SERVER_URL}`);
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

    const response = await axios.post(MCP_SERVER_URL, request, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log(JSON.stringify(response.data));
  } catch (error) {
    const errorResponse = {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error.message
      },
      id: (request && request.id) || null
    };
    console.log(JSON.stringify(errorResponse));
  }
});