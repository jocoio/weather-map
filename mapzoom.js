// MAP ZOOM AND CENTER
// Based on https://bl.ocks.org/mbostock/2206590


// TODO: Make map responsive to screen size
var width = 960;
var height = 500;
var centered;

// Albers map projection
var projection = d3.geo.albersUsa()
  .scale(1070)
  .translate([width / 2, height / 2]);

// Geographic shape generator
var path = d3.geo.path().projection(projection);

// New svg object
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

    loadState(d);
  }
  // Else reset zoom
  else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;

    leaveState();
  }

  g.selectAll("path")
    .classed("active", centered && function (d) { return d === centered; });

  // Zoom tansition
  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .style("stroke-width", 1.5 / k + "px");
}
