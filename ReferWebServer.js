var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Firebase = require("firebase");
// var redis = require('redis');
// var redisClient = redis.createClient();

//Use YOUR Firebase URL (not the one below)
var myDataRef = new Firebase('https://glaring-torch-9647.firebaseio.com');
var userConsumptionTable = myDataRef.child("consumption");
var userSettingsTable = myDataRef.child("settings");

var INDEX_PRIMARY_CMD = 0;
var INDEX_SECOND_CMD_OR_OUNCES = 1;

var DISPENSE = "dispense";
var AUTOFILL = "autofill"
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

//TODO Enable later
//var greenBean = require("green-bean");
//var refrigerator;

//TODO Remove this later
var settings = {
  time: 2400,
  glass_ounces: 6,
  name: "FixOfWater"
};
var client = {
  id: 0
};

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

/*!
 * Function to start dispensing water.
 */
var startDispensingWater = function() {
  //refrigerator.dispenseColdWater();
  userConsumptionTable.push({
    user_id: client.id,
    type: 'water',
    timestamp: getDateTime(),
    ounces: disp_ounces
  });
  clearTimeout(autofillTimeoutId);
  console.log("Start dispensing water.");
};

/*!
 * Function to start dispensing cubed.
 */
var startDispensingCubed = function() {
  //refrigerator.dispenseCubed();
  userConsumptionTable.push({
    user_id: client.id,
    type: 'cubes',
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
  //refrigerator.dispenseCrushed();
  userConsumptionTable.push({
    user_id: client.id,
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
  //refrigerator.dispenseStop();
  clearTimeout(autofillTimeoutId);
  console.log("Stop dispensing.");
};

/*!
 * Function to start autofill.
 */
var startAutofill = function() {
  console.log("Autofill " + disp_ounces);
  userConsumptionTable.push({
    user_id: client.id,
    type: 'autofill',
    timestamp: getDateTime(),
    ounces: disp_ounces
  });
  startDispensingWater();
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
  [STOP, UNUSED, UNUSED, UNUSED, stopDispensing]
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
      // TODO read from redis
      disp_ounces = settings.glass_ounces;
      disp_time_ms = settings.time;
      rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES] = UNUSED;
    } // Precise fill command
    else if ((numberOfSections > INDEX_SECOND_CMD_OR_OUNCES) &&
      (!isNaN(parseInt(rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES], 10)))) {
      disp_ounces = parseInt(rcvd_voice_cmd[INDEX_SECOND_CMD_OR_OUNCES], 10);
      disp_time_ms = disp_ounces * (settings.glass_ounces / settings.time);
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

  // TODO Remove later - Testing only
executeCommand(getReceivedCommand("dispense water"));
executeCommand(getReceivedCommand("dispense cubed"));
executeCommand(getReceivedCommand("dispense crushed"));
executeCommand(getReceivedCommand("stop"));
executeCommand(getReceivedCommand("autofill"));
setTimeout(function() {
  executeCommand(getReceivedCommand("dispense 20 ounces water"))
}, 10000);

//TODO Enable later
//greenBean.connect("refrigerator", function(refrigerator) {
//console.log("========> Refrigerator connected");
io.on('connection', function(client) {
  client.on('join', function(user_info) {
    client.username = user_info.username;
    client.id = user_info.id;

    client.emit('join', nickname);
    console.log(nickname + " is connected");
    myFirebaseRef.child("config").on("value", function(settings) {
      console.log("Settings " + settings.val());
      user_settings = settings;
    });
  });

  client.on('settings', function(settings) {
    myDataRef.push({
      "settings": {
        user_name: settings.username,
        glass_ounces: settings.glass_ounces,
        time: settings.time
      }
    });
    console.log("==> settings = " + settings);
  });

  client.on('disconnect', function(name) {
    //TODO Save identifier for next time user connects
  });

  client.on('voice_command', function(voice_command) {
    client.emit('voice_cmd_response',
      executeCommand(getReceivedCommand(voice_command)));
  });
});

//TODO Enable later
//});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(8080, function() {
  console.log('listening on *:8080');
});
