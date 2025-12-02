import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface ServerInstance {
  process: ChildProcess;
  cleanup: () => void;
}

/**
 * 启动测试服务器
 */
export function startTestServer(): Promise<ServerInstance> {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('tsx', ['server/index.ts'], {
      cwd: path.resolve(__dirname, '..', '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        serverProcess.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 15000); // 增加到15秒

    const checkOutput = (data: Buffer) => {
      const text = data.toString();
      if (text.includes('Server started on port') || text.includes('Server is ready')) {
        serverReady = true;
        clearTimeout(timeout);
        resolve({
          process: serverProcess,
          cleanup: () => {
            serverProcess.kill('SIGTERM');
            setTimeout(() => {
              if (!serverProcess.killed) {
                serverProcess.kill('SIGKILL');
              }
            }, 2000);
          }
        });
      }
    };

    serverProcess.stdout.on('data', checkOutput);
    serverProcess.stderr.on('data', checkOutput);

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * 等待进程输出指定文本
 */
export function waitForOutput(
  proc: ChildProcess,
  text: string,
  timeoutMs: number = 10000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for "${text}"`));
    }, timeoutMs);

    const onData = (data: Buffer) => {
      buffer += data.toString();
      if (buffer.includes(text)) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout?.off('data', onData);
      proc.stderr?.off('data', onData);
    };

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
  });
}

