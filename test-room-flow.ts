import { JubenshaClient } from './src/index';
import { delay } from './src/utils/delay';

async function testRoomFlow() {
  console.log('=== 测试房间流程 ===\n');

  // 创建两个客户端模拟房主和玩家
  const host = new JubenshaClient({ 
    serverUrl: 'ws://localhost:4000/ws',
    debug: true 
  });
  
  const player = new JubenshaClient({ 
    serverUrl: 'ws://localhost:4000/ws',
    debug: true 
  });

  try {
    // 1. 连接服务器
    console.log('1. 连接服务器...');
    await host.connect();
    await player.connect();
    console.log('✓ 连接成功\n');
    await delay(1000);

    // 2. 创建房间
    console.log('2. 创建房间（使用 esther-story 剧本）...');
    const result = await host.room.createRoom('esther-story', 6, '房主');
    console.log(`✓ 房间创建成功: ${result.roomId}`);
    console.log(`  房间信息:`, {
      id: result.room.id,
      scriptId: result.room.scriptId,
      maxPlayers: result.room.maxPlayers,
      players: result.room.players.length
    });
    console.log(`  房主信息:`, {
      id: result.player.id,
      name: result.player.name,
      isHost: result.player.isHost
    });
    console.log('');

    await delay(1000);

    // 3. 监听房间事件
    host.room.on('playerJoined', (player) => {
      console.log(`[房主] 玩家加入: ${player.name} (${player.id})`);
    });

    host.room.on('roomUpdated', (room) => {
      console.log(`[房主] 房间更新: ${room.players.length}/${room.maxPlayers} 人`);
    });

    player.room.on('roomJoined', (data) => {
      console.log(`[玩家] 成功加入房间: ${data.room.id}`);
    });

    // 4. 玩家加入房间
    console.log('3. 玩家加入房间...');
    const joinResult = await player.room.joinRoom(result.roomId, '玩家1');
    console.log(`✓ 玩家加入成功`);
    console.log(`  房间信息:`, {
      id: joinResult.room.id,
      players: joinResult.room.players.map(p => p.name).join(', ')
    });
    console.log('');

    await delay(2000);

    // 5. 查看房间状态
    console.log('4. 查看房间状态...');
    if (host.room.currentRoom) {
      console.log(`  当前房间: ${host.room.currentRoom.id}`);
      console.log(`  玩家列表: ${host.room.currentRoom.players.map(p => `${p.name}${p.isHost ? '(房主)' : ''}`).join(', ')}`);
    }
    console.log('');

    await delay(1000);

    // 6. 测试准备状态
    console.log('5. 测试准备状态...');
    await host.room.setReady(true);
    console.log('✓ 房主已准备');
    await delay(500);
    await player.room.setReady(true);
    console.log('✓ 玩家已准备');
    console.log('');

    await delay(1000);

    // 7. 测试聊天
    console.log('6. 测试聊天功能...');
    await host.room.sendMessage('大家好，欢迎来到房间！');
    await delay(500);
    await player.room.sendMessage('谢谢房主！');
    console.log('✓ 聊天消息已发送');
    console.log('');

    await delay(2000);

    console.log('=== 测试完成 ===');
    console.log('\n所有功能测试通过！');

  } catch (error: any) {
    console.error('测试失败:', error.message);
    console.error(error);
  } finally {
    // 清理
    await delay(1000);
    host.disconnect();
    player.disconnect();
    console.log('\n已断开连接');
  }
}

// 运行测试（带超时）
const timeout = 30000; // 30秒超时
Promise.race([
  testRoomFlow(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('测试超时')), timeout)
  )
]).catch(error => {
  console.error('测试错误:', error);
  process.exit(1);
});

