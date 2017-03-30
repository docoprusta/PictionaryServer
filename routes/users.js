var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
var passwordHash = require('password-hash');
var auth = require('http-auth');

var emailFromDB;
var passwordFromDB;

//basic authentication
var basic = auth.basic({
        realm: "user"
    }, function (email, password, callback) { // Custom authentication method.
		mongoose.model('User').findOne({'email' : email},function (err, user) {
			
			if (err) {
				console.log(err);
			} else if(!user) {
				console.log("not valid email");
			} else {
				emailFromDB = user.email;
				passwordFromDB = user.password;
			}

			callback((email === emailFromDB && passwordHash.verify(password, passwordFromDB)) || (email === "admin" && password === "admin"));
		})
    }
);

var admin = auth.basic({
        realm: "admin"
    }, function (username, password, callback) { // Custom authentication method.
        callback(username === "admin" && password === "admin");
    }
);

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method
      delete req.body._method
      return method
    }
}));

//get user by email
router.get('/', auth.connect(basic), function(req, res, next) {

	var email = req.query.email;
	var isExists = false;
	
	if(email) {
	
		mongoose.model('User').count({email : email}, function(err, count) {
			if (count > 0) {
				isExists = true;
			}
			if (isExists) {
				mongoose.model('User').findOne({email : email}, function(err, user){
					if (err) {
						res.send("problem");
					} else {
						res.format ({
							json : function() {
								res.json(user._id);
							}
						})
					}
				});
			} else {
				res.send("user not found!");
			}
		});
	}
});

//post user
router.post('/', function(req, res, next) {
	var email = req.body.email;
	var password = passwordHash.generate(req.body.password);
	
	mongoose.model('User').create({
		email : email,
		password : password
	}, function (err, user) {
		if (err) {
			res.send(err.errmsg);
		} else {
			res.sendStatus(200);
		}
	})
	
});

//edit user (only admin can do)
router.put('/:id/edit', auth.connect(admin), function(req, res) {
	var email = req.body.email;
	mongoose.model('User').findById(req.id, function(err, user) {
		user.update({
			email : email
		}, function(err){
			if (err) {
				res.send("problem");
			} else {
				res.sendStatus(200);
			}
		})
	});
	
});

//important!
router.param('id', function(req, res, next, id) {

	mongoose.model('User').findById(id, function(err, user) {
		if (err) {
			console.log(id + ' was not found');
            res.status(404)
			res.format ({
				json: function () {
					res.json({message: id + ' was not found'});
				}
			});
		} else {
			req.id = id;
			next();
		}
	});

});

//get user by id (only admin can do)
router.get('/:id', auth.connect(admin), function(req, res) {
	mongoose.model('User').findById(req.id, function(err, user) {
		if (err) {
			console.log("error");
		} else {
			
			res.format({
				json : function() {
					res.json(user);
				}
			})
			
		}
	})
});

//delete user by id
router.delete('/:id', auth.connect(basic), function(req, res) {
	mongoose.model('User').findById(req.id, function(err, user) {
		if (err) {
			res.send("problem");
		} else {
			user.remove(function(err, user){
				if (err) {
					res.send("problem");
				} else {
					console.log(err);
					res.sendStatus(200);
				}
			});
		}
	});
});

module.exports = router;
