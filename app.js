var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var ejs = require("ejs").__express;

require('dotenv').config()

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is required');
  process.exit(1);
}

var app = express();
var server = require('http').Server(app);
global.io = require('socket.io')(server);
var messageController = require('./controllers/messageController');
var solicitudeController = require('./controllers/solicitudeController');
var userController = require('./controllers/userController');

var usersOnline = [];

var sessionMiddleware = session({
  // When there is nothing on the session, do not save it
  saveUninitialized: false,
  // Update session if it changes
  resave: true,
  // Set cookie
  cookie: {
    secure: false,
    maxAge: 365 * 24 * 60 * 60 * 1000
  },
  // Name of your cookie
  name: 'testCookie',
  // Secret of your cookie
  secret: process.env.SESSION_SECRET
});

io.use(function (socket, next) {
  var req = socket.request;
  if (!req || !req.res) {
    return next();
  }
  sessionMiddleware(req, req.res, function () {
    next();
  });
});

var index = require('./routes/index');
console.log(process.env.MONGODB_CONNECTION_STRING);
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión:'));
db.once('open', function () {
  console.log('Conexión exitosa a la base de datos.');
});

io.on('connection', function (socket) {
  console.log('A client has connected');
  console.log(socket.id);
  var connectedUser = actingUser(socket);
  if (connectedUser) {
    socket.join('user:' + String(connectedUser._id));
  }
  socket.on('userConnected', (data) => {
    data.id = socket.id;
    console.log('user conneasd');
    console.log(data);
    addUserinRoom(data, () => {
      socket.join(data.room);
      console.log('this is the room');
      io.of('/home').adapter.clients((err, clients) => {
        console.log('clients');
        console.log(clients); // an array containing all connected socket ids
      });

      console.log(usersOnline);
      io.emit('usersConnected', { data: usersOnline });
      friendsOnline(data.user.friends, (friendsOn) => {
        if (friendsOn.length > 0) {
          friendsOn.map((el) => {
            console.log('sending to ' + el.id + ' -> ' + el.user.username);
            io.to(el.id).emit('friendConnected', { data: data });
          })
        }
      })
    })
  });


  socket.on('SignUp', function (data) {
    console.log('sending registration');
    console.log(data);
  });

  socket.on('addSolicitude', (data) => {
    var actor = actingUser(socket);
    if (!actor) {
      return;
    }
    var payload = payloadFrom(data);
    payload.user = { _id: String(actor._id) };
    solicitudeController.createSocket(payload, (solicitude, err) => {
      console.log('adding');
      console.log(data.friend.id);
      io.to(data.friend.id).emit('solicitudeAdded', { data: solicitude, ok: !err, err: err });
      io.to(socket.id).emit('solicitudeAdded', { data: solicitude, ok: !err, err: err });
    })
  });

  socket.on('deleteSolicitude', (data) => {
    solicitudeController.deleteSocket(data, (err) => {
      io.to(socket.id).emit('solicitudeDeleted', { data: data, ok: !err, err: err });
    })
  });

  socket.on('acceptSolicitude', (data) => {
    var actor = actingUser(socket);
    if (!actor) {
      return;
    }
    var payload = payloadFrom(data);
    delete payload.user;
    delete payload.to;
    payload.actorId = String(actor._id);
    solicitudeController.acceptSocket(payload, (user, friend, err) => {
      console.log('¿friend');
      console.log(friend);
      io.to(socket.id).emit('solicitudeAccepted', { data: user, ok: !err, err: err });
      if (!friend || !friend._id) {
        return;
      }
      isOnline(friend._id, (el) => {
        if (el) {
          console.log('goo job');
          console.log(el);
          io.to(el.id).emit('solicitudeAccepted', { data: friend, ok: !err, err: err });
        }
      })
    })
  });

  socket.on('getUserSocket', (id) => {
    console.log('getting socket');
    console.log(id);
    isOnline(id, (el) => {
      io.to(socket.id).emit('userFound', { data: el });
    })
  });

  socket.on('getFriends', (data) => {
    console.log(data);
    userController.getFriendsSocket(data, (friends, err) => {
      friendsOnline(friends, (friendsOn) => {
        if (friendsOn.length > 0) {
          socket.emit('friendsGetted', { data: friendsOn, ok: !err, err: err });
        }
      })
    })
  });

  socket.on('addMessage', (data) => {
    var actor = actingUser(socket);
    if (!actor) {
      return;
    }
    var payload = payloadFrom(data);
    payload.user = String(actor._id);
    messageController.createSocket(payload, (message, err) => {
      console.log('new message');
      var room = (message && message.room) || payload.room;
      if (!room) {
        return;
      }
      io.to(room).emit('messageAdded', { data: message, ok: !err, err: err });
    })
  });

  socket.on('addMessagePrivated', (data) => {
    console.log('message privated');
    var actor = actingUser(socket);
    if (!actor) {
      return;
    }
    var payload = payloadFrom(data);
    payload.user = String(actor._id);
    messageController.createSocket(payload, (message, err) => {
      console.log('message created');
      console.log(message);
      var recipientId = data && data.to && data.to.user && data.to.user._id;
      if (recipientId) {
        io.to('user:' + String(recipientId)).emit('addMessagePrivated', { data: message, ok: !err, err: err });
      }
      if (!recipientId || String(recipientId) !== String(actor._id)) {
        io.to(socket.id).emit('addMessagePrivated', { data: message, ok: !err, err: err });
      }
    })
  });

  socket.on('getMessages', (room) => {
    messageController.getAllSocket(room, (messages, err) => {
      socket.emit('messagesGetted', { data: messages, ok: !err, err: err });
    })
  });

  socket.on('userDisconnect', function (data) {
    let friendList = [];
    usersOnline.map((element, idx) => {
      if (element.user._id == data.user._id) {
        friendList = element.user.friends;
        usersOnline.splice(idx, 1);
      }
    });
    socket.disconnect();
    console.log(io.eio.clients);
    usersOnline = usersOnline.filter(function (n) { return n != undefined })
    io.emit('usersConnected', { data: usersOnline });
    friendsOnline(friendList, (friendsOn) => {
      if (friendsOn.length > 0) {
        friendsOn.map((el) => {
          console.log('sending to ' + el.id + ' -> ' + el.user.username);
          io.to(el.id).emit('friendDisConnected', { data: data.user._id });
        })
      }
    })
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
  });
});
//
// function getUsersOfRoom(data, cb) {
//   let usersRoom = usersOnline.map((element) => {
//     if (element.room == data.room) {
//       return element
//     }
//   })
//   usersRoom = usersRoom.filter(function(n){ return n != undefined })
//   console.log(usersRoom);
//   cb(usersRoom);
// }

