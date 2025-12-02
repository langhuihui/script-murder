import { chromium } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let serverProcess: ChildProcess | null = null;

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('tsx', ['server/index.ts'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        serverProcess?.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 15000);

    const checkOutput = (data: Buffer) => {
      const text = data.toString();
      console.log(`[SERVER] ${text.trim()}`);
      if (text.includes('Server started') || text.includes('Server is ready') || text.includes('Jubensha Server started')) {
        serverReady = true;
        clearTimeout(timeout);
        resolve();
      }
    };

    serverProcess.stdout?.on('data', checkOutput);
    serverProcess.stderr?.on('data', checkOutput);

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function testUIJump() {
  console.log('🚀 开始测试游戏界面跳转...\n');
  
  // 启动服务器
  console.log('📡 启动服务器...');
  await startServer();
  console.log('✓ 服务器启动成功\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待服务器完全启动

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // 监听控制台消息
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    // 只打印游戏相关的日志
    if (text.includes('game') || text.includes('Game') || text.includes('view') || 
        text.includes('Body classes') || text.includes('updateRoomInfo') || 
        text.includes('game:started') || text.includes('status') || 
        text.includes('==========')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[ERROR] ${error.message}`);
  });

  try {
    // 1. 打开页面
    console.log('\n📄 步骤 1: 打开首页...');
    await page.goto('http://localhost:4000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#scriptList', { timeout: 10000 });
    console.log('✓ 页面加载成功\n');

    // 2. 创建房间
    console.log('🏠 步骤 2: 创建房间...');
    const createRoomBtn = page.locator('.script-card button:has-text("创建房间")').first();
    await createRoomBtn.click();
    
    // 处理玩家名称输入
    try {
      await page.waitForSelector('#playerNameModal.active', { timeout: 2000 });
      await page.locator('#modalPlayerName').fill('测试房主');
      await page.locator('#playerNameModal button:has-text("确定")').click();
      await page.waitForSelector('#playerNameModal:not(.active)', { timeout: 2000 });
    } catch (e) {
      // 忽略
    }

    await page.waitForSelector('#roomSection.active', { timeout: 10000 });
    
    // 检查是否在等待房间界面
    const bodyClass1 = await page.evaluate(() => document.body.className);
    console.log(`当前 body class: ${bodyClass1}`);
    console.log('✓ 房间创建成功，进入等待房间界面\n');

    // 等待一下确保UI稳定
    await page.waitForTimeout(1000);

    // 3. 点击开始游戏按钮
    console.log('🎮 步骤 3: 点击开始游戏...');
    const startGameBtn = page.locator('#startGameBtn');
    await startGameBtn.waitFor({ state: 'visible', timeout: 5000 });
    
    // 点击前记录类名
    const bodyClassBefore = await page.evaluate(() => document.body.className);
    console.log(`点击前 body class: ${bodyClassBefore}`);
    
    // 点击按钮
    await startGameBtn.click();
    console.log('✓ 已点击开始游戏按钮\n');
    
    // 等待游戏开始事件和处理
    console.log('⏳ 等待游戏开始事件和处理...');
    await page.waitForTimeout(5000); // 等待5秒让所有处理完成
    
    // 检查类名是否改变
    const bodyClassAfter = await page.evaluate(() => {
      return {
        className: document.body.className,
        hasGameViewActive: document.body.classList.contains('game-view-active'),
        hasInRoom: document.body.classList.contains('in-room'),
        gameControlSection: {
          exists: !!document.getElementById('gameControlSection'),
          display: document.getElementById('gameControlSection')?.style.display || 'none',
          visible: (document.getElementById('gameControlSection') as HTMLElement)?.offsetParent !== null
        },
        playerGameSection: {
          exists: !!document.getElementById('playerGameSection'),
          display: document.getElementById('playerGameSection')?.style.display || 'none',
          visible: (document.getElementById('playerGameSection') as HTMLElement)?.offsetParent !== null
        },
        waitingSection: {
          exists: !!document.getElementById('waitingSection'),
          display: document.getElementById('waitingSection')?.style.display || 'none',
          visible: (document.getElementById('waitingSection') as HTMLElement)?.offsetParent !== null
        },
        nextPhaseBtn: {
          exists: !!document.getElementById('nextPhaseBtn'),
          display: document.getElementById('nextPhaseBtn')?.style.display || 'none',
          visible: (document.getElementById('nextPhaseBtn') as HTMLElement)?.offsetParent !== null
        }
      };
    });
    
    console.log('\n📊 界面状态检查结果:');
    console.log(`  body.className: ${bodyClassAfter.className}`);
    console.log(`  has 'game-view-active': ${bodyClassAfter.hasGameViewActive}`);
    console.log(`  has 'in-room': ${bodyClassAfter.hasInRoom}`);
    console.log(`  gameControlSection: exists=${bodyClassAfter.gameControlSection.exists}, display=${bodyClassAfter.gameControlSection.display}, visible=${bodyClassAfter.gameControlSection.visible}`);
    console.log(`  playerGameSection: exists=${bodyClassAfter.playerGameSection.exists}, display=${bodyClassAfter.playerGameSection.display}, visible=${bodyClassAfter.playerGameSection.visible}`);
    console.log(`  waitingSection: exists=${bodyClassAfter.waitingSection.exists}, display=${bodyClassAfter.waitingSection.display}, visible=${bodyClassAfter.waitingSection.visible}`);
    console.log(`  nextPhaseBtn: exists=${bodyClassAfter.nextPhaseBtn.exists}, display=${bodyClassAfter.nextPhaseBtn.display}, visible=${bodyClassAfter.nextPhaseBtn.visible}`);
    
    // 检查是否跳转到游戏界面
    if (bodyClassAfter.hasGameViewActive && !bodyClassAfter.hasInRoom) {
      console.log('\n✅ 成功！界面已跳转到游戏界面');
    } else {
      console.log('\n❌ 失败！界面没有跳转');
      console.log(`   期望: 包含 'game-view-active' 且不包含 'in-room'`);
      console.log(`   实际: className="${bodyClassAfter.className}"`);
      
      // 截图
      await page.screenshot({ path: 'test-results/ui-jump-failed.png', fullPage: true });
      console.log('   已保存截图到 test-results/ui-jump-failed.png');
    }

    // 打印所有相关的控制台消息
    console.log('\n📝 所有相关控制台消息:');
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('game') || msg.includes('Game') || msg.includes('view') || 
      msg.includes('Body classes') || msg.includes('updateRoomInfo') || 
      msg.includes('game:started') || msg.includes('status') || 
      msg.includes('==========') || msg.includes('Room status')
    );
    relevantMessages.forEach(msg => console.log(`  ${msg}`));

    // 等待一下观察
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    await page.screenshot({ path: 'test-results/ui-jump-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
      }, 2000);
    }
  }
}

// 运行测试
testUIJump().catch(console.error);

