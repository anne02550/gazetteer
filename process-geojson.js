var fs = require('fs');

const flipCoords = (coords) => {
  if(Array.isArray(coords[0])){
    return coords.map(x => flipCoords(x));
  }
  return [coords[1], coords[0]]
};

const processCountry = (data) => {
    var filename = `${data.properties.ISO_A3}.json`
    fs.writeFileSync(`./country-borders/${filename}`, JSON.stringify(flipCoords(data.geometry.coordinates)))
};


fs.readFile('web/countries.geojson', (err, data) => {
  if (err) {
    throw err; 
  }
  const json = JSON.parse(data.toString());

  for(var country of json.features) {
      processCountry(country);
  }
});