function actingUser(socket) {
  var sess = socket.request && socket.request.session;
  if (!sess || !sess.user || !sess.user._id) {
    return null;
  }
  return sess.user;
}

function payloadFrom(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }
  return Object.assign({}, data);
}

function addUserinRoom(data, cb) {
  if (data.user != null) {
    let exist = false;
    if (usersOnline.length != 0) {
      exist = usersOnline.find((element) => {
        return (element.user._id == data.user._id) && (element.room == data.room);
      });
    }
    if (!exist) {
      usersOnline.push(data);
    }
    usersOnline = usersOnline.filter(function (n) { return n != undefined })
    cb();
  }
}

function isOnline(data, cb) {
  if (data != null) {
    let exist = false;
    if (usersOnline.length != 0) {
      exist = usersOnline.find((element) => {
        return (element.user._id == data);
      });
    }
    if (exist != null) {
      cb(exist);
    }
  }
}


function friendsOnline(friends, cb) {
  let friendsOn = [];
  if (!Array.isArray(friends)) {
    return cb(friendsOn);
  }
  console.log('function friends');
  let ids = friends.map((friend) => {
    return friend._id;
  })
  console.log(ids);
  if (usersOnline.length != 0) {
    friends.map((friend) => {
      isOnline(friend._id, (el) => {
        friendsOn.push(el);
      });
    })
    cb(friendsOn);
  }
}


function getUserById(id, cb) {
  if (id != null) {
    if (usersOnline.length != 0) {
      let idx = usersOnline.map((val, key) => {
        if (val.user._id == id) {
          return key;
        }
      })
      cb(idx);
    }
  }
}
app.use(sessionMiddleware);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Server running http://localhost:' + port);
});
