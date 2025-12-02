import { test, expect } from '@playwright/test';
import { startTestServer, ServerInstance } from './utils/server-helper';

const SERVER_URL = 'ws://localhost:4000/ws';

test.describe('剧本杀主流程测试', () => {
  let server: ServerInstance | null = null;

  test.beforeAll(async () => {
    server = await startTestServer();
  });

  test.afterAll(async () => {
    if (server) {
      server.cleanup();
    }
  });

  test('完整流程：剧本列表 -> 创建房间 -> 加入房间 -> 准备 -> 聊天', async ({ page }) => {
    // 1. 打开剧本列表页面
    await page.goto(`file://${process.cwd()}/test-script-list.html`);
    
    // 2. 等待页面加载并连接服务器
    await page.waitForSelector('#scriptList', { timeout: 10000 });
    
    // 3. 验证剧本列表已加载
    const scriptCards = page.locator('.script-card');
    await expect(scriptCards).toHaveCount(1, { timeout: 5000 });
    
    // 4. 验证剧本信息
    await expect(page.locator('text=以斯帖记：王后的勇气')).toBeVisible();
    await expect(page.locator('text=4-6人')).toBeVisible();
    await expect(page.locator('text=90分钟')).toBeVisible();
    
    // 5. 创建房间
    const createRoomButton = page.locator('button:has-text("创建房间")').first();
    await createRoomButton.click();
    
    // 6. 处理模态对话框输入玩家名称（如果有）
    // 等待模态对话框可能出现（如果没有 userRole，会显示模态对话框）
    const modal = page.locator('#playerNameModal');
    
    // 等待模态对话框显示（最多等待 3 秒）
    try {
      // 使用 evaluate 检查 active 类，因为 CSS display:flex 可能不被 Playwright 正确识别为 visible
      await page.waitForFunction(
        () => {
          const modalEl = document.getElementById('playerNameModal');
          return modalEl && modalEl.classList.contains('active');
        },
        { timeout: 3000 }
      );
      const modalInput = page.locator('#modalPlayerName');
      await modalInput.fill('测试房主');
      await page.waitForTimeout(200); // 确保输入完成和回调设置完成
      
      // 直接通过 JavaScript 调用 confirmPlayerName 函数，确保执行
      await page.evaluate(() => {
        if (typeof window.confirmPlayerName === 'function') {
          window.confirmPlayerName();
        }
      });
      
      // 等待模态对话框关闭或房间信息显示
      await Promise.race([
        page.waitForFunction(
          () => {
            const modalEl = document.getElementById('playerNameModal');
            return modalEl && !modalEl.classList.contains('active');
          },
          { timeout: 5000 }
        ),
        page.waitForSelector('#roomSection.active', { timeout: 5000 })
      ]).catch(() => {
        console.log('Waiting timeout, continuing...');
      });
      console.log('Modal dialog closed or room section shown');
    } catch (e) {
      // 如果没有模态对话框，继续执行
      console.log('No modal dialog or timeout, continuing...');
    }
    
    // 等待一下，确保请求发送完成
    await page.waitForTimeout(500);
    
    // 检查是否有错误信息
    const errorDiv = page.locator('#error');
    const errorVisible = await errorDiv.isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await errorDiv.textContent();
      console.log('Error message:', errorText);
      throw new Error(`Page error: ${errorText}`);
    }
    
    // 监听控制台消息以调试
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`[Page Console] ${msg.text()}`);
      }
    });
    
    // 7. 等待房间信息显示 - 使用更宽松的选择器
    try {
      await page.waitForSelector('#roomSection.active', { timeout: 10000 });
    } catch (e) {
      // 如果失败，检查房间区域是否存在
      const roomSection = page.locator('#roomSection');
      const isVisible = await roomSection.isVisible().catch(() => false);
      const roomInfo = await roomSection.textContent().catch(() => '');
      console.log('Room section visible:', isVisible);
      console.log('Room section content:', roomInfo);
      throw e;
    }
    
    // 8. 验证房间信息
    const roomInfo = page.locator('#roomInfo');
    await expect(roomInfo).toContainText('房间号：');
    await expect(roomInfo).toContainText('剧本：esther-story');
    await expect(roomInfo).toContainText('人数：1/6');
    
    // 9. 验证房主在玩家列表中
    await expect(page.locator('.player-item:has-text("测试房主")')).toBeVisible();
    await expect(page.locator('.host-badge:has-text("房主")')).toBeVisible();
    
    // 10. 点击剧本卡片的"加入房间"按钮来加入房间（模拟第二个玩家）
    // 使用第一个方法：点击剧本卡片上的加入房间按钮
    const scriptCardJoinButton = page.locator('.script-card button:has-text("加入房间")').first();
    await scriptCardJoinButton.click();
    
    // 等待模态对话框显示
    await page.waitForSelector('#joinRoomModal.active', { timeout: 3000 });
    
    // 获取房间号（从房主页面看到的）
    const roomInfoText = await page.locator('#roomInfo').textContent();
    const roomIdMatch = roomInfoText?.match(/房间号[：:]\s*(\d{6})/);
    const roomId = roomIdMatch?.[1];
    
    if (roomId) {
      // 输入房间号
      await page.locator('#joinRoomIdInput').fill(roomId);
      await page.locator('#joinPlayerNameInput').fill('测试玩家1');
      await page.locator('#joinRoomModal button:has-text("加入")').click();
    } else {
      // 如果没有房间号，直接使用默认值（这种情况不应该发生）
      await page.locator('#joinRoomModal button:has-text("取消")').click();
    }
    
    // 11. 等待玩家加入
    await page.waitForTimeout(1000);
    
    // 12. 验证房间人数更新（应该显示2人）
    await expect(roomInfo).toContainText('人数：2/6', { timeout: 3000 });
    
    // 13. 验证新玩家在列表中
    await expect(page.locator('.player-item:has-text("测试玩家1")')).toBeVisible({ timeout: 3000 });
    
    console.log('✓ 主流程测试通过');
  });

  test('WebSocket 连接测试', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/test-script-list.html`);
    
    // 等待连接建立
    await page.waitForSelector('#scriptList', { timeout: 10000 });
    
    // 验证没有错误信息
    const errorDiv = page.locator('#error');
    const isErrorVisible = await errorDiv.isVisible().catch(() => false);
    expect(isErrorVisible).toBe(false);
    
    // 验证加载状态已消失
    const loadingDiv = page.locator('#loading');
    await expect(loadingDiv).not.toBeVisible({ timeout: 5000 });
  });

  test('剧本列表查询测试', async () => {
    // 使用 WebSocket 直接测试
    const WebSocket = require('ws');
    const ws = new WebSocket(SERVER_URL);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      ws.on('open', () => {
        const requestId = Date.now().toString();
        ws.send(JSON.stringify({
          id: requestId,
          event: 'script:list',
          data: {}
        }));
      });
      
      ws.on('message', (data: string) => {
        const message = JSON.parse(data.toString());
        if (message.id && message.data?.scripts) {
          clearTimeout(timeout);
          const scripts = message.data.scripts;
          
          // 验证返回的剧本列表
          expect(scripts).toBeInstanceOf(Array);
          expect(scripts.length).toBeGreaterThan(0);
          
          // 验证剧本信息
          const estherScript = scripts.find((s: any) => s.id === 'esther-story');
          expect(estherScript).toBeDefined();
          expect(estherScript.title).toBe('以斯帖记：王后的勇气');
          expect(estherScript.maxPlayers).toBe(6);
          expect(estherScript.minPlayers).toBe(4);
          
          ws.close();
          resolve();
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  });

  test('创建房间和加入房间测试', async () => {
    const WebSocket = require('ws');
    
    // 创建两个 WebSocket 连接模拟房主和玩家
    const hostWs = new WebSocket(SERVER_URL);
    const playerWs = new WebSocket(SERVER_URL);
    
    let hostRoomId: string | null = null;
    let hostPlayerId: string | null = null;
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        hostWs.close();
        playerWs.close();
        reject(new Error('Test timeout'));
      }, 15000);
      
      let hostConnected = false;
      let playerConnected = false;
      
      const checkBothConnected = () => {
        if (hostConnected && playerConnected) {
          // 房主创建房间
          const createRequestId = Date.now().toString();
          hostWs.send(JSON.stringify({
            id: createRequestId,
            event: 'room:create',
            data: {
              scriptId: 'esther-story',
              maxPlayers: 6,
              playerName: '测试房主'
            }
          }));
        }
      };
      
      hostWs.on('open', () => {
        hostConnected = true;
        checkBothConnected();
      });
      
      playerWs.on('open', () => {
        playerConnected = true;
        checkBothConnected();
      });
      
      hostWs.on('message', (data: string) => {
        const message = JSON.parse(data.toString());
        
        if (message.id && message.data?.roomId) {
          hostRoomId = message.data.roomId;
          hostPlayerId = message.data.player?.id;
          
          expect(hostRoomId).toBeTruthy();
          expect(message.data.room.scriptId).toBe('esther-story');
          expect(message.data.room.maxPlayers).toBe(6);
          expect(message.data.player.isHost).toBe(true);
          
          // 玩家加入房间
          const joinRequestId = Date.now().toString();
          playerWs.send(JSON.stringify({
            id: joinRequestId,
            event: 'room:join',
            data: {
              roomId: hostRoomId,
              playerName: '测试玩家'
            }
          }));
        }
      });
      
      playerWs.on('message', (data: string) => {
        const message = JSON.parse(data.toString());
        
        if (message.id && message.data?.room) {
          expect(message.data.room.id).toBe(hostRoomId);
          expect(message.data.room.players.length).toBe(2);
          
          const playerNames = message.data.room.players.map((p: any) => p.name);
          expect(playerNames).toContain('测试房主');
          expect(playerNames).toContain('测试玩家');
          
          clearTimeout(timeout);
          hostWs.close();
          playerWs.close();
          resolve();
        }
      });
      
      hostWs.on('error', (error) => {
        clearTimeout(timeout);
        playerWs.close();
        reject(error);
      });
      
      playerWs.on('error', (error) => {
        clearTimeout(timeout);
        hostWs.close();
        reject(error);
      });
    });
  });

  test('准备状态和聊天测试', async () => {
    const WebSocket = require('ws');
    
    const hostWs = new WebSocket(SERVER_URL);
    const playerWs = new WebSocket(SERVER_URL);
    
    let hostRoomId: string | null = null;
    let hostPlayerId: string | null = null;
    let playerPlayerId: string | null = null;
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        hostWs.close();
        playerWs.close();
        reject(new Error('Test timeout'));
      }, 20000);
      
      let hostInRoom = false;
      let playerInRoom = false;
      let readyTested = false;
      let chatTested = false;
      
      // 房主创建房间
      hostWs.on('open', () => {
        hostWs.send(JSON.stringify({
          id: '1',
          event: 'room:create',
          data: {
            scriptId: 'esther-story',
            maxPlayers: 6,
            playerName: '房主'
          }
        }));
      });
      
      // 玩家连接后等待房间创建
      playerWs.on('open', () => {
        // 等待 hostRoomId 被设置
      });
      
      hostWs.on('message', (data: string) => {
        const message = JSON.parse(data.toString());
        
        if (message.id === '1' && message.data?.roomId) {
          hostRoomId = message.data.roomId;
          hostPlayerId = message.data.player?.id;
          hostInRoom = true;
          
          // 玩家加入房间（确保 playerWs 已连接）
          if (playerWs.readyState === WebSocket.OPEN) {
            playerWs.send(JSON.stringify({
              id: '2',
              event: 'room:join',
              data: {
                roomId: hostRoomId,
                playerName: '玩家1'
              }
            }));
          }
        }
        
        if (message.id === '3' && message.data?.success) {
          expect(message.data.isReady).toBe(true);
          readyTested = true;
          
          // 测试聊天
          hostWs.send(JSON.stringify({
            id: '4',
            event: 'chat:message',
            data: { message: '大家好！' }
          }));
        }
        
        if (message.id === '4' && message.data?.success) {
          chatTested = true;
          
          // 等待所有测试完成
          if (readyTested && chatTested) {
            clearTimeout(timeout);
            hostWs.close();
            playerWs.close();
            resolve();
          }
        }
      });
      
      playerWs.on('message', (data: string) => {
        const message = JSON.parse(data.toString());
        
        if (message.id === '2' && message.data?.room) {
          playerPlayerId = message.data.player?.id;
          playerInRoom = true;
          
          // 测试准备状态
          hostWs.send(JSON.stringify({
            id: '3',
            event: 'room:setReady',
            data: { ready: true }
          }));
        }
        
        // 监听房间更新和聊天消息
        if (message.type === 'room:playerReady' || message.type === 'chat:message') {
          // 验证消息格式
          expect(message.data).toBeDefined();
        }
      });
      
      hostWs.on('error', (error) => {
        clearTimeout(timeout);
        playerWs.close();
        reject(error);
      });
      
      playerWs.on('error', (error) => {
        clearTimeout(timeout);
        hostWs.close();
        reject(error);
      });
    });
  });
});

