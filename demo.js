const { JubenshaClient, GamePhase } = require('./dist');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('Initializing jubensha-sdk demo...');

  const host = new JubenshaClient({ serverUrl: 'ws://localhost:4000/ws' });
  const guest = new JubenshaClient({ serverUrl: 'ws://localhost:4000/ws' });

  host.game.on('phaseChange', (phase) => {
    console.log(`>>> [HOST] Phase changed to ${phase}`);
  });

  host.game.on('stateUpdate', (state) => {
    console.log('>>> [HOST] State updated:', JSON.stringify(state, null, 2));
  });

  console.log('Connecting host and guest to server...');
  await host.connect();
  await guest.connect();

  const result = await host.room.createRoom('script_001', 5);
  console.log('[HOST] Room created result:', JSON.stringify(result, null, 2));
  console.log('[HOST] Room created:', result.roomId);

  await guest.room.joinRoom(result.roomId, 'Player_B');
  console.log('[GUEST] Joined room:', result.roomId);

  console.log('Starting game...');
  await host.game.startGame();

  await delay(1000);
  console.log('Advancing to next phase...');
  await host.game.nextPhase();

  await delay(1000);
  console.log('Submitting clue CLUE_001...');
  await host.game.submitClue('CLUE_001');

  await delay(1000);
  console.log('Advancing to another phase...');
  await host.game.nextPhase();

  await delay(1000);
  console.log('Demo finished, disconnecting...');
  host.disconnect();
  guest.disconnect();
  
  // 确保进程正常退出
  process.exit(0);
}

// 添加超时处理
const timeout = setTimeout(() => {
  console.error('Demo timeout after 30 seconds');
  process.exit(1);
}, 30000);

runDemo()
  .then(() => {
    clearTimeout(timeout);
  })
  .catch((err) => {
    clearTimeout(timeout);
    console.error('Demo error:', err);
    process.exit(1);
  });

