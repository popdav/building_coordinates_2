var map = null;
var blue_circle = null;
var yellow_circle = null;
var bule_marker = null;
var yellow_marker = null;
var school_list = [];
var school_list1 = [], school_list2 = [], school_union = [], school_diff_cp = [], school_diff_ap = [];
var schoolMarkerArrayUnion = [], schoolMarkerArrayApCp = [];

var crime_list = [];
var crime_list1 = [], crime_list2 = [], crime_union = [], crime_diff_ap = [], crime_diff_cp = [];
var crimeMarkerArrayUnion = [], crimeMarkerArrayAp = [], crimeMarkerArrayCp = [];


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

	for(var i=0; i<schoolMarkerArrayUnion.length; i++)
		schoolMarkerArrayUnion[i].setMap(null);

	for(var i=0; schoolMarkerArrayApCp[i]; i++)
		schoolMarkerArrayApCp[i].setMap(null);

	schoolMarkerArrayUnion = [];
	schoolMarkerArrayApCp = [];

}

function select_a_school(school){
	for(var i=0; schoolMarkerArrayUnion[i]; i++){
		if(school.id === schoolMarkerArrayUnion[i].id){
			schoolMarkerArrayUnion[i].setIcon("http://www.192.com/schools/images/schoolPlaceAvailable.png");
		} else {
			schoolMarkerArrayUnion[i].setIcon("http://www.192.com/schools/images/school.png");
		}
	}

	for(var i=0; schoolMarkerArrayApCp[i]; i++){
		if(school.id === schoolMarkerArrayApCp[i].id){
			schoolMarkerArrayApCp[i].setIcon("http://www.192.com/schools/images/schoolPlaceAvailable.png");
		} else {
			schoolMarkerArrayApCp[i].setIcon("http://www.192.com/schools/details/images/school.png?1.b518");
		}
	}
}


function crimeMarkerDelete() {

	for(var i=0; crimeMarkerArrayUnion[i]; i++)
		crimeMarkerArrayUnion[i].setMap(null);

	crimeMarkerArrayUnion = [];

	for(var i=0; crimeMarkerArrayAp[i]; i++)
		crimeMarkerArrayAp[i].setMap(null);

	crimeMarkerArrayAp = [];

	for(var i=0; crimeMarkerArrayCp[i]; i++)
		crimeMarkerArrayCp[i].setMap(null);

	crimeMarkerArrayCp = [];
}


function select_a_crime(crime){
	for(var i=0; crimeMarkerArrayUnion[i]; i++){
		if(crime.id === crimeMarkerArrayUnion[i].id){
			crimeMarkerArrayUnion[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png")
		} else {
			crimeMarkerArrayUnion[i].setIcon("http://maps.google.com/mapfiles/ms/micons/grn-pushpin.png");
		}
	}

	for(var i=0; crimeMarkerArrayAp[i]; i++){
		if(crime.id === crimeMarkerArrayAp[i].id){
			crimeMarkerArrayAp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png")
		} else {
			crimeMarkerArrayAp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png");
		}
	}

	for(var i=0; crimeMarkerArrayCp[i]; i++){
		if(crime.id === crimeMarkerArrayCp[i].id){
			crimeMarkerArrayCp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png")
		} else {
			crimeMarkerArrayCp[i].setIcon("http://maps.google.com/mapfiles/ms/micons/ylw-pushpin.png");
		}
	}
}
