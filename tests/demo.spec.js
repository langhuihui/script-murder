const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');

function waitForOutput(proc, text, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for "${text}"`));
    }, timeoutMs);

    const onData = (data) => {
      buffer += data.toString();
      if (buffer.includes(text)) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout.off('data', onData);
      proc.stderr.off('data', onData);
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
  });
}

test('jubensha demo full flow via demo.js', async () => {
  const cwd = path.resolve(__dirname, '..');

  // 1. 启动 WebSocket Server
  const server = spawn('node', ['server/index.js'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // 等待服务启动完成
  await waitForOutput(
    server,
    'WebSocket Server started on ws://localhost:8080',
    10000
  );

  // 2. 运行 demo.js
  let output = '';
  const demo = spawn('node', ['demo.js'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  demo.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);
  });

  demo.stderr.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stderr.write(text);
  });

  const exitCode = await new Promise((resolve) => {
    demo.on('close', (code) => resolve(code));
  });

  // 3. 关闭 server
  server.kill('SIGTERM');

  // 4. 断言结果
  expect(exitCode).toBe(0);
  expect(output).toContain('[HOST] Room created:');
  expect(output).toContain('Phase changed to READING');
  expect(output).toContain('Submitting clue CLUE_001...');
  expect(output).toContain('Demo finished, disconnecting...');
});

