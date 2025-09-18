# OpenSearch MCP InBridge

Simple HTTP client to connect Claude Desktop to OpenSearch MCP servers.

## 🚀 Quick Install

```bash
npm install -g git+https://github.com/jijuta/opensearch-mcp-inbridge-secure.git
```

## 🎯 What does this do?

This is a **simple HTTP proxy** that:
1. Takes JSON-RPC messages from Claude Desktop (stdin)
2. Forwards them to your OpenSearch MCP server via HTTP
3. Returns responses back to Claude Desktop (stdout)

**No hardcoded servers, no exposed credentials!** All configuration is done in Claude Desktop.

## 🔧 Setup Guide

### Step 1: Install the Client

Run this command in your terminal/command prompt:
```bash
npm install -g git+https://github.com/jijuta/opensearch-mcp-inbridge-secure.git
```

### Step 2: Configure Claude Desktop

#### Windows Setup
1. Press `Win + R`, type `%APPDATA%`, and press Enter
2. Navigate to `Claude` folder (create if it doesn't exist)
3. Create or edit `claude_desktop_config.json`
4. Add the configuration below

#### macOS Setup
1. Open Finder
2. Press `Cmd + Shift + G` and type: `~/Library/Application Support/Claude/`
3. Create or edit `claude_desktop_config.json`
4. Add the configuration below

#### Linux Setup
1. Open your file manager or terminal
2. Navigate to `~/.config/Claude/` (create folder if needed)
3. Create or edit `claude_desktop_config.json`
4. Add the configuration below

#### Configuration for All Platforms

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "opensearch-mcp-inbridge",
      "env": {
        "MCP_SERVER_URL": "http://your-server:your-port"
      }
    }
  }
}
```

**⚠️ Important: Contact your system administrator for the correct MCP_SERVER_URL value**

### Step 3: Restart Claude Desktop

1. **Completely close** Claude Desktop (check system tray/dock)
2. **Restart** Claude Desktop
3. Look for OpenSearch tools in your Claude interface

Your OpenSearch tools will now be available! 🎉

## 🔒 Security Features

- **No hardcoded servers**: All configuration via environment variables
- **No credentials in code**: Server URLs specified only in Claude Desktop config
- **Minimal dependencies**: Only axios for HTTP requests
- **Clear error messages**: Helpful guidance when misconfigured

## 🛠️ Available OpenSearch Tools

Once connected, you'll have access to:

- **Index_Lister**: List all OpenSearch indices
- **Index_Searcher**: Search within indices using Query DSL
- **Cluster_Health_Checker**: Check cluster health status
- **IndexMappingTool**: Get index mappings and settings
- **GetShardsTool**: View shard information
- **CountTool**: Count documents in indices
- **MsearchTool**: Multi-search operations
- **ExplainTool**: Explain query execution

## 🔍 Troubleshooting

### Installation Issues

#### "npm command not found"
- Install Node.js from [nodejs.org](https://nodejs.org)
- Restart your terminal/command prompt after installation

#### "Permission denied" (macOS/Linux)
```bash
sudo npm install -g git+https://github.com/jijuta/opensearch-mcp-inbridge-secure.git
```

#### Windows PowerShell execution policy error
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Configuration Issues

#### "MCP_SERVER_URL environment variable is required"
- Double-check your `claude_desktop_config.json` syntax
- Ensure the JSON is valid (use [jsonlint.com](https://jsonlint.com))
- Contact your system administrator for the correct URL

#### Claude Desktop not recognizing the server
1. Verify config file location:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
2. Check JSON syntax is correct
3. **Completely restart** Claude Desktop (close from system tray/dock)
4. Check Claude Desktop logs for errors

### Connection Issues

#### "Cannot connect to MCP server"
- Verify you have the correct MCP_SERVER_URL from your admin
- Check network connectivity to the server
- Ensure the server format is `http://hostname:port` or `https://hostname:port`
- Contact your system administrator to verify the server is running

#### Tools not appearing in Claude
- Wait 10-30 seconds after restart for tools to load
- Check Claude Desktop's debug logs
- Verify the opensearch-mcp-inbridge command is working:
  ```bash
  which opensearch-mcp-inbridge
  ```

## 🏗️ Requirements

- Node.js 16+
- Access to an OpenSearch MCP server
- Claude Desktop
- MCP server URL from your system administrator

## 📞 Support

For server connection details, contact your system administrator or IT support team.

## 📝 License

MIT

---

**Secure, simple, and configurable!** 🔒