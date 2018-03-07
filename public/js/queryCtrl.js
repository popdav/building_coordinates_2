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


			$http.post('/schoolAp', schoolBody)
				.then(function(docs){
					school_list1 = docs.data;
				})
				.then(function(docs){
					$http.post('/schoolCp', schoolBody)
						.then(function(docs){
							school_list2 = docs.data;
							diffAndUniSchool();
							$scope.schoolAddress = school_list;
							$scope.indeks4 = 1;
							schoolMarkerMaker();
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
			select_a_school(schoolObj[0]);
		}
	}


	//funkcija za promenu radiusa
	$scope.radChange = function() {
		if( $scope.selected != null)
			$scope.queryBuildings();
		else
			 $scope.queryAddress();


	}

	function schoolMarkerMaker() {
		for(var i=0; school_union[i]; i++){
			var school_marker = new google.maps.Marker({
			    position: {lat: school_union[i].coordinates.latitude, lng: school_union[i].coordinates.longitude},
			    map: map,
			    icon: "http://www.192.com/schools/images/school.png"
		  	});
			school_marker.set("id", school_union[i].id);
			school_marker.addListener('click', function(){
				for(var i=0; schoolMarkerArrayUnion[i]; i++)
					schoolMarkerArrayUnion[i].setIcon("http://www.192.com/schools/images/school.png");
				for(var i=0; schoolMarkerArrayApCp[i]; i++)
					schoolMarkerArrayApCp[i].setIcon("http://www.192.com/schools/details/images/school.png?1.b518");

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
			})
			schoolMarkerArrayUnion.push(school_marker);
		}

		for(var i=0; school_diff_ap[i]; i++){
			var school_marker = new google.maps.Marker({
			    position: {lat: school_diff_ap[i].coordinates.latitude, lng: school_diff_ap[i].coordinates.longitude},
			    map: map,
			    icon: "http://www.192.com/schools/details/images/school.png?1.b518"
		  	});
			school_marker.set("id", school_diff_ap[i].id);
			school_marker.addListener('click', function(){
				for(var i=0; schoolMarkerArrayUnion[i]; i++)
					schoolMarkerArrayUnion[i].setIcon("http://www.192.com/schools/images/school.png");
				for(var i=0; schoolMarkerArrayApCp[i]; i++)
					schoolMarkerArrayApCp[i].setIcon("http://www.192.com/schools/details/images/school.png?1.b518");

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
			})
			schoolMarkerArrayApCp.push(school_marker);
		}

		for(var i=0; school_diff_cp[i]; i++){
			var school_marker = new google.maps.Marker({
			    position: {lat: school_diff_cp[i].coordinates.latitude, lng: school_diff_cp[i].coordinates.longitude},
			    map: map,
			    icon: "http://www.192.com/schools/details/images/school.png?1.b518"
		  	});
			school_marker.set("id", school_diff_cp[i].id);
			school_marker.addListener('click', function(){
				for(var i=0; schoolMarkerArrayUnion[i]; i++)
					schoolMarkerArrayUnion[i].setIcon("http://www.192.com/schools/images/school.png");
				for(var i=0; schoolMarkerArrayApCp[i]; i++)
					schoolMarkerArrayApCp[i].setIcon("http://www.192.com/schools/details/images/school.png?1.b518");

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
			})
			schoolMarkerArrayApCp.push(school_marker);
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
					crime_list1 = docs.data;
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
							crime_list2 = docs.data;
							diffAndUniCrime();
							$scope.indeks6 = 1;
							$scope.policeAddress = crime_list;
							crimeMarkerMaker();
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


	function crimeMarkerMaker() {
		for(var i=0; crime_union[i]; i++){
			var crime_marker = new google.maps.Marker({
				    position: {lat: crime_union[i].obj.location.y, lng: crime_union[i].obj.location.x},
				    map: map,
				    icon: "http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png"
			  	});
				crime_marker.set("id", crime_union[i].id);
				crime_marker.addListener('click', function(){
					for(var i=0; crimeMarkerArrayUnion[i]; i++)
						crimeMarkerArrayUnion[i].setIcon("http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png");
					for(var i=0; crimeMarkerArrayAp[i]; i++)
						crimeMarkerArrayAp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png");
					for(var i=0; crimeMarkerArrayCp[i]; i++)
						crimeMarkerArrayCp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png");

					this.setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png");

					var pos;
					for(var i=0; i<$scope.policeAddress.length; i++) {
						if(this.id === $scope.policeAddress[i].id){
							$scope.selectedCrime = [];
							$scope.selectedCrime.push($scope.policeAddress[i]);
							pos = i;
						}
					}

					var y=0;
					if(pos >= 10 && pos < 20)
						y = 170;

					var mySelectCri = document.getElementById('myPolice');
					var att = document.createAttribute("selected");
					mySelectCri.setAttributeNode(att);

					mySelectCri.click();
					mySelectCri.scrollTo(0, y);
				})
				crimeMarkerArrayUnion.push(crime_marker);
		}

		for(var i=0; crime_diff_ap[i]; i++){
			var crime_marker = new google.maps.Marker({
				    position: {lat: crime_diff_ap[i].obj.location.y, lng: crime_diff_ap[i].obj.location.x},
				    map: map,
				    icon: "http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png"
			  	});
				crime_marker.set("id", crime_diff_ap[i].id);
				crime_marker.addListener('click', function(){
					for(var i=0; crimeMarkerArrayUnion[i]; i++)
						crimeMarkerArrayUnion[i].setIcon("http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png");
					for(var i=0; crimeMarkerArrayAp[i]; i++)
						crimeMarkerArrayAp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png");
					for(var i=0; crimeMarkerArrayCp[i]; i++)
						crimeMarkerArrayCp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png");

					this.setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png");

					var pos;
					for(var i=0; i<$scope.policeAddress.length; i++) {
						if(this.id === $scope.policeAddress[i].id){
							$scope.selectedCrime = [];
							$scope.selectedCrime.push($scope.policeAddress[i]);
							pos = i;
						}
					}

					var y=0;
					if(pos >= 10 && pos < 20)
						y = 170;

					var mySelectCri = document.getElementById('myPolice');
					var att = document.createAttribute("selected");
					mySelectCri.setAttributeNode(att);

					mySelectCri.click();
					mySelectCri.scrollTo(0, y);
				})
				crimeMarkerArrayAp.push(crime_marker);
		}

		for(var i=0; crime_diff_cp[i]; i++){
			var crime_marker = new google.maps.Marker({
				    position: {lat: crime_diff_cp[i].obj.location.y, lng: crime_diff_cp[i].obj.location.x},
				    map: map,
				    icon: "http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png"
			  	});
				crime_marker.set("id", crime_diff_cp[i].id);
				crime_marker.addListener('click', function(){
					for(var i=0; crimeMarkerArrayUnion[i]; i++)
						crimeMarkerArrayUnion[i].setIcon("http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png");
					for(var i=0; crimeMarkerArrayAp[i]; i++)
						crimeMarkerArrayAp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png");
					for(var i=0; crimeMarkerArrayCp[i]; i++)
						crimeMarkerArrayCp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png");

					this.setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png");

					var pos;
					for(var i=0; i<$scope.policeAddress.length; i++) {
						if(this.id === $scope.policeAddress[i].id){
							$scope.selectedCrime = [];
							$scope.selectedCrime.push($scope.policeAddress[i]);
							pos = i;
						}
					}

					var y=0;
					if(pos >= 10 && pos < 20)
						y = 170;

					var mySelectCri = document.getElementById('myPolice');
					var att = document.createAttribute("selected");
					mySelectCri.setAttributeNode(att);

					mySelectCri.click();
					mySelectCri.scrollTo(0, y);
				})
				crimeMarkerArrayCp.push(crime_marker);
		}

	}

	//funkcija za odabir prekrsaja
	$scope.crimeSelected = function() {
		var selectedCrimeElement = document.getElementById('myPolice');

		var att = document.createAttribute("selected");
		selectedCrimeElement.setAttributeNode(att);

		var crimeObj = $scope.selectedCrime;




		if(crimeObj != undefined || crimeObj != null){
			select_a_crime(crimeObj[0]);
		}
	}


});

function diffAndUniSchool(){
	school_union = [];
	school_diff_ap = [];
	school_diff_cp = [];
	school_list = [];

	for(var i=0; school_list1[i]; i++){
		for(var j=0; school_list2[j]; j++){
			if(school_list1[i].name === school_list2[j].name){
				school_union.push(school_list1[i]);
			}
		}
	}
	deleteDuplicates(school_union);

	var is_in = false;
	for(var i=0; school_list1[i]; i++){
		is_in = false;
		for(var j=0; school_list2[j]; j++){
			if(school_list1[i].name === school_list2[j].name){
				is_in = true;
			}
		}
		if(!is_in)
			school_diff_ap.push(school_list1[i]);
	}

	for(var i=0; school_list2[i]; i++){
		is_in = false;
		for(var j=0; school_list1[j]; j++){
			if(school_list1[j].name === school_list2[i].name){
				is_in = true;
			}
		}
		if(!is_in)
			school_diff_cp.push(school_list2[i]);
	}

	school_list = school_list.concat(school_union);
	school_list = school_list.concat(school_diff_ap);
	school_list = school_list.concat(school_diff_cp);
	console.log(school_list);

}

function diffAndUniCrime(){
	crime_list = [];
	crime_union = [];
	crime_diff_ap = [];
	crime_diff_cp = [];

	for(var i=0; crime_list1[i]; i++){
		for(var j=0; crime_list2[j]; j++){
			if(crime_list1[i].obj.location.x === crime_list2[j].obj.location.x
				&& crime_list1[i].obj.location.y === crime_list2[j].obj.location.y){
					crime_union.push(crime_list1[i]);
				}
		}
	}

	deleteDuplicatesCrimes(crime_union);

	var is_in = false;
	for(var i=0; crime_list1[i]; i++){
		is_in = false;
		for(var j=0; crime_list2[j]; j++){
			if(crime_list1[i].obj.location.x === crime_list2[j].obj.location.x
				&& crime_list1[i].obj.location.y === crime_list2[j].obj.location.y){
					is_in = true;
				}
		}
		if(!is_in)
			crime_diff_ap.push(crime_list1[i]);
	}


	for(var i=0; crime_list2[i]; i++){
		is_in = false;
		for(var j=0; crime_list1[j]; j++){
			if(crime_list1[j].obj.location.x === crime_list2[i].obj.location.x
				&& crime_list1[j].obj.location.y === crime_list2[i].obj.location.y){
					is_in = true;
				}
		}
		if(!is_in)
			crime_diff_cp.push(crime_list2[i]);
	}
	crime_list = crime_list.concat(crime_union);
	crime_list = crime_list.concat(crime_diff_ap);
	crime_list = crime_list.concat(crime_diff_cp);
	console.log(crime_list);
}

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
