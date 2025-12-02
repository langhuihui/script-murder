import { JubenshaServer } from '../src/server';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPortConfig } from '../src/utils/port-config';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从环境变量读取端口配置（现在共用同一个端口）
const PORT = parseInt(process.env.PORT || process.env.WS_PORT || process.env.HTTP_PORT || '4000', 10);

// Content-Type 映射
const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.html': 'text/html'
};

const SCRIPTS_DIR = join(__dirname, '..', 'scripts');
const ROOT_DIR = join(__dirname, '..');
const INDEX_FILE = join(ROOT_DIR, 'test-script-list.html');

// 创建 HTTP 服务器用于提供静态文件（CSS、图片等）
const httpServer = createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // 处理首页请求
  if (req.url === '/' || req.url === '/index.html') {
    if (existsSync(INDEX_FILE)) {
      try {
        const content = readFileSync(INDEX_FILE);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      } catch (error) {
        console.error('Error serving index file:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
    } else {
      res.writeHead(404);
      res.end('Index file not found');
      return;
    }
  }

  // 处理静态文件请求（scripts 目录下的文件）
  if (req.url.startsWith('/scripts/')) {
    const filePath = join(__dirname, '..', req.url);
    
    // 安全检查：确保文件在 scripts 目录内
    if (!filePath.startsWith(SCRIPTS_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      console.error('Error serving file:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
    return;
  }

  // 处理根目录静态文件（CSS、JS 等）
  const rootStaticFiles = ['/styles.css', '/app.js'];
  if (rootStaticFiles.includes(req.url)) {
    const filePath = join(ROOT_DIR, req.url);
    
    // 安全检查：确保文件在项目根目录内
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    } catch (error) {
      console.error('Error serving static file:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
  }

  // 其他请求返回 404
  res.writeHead(404);
  res.end('Not Found');
});

// 启动 WebSocket 服务器（挂载到 HTTP 服务器上）
const wsServer = new JubenshaServer({
  server: httpServer,
  path: '/ws'
});

// 启动 HTTP 服务器（WebSocket 也挂载在这个服务器上）
httpServer.listen(PORT, () => {
  console.log(`\n✅ Server started on port ${PORT}`);
  console.log(`\n🌐 HTTP Server:`);
  console.log(`   Homepage: http://localhost:${PORT}/`);
  console.log(`   Static files: http://localhost:${PORT}/scripts/`);
  console.log(`\n📡 WebSocket Server:`);
  console.log(`   URL: ws://localhost:${PORT}/ws`);
  console.log(`\n⚙️  Port: ${PORT} (from env: PORT=${process.env.PORT || process.env.WS_PORT || process.env.HTTP_PORT || 'default'})`);
  console.log('\n✅ Server is ready to accept connections');
});