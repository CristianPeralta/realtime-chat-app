var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');
var messageController = require('../controllers/messageController');
var solicitudeController = require('../controllers/solicitudeController');
var roomController = require('../controllers/RoomController');

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.sendStatus(401);
  }
  return next();
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/room/delete', requireSession, roomController.delete);
router.get('/room/:room', roomController.room);

router.post('/signup', userController.create);

router.post('/login', userController.login);
router.post('/logout', userController.logout);

router.get('/user', userController.getUser);
router.get('/profile', userController.getProfile);

router.get('/messages', messageController.getAll);
router.get('/messages/privates', messageController.getAllPrivate);
router.post('/message', requireSession, messageController.create);
router.post('/upload', requireSession, messageController.upload);
router.get('/message/delete', requireSession, messageController.delete);
router.get('/historial/:user/:to', messageController.getHistorialSpecificUser);

router.get('/room', roomController.getAll);
router.post('/room', roomController.create);

router.post('/solicitude', solicitudeController.create);
router.post('/solicitude/delete', solicitudeController.delete);
router.post('/friend/delete', userController.deleteFriend);

module.exports = router;
