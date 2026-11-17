const formidable = require("formidable");
const fs = require("fs-extra");
const bcrypt = require("bcrypt");
const path = require("path");
var mongoose = require("mongoose");
const randomstring = require("randomstring");

var User = require('../models/User');
var signupError = require('../lib/signupError');


function stripPassword(value) {
  if (Array.isArray(value)) {
    return value.map(stripPassword);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (value._bsontype === 'ObjectID' || value._bsontype === 'ObjectId') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const source = typeof value.toObject === 'function' ? value.toObject() : value;
  const copy = {};
  Object.keys(source).forEach((key) => {
    if (key === 'password') {
      return;
    }
    copy[key] = stripPassword(source[key]);
  });
  return copy;
}

function publicUser(user) {
  return stripPassword(user);
}

module.exports.login = function (req,res) {
  let data = req.body || {};
  User.findOne({email:data.email}).then((user) => {
    if (!user || !data.password || !bcrypt.compareSync(data.password, user.password)) {
      return res.sendStatus(401);
    }
    return User.findOne({_id:user._id}).populate({
      path: 'friends',
      populate: {path: 'friends'}
    }).populate({
      path: 'solicitudes',
      populate: [
        {path: 'from'},
        {path: 'to'}
      ],
    }).then((full) => {
      if (!full) {
        return res.sendStatus(401);
      }
      let currentUser = publicUser(full);
      req.session.user = currentUser;
      return res.json(currentUser);
    });
  }).catch((err) => {
    console.error(err);
    if (!res.headersSent) {
      return res.sendStatus(503);
    }
  });
}

module.exports.addFriend = function (req,res) {
  let data = req.body;
  console.log(data);
  User.findOne({_id:data.user._id}).then((user, err) => {
    if(err){
      console.log(err);
      return res.sendStatus(503)
    }
    User.findOne({_id:data.friend._id}).then((friend, err) => {
      if(err){
        console.log(err);
        return res.sendStatus(503)
      }
      if (user.friends.indexOf(mongoose.Types.ObjectId(friend._id)) == -1) {
        user.friends.push(mongoose.Types.ObjectId(friend._id));
        user.save(function (err,user) {
          if(err){
            console.log(err);
            return res.sendStatus(503)
          }
          User.findOne({_id:user._id}).populate({
            path: 'friends',
            populate: {path: 'friends'}
          }).populate({
            path: 'solicitudes',
            populate: [
              {path: 'from'},
              {path: 'to'}
            ],
          }).then((user, err) => {
            if(err){
              console.log(err);
              return res.sendStatus(503)
            }
            req.session.user = user;
            let currentUser = req.session.user;
            return res.json(currentUser);
          })
        });
      }

    })

  })
}

module.exports.deleteFriend = function (req,res) {
  let data = req.body;
  console.log('deletbn');
  console.log(data);
  User.findOne({_id:data.user._id}).then((user, err) => {
    if(err){
      console.log(err);
      return res.sendStatus(503)
    }
    idx = user.friends.indexOf(mongoose.Types.ObjectId(data.friend._id));
    if (idx != -1) {
      user.friends.splice(idx, 1);
      user.save(function (err,user) {
        if(err){
          console.log(err);
          return res.sendStatus(503)
        }
        User.findOne({_id:data.friend._id}).then((friend, err) => {
          if(err){
            console.log(err);
            return res.sendStatus(503)
          }
          idx = friend.friends.indexOf(mongoose.Types.ObjectId(data.user._id));
          if (idx != -1) {
            friend.friends.splice(idx, 1);
            friend.save(function (err,friend) {
              User.findOne({_id:user._id}).populate({
                path: 'friends',
                populate: {path: 'friends'}
              }).populate({
                path: 'solicitudes',
                populate: [
                  {path: 'from'},
                  {path: 'to'}
                ],
              }).then((user, err) => {
                if(err){
                  console.log(err);
                  return res.sendStatus(503)
                }
                req.session.user = user;
                let currentUser = req.session.user;
                return res.json(currentUser);
              })
            })
          }
        })

      });
    }

  })
}

module.exports.getFriends = function (req,res) {
  let data = req.body;
  console.log(data);
  User.findOne({_id:data._id}).populate({
    path: 'friends',
    populate: {path: 'friends'}
  }).populate({
    path: 'solicitudes',
    populate: [
      {path: 'from'},
      {path: 'to'}
    ],
  }).then((user, err) => {
    if(err){
      console.log(err);
      return res.sendStatus(503)
    }
    return res.json(user);
  })
}


module.exports.getFriendsSocket = function (data, cb) {
  if (!data || !data._id) {
    return cb([], null);
  }
  User.findOne({_id:data._id}).populate({
    path: 'friends',
    populate: {path: 'friends'}
  }).populate({
    path: 'solicitudes',
    populate: [
      {path: 'from'},
      {path: 'to'}
    ],
  }).then((user) => {
    return cb((user && user.friends) || [], null);
  }).catch((err) => {
    console.error(err);
    return cb([], err);
  })
}

module.exports.getUser = function (req,res) {
    let user = req.session.user;
    if (user && user._id) {
      User.findOne({_id:user._id}).populate({
        path: 'friends',
        populate: {path: 'friends'}
      }).populate({
        path: 'solicitudes',
        populate: [
          {path: 'from'},
          {path: 'to'}
        ],
      }).then((found) => {
        if (!found) {
          return res.json({});
        }
        return res.json(publicUser(found));
      }).catch((err) => {
        console.error(err);
        return res.sendStatus(401);
      });
    } else {
      return res.json({});
    }

}

module.exports.getProfile = function (req,res) {
    let user = req.query.id;
    User.findOne({_id:user}).populate({
      path: 'friends',
      populate: {path: 'friends'}
    }).populate({
      path: 'solicitudes',
      populate: [
        {path: 'from'},
        {path: 'to'}
      ],
    }).then((user, err) => {
      if (err) {
        console.log(err);
        return res.sendStatus(503);
      }
      return res.json(user);
    })
}


module.exports.logout= function (req,res) {
    req.session.destroy(function(err) {
      // cannot access session here
      if(err){
        console.log(err);
        return res.sendStatus(503)
      }
      return res.sendStatus(200);
    })
}


module.exports.create = function (req,res) {
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    if (err) {
      console.error(err);
      return res.sendStatus(400);
    }
    let data = fields;
    var user = new User();
    var photo = files && files.photo;
    if (Array.isArray(photo)) {
      photo = photo[0];
    }
    if (!photo || !photo.name) {
      return res.status(400).json({ error: 'photo is required' });
    }

    data.photo = path.join("uploads/", photo.name);
    console.log(data);

    user.username = data.username;
    user.email = data.email;
    user.photo = data.photo;
    user.gender = data.gender;
    user.password = bcrypt.hashSync(data.password, 10);

    user.save(function (err,user) {
        if (err) {
          var failure = signupError.signupFailure(err);
          if (failure.body) {
            return res.status(failure.status).json(failure.body);
          }
          console.error(err);
          return res.sendStatus(failure.status);
        }
        req.session.user = user;
        let currentUser = req.session.user;
        return res.json(currentUser);
    });

  });
  form.on("error", function(err) {
    return res.send(null, 500);
  });

  form.on("fileBegin", function(name, file) {
    let rdName = randomstring.generate();
    rdName = rdName.replace("/", "");
    let originalName = file.name || '';
    file.name = rdName + path.extname(originalName);
  });

  form.on("end", function(fields, files) {
    if (!this.openedFiles || !this.openedFiles[0]) {
      return;
    }
    const temp_path = this.openedFiles[0].path;
    const file_name = this.openedFiles[0].name;
    const new_location = path.join(__dirname, "../public/uploads/", file_name);

    fs.copy(temp_path, new_location, function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log("success!")
      }
    });
  });
}


