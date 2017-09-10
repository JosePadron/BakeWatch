var socket = io.connect('http://10.203.9.130:8080');

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
    jQuery("#ovenImage").remove();
    jQuery(".oven-image-container").append(image);
  }
  
  // START EVERYTHING UP!
  var app = new App();
  
  jQuery(document).on('ready', function () {
  
    jQuery("#btn-share").on('click', function () {
      app.submit_photo();
    });

    jQuery("#btn-capture").on('click', function(){      
      socket.emit('take_picture', {}, function(data){
        console.log("Take Picture");
        app.updateImage();
      });
    });

    jQuery("#btn-light-toggle").on('click', function(){
      socket.emit('oven_light_toggle');
    });

    jQuery("#btn-oven-off").on('click', function(){
      socket.emit('oven_temp_off');
    });

    jQuery("#btn-data").on('click', function(){
      socket.emit('get_oven_data');
    });
  });

  socket.on('get_picture', function(){
    app.updateImage();
  });
