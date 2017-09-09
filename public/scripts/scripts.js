var socket = io.connect('http://10.10.4.247:8080');


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
    var image_element = document.getElementById('ovenImage');
  }
  
  // START EVERYTHING UP!
  var app = new App();
  
  jQuery(document).on('ready', function () {
  
    jQuery("#btn-share").on('click', function () {
      app.submit_photo();
    });

    jQuery("#btn-capture").on('click', function(){
      socket.emit('take_picture', {}, function(data){
        console.log("Event Happened");
        jQuery("#ovenImage").attr('src', '/public/image.jpg');
      });
    })
  });