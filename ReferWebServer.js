var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var redis = require('redis');

var options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
  requestCert: true,
  rejectUnauthorized: false
};

// Create a service with app object as callback
var app = express();

// Create an HTTPS service using SSL Certificate and Key
server = https.createServer(options, app).listen(3210);
console.log("==> Listening on port 3210");
var io = require('socket.io').listen(server);

var SendConfigResponse = function(client) {
  redisClient.get("user_config", function(err, config) {
    client.emit("user_config", config);
    console.log("==> saved user_config = " + config);
  });
}

io.on('connection', function(client) {
  client.on('join', function(nickname) {
    client.nickname = nickname;
    redisClient.sadd('clients', nickname);
    redisClient.smembers('clients', function(err, clients) {
      clients.forEach(function(nickname) {
        client.emit('join', nickname);
        console.log(nickname + " is connected");
      });
    });

    SendConfigResponse(client);

    // Random Data Generation
    client.timerId = setInterval(function() {
      client.data = client.data + 1;
      client.broadcast.emit('refer_data', client.nickname, client.data);
      client.emit('refer_data', client.nickname, client.data);
      console.log("====> " + client.nickname + " refer_data = " + client.data);
    }, 1000);
  });

  client.on('user_config', function(config) {
    redisClient.set("user_config", config);
    console.log("==> user_config = " + config);
    SendConfigResponse(client);
  });

  client.on('disconnect', function(name) {
    client.broadcast.emit("remove_client", client.nickname);
    redisClient.srem("clients", client.nickname);
    clearInterval(client.timerId);
  });
});

app.get('/', function(req, res) {
  if (req.client.authorized) {
    res.json({
      "status": "approved"
    });
    res.sendFile(__dirname + '/index.html');
  } else {
    res.json({
      "status": "denied"
    }, 401);
  }
});
