var Firebase = require("firebase");
var myDataRef = new Firebase('https://flickering-torch-9611.firebaseio.com/');
var os = require('os');

//Set server ip
myDataRef.child("server").set({
  server_ip: ip_address('wlan0')
});

function ip_address(interface) {
  var items = os.networkInterfaces()[interface] || [];

  return items
    .filter(function(item) {
      return item.family.toLowerCase() == 'ipv4';
    })
    .map(function(item) {
      return item.address;
    })
    .shift();
}
