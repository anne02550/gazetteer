
// var mymap = L.map('map').setView([51.505, -0.09], 13);
// L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=sk.eyJ1IjoiYW5uZTAyNTUwIiwiYSI6ImNrY2oxeW94NTE5cWUydWxwenV2dHN1cGUifQ.W3bizGsISmL3lVacVw8Wlg', {
//     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
//     maxZoom: 18,
//     id: 'mapbox/streets-v11',
//     tileSize: 512,
//     zoomOffset: -1,
//     accessToken: 'your.mapbox.access.token'
// }).addTo(mymap);

function getLocationInfo(long, lat) {
	var url = "api/geolocate";

	var success = (result) => {
		$("#country").val(result.country);
		$("#population").val(result.population.toLocaleString());
		$("#capital").val(result.capital);
		$("#weather").val(result.weather);
		$("#currency").val(result.currency);
		$("#flag").val(result.flag);
		var exchangeRateConvert = (1/result.exchange_rate).toPrecision(3);
		$("#exchange_rate").val(exchangeRateConvert);
	};

	$.ajax({
		url, 
		success,
		error: (err) => alert(JSON.stringify(err)),
		type : "POST",
		dataType: "json",
		data: {long: long, lat: lat },
	});

	if (location.protocol !== 'https:') {
		return;
	}

	var map = L.map('map').fitWorld().setView([long, lat], 13);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=sk.eyJ1IjoiYW5uZTAyNTUwIiwiYSI6ImNrY2oxeW94NTE5cWUydWxwenV2dHN1cGUifQ.W3bizGsISmL3lVacVw8Wlg', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(map);

	function onLocationFound(e) {
		var radius = e.accuracy / 2;

		L.marker(e.latlng).addTo(map)
			.bindPopup("You are within " + radius + " meters from this point").openPopup();

		L.circle(e.latlng, radius).addTo(map);
	}

	function onLocationError(e) {
		alert(e.message);
	}

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);

	map.locate({setView: true, maxZoom: 16});
}

$(document).ready(function(){	
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(pos => getLocationInfo(pos.coords.longitude, pos.coords.latitude));
	}
});
