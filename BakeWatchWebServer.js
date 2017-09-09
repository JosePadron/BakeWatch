var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var os = require('os');
var greenBean = require("green-bean");
var rangeAppliance;

greenBean.connect("range", function(range) {
  console.log("========> Appliance connected");
  rangeAppliance = range;

    range.lowerOven.displayTemperature.read(function(value) {
        console.log("lower oven display temperature is:", value);
    });

    range.lowerOven.displayTemperature.subscribe(function(value) {
        console.log("lower oven display temperature changed:", value);
    });
});

  io.on('connection', function(client) {
    client.on('join', function(user_info) {
      console.log("Username ===> " + user_info.name);
      console.log("Password ===> " + user_info.password);

      user_settings.name = user_info.name;
      usersRef.child(user_settings.name).child("settings").once("value", function(settings) {
        var cloud_settings = settings.val();
        console.log("Back from the cloud ===> " + cloud_settings);
        if (cloud_settings != null) {
          user_settings.glass_ounces = cloud_settings.glass_ounces;
          user_settings.glass_fill_time = cloud_settings.glass_fill_time;
          user_settings.weight_lbs = cloud_settings.weight_lbs;

          console.log("Cloud settings glass_ounces ===> " + user_settings.glass_ounces);
          console.log("Cloud settings glass_fill_time ===> " + user_settings.glass_fill_time);
          console.log("Cloud settings weight_lbs ===> " + user_settings.weight_lbs);
        } else {
          usersRef.child(user_settings.name).set({
            password: user_info.password
          });
        }
      }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
      });

      // Update light state
      myDataRef.child("light").once("value", function(lightState) {
        var lightFromCloud = lightState.val();
        // console.log("Back from the cloud light ===> " + lightFromCloud.state);
        if (lightFromCloud != null) {
          updateLightState(lightFromCloud.state);
        } else {
          updateLightState(OFF);
        }
      }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
      });

      console.log(user_settings.name + " is connected");
    });

	client.on('lightOn', function(on){
		if( on ){
			turnLightOn();
			console.log("Turn Light On");
		} else {
			turnLightOff();
			console.log("Turn Light Off");
		}
	});

    client.on('settings', function(settings) {
      usersRef.child(user_settings.name).child("settings").set({
        glass_ounces: settings.glass_ounces,
        glass_fill_time: settings.glass_fill_time,
        weight_lbs: settings.weight_lbs
      });

      user_settings.glass_ounces = settings.glass_ounces;
      user_settings.glass_fill_time = settings.glass_fill_time;
      user_settings.weight_lbs = settings.weight_lbs;

      console.log("New settings glass_ounces ===> " + settings.glass_ounces);
      console.log("New settings glass_fill_time ===> " + settings.glass_fill_time);
      console.log("New settings weight_lbs ===> " + settings.weight_lbs);
    });

    client.on('disconnect', function(name) {
      console.log("==> Client disconnected = " + name);
    });

    client.on('voice_command', function(voice_command) {
      client.emit('voice_cmd_response',
        executeCommand(getReceivedCommand(voice_command)));
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
