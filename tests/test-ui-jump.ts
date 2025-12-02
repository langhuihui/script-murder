import { chromium } from 'playwright';

async function testUIJump() {
  console.log('🚀 开始测试游戏界面跳转...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听控制台消息
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('game') || text.includes('Game') || text.includes('view') || text.includes('Body classes')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    // 1. 打开页面
    console.log('📄 步骤 1: 打开首页...');
    await page.goto('http://localhost:4000/', { waitUntil: 'networkidle' });
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
    expect(bodyClass1).toContain('in-room');
    console.log('✓ 房间创建成功，进入等待房间界面\n');

    // 3. 点击开始游戏按钮
    console.log('🎮 步骤 3: 点击开始游戏...');
    const startGameBtn = page.locator('#startGameBtn');
    await startGameBtn.waitFor({ state: 'visible', timeout: 5000 });
    
    // 等待一下确保按钮可点击
    await page.waitForTimeout(500);
    
    // 点击前记录类名
    const bodyClassBefore = await page.evaluate(() => document.body.className);
    console.log(`点击前 body class: ${bodyClassBefore}`);
    
    await startGameBtn.click();
    
    // 等待游戏开始事件
    console.log('⏳ 等待游戏开始事件...');
    await page.waitForTimeout(3000);
    
    // 检查类名是否改变
    const bodyClassAfter = await page.evaluate(() => document.body.className);
    console.log(`点击后 body class: ${bodyClassAfter}`);
    
    // 检查是否跳转到游戏界面
    if (bodyClassAfter.includes('game-view-active') && !bodyClassAfter.includes('in-room')) {
      console.log('✅ 成功！界面已跳转到游戏界面');
    } else {
      console.log('❌ 失败！界面没有跳转');
      console.log(`   期望: 包含 'game-view-active' 且不包含 'in-room'`);
      console.log(`   实际: ${bodyClassAfter}`);
      
      // 检查游戏控制区域是否显示
      const gameControlSection = page.locator('#gameControlSection');
      const isVisible = await gameControlSection.isVisible();
      console.log(`   游戏控制区域是否可见: ${isVisible}`);
      
      // 检查下一阶段按钮
      const nextPhaseBtn = page.locator('#nextPhaseBtn');
      const nextPhaseVisible = await nextPhaseBtn.isVisible();
      console.log(`   下一阶段按钮是否可见: ${nextPhaseVisible}`);
      
      // 截图
      await page.screenshot({ path: 'test-results/ui-jump-failed.png', fullPage: true });
      console.log('   已保存截图到 test-results/ui-jump-failed.png');
    }

    // 等待一下观察
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    await page.screenshot({ path: 'test-results/ui-jump-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

// 运行测试
testUIJump().catch(console.error);

function expect(condition: boolean) {
  if (!condition) {
    throw new Error('Assertion failed');
  }
}

