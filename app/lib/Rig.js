var nest = require('unofficial-nest-api');
var config = require('../config');

var Thermostat = require('./Thermostat');

function Rig() {
  this.units = [];
}

Rig.prototype.init = function (callback) {
  var self = this;

  function mapFromDevices(data) {
    for (var deviceId in data.device) {
      if (data.track[deviceId].online) {
        var unit = Thermostat.create();
        unit.setId(deviceId);
        unit.setTemperature(Math.floor(data.shared[deviceId].target_temperature));
        unit.setScale(data.device[deviceId].temperature_scale);
        self.units.push(unit);
      }
    }
    return callback();
  }

  self.connect(mapFromDevices);
};

Rig.prototype.connect = function (callback) {
  nest.login(config.nest.username, config.nest.password, function (err) {
    if (err) return callback(err);
    return nest.fetchStatus(callback);
  });
};

Rig.prototype.setTemperature = function (temperature) {
  var self = this;

  function mapToDevices() {
    for (var i = 0, len = self.units.length; i < len; i++) {
      self.units[i].setTemperature(temperature);
      nest.setTemperature(self.units[i].getId(), temperature);
    }
  }

  self.connect(mapToDevices);
};

Rig.prototype.getTemperature = function () {
  var i = 0, len = this.units.length, total = 0;

  for (i = 0; i < len; i++) {
    total += this.units[i].getTemperature();
  }

  return Math.floor(total / len);
};

Rig.prototype.getScale = function () {
  var len = this.units.length;

  if (len === 0) {
    return null;
  }

  return this.units[0].getScale();
};

Rig.prototype.getUnits = function () {
  return this.units;
};

exports = module.exports = {};
exports.create = function () {
  return new Rig();
};