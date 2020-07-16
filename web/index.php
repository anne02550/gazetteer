<?php

require('../vendor/autoload.php');

$app = new Silex\Application();
$app['debug'] = true;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ParameterBag;

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
  

  $geocoder = new \OpenCage\Geocoder\Geocoder('8c3273825ce1420990383af1c274fa14');
  $long = $request->request->get('long');
  $lat = $request->request->get('lat');

  $query = $long . ',' . $lat;
  $geo_result = $geocoder->geocode($query);
  $result = new \stdClass();
  // $result->location = $geo_result['results'][0]['formatted'];
  $result->country = $geo_result['results'][0]['components']['country'];
  // $result->country = "England";
  $result->capital = "London";
  $result->population = 60000000;
  $result->weather = "rainy";
  $result->currency = $geo_result['results'][0]['annotations']['currency']['name'];
  $result->flag = $geo_result['results'][0]['annotations']['flag'];
 

  // start to call API weather:
  $curl = curl_init();
  $weather_query = "api.openweathermap.org/data/2.5/weather?lat=50&lon=100.0&appid=8521f4625e53b1542f06039f7280aad8";
  $options = [
    CURLOPT_TIMEOUT => 5000,
    CURLOPT_URL => $weather_query,
    CURLOPT_RETURNTRANSFER => 1
  ];
  curl_setopt_array($curl, $options);
  $output = curl_exec($curl);
  $result -> weatherapi = json_decode($output);
  $result -> weather = json_decode($output) -> weather[0] -> description;

  return json_encode($result);
});




$app->run();
