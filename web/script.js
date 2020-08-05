

var url = "api/geolocate";

var preloaderFadeOutTime = 500;
function showPreloader() {
	var preloader = $('.sk-cube-wrapper');
	preloader.fadeIn(preloaderFadeOutTime);
}

function hidePreloader() {
	var preloader = $('.sk-cube-wrapper');
	preloader.fadeOut(preloaderFadeOutTime);
}

var map = L.map('map').fitWorld();
L.control.zoom({
	position: 'bottomright'
}).addTo(map);

var mapItems = [];

function clearMapItems() {
	while(mapItems.length) {
		var item = mapItems.pop();
		map.removeLayer(item);
	};
}


// ERROR handling:
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

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=sk.eyJ1IjoiYW5uZTAyNTUwIiwiYSI6ImNrY2oxeW94NTE5cWUydWxwenV2dHN1cGUifQ.W3bizGsISmL3lVacVw8Wlg', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1
}).addTo(map);

// PIN icon:
var pinIcon = L.icon({
    iconUrl: 'img/pin.png',
    iconSize:     [60, 60], // size of the icon
    iconAnchor:   [30, 60], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var sidebar = L.control.sidebar('sidebar', {
	closeButton: true,
	position: 'left'
});

map.addControl(sidebar);

// ALL side bar information display :
var onApiSuccess = (result, countryView, showCircle) => {
	// stop loader here
	hidePreloader();

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
	$("#flag").attr('src', `http://www.geognos.com/api/en/countries/flag/${result.iso_code_2}.png`)
	$("#latitude").text(result.capital_lat);
	$("#longitude").text(result.capital_long);
	$("#speed-in").text(result.drive_speed_in);
	$("#drive-on").text(result.drive_on);
	$("#currency-symbol").text(result.currency_symbol);
	$("#currency-code").text(result.currency_code);
	$("#continent").text(result.continent  );
	$("#subregion").text(result.subregion );
	var languages = result.languages.map(l => l.name).join(", ");
	$("#languages").text(languages);

//  wikipedia display
	var wikiDisplay = $("#wiki");
	if(result.wiki_link) {
		wikiDisplay.attr("href", result.wiki_link);
		wikiDisplay.show();
	}
	else {
		wikiDisplay.hide();
	}


	// Weather forecast display:
	var forecast = result.daily_forecast;
	$("#forecast").text(JSON.stringify(forecast.map(f => {
		var date = new Date(f.dt * 1000);
		return {
			description: f.weather[0].description,
			date: `${date.getDay()} ${date.getMonth()} ${date.getYear()}`
		};
	})));

	// MAP - outline country - circle location - logic:
	map.setView([result.lat, result.long], 13);

	
	if(countryView) {
		var marker = L.marker([result.capital_lat, result.capital_long], {icon: pinIcon});
		marker.addTo(map);
		mapItems.push(marker);

		sidebar.show();
		var polygon = L.polygon(result.borders, {color: 'green', weight: 10, opacity: .7, dashArray: '20,15', lineJoin: 'round'}); 
		polygon.addTo(map);
		mapItems.push(polygon);
	
		map.fitBounds(polygon.getBounds());
	}
	else{
		var marker = L.marker([result.lat, result.long], {icon: pinIcon});
		marker.addTo(map);
		mapItems.push(marker);
	}

	if(showCircle) {
		var circle = L.circle([result.lat, result.long], {radius: 4000}).addTo(map);
		mapItems.push(circle);
	}
};

function closeSideBar() {
    sidebar.hide()
};


function getLocationInfo(data, countryView, showCircle) {
	showPreloader();
	clearMapItems();
	$.ajax({
		url, 
		success: (result) => onApiSuccess(result, countryView, showCircle),
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
			getLocationInfo({long: long, lat: lat}, false, true)
		});

		$("#address").on('change', function(e){
			var address = $("#address").val();
			getLocationInfo({ address: address}, true, false)
		});
});
