var map = null;
var blue_circle = null;
var yellow_circle = null;
var bule_marker = null;
var yellow_marker = null;
var school_list = [];
var schoolMarkerArray = [];

var crime_list = [];
var crimeMarkerArray = [];


angular.module('gservice', [])
	.factory('gservice', function($rootScope, $http){

	var googleMapService = {};

	googleMapService.refresh = function(){

		initialize();
	}

	function initialize(){

		var mapProp = {
			zoom: 12,
			center: {lat: 51.504627, lng: -0.121729}
		};
		map = new google.maps.Map(document.getElementById('map'), mapProp);
	}

	google.maps.event.addDomListener(window, 'load', googleMapService.refresh());
	return googleMapService;
})


function CpApMarkerMaker(cp_lat, cp_long, ap_lat, ap_long, zoom, rad){
	map.setZoom(zoom);

	var mapCenter;
	if(ap_lat != undefined || ap_long != undefined){
		mapCenter = {lat:(cp_lat + ap_lat)/2, lng: (cp_long + ap_long)/2};
	} else {
		mapCenter = {lat: cp_lat, lng: cp_long};
	}
	map.setCenter(mapCenter);

	if(blue_circle != null)
		blue_circle.setMap(null);
	if(yellow_circle != null)
		yellow_circle.setMap(null);
	if(bule_marker != null)
		bule_marker.setMap(null);
	if(yellow_marker != null)
		yellow_marker.setMap(null);

	blue_circle = new google.maps.Circle({
            strokeColor: '#0000FF',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#0000FF',
            fillOpacity: 0.35,
            map: map,
            center: {lat: ap_lat, lng: ap_long},
            radius: rad*1
          });

	yellow_circle = new google.maps.Circle({
            strokeColor: '#FFFF00',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FFFF00',
            fillOpacity: 0.35,
            map: map,
            center: {lat: cp_lat, lng: cp_long},
            radius: rad*1
          });

		if(ap_lat  || ap_long ){
			bule_marker = new google.maps.Marker({
			    position: {lat: ap_lat, lng: ap_long},
			    map: map,
			    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
			  });
		}
		//marker za cp
		if(cp_lat || cp_long){
			yellow_marker = new google.maps.Marker({
			    position: {lat: cp_lat, lng: cp_long},
			    map: map,
			    icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
			  });
		}
}

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lng - p1.lng);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};




function schoolMarkerDelete() {
	if(schoolMarkerArray != null){
		for(var i=0; i<schoolMarkerArray.length; i++)
			schoolMarkerArray[i].setMap(null);

		schoolMarkerArray = [];
	}
}

function select_a_school(school, cp_lat, cp_long, ap_lat, ap_long, rad){
	for(var i=0; i<school_list.length; i++){
		//console.log("school_list: " + school_list[i].id + " schoolMarkerArray: " + schoolMarkerArray[i].id);
		if(school_list[i].id == schoolMarkerArray[i].id){
			var cp_sp_dis = getDistance({lat: cp_lat, lng: cp_long}, {lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude});
			var ap_sp_dis = getDistance({lat: school_list[i].coordinates.latitude, lng: school_list[i].coordinates.longitude}, {lat: ap_lat, lng: ap_long});

			if(cp_sp_dis <= rad && ap_sp_dis <= rad)
					schoolMarkerArray[i].setIcon("http://www.192.com/schools/images/school.png");
				else
					schoolMarkerArray[i].setIcon("http://www.192.com/schools/details/images/school.png?1.b518");


			if(school.id == schoolMarkerArray[i].id)
				schoolMarkerArray[i].setIcon("http://www.192.com/schools/images/schoolPlaceAvailable.png");

		}
		//map.setCenter({lat: school.coordinates.latitude, lng: school.coordinates.longitude})
	}
}


function crimeMarkerDelete() {
	if(crimeMarkerArray != null){
		for(var i=0; i<crimeMarkerArray.length; i++)
			crimeMarkerArray[i].setMap(null);

		crimeMarkerArray = [];
	}
}


function select_a_crime(crime, cp_lat, cp_long, ap_lat, ap_long, rad){
	for(var i=0; i<crime_list.length; i++){
		if(crime_list[i].id == crimeMarkerArray[i].id){
			var cp_c = getDistance({lat: cp_lat, lng: cp_long}, {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x})
			var ap_c = getDistance({lat: ap_lat, lng: ap_long}, {lat: crime_list[i].obj.location.y, lng: crime_list[i].obj.location.x})

			if(cp_c <= rad && ap_c <= rad){

				crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png");
			}
			else if(cp_c <= rad && ap_c > rad)
				crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png");
			else if(cp_c > rad && ap_c <= rad)
				crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png");


			if(crime.id == crimeMarkerArray[i].id)
				crimeMarkerArray[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png");

		}
	}
}
