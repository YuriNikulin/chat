var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

exports.chatroom = function(req, res) {
  res.render('chatroom', { title: 'Express Chat' });
}
