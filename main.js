// Local request for json file
var request = new XMLHttpRequest();
request.open("GET", "./states.json", false);
request.send(null)


// Global variables
var state_info = JSON.parse(request.responseText);
var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var day = new Date();
var url = "";
var format = d3.format(".0f");
var playing = false;
var play_idx = 0;



// STATE LOADING AND LEAVING



// Change state
function loadState(d) {

  leaveState();

  var abbr = d.properties.STATE_ABBR; // State abbreviation
  var city = state_info[abbr]; // Capital city object

  weather_url = "https://api.openweathermap.org/data/2.5/weather?q=" + city.capital + ",us&appid=20dd3084fbe66e7ae0dd3da85dd23f8f";
  forecast_url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city.capital + ",us&appid=20dd3084fbe66e7ae0dd3da85dd23f8f";

  // Current weather data
  d3.json(weather_url, function (data) {
    var kelvin = data.main.temp;

    // Black dot
    createCapital(city);

    // Populate side-bar info
    d3.select("#name").text(city.capital + ", " + abbr);
    d3.select("#temp-f").text(format(fahrenheit(kelvin)) + " °F");
    document.getElementById("time-warp").style.visibility = "visible";
    document.getElementById("time-play").style.visibility = "visible";

    // Set the color of the state
    d3.select('.active').attr("r", 10).style("fill", tempToHSL(kelvin));
  });

  // 5 Day forecast data
  d3.json(forecast_url, function (data) {

    // Compute and populate 5 day forecast sidebar
    for (var i = 0; i < 5; i++) {
      var avg_kelvin = average_temps(i, data.list);
      d3.select("#temp-" + i).text(days[(day.getDay() + 1 + i) % 7] + "     " + format(fahrenheit(avg_kelvin)) + " °F");
    }

    // Change map based on slider
    document.getElementById("time-warp").oninput = function () {
      vizualizeForecast(data.list[this.value])
      play_idx = this.value;
      if (playing) {
        playing = false;
      }
    }

    // Handles play/pause of animation
    document.getElementById("time-play").onclick = function () {
        handleAnimateClick(data);
    }
  });
}


// Leave states
function leaveState() {

  // Current weather text
  document.getElementById('name').innerHTML = "";
  document.getElementById('temp-f').innerHTML = "";

  // Future weather text
  for (var i = 0; i < 5; i++) {
    d3.select("#temp-" + i).text("");
  }

  // Forecast section
  playing = false;
  play_idx = 0;

  document.getElementById("time-warp").value = play_idx;
  document.getElementById("time-warp").style.width = "100px"
  document.getElementById("time-warp").style.visibility = "hidden";
  document.getElementById("time-play").style.visibility = "hidden";


  setTimeout(function () {
    d3.select("#time-temp").text("");
    d3.select('#time-code').text("");
  }, 500);

  // State styling
  d3.select('.active').attr("r", 10).style("fill", "#dddddd"); // Reset state color
  g.select("circle").remove(); // Remove capital circle


}


// Dot for the state capitol
function createCapital(city) {
  g.selectAll("circle")
    .data([[city.long, city.lat]]).enter()
    .append("circle")
    .attr("cx", function (d) { return projection(d)[0]; })
    .attr("cy", function (d) { return projection(d)[1]; })
    .attr("r", "3px")
    .attr("fill", "black")
}



// FORECAST ANIMATION AND VIZUALIZATION //



// Logic handling for the #time-play button
function handleAnimateClick(data) {
  
  // Check global to see if playing
  if (!playing) {
    document.getElementById("time-play").innerHTML = "Pause"
    document.getElementById("time-warp").style.width = "850px"
    playing = true;

    if (play_idx == 37) {
      play_idx = 0;
    }

    animateForecast(data.list);
  }
  else {
    document.getElementById("time-play").innerHTML = "Play";
    playing = false;
  }
}

// Recursive function that animates the five day forecast
// TODO: Add day/night indicator somewhere
function animateForecast(data_list) {

  // Display the current slide
  vizualizeForecast(data_list[play_idx]);

  // If there's more timeline to show, increment and call this function in 500ms
  if (playing && play_idx < 37) {
    play_idx++;
    document.getElementById("time-warp").value = play_idx;
    setTimeout(function () {
      animateForecast(data_list);
    }, 500);
  }
  // Animation is finished
  else {
    playing = false;
    document.getElementById("time-play").innerHTML = "Play";
  }
}


// Load data to map + sidebar with given moment in the forecast
function vizualizeForecast(forecast_point) {

  var forecast_temp = forecast_point.main.temp;
  var forecast_text = forecast_point.dt_txt;

  // Set state color the temp
  d3.select('.active').attr("r", 10).style("fill", tempToHSL(forecast_temp));

  // Display temp in sidebar
  d3.select('#time-temp').text(format(fahrenheit(forecast_temp)) + " °F");

  // Display time text in sidebar
  d3.select('#time-code').text(formatDateTime(forecast_text));
}



// CONVERSIONS AND FORMATTING //



// Temperature conversions
function celcuis(kelvin) { return kelvin - 273.15; }
function fahrenheit(kelvin) { return celcuis(kelvin) * 9 / 5 + 32; }


// Kelvin temp to HSL string representation
// TODO: Fix color range to be: Blue -> yellow/whitish -> Red (no green)
function tempToHSL(temp) {
  // console.log(270 - ((fahrenheit(temp) / 90) * 270));
  var hue = 270 - ((fahrenheit(temp) / 90) * 270);
  var hsl_string = 'hsl(' + [hue, '70%', '50%'] + ')';
  return hsl_string;
}


// Averages 24 hours (8 data points) of temperatures
function average_temps(i, temp_list) {
  var total = 0;
  for (var x = 0; x < 8; x++) {
    total += temp_list[(i * 8) + i].main.temp;
  }
  return total / 8;
}


// Formats openweathermap's time string
function formatDateTime(date_time) {

  var d = new Date(date_time);

  // Shamelessly grabbed from: https://stackoverflow.com/a/8888498
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;

  return (d.getMonth() + 1) + "/" + d.getDate() + "     " + strTime;
}