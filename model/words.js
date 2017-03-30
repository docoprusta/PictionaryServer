var mongoose = require('mongoose');
var wordSchema = new mongoose.Schema({
	userId : String,
	url : String,
	words : [{
		_id : false,
		language : String,
		meaning : String,
	}]
});
mongoose.model('Word', wordSchema);