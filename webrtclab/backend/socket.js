module.exports = (http) => {
  const io = require('socket.io')(http);
  let rooms = {};
  let roomId = null;
  let socketIds = {};

  function findRoomId(socketId) {
    const roomIds = Object.keys(rooms);
    let result = null;

    return roomIds.find((id) => socketId === rooms[id]);
  }

  io.on('connection', (socket) => {
    socket.on('enter', (roomName, userId) => {
      roomId = roomName;
      socket.join(roomId);

      if (rooms[roomId]) {
        console.log('Already taken is roomId :: ' + roomId);
        rooms[roomId][socket.id] = userId;
      } else {
        console.log('Create a room :: ' + roomId);
        rooms[roomId] = {};
        rooms[roomId][socket.id] = userId;
      }
      let thisRoom = rooms[roomId];
      console.log('present Room', thisRoom);

      io.sockets.in(roomId).emit('join', roomId, thisRoom);
      console.log('room list', rooms);
    });
    /**
     * 메시지 핸들링
     */
    socket.on('message', (data) => {
      //console.log('message: ' + data);

      if (data.to === 'all') {
        // for broadcasting without me
        socket.broadcast.to(data.roomId).emit('message', data);
      } else {
        // for target user
        const targetSocketId = socketIds[data.to];
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', data);
        }
      }
    });

    /**
     * 연결 해제 핸들링
     */
    socket.on('disconnect', () => {
      console.log('a user disconnected', socket.id);

      const roomId = findRoomBySocketId(socket.id);
      if (roomId) {
        socket.broadcast.to(roomId).emit('leave', rooms[roomId][socket.id]); // 자신 제외 룸안의 유저ID 전달
        delete rooms[roomId][socket.id]; // 해당 유저 제거
      }
    });
  });
};