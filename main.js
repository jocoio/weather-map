
// Live weather from https://bl.ocks.org/curran/c7d740b2e91dda4f257d4174be506c42

var request = new XMLHttpRequest();
request.open("GET", "./states.json", false);
request.send(null)
var my_JSON_object = JSON.parse(request.responseText);
console.log(my_JSON_object);

var url = "";
var format = d3.format(".2f");

function update(city_name) {

  url = "https://api.openweathermap.org/data/2.5/weather?q=" + city_name + ",us&appid=e95cc5001f5007830d078685ef86fd62";

  d3.json(url, function (data) {
    var kelvin = data.main.temp;
    d3.select("#temp-c").text(format(celcuis(kelvin)) + " °C");
    d3.select("#temp-f").text(format(fahrenheit(kelvin)) + " °F");
  });
}

function celcuis(kelvin) { return kelvin - 273.15; }
function fahrenheit(kelvin) { return celcuis(kelvin) * 9 / 5 + 32; }

update("Boston");

var fiveMinutes = 1000 * 60 * 5;
setInterval(update, fiveMinutes);


// Zoom and center state map from https://bl.ocks.org/mbostock/2206590

var width = 960,
  height = 500,
  centered;

var projection = d3.geo.albersUsa()
  .scale(1070)
  .translate([width / 2, height / 2]);

var path = d3.geo.path()
  .projection(projection);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", clicked);

var g = svg.append("g");

d3.json("./us.json", function (error, us) {

  if (error) throw error;

  g.append("g")
    .attr("id", "states")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
    .attr("d", path)
    .on("click", clicked);

  g.append("path")
    .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
    .attr("id", "state-borders")
    .attr("d", path);
});

function clicked(d) {
  document.getElementById('name').innerHTML = my_JSON_object[d.properties.STATE_ABBR].capital + ", " + d.properties.STATE_ABBR;
  console.log(my_JSON_object[d.properties.STATE_ABBR].capital);
  update(my_JSON_object[d.properties.STATE_ABBR].capital);

  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
    .classed("active", centered && function (d) { return d === centered; });

  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .style("stroke-width", 1.5 / k + "px");
}
