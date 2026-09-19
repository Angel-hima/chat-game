const { io } = require('socket.io-client');

async function runTest() {
  console.log('--- E2Eテスト開始 ---');
  const hostSocket = io('http://localhost:3010');
  const guestSocket = io('http://localhost:3010');

  await Promise.all([
    new Promise((resolve) => hostSocket.on('connect', resolve)),
    new Promise((resolve) => guestSocket.on('connect', resolve))
  ]);
  console.log('✓ 2台のクライアントが正常接続');

  // ホストが公開部屋を作成
  const room = await new Promise((resolve, reject) => {
    hostSocket.emit('create_room', {
      player: { name: 'ホスト太郎', avatar: '🐱' },
      name: 'みんなで雑談しよう！',
      isPublic: true,
      maxPlayers: 6,
      gameMode: 'talk'
    }, (res) => {
      if (res.success) resolve(res.room);
      else reject(res.error);
    });
  });
  console.log(`✓ 公開部屋作成成功: ID=${room.id}, 名前=${room.name}`);

  // ゲストが公開部屋一覧を受信
  const publicRooms = await new Promise((resolve) => {
    guestSocket.emit('get_public_rooms');
    guestSocket.on('public_rooms_updated', (rooms) => {
      resolve(rooms);
    });
  });
  console.log(`✓ ゲストが公開部屋一覧を受信: ${publicRooms.length}件検出 (部屋名: ${publicRooms[0].name})`);

  // ゲストが部屋に参加
  const joinedRoom = await new Promise((resolve, reject) => {
    guestSocket.emit('join_room', {
      roomId: room.id,
      player: { name: 'ゲスト花子', avatar: '🐰' }
    }, (res) => {
      if (res.success) resolve(res.room);
      else reject(res.error);
    });
  });
  console.log(`✓ ゲスト入室成功: 現在参加人数=${joinedRoom.players.length}`);

  // チャット送受信テスト
  const chatPromise = new Promise((resolve) => {
    hostSocket.on('chat_message', (msg) => {
      if (msg.text === 'こんにちは！よろしく！') {
        resolve(msg);
      }
    });
  });
  guestSocket.emit('send_message', 'こんにちは！よろしく！');
  const chatMsg = await chatPromise;
  console.log(`✓ チャット送受信成功: [${chatMsg.senderName}]: ${chatMsg.text}`);

  // リアクションスタンプ送受信テスト
  const stampPromise = new Promise((resolve) => {
    guestSocket.on('reaction_stamp', (stamp) => {
      if (stamp.text === 'それな！') resolve(stamp);
    });
  });
  hostSocket.emit('send_reaction', { emoji: '👍', text: 'それな！' });
  const stamp = await stampPromise;
  console.log(`✓ リアクションスタンプ送受信成功: ${stamp.emoji} ${stamp.text} by ${stamp.senderName}`);

  // ゲーム開始テスト
  const gameStartPromise = new Promise((resolve) => {
    guestSocket.on('room_updated', (r) => {
      if (r.status === 'playing') resolve(r);
    });
  });
  hostSocket.emit('start_game');
  const playingRoom = await gameStartPromise;
  console.log(`✓ ゲーム開始成功: ステータス=${playingRoom.status}, 現在のお題=「${playingRoom.currentTopic}」`);

  hostSocket.disconnect();
  guestSocket.disconnect();
  console.log('--- すべてのテストに合格しました ---');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('テスト失敗:', err);
  process.exit(1);
});
