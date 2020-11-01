<?php

require('../vendor/autoload.php');

use GeoNames\Client as GeoNamesClient;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ParameterBag;

$app = new Silex\Application();
$app['debug'] = true;

function call_json_api($url) {
  $curl = curl_init();
  $options = [
    CURLOPT_TIMEOUT => 5000,
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => 1
  ];
  curl_setopt_array($curl, $options);
  $output = curl_exec($curl);

  return json_decode($output);
}

// check if wiki link exist:
function check_wiki_page_exists($url) {
  $curl = curl_init();
  $options = [
    CURLOPT_TIMEOUT => 5000,
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => 1
  ];
  curl_setopt_array($curl, $options);
  $output = curl_exec($curl);

  $httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

  return $httpcode !== 404;
}

// Accept JSON bodies
$app->before(function (Request $request) {
    if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
        $data = json_decode($request->getContent(), true);
        $request->request->replace(is_array($data) ? $data : array());
    }
});

// Register the monolog logging service
$app->register(new Silex\Provider\MonologServiceProvider(), array(
  'monolog.logfile' => 'php://stderr',
));

// Register view rendering
$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
));

// Our web handlers
$app->get('/', function() use($app) {
  $countriesJson = file_get_contents("countries.json");
  $countries = json_decode($countriesJson, true);

  $app['monolog']->addDebug('logging output.');
  return $app['twig']->render('index.twig', [
    'countries' => $countries
  ]);
});

//my api:
$app->post('/api/geolocate', function(Request $request) use($app) {
  $result = new \stdClass();

  // get stuff from the request body
  $long = $request->request->get('long');
  $lat = $request->request->get('lat');
  $address = $request->request->get('address');

  // Call the open cage api
  $openCageClient = new \OpenCage\Geocoder\Geocoder('8c3273825ce1420990383af1c274fa14');
  $openCageQuery = $lat . ',' . $long;
  $search_type = "long-lat";

  if ($long === null || $lat === null) {
    $openCageQuery = $address;
    $search_type = "address";
  }

  $geo_result = $openCageClient->geocode($openCageQuery);
  
  if(count($geo_result['results']) === 0) { 
    $result->error = 'Sorry, that location could not be found. Please try again.';
    return json_encode($result);
  }

  // Call for Sidebar information:
  $currency_code = $geo_result['results'][0]['annotations']['currency']['iso_code'];
  $iso_code = $geo_result['results'][0]['components']['ISO_3166-1_alpha-3'];
  $country_code = $geo_result['results'][0]['components']['country_code'];
  $country_name = $geo_result['results'][0]['components']['country'];

  $result->currency_code = $currency_code;
  $result->country_code = $country_code;
  $result->country = $country_name;

  $result->currency = $geo_result['results'][0]['annotations']['currency']['name'];
  $result->currency_iso_code = $geo_result['results'][0]['annotations']['currency']['iso_code'];
  $result->drive_on = $geo_result['results'][0]['annotations']['roadinfo']['drive_on'];
  $result->drive_speed_in = $geo_result['results'][0]['annotations']['roadinfo']['speed_in'];
  $result->flag = $geo_result['results'][0]['annotations']['flag'];
  $result->iso_code_2 = $geo_result['results'][0]['components']['ISO_3166-1_alpha-2'];
  $result->continent = $geo_result['results'][0]['components']['continent'];

  if($long === null || $lat === null)
  {
    $long = $geo_result['results'][0]['geometry']['lng'];
    $lat = $geo_result['results'][0]['geometry']['lat'];
  }

  $result->long = $long;
  $result->lat = $lat;

  // start to call rest countries:
  $rest_countries_url = "https://restcountries.eu/rest/v2/alpha/" . $iso_code;
  $restCountryOutput = call_json_api($rest_countries_url);
  
  $result -> region = $restCountryOutput -> region;
  $result -> subregion = $restCountryOutput -> subregion;
  $result -> languages = $restCountryOutput -> languages;
  $result -> currency_symbol = $restCountryOutput -> currencies[0]->symbol;

  // Call to geonames
  $geonames_url = "http://api.geonames.org/countryInfoJSON?formatted=true&lang=eng&country=" . $country_code . "&username=annepham&style=full";
  $geonames = call_json_api($geonames_url) -> geonames[0];

  $capital = $geonames -> capital;

  $result -> capital = $capital;
  $result -> population = $geonames -> population;

  // get capital long lat
  $capital_result = $openCageClient->geocode($capital);
  $capital_long = $capital_result['results'][0]['geometry']['lng'];
  $capital_lat = $capital_result['results'][0]['geometry']['lat'];

  $result->capital_long = $capital_long;
  $result->capital_lat = $capital_lat;

  // start to call API weather:
  $weather_long = null;
  $weather_lat = null;
  if($search_type == "long-lat") {
    $weather_long = $long;
    $weather_lat = $lat;
  }
  else {
    $weather_long = $capital_long;
    $weather_lat = $capital_lat;
  }
  
  // weather forecast:
  $weather_url = "api.openweathermap.org/data/2.5/onecall?lat=" . $weather_lat . "&lon=" . $weather_long . "&appid=8521f4625e53b1542f06039f7280aad8";
  $weatherOutput = call_json_api($weather_url);
  
  $result -> weather = $weatherOutput -> current -> weather[0] -> description;
  $result -> daily_forecast = $weatherOutput -> daily;
  
  // exchange rate:
  $exhange_url = "https://openexchangerates.org/api/latest.json?app_id=09b3280f2c25483e9bc678feae537506";
  $currencyOutput = call_json_api($exhange_url);

  $result -> exchange_rate = $currencyOutput -> rates -> $currency_code;

  // Wiki links, build wiki url
  $wiki_url = 'https://en.wikipedia.org/wiki/' . str_replace(' ', '_', $country_name);
  $wiki_exists = check_wiki_page_exists($wiki_url);
  $result -> wiki_link = $wiki_exists ? $wiki_url : null;

  // borders:
  $countryBordersJson = file_get_contents("../country-borders/" . $iso_code  . ".json");
  $countryBorders = json_decode($countryBordersJson, true);

  $result -> borders = $countryBorders;

  // done
  return json_encode($result);
});




$app->run();
