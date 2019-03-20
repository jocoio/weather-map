
// LIVE WEATHER
// started from https://bl.ocks.org/curran/c7d740b2e91dda4f257d4174be506c42

var request = new XMLHttpRequest();
request.open("GET", "./states.json", false);
request.send(null)
var state_info = JSON.parse(request.responseText);

var url = "";
var format = d3.format(".2f");


function update(d) {

  var abbr = d.properties.STATE_ABBR; // State abbreviation
  var city = state_info[abbr]; // Capital city object

  weather_url = "https://api.openweathermap.org/data/2.5/weather?q=" + city.capital + ",us&appid=e95cc5001f5007830d078685ef86fd62";
  forecast_url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city.capital + ",us&appid=e95cc5001f5007830d078685ef86fd62";

  d3.select('.active').attr("r", 10).style("fill", "#aaa"); // Reset state color
  g.select("circle").remove(); // Remove capital circle

  // Current weather data
  d3.json(weather_url, function (data) {
    var kelvin = data.main.temp;

    // Dot for the state capitol
    g.selectAll("circle")
      .data([[city.long, city.lat]]).enter()
      .append("circle")
      .attr("cx", function (d) { return projection(d)[0]; })
      .attr("cy", function (d) { return projection(d)[1]; })
      .attr("r", "3px")
      .attr("fill", "black")

    // Populate side-bar info
    d3.select("#name").text(city.capital + ", " + abbr);
    d3.select("#temp-f").text(format(fahrenheit(kelvin)) + " °F");

    // Set the color of the state
    var hue = 30 + 240 * (celcuis(kelvin) - 30) / 60;
    var hsl_string = 'hsl(' + [hue, '70%', '50%'] + ')';
    d3.select('.active').attr("r", 10).style("fill", hsl_string);
  });

  // 5 Day forecast data
  d3.json(forecast_url, function (data) {

    console.log(data);

    for (var i = 0; i < 5; i++) {
      var avg_kelvin = average_temps(i, data.list);
      d3.select("#temp-" + i).text(format(fahrenheit(avg_kelvin)) + " °F");
    }
  });
}

function reset(d) {
  document.getElementById('name').innerHTML = "";
  document.getElementById('temp-f').innerHTML = "";

  for (var i = 0; i < 5; i++) {
    d3.select("#temp-" + i).text("");
  }

  d3.select('.active').attr("r", 10).style("fill", "#aaa"); // Reset state color
  g.select("circle").remove(); // Remove capital circle
}

// Temp translations
function celcuis(kelvin) { return kelvin - 273.15; }
function fahrenheit(kelvin) { return celcuis(kelvin) * 9 / 5 + 32; }

// Averages 24 hours of temperatures
function average_temps(i, temp_list) {
  
  var total = 0;
  
  for (var x = 0; x < 8; x++) {
    total += temp_list[(i * 8) + i].main.temp;
  }

  return total / 8;
}

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

// Handles clicking on the d3 canvas
// If clicked on a state, d = state object
function clicked(d) {

  var x, y, k;

  // If d exists and is not the currently centered state
  if (d && centered !== d) {
    var centroid = path.centroid(d);

    x = centroid[0];
    y = centroid[1];
    k = 3;
    centered = d;

    update(d);
  }
  // Else reset zoom
  else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;

    reset(d);
  }

  g.selectAll("path")
    .classed("active", centered && function (d) { return d === centered; });

  // Zoom tansition
  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .style("stroke-width", 1.5 / k + "px");
}
