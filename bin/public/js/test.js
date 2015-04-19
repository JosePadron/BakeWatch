
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
        socket.emit('voice_command', final_transcript);
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
    socket.on('connect', function(data) {
      nickname = prompt("What is your nickname?");
      user_info = {
        name: nickname,
        password: "123"
      };
      socket.emit('join', user_info);
    });
    socket.on('voice_cmd_response', function(result) {
      showErrorInfo((result) ? "" : "Invalid command!");
    });
    function UpdateSettings() {
      settings = {
        glass_ounces: $('#oz_per_sec_input').val(),
        glass_fill_time: 1000,
        weight_lbs: 180
      };
      socket.emit('settings', settings);
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