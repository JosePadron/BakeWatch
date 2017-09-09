var greenBean = require("green-bean");

greenBean.connect("range", function(range) {
    range.twelveHourShutoff.read(function(value) {
        console.log("twelve hour shutoff is:", value);
    });

    range.twelveHourShutoff.subscribe(function(value) {
        console.log("twelve hour shutoff changed:", value);
    });

    range.twelveHourShutoff.write(1);
});
