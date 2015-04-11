/**
*	CONTROLLERS
*
*
*/


/***************** LOGIN PAGE *******************/
App.controller('Home', function(page){

	$(page).find('#username-input').val("alex");
    $(page).find('#password-input').val("123");
    var user_info = {};

	$(page).on('click', 'input[type="submit"]', function(){

            var username = $('#username-input').val();
            var password = $('#password-input').val();
            
            myDataRef.child('Users').child(username).once('value', function(allUserData) {
              
				if( allUserData.child('password').val() == password ){
					console.log('Successful Login');
					userData = allUserData;

					//may need to be
					//consumption = userData.child('consumption').val();
					consumption = userData.child('consumption');
					//console.log(allUserData);
					// Given a DataSnapshot containing a child "fred" and a child "wilma", this callback
					// function will be called twice
					consumption.forEach(function(childSnapshot) {
						// key will be "fred" the first time and "wilma" the second time
						var key = childSnapshot.key();
						// childData will be the actual contents of the child
						var childData = childSnapshot.val();
						//console.log( childData.child('ounces') + 'of' + childData.child('type') + ' @ ' + childData.child('timestamp') );
						// Send User to Command Page.
					});

					socket.emit('join', user_info);
					
					// Success, Log In.
					App.load("CommandPage", "fade");

				}else{
					console.log('You entered ' + password + ' but the password was ' + allUserData.child('password').val() )
					
					App.load("Settings", "slide-up");
					user_info = {
						name: username,
						password: password
					}
					// TODO: Send User Object
					socket.emit('join', user_info);
				}

            }); // myDataRef.Child(Users)...
    }); //On Click Event.


	// Bottom Bar Navigation.
	$(page).on('click', '.app-bottombar .nav-home', function(){
		App.load('Home', "fade");
		console.log("Navigate To Home");
	});

	$(page).on('click', '.app-bottombar .nav-statsPage', function(){
		App.load('StatsPage', "fade");
		console.log("Navigate To Stats Page");
	});

	$(page).on('click', '.app-bottombar .nav-settings', function(){
		App.load('Settings', "slide-up");
		console.log("Navigate to Settings");
	});

}); // App Controller.


