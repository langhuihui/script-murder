const { JubenshaClient, GamePhase } = require('./dist');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('Initializing jubensha-sdk demo...');

  const host = new JubenshaClient({ serverUrl: 'ws://localhost:8080' });
  const guest = new JubenshaClient({ serverUrl: 'ws://localhost:8080' });

  host.game.on('phaseChange', (phase) => {
    console.log(`>>> [HOST] Phase changed to ${phase}`);
  });

  host.game.on('stateUpdate', (state) => {
    console.log('>>> [HOST] State updated:', JSON.stringify(state, null, 2));
  });

  console.log('Connecting host and guest to server...');
  await host.connect();
  await guest.connect();

  const roomId = await host.room.createRoom('script_001', 5);
  console.log('[HOST] Room created:', roomId);

  await guest.room.joinRoom(roomId, 'Player_B');
  console.log('[GUEST] Joined room:', roomId);

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
}

runDemo().catch((err) => {
  console.error('Demo error:', err);
  process.exitCode = 1;
});

