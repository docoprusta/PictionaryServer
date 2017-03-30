var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', function(req, res) {
	var userName = req.body.userName;
	var password = req.body.password;
	
});

module.exports = router;