module.exports.edit = function (req,res) {
  let user = req.body.id;
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    let data = fields;
    User.findOne({_id:user}).populate({
      path: 'friends',
      populate: {path: 'friends'}
    }).populate({
      path: 'solicitudes',
      populate: [
        {path: 'from'},
        {path: 'to'}
      ],
    }).then((user, err) => {
      if (err) {
        console.log(err);
        return res.sendStatus(503);
      }
      data.photo = path.join("uploads/", files.photo.name);
      console.log(data);

      user.username = data.username;
      user.email = data.email;
      user.photo = data.photo;
      user.gender = data.gender;
      user.save(function (err,user) {
          if(err){
            console.log(err);
            return res.sendStatus(503)
          }
          req.session.user = user;
          let currentUser = req.session.user;
          return res.json(currentUser);
      });
    })

  });
  form.on("error", function(err) {
    return res.send(null, 500);
  });

  form.on("fileBegin", function(name, file) {
    let rdName = randomstring.generate();
    rdName = rdName.replace("/", "");
    let originalName = file.name;
    file.name = rdName + path.extname(originalName);
  });

  form.on("end", function(fields, files) {
    const temp_path = this.openedFiles[0].path;
    const file_name = this.openedFiles[0].name;
    const new_location = path.join(__dirname, "../public/uploads/", file_name);

    fs.copy(temp_path, new_location, function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log("success!")
      }
    });
  });
}
