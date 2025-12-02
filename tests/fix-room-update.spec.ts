import { test, expect } from '@playwright/test';
import { startTestServer, ServerInstance } from './utils/server-helper';

test.describe('房间更新问题测试', () => {
  let server: ServerInstance | null = null;

  test.beforeAll(async () => {
    server = await startTestServer();
  });

  test.afterAll(async () => {
    if (server) {
      server.cleanup();
    }
  });

  test('房主创建房间后，玩家加入，房主应该看到玩家', async ({ browser }) => {
    // 创建两个页面：房主和玩家
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    // 收集所有日志
    const hostLogs: string[] = [];
    const playerLogs: string[] = [];
    const serverLogs: string[] = [];

    // 监听控制台消息
    hostPage.on('console', msg => {
      const text = msg.text();
      hostLogs.push(`[HOST CONSOLE ${msg.type()}]: ${text}`);
      console.log(`[HOST CONSOLE ${msg.type()}]: ${text}`);
    });

    playerPage.on('console', msg => {
      const text = msg.text();
      playerLogs.push(`[PLAYER CONSOLE ${msg.type()}]: ${text}`);
      console.log(`[PLAYER CONSOLE ${msg.type()}]: ${text}`);
    });

    try {
      // 1. 房主打开页面
      console.log('\n=== 步骤 1: 房主打开页面 ===');
      await hostPage.goto('http://localhost:4000/');
      await hostPage.waitForSelector('#scriptList', { timeout: 10000 });
      console.log('✓ 房主页面加载完成');

      // 等待剧本列表加载
      await hostPage.waitForSelector('.script-card', { timeout: 5000 });
      console.log('✓ 剧本列表加载完成');

      // 2. 房主创建房间
      console.log('\n=== 步骤 2: 房主创建房间 ===');
      
      // 点击第一个剧本的"创建房间"按钮
      const createRoomButton = hostPage.locator('.script-card button:has-text("创建房间")').first();
      await createRoomButton.click();
      
      // 处理可能出现的模态对话框（输入玩家名称）
      try {
        await hostPage.waitForSelector('#playerNameModal.active', { timeout: 2000 });
        console.log('检测到玩家名称输入对话框');
        
        // 输入玩家名称并确认
        await hostPage.locator('#modalPlayerName').fill('房主');
        await hostPage.locator('#playerNameModal button:has-text("确定")').click();
        
        // 等待模态对话框关闭
        await hostPage.waitForSelector('#playerNameModal:not(.active)', { timeout: 2000 });
      } catch (e) {
        console.log('没有检测到玩家名称输入对话框，继续...');
      }
      
      // 等待房间区域显示
      await hostPage.waitForSelector('#roomSection.active', { timeout: 10000 });
      console.log('✓ 房间区域已显示');

      // 获取房间号
      const roomInfo = await hostPage.locator('#roomInfo').textContent();
      console.log('房主看到的房间信息:', roomInfo);
      
      const roomIdMatch = roomInfo?.match(/房间号[：:]\s*(\d{6})/);
      const roomId = roomIdMatch?.[1];
      expect(roomId).toBeTruthy();
      console.log('✓ 获取到房间号:', roomId);

      // 等待一下确保房间创建完成
      await hostPage.waitForTimeout(1000);

      // 3. 检查房主看到的初始玩家数
      const initialPlayerCount = await hostPage.locator('#roomInfo').textContent();
      console.log('房主初始看到的房间信息:', initialPlayerCount);
      expect(initialPlayerCount).toContain('人数：1/');

      // 4. 玩家打开页面并加入房间
      console.log('\n=== 步骤 3: 玩家打开页面并加入房间 ===');
      await playerPage.goto('http://localhost:4000/');
      await playerPage.waitForSelector('#scriptList', { timeout: 10000 });
      console.log('✓ 玩家页面加载完成');

      // 等待剧本列表加载
      await playerPage.waitForSelector('.script-card', { timeout: 5000 });

      // 点击第一个剧本的"加入房间"按钮
      const joinRoomButton = playerPage.locator('.script-card button:has-text("加入房间")').first();
      await joinRoomButton.click();

      // 等待模态对话框显示
      await playerPage.waitForSelector('#joinRoomModal.active', { timeout: 3000 });

      // 输入房间号
      await playerPage.locator('#joinRoomIdInput').fill(roomId!);
      await playerPage.locator('#joinPlayerNameInput').fill('测试玩家');

      // 点击确认按钮
      await playerPage.locator('#joinRoomModal button:has-text("加入")').click();

      // 等待房间区域显示
      await playerPage.waitForSelector('#roomSection.active', { timeout: 5000 });
      console.log('✓ 玩家加入房间成功');

      // 5. 等待一下，让服务器广播消息
      await hostPage.waitForTimeout(2000);

      // 6. 检查房主是否看到玩家
      console.log('\n=== 步骤 4: 检查房主是否看到玩家 ===');
      
      const hostRoomInfo = await hostPage.locator('#roomInfo').textContent();
      console.log('房主当前看到的房间信息:', hostRoomInfo);
      
      // 检查人数是否更新为 2
      expect(hostRoomInfo).toContain('人数：2/');
      console.log('✓ 房主看到的人数已更新为 2');

      // 检查玩家列表
      const hostPlayerList = await hostPage.locator('#playerList').textContent();
      console.log('房主看到的玩家列表:', hostPlayerList);
      
      expect(hostPlayerList).toContain('房主');
      expect(hostPlayerList).toContain('测试玩家');
      console.log('✓ 房主看到玩家列表中包含"房主"和"测试玩家"');

      // 7. 检查玩家看到的房间信息
      console.log('\n=== 步骤 5: 检查玩家看到的房间信息 ===');
      const playerRoomInfo = await playerPage.locator('#roomInfo').textContent();
      console.log('玩家看到的房间信息:', playerRoomInfo);
      expect(playerRoomInfo).toContain('人数：2/');
      console.log('✓ 玩家看到的人数正确');

      console.log('\n=== 测试通过 ===');

    } catch (error) {
      console.error('\n=== 测试失败 ===');
      console.error('错误:', error);
      
      console.log('\n=== 房主日志 ===');
      hostLogs.forEach(log => console.log(log));
      
      console.log('\n=== 玩家日志 ===');
      playerLogs.forEach(log => console.log(log));
      
      throw error;
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  }, 60000); // 60秒超时
});

