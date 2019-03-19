
// LIVE WEATHER
// started from https://bl.ocks.org/curran/c7d740b2e91dda4f257d4174be506c42

var request = new XMLHttpRequest();
request.open("GET", "./states.json", false);
request.send(null)
var state_info = JSON.parse(request.responseText);

var url = "";
var format = d3.format(".2f");

// Grabs weather data for given city_name
function update(city) {

  console.log(projection([city.long, city.lat]));

  weather_url = "https://api.openweathermap.org/data/2.5/weather?q=" + city.capital + ",us&appid=e95cc5001f5007830d078685ef86fd62";
  forecast_url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city.capital + ",us&appid=e95cc5001f5007830d078685ef86fd62";

  d3.json(weather_url, function (data) {
    var kelvin = data.main.temp;

    // Dot for the state capitol
    g.selectAll("circle")
      .data([[city.long, city.lat]]).enter()
      .append("circle")
      .attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
      .attr("cy", function (d) { return projection(d)[1]; })
      .attr("r", "3px")
      .attr("fill", "black")

    // Populate side-bar info
    d3.select("#temp-f").text(format(fahrenheit(kelvin)) + " °F");
  });

  d3.json(forecast_url, function (data) {
    var kelvin = data.list[0].main.temp;
    console.log(data);
    // Populate 
    //d3.select("#temp-f").text(format(fahrenheit(kelvin)) + " °F");
  });
}

// Temp translations
function celcuis(kelvin) { return kelvin - 273.15; }
function fahrenheit(kelvin) { return celcuis(kelvin) * 9 / 5 + 32; }

// Update weather every five minutes
var fiveMinutes = 1000 * 60 * 5;
setInterval(update, fiveMinutes);



// MAP ZOOM AND CENTER
// started from https://bl.ocks.org/mbostock/2206590

var width = 960;
var height = 500;
var centered;

// Albers map projection
var projection = d3.geo.albersUsa()
  .scale(1070)
  .translate([width / 2, height / 2]);

// Geographic shape generator
var path = d3.geo.path().projection(projection);

// new svg object
var map_svg = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

// Map background
map_svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", clicked);

// Zooomable container
var g = map_svg.append("g");

d3.json("./us.json", function (error, us) {

  if (error) throw error;

  // Load in map as svg
  g.append("g")
    .attr("id", "states")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
    .attr("d", path)
    .on("click", clicked);

  // Load in map borders as svg
  g.append("path")
    .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
    .attr("id", "state-borders")
    .attr("d", path);
});

function clicked(d) {

  var x, y, k;

  // If d is a different state
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    var abbr = d.properties.STATE_ABBR;

    x = centroid[0];
    y = centroid[1];
    k = 3;
    centered = d;

    document.getElementById('name').innerHTML = state_info[abbr].capital + ", " + abbr;
    update(state_info[abbr]);
  }
  // Else reset zoom
  else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;

    document.getElementById('name').innerHTML = "";
    document.getElementById('temp-f').innerHTML = "";
  }

  g.select("circle").remove();

  g.selectAll("path")
    .classed("active", centered && function (d) { return d === centered; });

  // Zoom tansition
  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .style("stroke-width", 1.5 / k + "px");
}
