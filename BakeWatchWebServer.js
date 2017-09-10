var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var os = require('os');
var adapter = require("gea-adapter-usb");
var gea = require("gea-sdk");

var ON = 1
var OFF = 0
var lightState = OFF;

var savedBus;

// configure the application
var geaApp = gea.configure({
    address: 0xe4,
    version: [ 0, 0, 1, 0 ]
});

function UpdateLight(state)
{
   console.log("Update light:", state);
   savedBus.send({
         command: 0xF1,
         data: [ 1, 0xf2, 07, 1, state ],
         source: 0xE4,
         destination: 0x80
     });
}

function StopCooking()
{
   console.log("Stop cooking")
   savedBus.send({
         command: 0xF1,
         data: [ 1, 0x51, 0x00, 13, 0,0,0,0,0, 0,0,0,0,0, 0,0,0 ],
         source: 0xE4,
         destination: 0x80
     });
}

geaApp.bind(adapter, function (bus) {
    console.log("bind was successful");
    savedBus = bus

io.on('connection', function(client) {
    client.on('take_picture', function(){
        console.log("io.on:Taking picture");
        UpdateLight(ON);
        TakePicture();
        if(!lightState)
        {
           UpdateLight(OFF);
           StopCooking();
        }
    });

    client.on('oven_light_toggle', function(){
        console.log("io.on:Oven Light Toggle");
        lightState = !lightState;
        UpdateLight(lightState);
    });

    client.on('oven_temp_off', function(){
        console.log("io.on:Oven Off");
        StopCooking();
    });

    client.on('get_oven_data', function(){
        console.log("io.on:Oven Data");
        var ovenData = {};

        // get the oven data and attach it to ovenData object

        // listen for read responses for an ERD
       savedBus.on("read-response", function (erd) {
          console.log("read response:", erd);
          console.log("Oven display temperature is:", erd.data);
          io.emit('oven_data', erd.data);
       });

       // read an ERD
       savedBus.read({
          erd: 0x5109,
          source: 0xE4,
          destination: 0x80
       });
    });
});
});

// Serve Static Files
app.use( "/public/", express.static( __dirname + '/public/'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

function TakePicture()
{
   console.log("Taking picture");
   var exec = require('child_process').exec;

    exec('raspistill -vf -hf -o /home/pi/firstbuild_hackathon/public/image.jpg', function(error, stdout, stderr) {
        //console.log('stdout: ' + stdout);
        //console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
}

server.listen(8080, function() {
	console.log('listening on *:8080');
});
