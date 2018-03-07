var express = require('express');
var mongoose = require('mongoose');
var port = process.env.PORT || 3000;
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var database1, database2, dbSchool, dbCrimes;

module.exports = function(app){

	MongoClient.connect("mongodb://localhost/paf_service", function(err, db1){
		if(err)
			throw err;
		database1 = db1;
	});


	MongoClient.connect("mongodb://localhost/geocode", function(err, db2){
		if(err)
			throw err;
		database2 = db2;
	});

	MongoClient.connect("mongodb://localhost/test", function(err, db3){
		if(err)
			throw err;
		dbSchool = db3;
	});

	MongoClient.connect("mongodb://localhost/test", function(err, db4){
		if(err)
			throw err;
		dbCrimes = db4;
	});



	//poziv u bazu za prekrsaje
	app.post('/crimesAp', function(req, res){
		var objSelected = req.body.objSelect;
		var radius = req.body.radi;

		radius = Number(radius);
		if(radius < 0)
			radius = radius * (-1);

		dbCrimes.command({
		   geoNear: "crimes" ,
		   near: { type: "Point" , coordinates: [ objSelected.ap_lon, objSelected.ap_lat ]} ,
		   spherical: true,
		   "maxDistance" : 9656.064,
		   "limit" : 8
		}, function(err, docs){
			if(err)
				throw err;
			for(var i=0; i<docs.results.length; i++)
				docs.results[i].id = Math.random().toString(36).substr(2, 9);
			res.send(docs.results);
		})
	})


	//poziv u bazu za prekrsaje
	app.post('/crimesCp', function(req, res){
		var objSelected = req.body.objSelect;
		var radius = req.body.radi;

		radius = Number(radius);
		if(radius < 0)
			radius = radius * (-1);

		dbCrimes.command({
		   geoNear: "crimes" ,
		   near: { type: "Point" , coordinates: [ objSelected.cp_lon, objSelected.cp_lat ]} ,
		   spherical: true,
		   "maxDistance" : 9656.064,
		   "limit" : 8
		}, function(err, docs){
			if(err)
				throw err;
			for(var i=0; i<docs.results.length; i++)
				docs.results[i].id = Math.random().toString(36).substr(2, 9);
			res.send(docs.results);
		})
	})





	//poziv u bazu za skole
	app.post('/schoolAp', function(req, res){
		var objSelected = req.body.objSelect;
		var radius = req.body.radi;
		var niz = [];

		radius = Number(radius);
		if(radius < 0)
			radius = radius * (-1);


		dbSchool.command({
		   geoNear: "schoolDetail" ,
		   near: { type: "Point" , coordinates: [ objSelected.ap_lon, objSelected.ap_lat ]} ,
		   spherical: true,
		   "maxDistance" : 32186.88,
		   "limit" : 6
		}, function(err, docs){
			if(err)
				throw err;
			var niz_length2 = niz.length;
			for(var i=niz_length2; i<docs.results.length + niz_length2; i++){
				var objekat = new Object();

				objekat.name = docs.results[i].obj.name;
				objekat.coordinates = docs.results[i].obj.location.coordinates;
				objekat.address = docs.results[i].obj.address;
				objekat.id = Math.random().toString(36).substr(2, 9);

				niz.push(objekat);
			}
			res.send(niz);
		})
	})


	//poziv u bazu za skole
	app.post('/schoolCp', function(req, res){
		var objSelected = req.body.objSelect;
		var radius = req.body.radi;
		var niz = [];

		radius = Number(radius);
		if(radius < 0)
			radius = radius * (-1);
		dbSchool.command({
		   geoNear: "schoolDetail" ,
		   near: { type: "Point" , coordinates: [ objSelected.cp_lon, objSelected.cp_lat ]} ,
		   spherical: true,
		   "maxDistance" : 32186.88,
		   "limit" : 6
		}, function(err, docs){
			if(err)
				throw err;

			var niz_length = niz.length;
			for(var i=niz_length; i<docs.results.length + niz_length; i++){
				var objekat = new Object();

				objekat.name = docs.results[i].obj.name;
				objekat.coordinates = docs.results[i].obj.location.coordinates;
				objekat.address = docs.results[i].obj.address;
				objekat.id = Math.random().toString(36).substr(2, 9);

				niz.push(objekat);
			}

			res.send(niz);
		})
	})



	//poziv u bazu za adrese
	app.post('/query/', function(req, res){
		var postcode = req.body.postcode;
		var niz_adresa = [];
		var y=0;
		database1.collection("pafAddress").find({"postcode" : postcode}).toArray(function(err, docs){
			if(err)
				throw err;
			if(docs.length == 0){
				res.send(niz_adresa);
				return false;
			}

			for(var i=0; i<docs.length; i++){
				var building = new Object();
				building.addressKey = docs[i].addressKey;
				building.subBuild = docs[i].subBuild;
				building.buildNo =  docs[i].buildNo;
				building.buildName = docs[i].buildName;
				building.street = docs[i].street;
				building.subStreet = docs[i].subStreet;
				niz_adresa.push(building);
				database2.collection("postcodeGeocode").find({"_id" : postcode}).toArray(function(err, data){
						if(err)
							throw err;

						for(var j=0; j<niz_adresa.length; j++){
							niz_adresa[j].cp_lat = data[0].cp_lat;
							niz_adresa[j].cp_lon = data[0].cp_lon;

							var objekat = data[0].dps;
							for(var key in objekat){

								if(!objekat.hasOwnProperty(key)) continue;

									var obj = objekat[key];

									if(obj.add == niz_adresa[j].addressKey){
										y++;
										niz_adresa[j].ap_lat = obj.ap_lat;
										niz_adresa[j].ap_lon = obj.ap_lon;
										break;
									}
							}

						}
						if(i == y/i){
							niz_adresa.sort(function(a, b){
								return a.addressKey - b.addressKey;
							});
							res.send(niz_adresa);
						}


					})
			}

		})

	})
}
