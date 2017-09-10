
var socket = io.connect('http://bakewatch.com/');


// Constructor
var App = function () {
    console.log("Constructor");
  }
  
  App.prototype.submit_photo = function () {
    FB.login(function (response) {
      console.log(response);
      // app.successMessage();

      fileUpload(response.authResponse.accessToken);
    }, {
      scope: 'publish_actions'
    });
  }
  
  App.prototype.successMessage = function(){
    var modal_switch = document.getElementById('modal_1'); 
    modal_switch.checked = true;
  }
  
  App.prototype.updateImage = function(){
    var image = new Image(640, 480);
    image.src = "/public/image.jpg";
    image.id = "ovenImage";
    jQuery("#ovenImage").remove();
    jQuery(".oven-image-container").append(image);
  }
  
  // START EVERYTHING UP!
  var app = new App();
  
  jQuery(document).on('ready', function () {
  
    jQuery("#btn-share").on('click', function () {
      console.log("Share");
      app.submit_photo();
    });

    jQuery("#btn-capture").on('click', function(){   
      console.log("Take Picture");   
      socket.emit('take_picture', {}, function(data){
        console.log("Take Picture");
      });
      app.updateImage();
    });

    jQuery("#btn-light-toggle").on('click', function(){
      console.log("Light Toggle");
      socket.emit('oven_light_toggle');
    });

    jQuery("#btn-oven-off").on('click', function(){
      console.log("Oven Off");
      socket.emit('oven_temp_off');
    });

    jQuery("#btn-data").on('click', function(){
      console.log("Get Oven Data");
      socket.emit('get_oven_data');
    });
  });

  socket.on('get_picture', function(){
    app.updateImage();
  });

  socket.on('oven_data', function(data){
    console.log('Data', data);
  });