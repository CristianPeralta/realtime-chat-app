var Room = require('../models/Room');
var mongoose = require("mongoose");
var roomName = require('../lib/roomName');


module.exports.room = function (req,res) {
  let callroom = req.params.room;
  Room.findOne({slug: callroom}).then( (room, err) => {
      if (err) {
        console.log(err);
        res.sendStatus(500)
      }
      return res.json(room);
    });
}

module.exports.create = function (req,res) {
  var parsed = roomName.parseRoomName(req.body && req.body.name);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  Room.findOne({ $or: [{ slug: parsed.slug }, { name: parsed.name }] }).then(function (existing) {
    if (existing) {
      return res.status(409).json({ error: 'A room with that name already exists' });
    }
    var room = new Room();
    room.name = parsed.name;
    room.slug = parsed.slug;
    room.save(function (err, saved) {
      if (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: 'A room with that name already exists' });
        }
        console.error(err);
        return res.sendStatus(503);
      }
      if (global.io) {
        global.io.emit('roomAdded', saved);
      }
      return res.json(saved);
    });
  }).catch(function (err) {
    console.error(err);
    return res.sendStatus(503);
  });
}

module.exports.getAll = function (req,res) {
  Room.find({}).then( (rooms, err) => {
      if (err) {
        console.log(err);
        res.sendStatus(500)
      }
      return res.json(rooms);
    });
}

module.exports.delete = function (req,res) {

  Room.remove({}, function(err) {
      if (!err) {
        console.log(err);
      }
      console.log(
        'deleted'
      );
      res.json('deleted')
  });
}
