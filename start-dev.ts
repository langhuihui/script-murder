import { spawn } from 'child_process';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPortConfig } from './src/utils/port-config';
import { delay } from './src/utils/delay';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname);

// 从环境变量读取端口配置（现在共用同一个端口）
const { PORT } = getPortConfig();

// 等待服务器启动
async function waitForServer(maxWait = 15000): Promise<void> {
  const startTime = Date.now();
  
  // 等待 2 秒后开始检查
  await delay(2000);
  
  while (Date.now() - startTime < maxWait) {
    try {
      const { WebSocket } = await import('ws');
      const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
      
      const connected = await Promise.race([
        new Promise<boolean>((resolve) => {
          ws.on('open', () => {
            ws.close();
            resolve(true);
          });
        }),
        delay(500).then(() => false)
      ]);
      
      if (connected) {
        return;
      }
    } catch (error) {
      // 继续重试
    }
    
    await delay(500);
  }
  
  throw new Error('Server startup timeout');
}

// 打开浏览器
function openBrowser(url: string, role: 'host' | 'player') {
  const fullUrl = `${url}?role=${role}`;
  const platform = process.platform;
  
  let command: string;
  if (platform === 'darwin') {
    // macOS
    command = `open -a "Google Chrome" "${fullUrl}" || open -a "Safari" "${fullUrl}" || open "${fullUrl}"`;
  } else if (platform === 'win32') {
    // Windows
    command = `start chrome "${fullUrl}" || start msedge "${fullUrl}" || start "${fullUrl}"`;
  } else {
    // Linux
    command = `xdg-open "${fullUrl}" || google-chrome "${fullUrl}" || chromium-browser "${fullUrl}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.warn(`Failed to open browser for ${role}:`, error.message);
      console.log(`Please manually open: ${fullUrl}`);
    } else {
      console.log(`✓ Opened ${role} window: ${fullUrl}`);
    }
  });
}

async function main() {
  console.log('🚀 Starting development environment...\n');
  
  // 1. 启动服务器
  console.log('1. Starting server...');
  const serverProcess = spawn('tsx', ['server/index.ts'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });
  
  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    const text = data.toString();
    serverOutput += text;
    process.stdout.write(`[SERVER] ${text}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(`[SERVER ERROR] ${text}`);
  });
  
  // 等待服务器启动
  try {
    await waitForServer(20000);
    console.log('\n✓ Server is ready!\n');
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    serverProcess.kill();
    process.exit(1);
  }
  
  // 2. 获取 HTML 文件路径
  const htmlPath = path.join(projectRoot, 'test-script-list.html');
  // 通过 URL 参数传递端口信息
  const htmlUrl = `file://${htmlPath}?wsPort=${PORT}&httpPort=${PORT}`;
  
  // 3. 打开两个浏览器窗口
  console.log('2. Opening browser windows...');
  console.log(`   Using port: ${PORT} (WebSocket and HTTP share the same port)`);
  
  // 延迟打开，确保第一个窗口完全加载
  await delay(1000);
  openBrowser(htmlUrl, 'host');
  
  await delay(2000);
  openBrowser(htmlUrl, 'player');
  
  console.log('\n✓ Development environment ready!');
  console.log('  - Host window: Will automatically create a room');
  console.log('  - Player window: Will automatically join the room');
  console.log('\nPress Ctrl+C to stop the server\n');
  
  // 处理退出
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      serverProcess.kill('SIGKILL');
      process.exit(0);
    }, 2000);
  });
  
  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  // 保持进程运行
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Server exited with code ${code}`);
      process.exit(1);
    }
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

