
var url = "api/geolocate";

var map = L.map('map').fitWorld();

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=sk.eyJ1IjoiYW5uZTAyNTUwIiwiYSI6ImNrY2oxeW94NTE5cWUydWxwenV2dHN1cGUifQ.W3bizGsISmL3lVacVw8Wlg', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1
}).addTo(map);

var pinIcon = L.icon({
    iconUrl: 'img/pin.png',
    iconSize:     [95, 95], // size of the icon
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var onApiSuccess = (result) => {
	if(result.error) {
		alert(result.error);
		return;
	}

	$("#country").val(result.country);
	$("#population").val(result.population.toLocaleString());
	$("#capital").val(result.capital);
	$("#weather").val(result.weather);
	$("#currency").val(result.currency);
	$("#flag").val(result.flag);
	var exchangeRateConvert = (1/result.exchange_rate).toPrecision(3);
	$("#exchange_rate").val(exchangeRateConvert);

    // MAP:

	function onLocationFound(e) {
		var radius = e.accuracy / 2;

		L.marker(e.latlng, {icon: pinIcon}).addTo(map);
		L.circle(e.latlng, radius).addTo(map);
	}

	function onLocationError(e) {
		alert(e.message);
	}

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
	map.setView([result.lat, result.long], 13);
	L.marker([result.lat, result.long], {icon: pinIcon}).addTo(map);
};

function getLocationInfo(data) {
	$.ajax({
		url, 
		success: onApiSuccess,
		error: (err) => alert(JSON.stringify(err)),
		type : "POST",
		dataType: "json",
		data: data,
	});
}

//Find location button logic:
$(document).ready(
	function(){
		navigator.geolocation.getCurrentPosition(function(pos) {
			var long = pos.coords.longitude;
			var lat = pos.coords.latitude;
			getLocationInfo({long: long, lat: lat})
		});

		$("#address").click(function(e){
			e.preventDefault();
			var address = $("#find-address").val();
			getLocationInfo({ address: address})
		})
});
