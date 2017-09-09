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

function getBase64Image(img, logo, temp) {
//   var logo = new Image(350, 88);
//   logo.src = 'images/first-build-logo.png';

  var canvas = document.createElement("canvas");  
      canvas.width = img.width;
      canvas.height = img.height;
  var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
  
      var canvas2 = document.createElement("canvas");
    //   canvas2.width = logo.width;
    //   canvas2.height = logo.height;
  var ctx2 = canvas2.getContext("2d");
      ctx2.drawImage(logo, 0, 0, logo.width, logo.height);

  var canvas3 = document.createElement("canvas");
  var ctx3 = canvas3.getContext('2d');
      canvas3.width = img.width;
      canvas3.height= img.height;
      ctx3.drawImage(canvas, 0, 0);
      ctx3.drawImage(canvas2, 479, 376);
      ctx3.fillStyle = "white";
      ctx3.font = "30px sans-serif";
      ctx3.textBaseline = 'bottom';
      ctx3.fillText(temp + "°F", 0, 0);
      
      

      

  jQuery('.oven-image-container img').remove();
  jQuery('.oven-image-container').append(canvas3);
  var c = canvas3.toDataURL("image/jpg");
  var data = c.replace(/^data:image\/(png|jpe?g);base64,/, '');
  return conversions.base64ToString(data);
}

function fileUpload(access_token) {
  var image = getBase64Image(document.getElementById('ovenImage'), document.getElementById('logo'));
//   postImage({
//     fb: {
//       caption: 'Look what I\'m cookin\'! #firstbuild #hackthehome',
//       /* place any other API params you wish to send. Ex: place / tags etc.*/
//       accessToken: access_token,
//       file: {
//         name: 'upload.jpg',
//         type: 'image/jpeg', // or png
//         dataString: image // the string containing the binary data
//       }
//     },
//     call: { // options of the $.ajax call
//       url: 'https://graph.facebook.com/me/photos', // or replace *me* with albumid
//       success: function (s) {
//         console.log("Success", s);
//         app.successMessage();        
//       },
//       error: function (e) {
//         console.log("Error", e);
//       }
//     }
//   });

}