
var url = "api/geolocate";

var map = L.map('map', {scrollWheelZoom: false}).fitWorld();
L.control.zoom({
	position: 'bottomright'
}).addTo(map);

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

var sidebar = L.control.sidebar('sidebar', {
	closeButton: true,
	position: 'left'
});
map.addControl(sidebar);

var onApiSuccess = (result) => {
	if(result.error) {
		alert(result.error);
		return;
	}

	$("#country").text(result.country);
	$("#population").text(result.population.toLocaleString());
	$("#capital").text(result.capital);
	$("#weather").text(result.weather);
	$("#currency").text(result.currency);
	$("#flag").text(result.flag);
	var exchangeRateConvert = (1/result.exchange_rate).toPrecision(3);
	$("#exchange_rate").text(exchangeRateConvert);
/*  function renderGeoname(geoname) {
	var flagElem = document.getElementById('flag');
	var countryNameElem = document.getElementById('countryName');
	var continentNameElem = document.getElementById('continent');
	var capitalNameElem = document.getElementById('capital');
	var exchangeRateElem = document.getElementById('exchangeRate');
	var currencyElem = document.getElementById('currency');
	var populationElem = document.getElementById('population');
	var wikiLink = document.getElementById('wikiLink');
	
	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	
	flagElem.src = `http://www.geognos.com/api/en/countries/flag/${geoname.countryCode}.png`;
	countryNameElem.innerHTML = geoname.countryName;
	continentNameElem.innerHTML = geoname.continentName;
	capitalNameElem.innerHTML = geoname.capital;
	currencyElem.innerHTML = geoname.currencyCode;
	populationElem.innerHTML = numberWithCommas(geoname.population);
	exchangeRateElem.innerHTML = rates.rates[geoname.currencyCode] + ' to 1 USD';
	wikiLink.href = `https://en.wikipedia.org/wiki/${geoname.countryName}`;

}
*/

    // MAP:

	function onLocationFound(e) {
		var radius = e.accuracy / 2;

		var marker = L.marker(e.latlng, {icon: pinIcon});
		L.circle(e.latlng, radius).addTo(map);
	}

	function onLocationError(e) {
		alert(e.message);
	}

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
	map.setView([result.lat, result.long], 13);
	var marker = L.marker([result.lat, result.long], {icon: pinIcon});
	marker.addTo(map);

	sidebar.show();
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

		$("#address").on('change', function(e){
			var address = $("#address").val();
			getLocationInfo({ address: address})
		});
});
