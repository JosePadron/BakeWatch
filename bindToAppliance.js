var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");

// configure the application
var app = gea.configure({
    address: 0xe4,
    version: [ 0, 0, 1, 0 ]
});

// bind to the adapter to access the bus
app.bind(adapter, function (bus) {
    console.log("bind was successful");
});
