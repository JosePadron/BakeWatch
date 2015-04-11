var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Firebase = require("firebase");
var os = require('os');

var myDataRef = new Firebase('https://glaring-torch-9647.firebaseio.com');
var usersRef = myDataRef.child("Users");

var mraa = require('mraa');
var light = new mraa.Gpio(3); //TODO: change to relay port
light.dir(mraa.DIR_OUT);
var light_state = 0;

var INDEX_PRIMARY_CMD = 0;
var INDEX_SECOND_CMD_OR_OUNCES = 1;

var LIGHT = "light";
var ON = 1;
var OFF = 0;
var ON_TXT = "on";
var OFF_TXT = "off";
var AUTOFILL = "autofill";
var DISPENSE = "dispense";
var STOP = "stop";
var WATER = "water";
var CUBED = "cubed";
var CRUSHED = "crushed";
var OUNCES = "ounces";
var UNUSED = "";
var NUMBER = 0;
var disp_ounces = 0;
var disp_time_ms = 0;
var autofillTimeoutId;

var greenBean = require("green-bean");
var refrigerator;

var user_settings = {
  name: "Default",
  glass_ounces: 8,
  glass_fill_time: 11000,
  weight_lbs: 180,
};

function updateLightState(new_state) {
  myDataRef.child("light").set({
    state: new_state
  });
  light.write(new_state);
  console.log("New light state ===> " + new_state);
}

function turnLightOn() {
  updateLightState(ON);
}

function turnLightOff() {
  updateLightState(OFF);
}

function getDateTime() {

  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;

  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}

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

var sendCommandToDispenseWater = function() {
  refrigerator.dispenseColdWater();
  clearTimeout(autofillTimeoutId);
  console.log("Start dispensing water.");
};

/*!
 * Function to start dispensing water.
 */
var startDispensingWater = function() {
  sendCommandToDispenseWater();
  usersRef.child(user_settings.name).child("consumption").push({
    type: WATER,
    timestamp: getDateTime(),
    ounces: disp_ounces
  });
};

/*!
 * Function to start dispensing cubed.
 */
var startDispensingCubed = function() {
  refrigerator.dispenseCubed();
  usersRef.child(user_settings.name).child("consumption").push({
    type: CUBED,
    timestamp: getDateTime(),
    ounces: 0
  });
  clearTimeout(autofillTimeoutId);
  console.log("Start dispensing cubed.");
};

/*!
 * Function to start dispensing crushed.
 */
var startDispensingCrushed = function() {
  refrigerator.dispenseCrushed();
  usersRef.child(user_settings.name).child("consumption").push({
    type: 'crushes',
    timestamp: getDateTime(),
    ounces: 0
  });
  clearTimeout(autofillTimeoutId);
  console.log("Start dispensing crushed.");
};

/*!
 * Function to stop dispensing.
 */
var stopDispensing = function() {
  refrigerator.dispenseStop();
  clearTimeout(autofillTimeoutId);
  console.log("Stop dispensing.");
};

/*!
 * Function to start autofill.
 */
var startAutofill = function() {
  console.log("Autofill " + user_settings.glass_ounces);
  usersRef.child(user_settings.name).child("consumption").push({
    type: WATER,
    timestamp: getDateTime(),
    ounces: user_settings.glass_ounces
  });
  sendCommandToDispenseWater();
  autofillTimeoutId = setTimeout(function() {
    stopDispensing();
  }, disp_time_ms)
};

/*!
 * Table with available commands.
 */
var commands_table = [
  [DISPENSE, WATER, UNUSED, UNUSED, startDispensingWater],
  [DISPENSE, CUBED, UNUSED, UNUSED, startDispensingCubed],
  [DISPENSE, CRUSHED, UNUSED, UNUSED, startDispensingCrushed],
  [AUTOFILL, UNUSED, UNUSED, UNUSED, startAutofill],
  [DISPENSE, NUMBER, OUNCES, WATER, startAutofill],
  [STOP, UNUSED, UNUSED, UNUSED, stopDispensing],
  [LIGHT, ON_TXT, UNUSED, UNUSED, turnLightOn],
  [LIGHT, OFF_TXT, UNUSED, UNUSED, turnLightOff],
]

/*!
 * Process the received voice data and return an array with its sections.
 * @param voice_command The received voice command.
 * @return The voice commands sections.
 */
function getReceivedCommand(voice_command) {
  var rcvd_voice_cmd = [UNUSED, UNUSED, UNUSED, UNUSED];
  var voice_command_sections = voice_command.split(" ");
  var numberOfSections = voice_command_sections.length;

  // Short message?
  if (numberOfSections < 2) {
    rcvd_voice_cmd[INDEX_PRIMARY_CMD] = voice_command;
  } else {
    for (var index = 0; index < numberOfSections; index++) {
      rcvd_voice_cmd[index] = voice_command_sections[index];
    }
  }

  // Autofill command?
  if ((numberOfSections > INDEX_PRIMARY_CMD) &&
    (AUTOFILL == rcvd_voice_cmd[INDEX_PRIMARY_CMD])) {
    disp_ounces = user_settings.glass_ounces;
    disp_time_ms = user_settings.glass_fill_time;
    rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES] = UNUSED;
  } // Precise fill command
  else if ((numberOfSections > INDEX_SECOND_CMD_OR_OUNCES) &&
    (!isNaN(parseInt(rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES], 10)))) {
    disp_ounces = parseInt(rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES], 10);
    disp_time_ms = disp_ounces * user_settings.glass_fill_time / user_settings.glass_ounces;
    console.log("--> Dispense time: " + disp_time_ms);
    rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES] = NUMBER;
  }
  return rcvd_voice_cmd;
}

/*!
 * Execute command a valid command.
 * @param voice_command The voice command array.
 * @return True if valid command; otherwise false;
 */
function executeCommand(voice_command) {
  var numberOfSections = commands_table[0].length - 1;
  var numberOfCommands = commands_table.length;
  var validSections;

  for (var cmd = 0; cmd < numberOfCommands; cmd++) {
    validSections = 0;
    for (var section = 0; section < numberOfSections; section++) {
      if (voice_command[section] == commands_table[cmd][section]) {
        validSections += 1;
      }
    }
    if (validSections == numberOfSections) {
      // Execute function
      commands_table[cmd][numberOfSections]();
      return true;
    }
  }
  return false;
}

//Set server ip
myDataRef.child("server").set({
  server_ip: ip_address('wlan0')
});

greenBean.connect("refrigerator", function(refer) {
  console.log("========> Refrigerator connected");
  refrigerator = refer;
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

  //TODO Enable later
});

// Serve Static Files
app.use( "/public/", express.static( __dirname + '/public/'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

server.listen(8080, function() {
	console.log('listening on *:8080');
});
