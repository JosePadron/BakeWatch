# FixOfWater Wiki Page
### Project for the 2015 Hack the Home Hackathon at First Build

Keep track of how much water you drink per day. This project uses the Intel Edison ioT
development board and the Green Bean to control the water dispenser of a GE Refrigerator
with voice commands like Dispense, Stop, Water, Cubed, Crushed. The system has a Redis
data structure server running on the Edison to store the water consumption of each user.


###### Examples of valid commands:

***Dispense*** 6 ounces ***Water***
***Dispense Cubed***   => ***Stop***
***Dispense Crushed***   => ***Stop***

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
npm install redis --save
```

### Install Redis Server
Download and Install latest stable version from: http://redis.io/

Using homebrew:

- Install Homebrew
```
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

- Install Redis
```
brew install redis
```

### Install GEA Refer Plugin
Modified to allow dispenser control: https://github.com/elrafapadron/gea-plugin-refrigerator

### Run Redis Server
redis-server /usr/local/etc/redis.conf
