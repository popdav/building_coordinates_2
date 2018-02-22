var queryCtrl = angular.module('queryCtrl', ['geolocation', 'gservice']);

queryCtrl.controller('queryCtrl', function($scope, $http, $rootScope, geolocation, gservice, $window){
	$scope.formData = {};
	$scope.formData.radius = 6000;
	$scope.txt1 = "";
	$scope.txt2 = "";
	$scope.indeks1 = 0;
	$scope.indeks2 = 0;
	$scope.indeks3 = 0;
	$scope.indeks4 = 0;
	$scope.dis = "";
	var queryBody = {};

	var arrPostcode = [];
	var obj = null;


	//upit za adreses
	$scope.queryAddress = function() {

		$scope.indeks1 = 0;
		$scope.indeks2 = 0;
		$scope.indeks3 = 0;
		$scope.indeks4 = 0;
		$scope.indeks5 = 0;
		$scope.indeks6 = 0;

		$scope.address = "";
		if($scope.formData.postcode != null){
			var postcodeCaseInsensitiv = $scope.formData.postcode;
			postcodeCaseInsensitiv = postcodeCaseInsensitiv.toUpperCase();
		}
		var postBody = {
			postcode: postcodeCaseInsensitiv
		}
		if(postBody.postcode != undefined){
			$http.post('/query', postBody)
				.then(function(postResults){
					console.log(postResults.data);
					if(postResults.data.length > 0){
						$scope.txt3 = "";
						$scope.indeks2 = 1;

						for(var i=0; i<postResults.data.length; i++){
							if(postResults.data[i].subBuild)
								postResults.data[i].subBuild = postResults.data[i].subBuild + ",";
							if(postResults.data[i].buildNo)
								postResults.data[i].buildNo = postResults.data[i].buildNo + ",";
							if(postResults.data[i].buildName)
								postResults.data[i].buildName = postResults.data[i].buildName + ",";
							if(postResults.data[i].street && postResults.data[i].subStreet) {
								postResults.data[i].street = postResults.data[i].street + ",";
								if(postResults.data[i].ap_lat == undefined){
									postResults.data[i].subStreet = postResults.data[i].subStreet + " (NO ADDRESS POINT)";

								}
							} else {
								if(postResults.data[i].ap_lat == undefined){
									postResults.data[i].street = postResults.data[i].street + " (NO ADDRESS POINT)";

								}
							}

						}


						$scope.address = postResults.data;
						$scope.school = false;
						$scope.police = false;

					} else {
						$scope.txt3 = "Invalid postcode!";
					}
				})
				.catch(function(err){
					console.log("Err: " + err);
					throw err;
				})
		}
	}

	//funkcija koja poziva funkciju za mape, i odredjuje njene parametre
	$scope.queryBuildings = function() {
		obj = $scope.selected;
		console.log($scope.selected);
		if(obj != null){
				$scope.schoolBoolean();
				$scope.policeBoolean();
				var zoom;
				if($scope.formData.radius <= 500)
					zoom = 16;
				else if($scope.formData.radius > 500 && $scope.formData.radius < 1000)
					zoom = 15;
				else if($scope.formData.radius >= 1000 && $scope.formData.radius < 2000)
					zoom = 14;
				else if($scope.formData.radius >= 2000 && $scope.formData.radius < 5000)
					zoom = 13;
				else if($scope.formData.radius >= 5000 && $scope.formData.radius < 20000)
					zoom = 11;
				else
					zoom = 9;


				CpApMarkerMaker(obj.cp_lat, obj.cp_lon, obj.ap_lat, obj.ap_lon, zoom, $scope.formData.radius)
				if(obj.cp_lat != undefined || obj.cp_lon != undefined){
					$scope.indeks1 = 1;
					$scope.txt1 = "Code point: " + obj.cp_lat + ", " + obj.cp_lon;
				}

				if(obj.ap_lat != undefined || obj.ap_lon != undefined){
					$scope.indeks3 = 1;
					$scope.txt2 = "Address point: " + obj.ap_lat + ", " + obj.ap_lon;
				}
				$scope.txt3 = "";

				$scope.dis = (getDistance({lat: obj.cp_lat, lng: obj.cp_lon}, {lat: obj.ap_lat, lng: obj.ap_lon})).toFixed(3);

		} else {
			$scope.txt3 = "You didn't select!";
		}
	};

	//funkcija za checkbox za skole
	//koja proveraca da li je checkbox tacan ili ne
	$scope.schoolBoolean = function() {
		$scope.indeks4 = 0;
		school_list = [];
		schoolMarkerDelete();
		if($scope.school){
			var schoolBody = {
				objSelect: $scope.selected,
				radi: $scope.formData.radius
			}
			console.log(schoolBody)
			var school_list1 = [], school_list2 = [];
			var tmp = false;
			$http.post('/schoolAp', schoolBody)
				.then(function(docs){
					school_list = school_list.concat(docs.data);
				})
				.then(function(docs){
					$http.post('/schoolCp', schoolBody)
						.then(function(docs){
							school_list = school_list.concat(docs.data);
							deleteDuplicates(school_list);
							console.log(school_list);
							$scope.schoolAddress = school_list;
							$scope.indeks4 = 1;
							schoolMarkerMaker(obj.cp_lat, obj.cp_lon, obj.ap_lat, obj.ap_lon, $scope.formData.radius);
						})
						.catch(function(err){
								console.log("Error " + err);
								throw err;
						})
				})
				.catch(function(err){
						console.log("Error " + err);
						throw err;
				})

		}
	}

	//funkcija za odabir skola
	$scope.schoolSelected = function() {
		var selectedSchoolElement = document.getElementById('mySelect');

		var att = document.createAttribute("selected");
		selectedSchoolElement.setAttributeNode(att);

		var schoolObj = $scope.selectedSchool;




		if(schoolObj != undefined || schoolObj != null){
			select_a_school(schoolObj[0], obj.cp_lat, obj.cp_lon, obj.ap_lat, obj.ap_lon, $scope.formData.radius);
		}
	}


	//funkcija za promenu radiusa
	$scope.radChange = function() {
		if( $scope.selected != null)
			$scope.queryBuildings();
		else
			 $scope.queryAddress();


	}

	function schoolMarkerMaker(cp_lat, cp_long, ap_lat, ap_long, rad) {
		if(school_list != null) {
			for(var i=0; i<school_list.length; i++){
				var cp_sp_dis = getDistance({lat: cp_lat, lng: cp_long}, {lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude});
				var ap_sp_dis = getDistance({lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude}, {lat: ap_lat, lng: ap_long});


				if(cp_sp_dis <= rad || ap_sp_dis <= rad){
					if(cp_sp_dis <= rad && ap_sp_dis <= rad)
							school_icon = "http://www.192.com/schools/images/school.png";
						else
							school_icon = "http://www.192.com/schools/details/images/school.png?1.b518";

					var school_marker = new google.maps.Marker({
					    position: {lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude},
					    map: map,
					    icon: school_icon
				  	});
					school_marker.set("id", school_list[i].id);
					school_marker.addListener('click', function() {
						for(var i=0; i<schoolMarkerArray.length; i++){
							var cp_sp_dis = getDistance({lat: cp_lat, lng: cp_long}, {lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude});
							var ap_sp_dis = getDistance({lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude}, {lat: ap_lat, lng: ap_long});

							if(cp_sp_dis <= rad && ap_sp_dis <= rad)
									schoolMarkerArray[i].setIcon("http://www.192.com/schools/images/school.png");
								else
									schoolMarkerArray[i].setIcon("http://www.192.com/schools/details/images/school.png?1.b518");
						}

						this.setIcon("http://www.192.com/schools/images/schoolPlaceAvailable.png");


						var pos;
						for(var i=0; i<$scope.schoolAddress.length; i++) {
							if(this.id === $scope.schoolAddress[i].id){
								$scope.selectedSchool = [];
								$scope.selectedSchool.push($scope.schoolAddress[i]);
								pos=i;
							}
						}

						var mySelectSch = document.getElementById('mySelect');
						var y=0;
						if(pos >= 10 && pos < 20)
							y = 170;

						mySelectSch.click();
						mySelectSch.scrollTo(0, y);


					});
					schoolMarkerArray.push(school_marker);

				}
			}

		}
	}


	$scope.policeBoolean = function() {
		$scope.indeks6 = 0;
		crimeMarkerDelete()
		if($scope.police){
			var policeBody = {
				objSelect: $scope.selected,
				radi: $scope.formData.radius
			}
			console.log(policeBody)
			$http.post('/crimesAp', policeBody)
				.then(function(docs){
					for(var i=0; i<docs.data.length; i++){
						var string = "Total: " + docs.data[i].obj.total;

						if(docs.data[i].obj.violenceAndSexualOffences)
							string += ", Violence and sexual offences: " + docs.data[i].obj.violenceAndSexualOffences;

						if(docs.data[i].obj.vehicleCrime)
							string += ", Vehicle crime: " + docs.data[i].obj.vehicleCrime;

						if(docs.data[i].obj.antisocialBehaviour)
							string += ", Antisocial behaviour: " + docs.data[i].obj.antisocialBehaviour;

						if(docs.data[i].obj.burglary)
							string += ", Burglary: " + docs.data[i].obj.burglary;

						if(docs.data[i].obj.otherTheft)
							string += ", Other theft: " + docs.data[i].obj.otherTheft;

						if(docs.data[i].obj.shoplifting)
							string += ", Shoplifting: " + docs.data[i].obj.shoplifting;

						if(docs.data[i].obj.possessionOfWeapons)
							string += ", Possession of weapons: " + docs.data[i].obj.possessionOfWeapons;

						if(docs.data[i].obj.otherCrime)
							string += ", Other crime: " + docs.data[i].obj.otherCrime;

						if(docs.data[i].obj.drugs)
							string += ", Drugs: " + docs.data[i].obj.drugs;

						if(docs.data[i].obj.bicycleTheft)
							string += ", Bicycle theft: " + docs.data[i].obj.bicycleTheft;

						if(docs.data[i].obj.publicOrder)
							string += ", Public order: " + docs.data[i].obj.publicOrder;

						if(docs.data[i].obj.theftFromThePerson)
							string += ", Theft from the person: " + docs.data[i].obj.theftFromThePerson;

						if(docs.data[i].obj.robbery)
							string += ", Robbery: " + docs.data[i].obj.robbery;

						if(docs.data[i].obj.criminalDamageAndArson)
							string += ", Criminal damage and arson: " + docs.data[i].obj.criminalDamageAndArson;

						if(docs.data[i].obj.violentCrime)
							string += ", Violent crime: " + docs.data[i].obj.violentCrime;

						if(docs.data[i].obj.publicDisorderAndWeapons)
							string += ", Public disorder and weapons: " + docs.data[i].obj.publicDisorderAndWeapons;


						docs.data[i].string = string;
					}
					console.log(docs.data);
					crime_list = crime_list.concat(docs.data);
					/*$scope.policeAddress = docs.data;
					$scope.indeks6 = 1;
					crime_list = docs.data;
					crimeMarkerMaker();*/
				})
				.then(function(docs){
					$http.post('/crimesCp', policeBody)
						.then(function(docs){
							for(var i=0; i<docs.data.length; i++){
								var string = "Total: " + docs.data[i].obj.total;

								if(docs.data[i].obj.violenceAndSexualOffences)
									string += ", Violence and sexual offences: " + docs.data[i].obj.violenceAndSexualOffences;

								if(docs.data[i].obj.vehicleCrime)
									string += ", Vehicle crime: " + docs.data[i].obj.vehicleCrime;

								if(docs.data[i].obj.antisocialBehaviour)
									string += ", Antisocial behaviour: " + docs.data[i].obj.antisocialBehaviour;

								if(docs.data[i].obj.burglary)
									string += ", Burglary: " + docs.data[i].obj.burglary;

								if(docs.data[i].obj.otherTheft)
									string += ", Other theft: " + docs.data[i].obj.otherTheft;

								if(docs.data[i].obj.shoplifting)
									string += ", Shoplifting: " + docs.data[i].obj.shoplifting;

								if(docs.data[i].obj.possessionOfWeapons)
									string += ", Possession of weapons: " + docs.data[i].obj.possessionOfWeapons;

								if(docs.data[i].obj.otherCrime)
									string += ", Other crime: " + docs.data[i].obj.otherCrime;

								if(docs.data[i].obj.drugs)
									string += ", Drugs: " + docs.data[i].obj.drugs;

								if(docs.data[i].obj.bicycleTheft)
									string += ", Bicycle theft: " + docs.data[i].obj.bicycleTheft;

								if(docs.data[i].obj.publicOrder)
									string += ", Public order: " + docs.data[i].obj.publicOrder;

								if(docs.data[i].obj.theftFromThePerson)
									string += ", Theft from the person: " + docs.data[i].obj.theftFromThePerson;

								if(docs.data[i].obj.robbery)
									string += ", Robbery: " + docs.data[i].obj.robbery;

								if(docs.data[i].obj.criminalDamageAndArson)
									string += ", Criminal damage and arson: " + docs.data[i].obj.criminalDamageAndArson;

								if(docs.data[i].obj.violentCrime)
									string += ", Violent crime: " + docs.data[i].obj.violentCrime;

								if(docs.data[i].obj.publicDisorderAndWeapons)
									string += ", Public disorder and weapons: " + docs.data[i].obj.publicDisorderAndWeapons;


								docs.data[i].string = string;
							}
							console.log(docs.data);

							$scope.indeks6 = 1;
							crime_list = crime_list.concat(docs.data);
							$scope.policeAddress = crime_list;
							deleteDuplicatesCrimes(crime_list);
							console.log(crime_list);
							crimeMarkerMaker(obj.cp_lat, obj.cp_lon, obj.ap_lat, obj.ap_lon, $scope.formData.radius);
						})
						.catch(function(err){
								console.log("Error " + err);
								throw err;
						})
				})
				.catch(function(err){
						console.log("Error " + err);
						throw err;
				})
		}
	}


	function crimeMarkerMaker(cp_lat, cp_long, ap_lat, ap_long, rad) {
		if(crime_list != null) {
			for(var i=0; i<crime_list.length; i++){
				/*var cp_sp_dis = getDistance({lat: cp_lat, lng: cp_long}, {lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude});
				var ap_sp_dis = getDistance({lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude}, {lat: ap_lat, lng: ap_long});*/
				var cp_c = getDistance({lat: cp_lat, lng: cp_long}, {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x})
				var ap_c = getDistance({lat: ap_lat, lng: ap_long}, {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x})

				var crime_icon;
				if(cp_c <= rad && ap_c <= rad){

					crime_icon = "http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png";
				}
				else if(cp_c <= rad && ap_c > rad)
					crime_icon = "http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png";
				else if(cp_c > rad && ap_c <= rad)
					crime_icon = "http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png";

				var crime_marker = new google.maps.Marker({
				    position: {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x},
				    map: map,
				    icon: crime_icon
			  	});
				crime_marker.set("id", crime_list[i].id);
				crime_marker.addListener('click', function() {
					for(var i=0; i<crimeMarkerArray.length; i++){

						var cp_c = getDistance({lat: cp_lat, lng: cp_long}, {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x})
						var ap_c = getDistance({lat: ap_lat, lng: ap_long}, {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x})

						if(cp_c <= rad && ap_c <= rad){

							crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png");
						}
						else if(cp_c <= rad && ap_c > rad)
							crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png");
						else if(cp_c > rad && ap_c <= rad)
							crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png");


						//crimeMarkerArray[i].setIcon(crime_icon);
					}

					this.setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png");


					for(var i=0; i<$scope.policeAddress.length; i++) {
							if(this.id === $scope.policeAddress[i].id){
								$scope.selectedCrime = [];
								$scope.selectedCrime.push($scope.policeAddress[i]);
							}
						}


					var mySelectCri = document.getElementById('myPolice');
					var att = document.createAttribute("selected");
					mySelectCri.setAttributeNode(att);

					mySelectCri.click();



				});
				crimeMarkerArray.push(crime_marker);


			}

		}
	}

	//funkcija za odabir prekrsaja
	$scope.crimeSelected = function() {
		var selectedCrimeElement = document.getElementById('myPolice');

		var att = document.createAttribute("selected");
		selectedCrimeElement.setAttributeNode(att);

		var crimeObj = $scope.selectedCrime;




		if(crimeObj != undefined || crimeObj != null){
			select_a_crime(crimeObj[0], obj.cp_lat, obj.cp_lon, obj.ap_lat, obj.ap_lon, $scope.formData.radius);
		}
	}


});


function deleteDuplicates(niz){
	var a;
	for(var i=0; niz[i]; i++){
		a = niz[i];
		for(var j=i+1; niz[j]; j++){
			if(a.name === niz[j].name){

				niz.splice(j, 1);
				j--;
			}
		}
	}
}

function deleteDuplicatesCrimes(niz){
	var a;
	for(var i=0; niz[i]; i++){
		a = niz[i];
		for(var j=i+1; niz[j]; j++){
			if(a.obj.location.x === niz[j].obj.location.x && a.obj.location.y === niz[j].obj.location.y){

				niz.splice(j, 1);
				j--;
			}
		}
	}
}
