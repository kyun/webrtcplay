const express = require('express');
const app = express();
const http = require('http').Server(app);

require('./socket.js')(http);

http.listen(9000, function () {
  console.log('WebRTC server is running at 9000 PORT...');
});
