var express = require('express');
var app = express();
var path = require('path');
var mongo = require('mongodb').MongoClient;
var validUrl = require('valid-url');
var autoIncrement = require('mongodb-autoincrement');
var url = 'mongodb://localhost:27017/shortener';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.get('/robots.txt', function(req,res) {
	//console.log('here');
	return;
});

app.get('/', function(req,res) {
	res.render('index');
})

app.get('/new*', function(req,res) {
	//get the url user has entered and slice off the leading '/'
	var link = req.params[0].slice(1);
	var shorty;
	//run input through url validator
	if (validUrl.isUri(link)){
		//open connection to db
		mongo.connect(url, function(err, db) {
			console.log('connected to db');
			var collectionName = 'urls';
			var collection = db.collection('urls');
			//check to see if url is already stored in the database
			collection.findOne({"address": {$regex: link}}, function(err,data) {
				if (err) {
					console.log(err);
				}

				else {
					if (data) {
						//i will get here if entry is already in the db
						shorty = 'http://localhost:8080/url/' + data._id;
						console.log(shorty);
						res.render('shortened', {original: link, short: shorty});
						//here i need to render shorty and the original url
					}

					else {
						//add to db if entry doesnt exist yet
						autoIncrement.getNextSequence(db, collectionName, function(err, autoIndex) {
							var collection = db.collection(collectionName);
							collection.insert({
								_id: autoIndex,
								address: link
							}, function(err,data) {
								if (err) {
									console.log(err);
								}

								else {
									shorty = 'http://localhost:8080/url/' + data.ops[0]._id;
									res.render('shortened', {original: link, short: shorty});
								}
							});
						});
					}
				}
			});
		});
    } 

    else {
        res.render('index');
    }
});

app.get('/url*', function(req,res) {
	var query = parseInt(req.params[0].slice(1));
	if (isNaN(query)) {
		res.render('index');
	}

	mongo.connect(url, function(err,db) {
		//query my db for the link, if exists redirect. if does not exist show error
		var collection = db.collection('urls');
		collection.findOne({"_id": query}, function(err,data) {
			if (err) {
				console.log(err);
			}

			else {
				if (data) {
					res.redirect(data.address);
				}

				else {
					res.render('index');
				}
				
				db.close();
			}
		});
	});
});

app.listen(8080, function(req, res) {
	console.log('listening on 8080');
});