/************** COMMAND PAGE *****************/
App.controller('CommandPage', function(page){

	$(page).find(".app-title").html( userData.key() + " Logged In. " );


	var start_timestamp;
	var final_transcript = '';
	var intervalId;
	var voiceRecognitionRunning = false;

	/***************** FUNCTIONS *******************/

	function startVoiceRecognition(event) {
		console.log("Start Voice Recognition");

		final_transcript = '';
		recognition.start();
		start_timestamp = event.timeStamp;
		//showErrorInfo('');
	}

	function stopVoiceRecognition(event) {
		console.log("Stop Voice Recognition");
		$(page).find("#command-btn").css({"background":"red"});

		//$("#recognition_btn").html("Start Recognition");
		voiceRecognitionRunning = false;
		recognition.stop();
	}

	function updateVoiceRecognition(event) {
		console.log("Update Voice Recognition");

		if (!voiceRecognitionRunning) {
			startVoiceRecognition(event);
		} else {
			stopVoiceRecognition(event);
		}
	}

	function showErrorInfo(info) {
		console.log("Error: " + info);
		//alert("Error: " + info);
		//$("#error").html("Error: " + info);
	}

	/************************/

	if (!('webkitSpeechRecognition' in window)) {

		showErrorInfo('not_supported');

	} else {

		var recognition = new webkitSpeechRecognition();
		recognition.continuous = false;
		recognition.interimResults = false;
		recognition.lang = 'en-US';

		recognition.onresult = function(event) {
			var interim_transcript = '';
			
			// If nothing comes back.
			if (typeof(event.results) == 'undefined') {
				recognition.onend = null;
				stopVoiceRecognition();
				return;
			}

			// Batch Together Transcript
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					final_transcript += event.results[i][0].transcript;
				} else {
					interim_transcript += event.results[i][0].transcript;
				}
			}

			//$("#voice").append(final_transcript);
			stopVoiceRecognition();

			$(page).find("#command-btn").html( final_transcript );
			console.log( final_transcript );

			// TODO: SEND IT TO SERVER!
			socket.emit('voice_command', final_transcript);
		}; // On Result

		recognition.onstart = function() {
			voiceRecognitionRunning = true;
			$(page).find("#command-btn").html('');
			$(page).find("#command-btn").css({"background":"green"});
		}; // On Start

		recognition.onend = function() {
			if (!final_transcript) {
				return;
			} else {
				stopVoiceRecognition();
			}
		}// On End

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
		}; // On Error

		socket.on('voice_cmd_response', function(result) {
			showErrorInfo((result) ? "Successful Command" : "Invalid command!");
		});




		/*************** PAGE INTERACTIONS *****************/
		// $(page).on("vmousedown", "#command-btn", function(){
		// 	voiceRecognitionRunning = true;
		// 	// While Holding
		// 	$(this).css({"background": "green"});
		// 	$(this).html("VR Running:  " + voiceRecognitionRunning);
		// 	updateVoiceRecognition(event);

		// }).on("vmouseup", "#command-btn", function(){
		// 	voiceRecognitionRunning = false;
		// 	updateVoiceRecognition(event);
		// 	// When Done Holding.
		// 	$(this).css({"background": "red"});
		// 	$(this).html("VR Running:  " + voiceRecognitionRunning);
		
		// });


		$(page).on("click", "#command-btn", function(){
			updateVoiceRecognition(event);
		});

    } // Is Supported.



	/************* BOTTOM NAV BAR ****************/
	$(page).on('click', '.app-bottombar .nav-home', function(){
		App.load('Home', "fade");
		console.log("Navigate To Home");
	});

	$(page).on('click', '.app-bottombar .nav-statsPage', function(){
		App.load('StatsPage', "fade");
		console.log("Navigate To Stats Page");
	});

	$(page).on('click', '.app-bottombar .nav-settings', function(){
		App.load('Settings', "slide-up");
		console.log("Navigate to Settings");
	});

}); // APP CONTROLLER | APP COMMAND


/*********** STATS PAGE ****************/
App.controller('StatsPage', function(page){
	
	$(page).on('click', '.app-bottombar .nav-home', function(){
		App.load('Home', "fade");
		console.log("Navigate To Home");
	});

	$(page).on('click', '.app-bottombar .nav-statsPage', function(){
		App.load('StatsPage', "fade");
		console.log("Navigate To Stats Page");
	});

	$(page).on('click', '.app-bottombar .nav-settings', function(){
		App.load('Settings', "slide-up");
		console.log("Navigate to Settings");
	});
});


/*********** SETINGS PAGE *******************/
App.controller('Settings', function(page){

	// TODO: Auto Populate Form

	$(page).on("click", "#save-settings-btn" ,function(){
		
		//var user_name = $(page).find("#user_name").val();
		var user_weight = $(page).find("#user_weight").val();
		var defaultGlassSize = $(page).find("#default_glass_size").val();
		var fillTime = $(page).find("#fill_time").val();
		
		settings = {

			glass_ounces: defaultGlassSize,
			glass_fill_time: fillTime,
			weight_lbs: user_weight
		}

		console.dir( settings );
		// Recommended OZs Per Day.
		var roz = user_weight * 0.5;
		// Recommended (8oz) Glasses Per Day.
		var glasses = roz / 8;

		console.log( roz + " oz of fluid or " + glasses + " 8oz glasses." );
		
		// TODO: Emit Settings to Server.
		socket.emit('settings', settings);
		return false
	});
	
	$(page).on('click', '.app-bottombar .nav-home', function(){
		App.load('Home', "slide-down");
		console.log("Navigate To Home");
	});

	$(page).on('click', '.app-bottombar .nav-statsPage', function(){
		console.log("Navigate To Stats Page");
		App.load('StatsPage', "slide-down");
	});

	$(page).on('click', '.app-bottombar .nav-settings', function(){
		App.load('Settings', "slide-down");
		console.log("Navigate to Settings");
	});
});

// Try to keep the app in current state when page refreshes.
try{
	App.load('Home');
	//App.restore();
} catch (error){
	App.load('Home');
}