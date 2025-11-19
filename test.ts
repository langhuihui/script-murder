import { JubenshaClient, GamePhase } from './src';

async function main() {
  console.log('Initializing SDK...');
  const client = new JubenshaClient({ serverUrl: 'ws://localhost:8080' });
  
  // 监听游戏阶段变化
  client.game.on('phaseChange', (phase) => {
    console.log(`>>> UI Update: Current Phase is ${phase}`);
  });

  client.game.on('stateUpdate', (state) => {
      console.log('>>> State Updated:', JSON.stringify(state, null, 2));
  });

  await client.connect();
  
  const roomId = await client.room.createRoom('script_001', 5);
  console.log('Room Created:', roomId);
  
  await client.game.startGame();
  
  // 模拟过几秒进入下一阶段
  console.log('Waiting for 2 seconds to simulate game progression...');
  setTimeout(async () => {
    await client.game.nextPhase(); // 进入 SEARCH
  }, 2000);
}

main();