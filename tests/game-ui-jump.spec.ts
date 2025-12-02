import { test, expect } from '@playwright/test';
import { startTestServer, ServerInstance } from './utils/server-helper';

test.describe('游戏界面跳转测试', () => {
  let server: ServerInstance | null = null;

  test.beforeAll(async () => {
    server = await startTestServer();
  });

  test.afterAll(async () => {
    if (server) {
      server.cleanup();
    }
  });

  test('游戏开始后应该跳转到游戏界面', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    // 监听控制台消息
    hostPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('game') || text.includes('Game') || text.includes('view') || text.includes('View')) {
        console.log(`[HOST] ${text}`);
      }
    });

    playerPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('game') || text.includes('Game') || text.includes('view') || text.includes('View')) {
        console.log(`[PLAYER] ${text}`);
      }
    });

    try {
      // 1. 房主创建房间
      console.log('\n=== 步骤 1: 房主创建房间 ===');
      await hostPage.goto('http://localhost:4000/');
      await hostPage.waitForSelector('#scriptList', { timeout: 10000 });
      await hostPage.waitForSelector('.script-card', { timeout: 5000 });

      const createRoomButton = hostPage.locator('.script-card button:has-text("创建房间")').first();
      await createRoomButton.click();

      try {
        await hostPage.waitForSelector('#playerNameModal.active', { timeout: 2000 });
        await hostPage.locator('#modalPlayerName').fill('房主');
        await hostPage.locator('#playerNameModal button:has-text("确定")').click();
        await hostPage.waitForSelector('#playerNameModal:not(.active)', { timeout: 2000 });
      } catch (e) {
        // 忽略
      }

      await hostPage.waitForSelector('#roomSection.active', { timeout: 10000 });

      // 检查是否在等待房间界面
      const hostBodyClass = await hostPage.evaluate(() => document.body.className);
      console.log('房主创建房间后 body class:', hostBodyClass);
      expect(hostBodyClass).toContain('in-room');

      const roomInfo = await hostPage.locator('#roomInfo').textContent();
      const roomIdMatch = roomInfo?.match(/房间号[：:]\s*(\d{6})/);
      const roomId = roomIdMatch?.[1];
      expect(roomId).toBeTruthy();
      console.log('✓ 房间创建成功，房间号:', roomId);

      // 2. 玩家加入房间
      console.log('\n=== 步骤 2: 玩家加入房间 ===');
      await playerPage.goto('http://localhost:4000/');
      await playerPage.waitForSelector('#scriptList', { timeout: 10000 });
      await playerPage.waitForSelector('.script-card', { timeout: 5000 });

      const joinRoomButton = playerPage.locator('.script-card button:has-text("加入房间")').first();
      await joinRoomButton.click();

      await playerPage.waitForSelector('#joinRoomModal.active', { timeout: 3000 });
      await playerPage.locator('#joinRoomIdInput').fill(roomId!);
      await playerPage.locator('#joinPlayerNameInput').fill('测试玩家');
      await playerPage.locator('#joinRoomModal button:has-text("加入")').click();

      await playerPage.waitForSelector('#roomSection.active', { timeout: 5000 });
      await hostPage.waitForTimeout(1000);

      // 检查玩家是否在等待房间界面
      const playerBodyClass = await playerPage.evaluate(() => document.body.className);
      console.log('玩家加入房间后 body class:', playerBodyClass);
      expect(playerBodyClass).toContain('in-room');

      console.log('✓ 玩家加入成功');

      // 3. 房主点击开始游戏按钮
      console.log('\n=== 步骤 3: 房主点击开始游戏 ===');

      // 等待开始游戏按钮出现
      const startGameBtn = hostPage.locator('#startGameBtn');
      await startGameBtn.waitFor({ state: 'visible', timeout: 5000 });
      await startGameBtn.click();

      // 等待游戏开始事件
      await hostPage.waitForTimeout(2000);

      // 检查房主界面是否跳转到游戏界面
      const hostBodyClassAfterStart = await hostPage.evaluate(() => document.body.className);
      console.log('房主开始游戏后 body class:', hostBodyClassAfterStart);

      // 应该包含 game-view-active，不应该包含 in-room
      expect(hostBodyClassAfterStart).toContain('game-view-active');
      expect(hostBodyClassAfterStart).not.toContain('in-room');

      // 检查游戏控制区域是否显示
      const gameControlSection = hostPage.locator('#gameControlSection');
      await expect(gameControlSection).toBeVisible({ timeout: 3000 });

      // 检查下一阶段按钮是否显示
      const nextPhaseBtn = hostPage.locator('#nextPhaseBtn');
      await expect(nextPhaseBtn).toBeVisible({ timeout: 3000 });

      console.log('✓ 房主界面已跳转到游戏界面');

      // 4. 检查玩家界面是否也跳转
      console.log('\n=== 步骤 4: 检查玩家界面 ===');
      await playerPage.waitForTimeout(2000);

      const playerBodyClassAfterStart = await playerPage.evaluate(() => document.body.className);
      console.log('玩家游戏开始后 body class:', playerBodyClassAfterStart);

      // 玩家也应该跳转到游戏界面
      expect(playerBodyClassAfterStart).toContain('game-view-active');
      expect(playerBodyClassAfterStart).not.toContain('in-room');

      // 检查玩家游戏区域是否显示
      const playerGameSection = playerPage.locator('#playerGameSection');
      await expect(playerGameSection).toBeVisible({ timeout: 3000 });

      // 检查等待区域是否隐藏
      const waitingSection = playerPage.locator('#waitingSection');
      await expect(waitingSection).not.toBeVisible({ timeout: 3000 });

      // 检查角色信息是否显示
      const characterInfo = playerPage.locator('#characterInfo');
      await expect(characterInfo).toBeVisible({ timeout: 3000 });

      console.log('✓ 玩家界面已跳转到游戏界面');

      console.log('\n=== 测试完成 ===');

    } catch (error) {
      console.error('\n=== 测试失败 ===');
      console.error('错误:', error);

      // 截图调试
      await hostPage.screenshot({ path: 'test-results/host-page-error.png' });
      await playerPage.screenshot({ path: 'test-results/player-page-error.png' });

      throw error;
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  }, 60000);
});

