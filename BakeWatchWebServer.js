var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var os = require('os');
var adapter = require("gea-adapter-usb");
var gea = require("gea-sdk");
var Firebase = require("firebase");
var myDataRef = new Firebase('https://flickering-torch-9611.firebaseio.com/');
var os = require('os');
const Raspistill = require('node-raspistill').Raspistill;
const camera = new Raspistill({
    verticalFlip: true,
    width: 680,
    height: 420,
    outputDir: './public',
    fileName: 'image',
    encoding: 'png'
});

var ON = 1
var OFF = 0
var lightState = OFF;

var savedBus;

Set server ip
myDataRef.child("server").set({
  server_ip: ip_address('wlan0')
});

function ip_address(interface) {
  var items = os.networkInterfaces()[interface] || [];

  return items
    .filter(function(item) {
      return item.family.toLowerCase() == 'ipv4';
    })
    .map(function(item) {
      return item.address;
    })
    .shift();
}

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

function GetU16(data)
{
  return (data[0]<<8) | data[1];
}

geaApp.bind(adapter, function (bus) {
    console.log("bind was successful");
    savedBus = bus

    savedBus.subscribe({
        source: 0xE4,
        destination: 0x80,
        erd: 0xF20D
    });

    // listen for publishes for an ERD
    savedBus.on("publish", function (erd) {
        console.log("Got a data published:", erd);
        if(erd.erd == 0xF20D) {
          if(erd.data == 1) {
            console.log("Cycle Started");
            io.emit('notify', erd.data);
          }
          else {
            console.log("Cycle Stopped");
            io.emit('notify', erd.data);
          }
        }
    });

io.on('connection', function(client) {

    client.on('take_picture', function(){
        console.log("io.on:Taking picture");
        UpdateLight(ON);

        camera.takePhoto().then(function(photo){
            io.emit('get_picture', photo);
            UpdateLight(OFF);
        });
    });

    client.on('take_timelapse', function(){
        const RaspistillInterruptError = require('node-raspistill').RaspistillInterruptError;
        const timelapse = new Raspistill({
            verticalFlip: true,
            width: 680,
            height: 420,
            outputDir: './public/timelapse/',
            encoding: 'png'
        });

        UpdateLight(ON);
        console.log("Taking timelapse photo");
        timelapse.timelapse('image%04d', 500, 10000, (image) => {
            console.log("Taking timelapse photo");
        }).then(() => {
            // timelapse ended
            console.log("Timelapse has ended");
            var GIFEncoder = require('gifencoder');
            var encoder = new GIFEncoder(680, 420);
            var pngFileStream = require('png-file-stream');
            var fs = require('fs');

            pngFileStream('public/timelapse/*.png')
              .pipe(encoder.createWriteStream({ repeat: -1, delay: 500, quality: 10 }))
              .pipe(fs.createWriteStream('myanimated.gif'));

            UpdateLight(OFF);
        }).catch((err) => {
            console.error(err);
            // something bad happened
            UpdateLight(OFF);
            console.log(err instanceof RaspistillInterruptError) // true, raspistill was interrupted;
        });
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

    // listen for read responses for an ERD
   savedBus.on("read-response", function (erd) {
      console.log("read response:", erd);
      if(erd.erd == 0x5109)
      {
         var temperature = GetU16(erd.data);
         console.log("Oven display temperature is:", temperature);
         io.emit('oven_temperature', temperature);
      }
      else if (erd.erd == 0x5105)
      {
         var time = GetU16(erd.data);
         console.log("Time left is:", time);
         io.emit('oven_time_left', time);
      }
   });

    client.on('get_oven_temperature', function(){
        console.log("io.on:Oven temperature");

       // Read temeprature
       savedBus.read({
          erd: 0x5109,
          source: 0xE4,
          destination: 0x80
       });
    });

    client.on('get_oven_time_left', function(){
        console.log("io.on:Oven time left");

       // Read temeprature
       savedBus.read({
          erd: 0x5105,
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

server.listen(80, function() {
	console.log('listening on *:80');
});
