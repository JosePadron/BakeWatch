# FixOfWater Wiki Page
### Project for the 2015 Hack the Home Hackathon at First Build

Keep track of how much water you drink per day. This project uses the Intel Edison ioT
development board and the Green Bean to control the water dispenser of a GE Refrigerator
with voice commands like Dispense, Stop, Water, Cubed, Crushed. The system uses Firebase
to store user data such as water consumption.


###### Examples of valid commands:

***Dispense*** 6 ounces ***Water***

***Dispense Cubed***   => ***Stop***

***Dispense Crushed***   => ***Stop***

***Light On***

***Light Off***

## Project Setup

### Configure Edison Board
Follow instructions from: https://github.com/FirstBuild/edison_iot

### Install Node
https://nodejs.org/download/

### Install Node packages

```
npm install green-bean
npm install socket.io
npm install express
```

### Install GEA Refer Plugin
Modified to allow dispenser control: https://github.com/elrafapadron/gea-plugin-refrigerator

