/**
*	CONTROLLERS
*
*
*/
App.controller('Home', function(page){


	$(page).on('click', '.app-content .app-button', function(){
		$('.modal-wrap').fadeIn(500);
		// $('.modal-wrap').fadeIn(500).delay(10).find("#username-input").focus();
		// $("#username-input").focus();
	});
	
	$('.modal-wrap input[type="submit"]').on('click', function(){
		$('modal.wrap').fadeOut(500);
		App.load("CommandPage", "fade");
	});
	
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

App.controller('StatsPage', function(page){

	$("#doughnutChart").drawDoughnutChart([
		{ title: "Water",         value : 120,  color: "#2C3E50" },
		{ title: "Iced", 		value:  80,   color: "#FC4349" },
		{ title: "Cubed",      value:  70,   color: "#6DBCDB" }
	]);
	
	
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

App.controller('Settings', function(page){

	
	
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
	App.load('StatsPage');
	//App.restore();
} catch (error){
	App.load('StatsPage');
}