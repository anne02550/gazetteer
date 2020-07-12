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

$app->get('/geolocate', function() use($app) {
  $app['monolog']->addDebug('logging output.');
  return $app['twig']->render('geocode.twig');
});

$app->post('/api/geolocate', function(Request $request) use($app) {
  $app['monolog']->addDebug('logging output.');
  
  $geocoder = new \OpenCage\Geocoder\Geocoder('8c3273825ce1420990383af1c274fa14');
  $long = $request->request->get('long');
  $lat = $request->request->get('lat');

  $query = $long . ',' . $lat;
  $geo_result = $geocoder->geocode($query);
  $result = new \stdClass();
  $result->location = $geo_result['results'][0]['formatted'];
  return json_encode($result);
});


$app->run();
