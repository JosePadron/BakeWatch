var socket = io.connect('http://localhost:8080');

var start_timestamp;
var final_transcript = '';
var intervalId;
var voiceRecognitionRunning = false;

if (!('webkitSpeechRecognition' in window)) {
  showErrorInfo('not_supported');
} else {
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    var interim_transcript = '';
    if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      stopVoiceRecognition();
      return;
    }
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    $("#voice").append(final_transcript);
    stopVoiceRecognition();
  };

  recognition.onstart = function() {
    voiceRecognitionRunning = true;
    $("#recognition_btn").html("Stop Recognition");
    $("#voice").html('');
  };

  recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
      showErrorInfo('info_no_speech');
    }
    if (event.error == 'audio-capture') {
      showErrorInfo('info_no_microphone');
    }
    if (event.error == 'not-allowed') {
      if (event.timeStamp - start_timestamp < 100) {
        showErrorInfo('info_blocked');
      } else {
        showErrorInfo('info_denied');
      }
    }
    stopVoiceRecognition();
  };

  recognition.onend = function() {
    if (!final_transcript) {
      return;
    } else {
      stopVoiceRecognition();
    }
  }
}

/*socket.on('connect', function(data) {
  nickname = prompt("What is your nickname?");
  socket.emit('join', nickname);
  console.log('--'+nickname);
});*/

socket.on('join', function(nickname) {
  console.log('-1-'+nickname);
  $('body').append("<div id=\"client_" + nickname + "\">" + nickname + "</div>");
});

socket.on('refer_data', function(nickname, data) {
  var client_id = "#client_data_" + nickname;
  if ($(client_id).length) {
    $(client_id).html(nickname + ": " + data);
  } else {
    $("#clients_data").append("<div id=\"client_data_" + nickname + "\">" + nickname + ": " + data + "</div>");
  }
});

socket.on('remove_client', function(nickname) {
  var client_id = "#client_" + nickname;
  $(client_id).remove();
  recognition.stop();
});

socket.on('settings', function(settings) {;
  $("#oz_per_sec_input").val(settings);
});

function UpdateSettings() {
  socket.emit('settings', $('#oz_per_sec_input').val());
}

function startVoiceRecognition(event) {
  final_transcript = '';
  recognition.start();
  start_timestamp = event.timeStamp;
  showErrorInfo('');
}

function stopVoiceRecognition(event) {
  $("#recognition_btn").html("Start Recognition");
  voiceRecognitionRunning = false;
  recognition.stop();
}

function updateVoiceRecognition(event) {
  if (!voiceRecognitionRunning) {
    startVoiceRecognition(event);
  } else {
    stopVoiceRecognition(event);
  }
}

function showErrorInfo(info) {
  $("#error").html("Error: " + info);
}