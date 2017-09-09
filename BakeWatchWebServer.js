var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var os = require('os');

var greenBean = require("green-bean");
var rangeAppliance;
var ON = 1
var OFF = 0
var lightState = OFF;

function UpdateLight(state)
{
   console.log("Update light:", state)
   range.lightState.Write(state);
}

function StopCooking()
{
   console.log("Stop cooking")
   range.upperOven.cookMode.Write(OFF);
}

greenBean.connect("range", function(range) {
  console.log("========> Appliance connected");
  rangeAppliance = range;

  range.upperOven.displayTemperature.read(function(value) {
     console.log("Oven display temperature is:", value);
  });
});

io.on('connection', function(client) {
    client.on('take_picture', function(){
        console.log("io.on:Taking picture");
        TakePicture();
    });

    client.on('oven_light_toggle', function(){
        console.log("io.on:Oven Light Toggle");
    });

    client.on('oven_temp_off', function(){
        console.log("io.on:Oven Off");
    });

    client.on('get_oven_data', function(){
        console.log("io.on:Oven Data");
        var ovenData = {};

        // get the oven data and attach it to ovenData object

        io.emit('oven_data', ovenData);
    });

});

// Serve Static Files
app.use( "/public/", express.static( __dirname + '/public/'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/get-picture/', function(req, res){
  console.log("Taking picture");
  UpdateLight(ON);
  TakePicture();
  if(!lightState)
  {
     UpdateLight(OFF);
     StopCooking();
  }
});

function TakePicture()
{
   console.log("Taking picture");
   var exec = require('child_process').exec;

    exec('raspistill -vf -hf -o /home/pi/firstbuild_hackathon/public/image.jpg', function(error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
}

server.listen(8080, function() {
	console.log('listening on *:8080');
});
