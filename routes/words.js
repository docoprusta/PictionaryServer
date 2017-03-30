var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
var passwordHash = require('password-hash');
var auth = require('http-auth');

var emailFromDB;
var passwordFromDB;
var idFromDB;
var userId;

//basic authentication
var basic = auth.basic({
        realm: "user"
    }, function (email, password, callback) { // Custom authentication method.
		mongoose.model('User').findOne({'email' : email}, function (err, user) {
			
			if (err) {
				console.log(err);
			} else if (user === null) {
				console.log("user not found")
			} else {
				emailFromDB = user.email;
				passwordFromDB = user.password;
				idFromDB = user._id;
			}

			callback(email === emailFromDB && passwordHash.verify(password, passwordFromDB));
		})
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

//get words by userId
router.get('/', auth.connect(basic), function(req, res){
	userId = req.query.userId;
	var isExists = false;
	
	if(userId == idFromDB) {
		
		mongoose.model('Word').count({userId : userId}, function(err, count) {
			if (count > 0) {
				isExists = true;
			}
			if (isExists) {
				mongoose.model('Word').find({userId : userId}, function(err, word){
					if (err) {
						res.send("problem");
					} else {
						res.format ({
							json : function() {
								res.json(word);
							}
						})
					}
				});
			} else {
				res.send("words not found!");
			}
		});
	} else {
		res.sendStatus(401);
	}
});

//post word
router.post('/', auth.connect(basic), function(req, res){
	if(req.body.userId == idFromDB) {
		mongoose.model('Word').create({
			userId : req.body.userId,
			words :  req.body.words,
			url : req.body.url
		}, function (err, user) {
			if (err) {
				res.send(err.errmsg);
			} else {
				res.sendStatus(200);
			}
		})
	} else {
		res.sendStatus(401);
	}
	
});

router.param('id', function(req, res, next, id){
	mongoose.model('Word').findById(id, function(err, word){
		if (err) {
			res.send("problem")
		} else {
			req.id = id;
			next();
		}
	
	});
});

//get word by id
router.get('/:id', auth.connect(basic), function(req, res) {
	mongoose.model('Word').findById(req.id, function(err, word){
		if (err) {
			res.send(err.errmsg);
		} else {
			res.format ({
				json : function() {
					res.json(word);
				}
			})
		}
	});
});

//add meaning to word
router.put('/:id/add/', auth.connect(basic), function(req, res) {
	var language = req.body.language;
	var meaning = req.body.meaning;
	mongoose.model('Word').findByIdAndUpdate(
		req.id,
		{$addToSet: {"words": {meaning : meaning, language : language}}},
		function(err, model) {
			if (err) {
				res.send(err.errmsg);
			} else {
				res.sendStatus(200);
			}
		}
	);
});

//edit word
router.put('/:id/edit', auth.connect(basic), function(req, res){

	var meaning = req.body.meaning !== "" ? req.body.meaning : req.body.origMeaning;
	var url = req.body.url !== "" ? req.body.url : req.body.origUrl;
	
	console.log(req.body)

	mongoose.model('Word').findOneAndUpdate(
		{_id : req.id, 'words.meaning' : req.body.origMeaning},
		{$set : {'url' : url, 'words.$.meaning' : meaning}},
		function(err, word) {
			if (err) {
				res.send(err.errmsg);
			} else {
				console.log(req.body)
				res.sendStatus(200);
			}
		}
	);

});

//delete a mening of a word
router.put('/:id/del', auth.connect(basic), function(req, res) {
	var language = req.body.language;
	var meaning = req.body.meaning;
	mongoose.model('Word').findOneAndUpdate(
		{_id : req.id, 'words.language' : language, 'words.meaning' : meaning},
		{$pull : {words : { language : language, meaning : meaning}}},
		function (err, word) {
			if (err) {
				res.send(err.errmsg);
			} else if (word){
				res.sendStatus(200);
			} else {
				res.send("problem");
			}
		}
	);
});

//delete word
router.delete('/:id', auth.connect(basic), function(req, res){
	mongoose.model('Word').findByIdAndRemove(req.id, function(err, word){
		if (err) {
			res.send(err.errmsg);
		} else {
			res.sendStatus(200);
		}
	});
});

module.exports = router;
