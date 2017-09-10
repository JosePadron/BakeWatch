// Facebook Initialization
(function (d, s, id) {var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) {return;}js = d.createElement(s);js.id = id;js.src = "//connect.facebook.net/en_US/sdk.js";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));
window.fbAsyncInit = function () {
  FB.init({
    appId: '160231797891385',
    xfbml: true,
    version: 'v2.10'
  });
  FB.AppEvents.logPageView();
};

var conversions = {
  stringToBinaryArray: function (string) {
    return Array.prototype.map.call(string, function (c) {
      return c.charCodeAt(0) & 0xff;
    });
  },
  base64ToString: function (b64String) {
    return atob(b64String);
  }
};
var DEFAULT_CALL_OPTS = {
  url: 'https://graph.facebook.com/me/photos',
  type: 'POST',
  cache: false,
  success: function (response) {
    console.log(response);
  },
  error: function () {
    console.error(arguments);
  },
  // we compose the data manually, thus
  processData: false,
  /**
   *  Override the default send method to send the data in binary form
   */
  xhr: function () {
    var xhr = $.ajaxSettings.xhr();
    xhr.send = function (string) {
      var bytes = conversions.stringToBinaryArray(string);
      XMLHttpRequest.prototype.send.call(this, new Uint8Array(bytes).buffer);
    };
    return xhr;
  }
};
/**
 * It composes the multipart POST data, according to HTTP standards
 */
var composeMultipartData = function (fields, boundary) {
  var data = '';
  $.each(fields, function (key, value) {
    data += '--' + boundary + '\r\n';

    if (value.dataString) { // file upload
      data += 'Content-Disposition: form-data; name=\'' + key + '\'; ' +
        'filename=\'' + value.name + '\'\r\n';
      data += 'Content-Type: ' + value.type + '\r\n\r\n';
      data += value.dataString + '\r\n';
    } else {
      data += 'Content-Disposition: form-data; name=\'' + key + '\';' +
        '\r\n\r\n';
      data += value + '\r\n';
    }
  });
  data += '--' + boundary + '--';
  return data;
};

var setupData = function (callObj, opts) {
  var boundary = 'Awesome field separator ' + Math.random();
  callObj.data = composeMultipartData(opts.fb, boundary);
  callObj.contentType = 'multipart/form-data; boundary=' + boundary;
};

var postImage = function (opts) {
  var callObj = $.extend({}, DEFAULT_CALL_OPTS, opts.call);
  callObj.url += '?access_token=' + opts.fb.accessToken;
  setupData(callObj, opts);
  $.ajax(callObj);
};

function fileUpload(access_token) {
  var image = app.updateImage();
  postImage({
    fb: {
      caption: 'Look what I\'m cookin\'! #firstbuild #hackthehome',
      /* place any other API params you wish to send. Ex: place / tags etc.*/
      accessToken: access_token,
      file: {
        name: 'upload.png',
        type: 'image/png', // or png
        dataString: image // the string containing the binary data
      }
    },
    call: { // options of the $.ajax call
      url: 'https://graph.facebook.com/me/photos', // or replace *me* with albumid
      success: function (s) {
        console.log("Success", s);
        app.successMessage();        
      },
      error: function (e) {
        console.log("Error", e);
      }
    }
  });

}

  // console.log("connecting to: " + data.val().server_ip);
  // var socket = io.connect('http://' + data.val().server_ip + ':80');
  var socket = io.connect('http://10.203.9.42:80');

// Constructor
var App = function () {
    console.log("App Loaded");
  }
  
  App.prototype.submit_photo = function () {
    FB.login(function (response) {
      console.log(response);
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
    jQuery("#oven-image-container canvas").remove();
    jQuery(".init-image").remove();

    var image = new Image(620, 480);
        image.src = '/public/image.jpg';
    var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
    var ctx = canvas.getContext('2d');
        image.onload = function(){
            ctx.drawImage(image, 0, 0, image.width, image.height);
            ctx.fillStyle = "white";
            ctx.font="40px sans-serif";
            ctx.fillText(app.temp + "°F: " + app.time_left + " mins left", 20, 440);
        }

    var logo = new Image(151, 94);
        logo.src = '/public/images/logo.png';
    var canvas2 = document.createElement('canvas');
        canvas2.width = logo.width;
        canvas2.height = logo.height;
    var ctx2 = canvas.getContext('2d');
        logo.onload = function(){
            ctx2.drawImage(logo, 460, 376, logo.width, logo.height);
        }

    var canvas3 = document.createElement('canvas');
    var ctx3 = canvas3.getContext('2d');
        canvas3.width = 620;
        canvas3.height = 480;
        // setTimeout(function(){
            ctx3.drawImage(canvas, 0, 0);
            ctx3.drawImage(canvas2, 0, 0);
        // }, 400);
        jQuery("#oven-image-container").append(canvas3);

    var c = canvas3.toDataURL("image/png");
    var data = c.replace(/^data:image\/(png|jpe?g);base64,/, '');
    return conversions.base64ToString(data);
  }
  
  // START EVERYTHING UP!
  var app = new App();
      app.temp = 0;
      app.time_left = 0;
  
  jQuery(document).on('ready', function () {
    socket.emit('get_oven_time_left');
    socket.emit('get_oven_temperature');
    socket.emit('take_picture');

    
    jQuery("#btn-share").on('click', function () {
      console.log("Share");
      app.submit_photo();
    });

    jQuery("#btn-capture").on('click', function(){   
      console.log("Take Picture");
      socket.emit('take_picture');
    });

    jQuery("#btn-light-toggle").on('click', function(){
      console.log("Light Toggle");
      socket.emit('oven_light_toggle');
    });

    jQuery("#btn-oven-off").on('click', function(){
      console.log("Oven Off");
      socket.emit('oven_temp_off');
    });

    jQuery("#btn-temp").on('click', function(){
      console.log("Get Oven Temp");
      socket.emit('get_oven_temperature');
    });

    jQuery("#btn-time-left").on('click', function(){
      console.log("Time Left");
      socket.emit('get_oven_time_left');
    });
  });

  socket.on('get_picture', function(){
    setTimeout(function(){
      console.log("Getting new photo");
      app.updateImage();
    }, 3000);
  });

  socket.on('oven_temperature', function(temp){
    console.log('Temp: ' + temp);
    app.temp = temp;
  });

  socket.on('oven_time_left', function(time_left){
    console.log('time_left Time: '+ time_left);
    app.time_left = time_left;
  });
