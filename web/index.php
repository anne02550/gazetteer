<?php

require('../vendor/autoload.php');

use GeoNames\Client as GeoNamesClient;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ParameterBag;

$app = new Silex\Application();
$app['debug'] = true;

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
  $app['monolog']->addDebug('logging output.');
  return $app['twig']->render('index.twig');
});

//my api:
$app->post('/api/geolocate', function(Request $request) use($app) {
  $app['monolog']->addDebug('logging output.');

  $long = $request->request->get('long');
  $lat = $request->request->get('lat');
 
  // Call the open cage api
  $openCageClient = new \OpenCage\Geocoder\Geocoder('8c3273825ce1420990383af1c274fa14');
  $openCageQuery = $lat . ',' . $long;
  $geo_result = $openCageClient->geocode($openCageQuery);
  $result = new \stdClass();
  $result->country = $geo_result['results'][0]['components']['country'];
  $result->currency = $geo_result['results'][0]['annotations']['currency']['name'];
  $result->flag = $geo_result['results'][0]['annotations']['flag'];

  $currency_code = $geo_result['results'][0]['annotations']['currency']['iso_code'];
  $result-> currency_code = $currency_code;
  
  $country_code = $geo_result['results'][0]['components']['country_code'];
  $result->country_code = $country_code;
  
  // start to call API weather:
  $curl = curl_init();
  $weather_query = "api.openweathermap.org/data/2.5/weather?lat=" . $lat . "&lon=" . $long . "&appid=8521f4625e53b1542f06039f7280aad8";
  $options = [
    CURLOPT_TIMEOUT => 5000,
    CURLOPT_URL => $weather_query,
    CURLOPT_RETURNTRANSFER => 1
  ];
  curl_setopt_array($curl, $options);
  $weatherOutput = curl_exec($curl);
  $result -> weather = json_decode($weatherOutput) -> weather[0] -> description;

  // Call to geonames
  $curl = curl_init();
  $geonames_query = "http://api.geonames.org/countryInfoJSON?formatted=true&lang=eng&country=" . $country_code . "&username=annepham&style=full";
  $options = [
    CURLOPT_TIMEOUT => 5000,
    CURLOPT_URL => $geonames_query,
    CURLOPT_RETURNTRANSFER => 1
  ];
  curl_setopt_array($curl, $options);
  $geonamesOutput = curl_exec($curl);
  $geonames = json_decode($geonamesOutput) -> geonames[0];

  $result -> capital = $geonames -> capital;
  $result -> population = $geonames -> population;

  // exchange rate:
  $curl = curl_init();
  $exhange_query = "https://openexchangerates.org/api/latest.json?app_id=09b3280f2c25483e9bc678feae537506";
  $options = [
    CURLOPT_TIMEOUT => 5000,
    CURLOPT_URL => $exhange_query,
    CURLOPT_RETURNTRANSFER => 1
  ];

  curl_setopt_array($curl, $options);
  $currencyOutput = curl_exec($curl);

  $result -> exchange_rate = json_decode($currencyOutput) -> rates -> $currency_code;
 

  return json_encode($result);
});




$app->run();
