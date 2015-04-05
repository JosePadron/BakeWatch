var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var redisClient = redis.createClient();

var sendSettings = function(client) {
  redisClient.get("settings", function(err, settings) {
    client.broadcast.emit('settings', settings);
    client.emit('settings', settings);
    console.log("==> saved settings = " + settings);
  });
}

io.on('connection', function(client) {
  client.data = 0

  client.on('join', function(nickname) {
    client.nickname = nickname;
    redisClient.sadd('clients', nickname);
    redisClient.smembers('clients', function(err, clients) {
      clients.forEach(function(nickname) {
        client.emit('join', nickname);
        console.log(nickname + " is connected");
      });
    });

    sendSettings(client);

    // Random Data Generation
    client.timerId = setInterval(function() {
      client.data = client.data + 1;
      client.broadcast.emit('refer_data', client.nickname, client.data);
      client.emit('refer_data', client.nickname, client.data);
      console.log("====> " + client.nickname + " refer_data = " + client.data);
    }, 1000);
  });

  client.on('settings', function(settings) {
    redisClient.set("settings", settings);
    console.log("==> settings = " + settings);
    sendSettings(client);
  });

  client.on('disconnect', function(name) {
    client.broadcast.emit("remove_client", client.nickname);
    redisClient.srem("clients", client.nickname);
    clearInterval(client.timerId);
  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(8080, function() {
  console.log('listening on *:8080');
});
