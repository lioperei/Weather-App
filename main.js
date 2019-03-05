window.onload = () => {
  var checkbox = document.getElementById('toggle');
  if (checkbox) {
    checkbox.addEventListener('change', function () {
      changeTemp(true);
    });
  }
  document.getElementsByClassName('day-details')[0].addEventListener('click', function () {
    this.style['display'] = 'none';
  });
}

tempSwitch = false;

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
weatherData = {};
forecastData = {};

var changeTemp = (flip) => {
  tempSwitch = flip ? !tempSwitch : tempSwitch;
  var change = tempSwitch ? toFarenheit : toCelsius;
  document.querySelectorAll('[temp]').forEach(element => {
    element.textContent = change(Number(element.getAttribute('temp')));
  })
}

var searchCity = () => {
  let city = document.getElementById('city-name').value;
  let country = document.getElementById('country-name').value;
  city ? api.weatherCall(city, country) : errorMessage('Enter a City Name');
  api.forecastCall(city, country);
}

var errorMessage = (msg) => {
  document.getElementById('city-error').textContent = msg;
}

var api = (() => {
  let apiKey = '51f5812c034a04ebadd2016bb3473d51';

  return {
    weatherCall: (city, country) => {
      var xhr = new XMLHttpRequest();
      let requestString = `http://api.openweathermap.org/data/2.5/weather?q=${city}${country ? `,${country}` : ''}&appid=${apiKey}`;
      xhr.onreadystatechange = function () { currentWeather(this) };
      xhr.open('GET', requestString, true);
      xhr.send();
    },

    forecastCall: (city, country) => {
      var xhr = new XMLHttpRequest();
      let requestString = `http://api.openweathermap.org/data/2.5/forecast?q=${city}${country ? `,${country}` : ''}&appid=${apiKey}`;
      xhr.onreadystatechange = function () { currentForecast(this) };
      xhr.open('GET', requestString, true);
      xhr.send();
    },
  }
})();

var currentWeather = (xhr) => {
  if (xhr.readyState == 4) {
    if (xhr.status == 200) {
      weatherData = JSON.parse(xhr.responseText);
      document.getElementsByClassName('city')[0].innerHTML = `<h3>${weatherData.name},${weatherData.sys.country}</h3>`;
      let weather = setWeatherIcon(document.getElementsByClassName('weather-condition')[0], weatherData.weather[0].main);
      setWeatherColor(document.getElementsByTagName('BODY')[0], weatherData.weather[0].main);
      weather.innerHTML = `<h4 class="daily-temp" temp=${weatherData.main.temp}></h4>` + weather.innerHTML;
      windIcon();
      document.getElementsByClassName('humidity')[0].innerHTML = `<img src="image/svg/wi-humidity.svg"><p>${weatherData.main.humidity}%</p>`;;
    } else {
      document.getElementById('city-error').textContent = 'Error retrieving weather data. Try Again.';
    }
  }
}

var currentForecast = (xhr) => {
  if (xhr.readyState == 4) {
    if (xhr.status == 200) {
      forecastData = chunk(JSON.parse(xhr.responseText).list, 5);
      forecastElements = document.getElementsByClassName('forecast')[0];
      forecastElements.innerHTML = '';
      for (i = 0; i < 5; i++) {
        let min = 1000;
        let max = -1000;
        let date = new Date(forecastData[i][0].dt_txt);
        let weatherStatus = new Array();
        for (j = 0; j < 5 || j < forecastData[i].length; j++) {
          let entry = forecastData[i][j];
          min = (min < entry.main.temp_min) ? min : entry.main.temp_min;
          max = (max > entry.main.temp_min) ? max : entry.main.temp_max;
          Array.from(entry.weather).forEach(w => {
            weatherStatus.push(w.main);
          });
        }
        let w = findCommon(weatherStatus);
        let container = forecastElement(w, date, min, max);
        container.setAttribute('day', i);
        container.addEventListener('click', function () {
          showDaydata(this);
        });
        forecastElements.appendChild(container);
      }
      changeTemp(false);
      show();
    } else {
      document.getElementById('city-error').textContent = 'Error retrieving weather data. Try Again.';
    }
  }
}

function showDaydata(element) {
  let day = forecastData[element.getAttribute('day')];
  let d = new Date(day[0].dt_txt);
  document.getElementById('day-date').textContent = `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
  document.getElementsByClassName('day-details')[0].style['display'] = 'block';
  let table = document.getElementById('day-info');
  table.innerHTML = '<th>Time</th><th>Weather</th><th>Temperature</th>';
  day.forEach((time) => {
    let row = document.createElement('TR');
    let t = document.createElement('TD');
    let p = new Date(time.dt_txt).getHours();
    t.innerHTML = `${p == 0 ? 24 : p}:00`;
    let weather = document.createElement('TD');
    let weatherContainer = document.createElement('div');
    setWeatherIcon(weatherContainer, time.weather[0].main);
    weather.appendChild(weatherContainer);
    weather.className = 'day-icon';
    let temperature = document.createElement('TD');
    temperature.setAttribute('temp', time.main.temp);
    row.appendChild(t);
    row.appendChild(weather);
    row.appendChild(temperature);
    table.appendChild(row);
  });
  changeTemp(false);
}


function windIcon() {
  let windData = weatherData.wind;
  let container = document.getElementsByClassName('wind')[0];
  container.innerHTML = '<img src="image/svg/wi-windy.svg">';
  let direction = '';
  switch (true) {
    case (windData.speed <= 330 && windData.speed < 30):
      direction = 'North';
      break;
    case (windData.speed <= 30 && windData.speed < 60):
      direction = 'North East';
      break;
    case (windData.speed <= 60 && windData.speed < 120):
      direction = 'East';
      break;
    case (windData.speed <= 120 && windData.speed < 150):
      direction = 'South East';
      break;
    case (windData.speed <= 150 && windData.speed < 210):
      direction = 'South';
      break;
    case (windData.speed <= 210 && windData.speed < 240):
      direction = 'South West';
      break;
    case (windData.speed <= 240 && windData.speed < 300):
      direction = 'West';
      break;
    case (windData.speed <= 300 && windData.speed < 330):
      direction = 'North West';
      break;
    default:
      direction = '';
      break;
  }
  container.innerHTML = container.innerHTML + `<p>${weatherData.wind.speed} km/h ${direction}</p>`;
}


function forecastElement(w, date, min, max) {
  let container = document.createElement('div');
  let dateDiv = document.createElement('h4');
  let weatherMinMax = document.createElement('div');
  weatherMinMax.className = "min-max"
  let weatherIcon = document.createElement('div');
  dateDiv.innerHTML = `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  weatherMinMax.innerHTML = `<br><p>Max:</p><p temp="${max}"></p><br><p>Min:<p/><p temp="${min}"></p>`;
  weatherIcon = setWeatherIcon(weatherIcon, w);
  let weatherInfo = document.createElement('div');
  weatherInfo.className = "info";
  weatherInfo.appendChild(weatherMinMax);
  weatherInfo.appendChild(weatherIcon);
  container.appendChild(dateDiv);
  container.appendChild(weatherInfo);
  forecastElements.appendChild(setWeatherColor(container, w));
  return container;
}

function setWeatherIcon(container, weatherStatus) {
  switch (weatherStatus) {
    case 'Rain':
      container.innerHTML = `<img src="image/svg/wi-rain.svg"><h5>${weatherStatus}</h5>`;
      break;
    case 'Clouds':
      container.innerHTML = `<img src="image/svg/wi-cloudy.svg"><h5>${weatherStatus}</h5>`;
      break;
    case 'Clear':
      container.innerHTML = `<img src="image/svg/wi-day-sunny.svg"><h5>${weatherStatus}</h5>`;
      break;
    case 'Snow':
      container.innerHTML = `<img src="image/svg/wi-snow.svg"><h5>${weatherStatus}</h5>`;
      break;
    case 'Fog':
      container.innerHTML = `<img src="image/svg/wi-fog.svg"><h5>${weatherStatus}</h5>`;
    case 'Drizzle':
      container.innerHTML = `<img src="image/svg/wi-rain-mix.svg"><h5>${weatherStatus}</h5>`;
      break;
    default:
      container.innerHTML = `<img src="image/svg/wi-day-haze.svg"><h5>${weatherStatus}</h5>`;
  }
  return container;
}

function setWeatherColor(container, weatherStatus) {
  switch (weatherStatus) {
    case 'Rain':
      container.style['background-color'] = 'aliceblue';
      break;
    case 'Snow':
      container.style['background-color'] = 'white';
      break;
    case 'Clouds':
      container.style['background-color'] = '#80808047';
      break;
    case 'Fog':
      container.style['background-color'] = '#80808047';
      break;
    case 'Clear':
      container.style['background-color'] =  '#ffffb3';
      break;
    default:
      container.style['background-color'] = 'white';
  }
  return container;
}

function show() {
  document.getElementById('prompt').style['display'] = 'none';
  document.getElementById('now').style['display'] = 'block';
  document.getElementById('division').style['display'] = 'block';
  document.getElementById('forecast').style['display'] = 'flex';
}

function findCommon(arr) {
  let map = new Map()
  for (let num of arr) {
    map.set(num, (map.get(num) || 0) + 1)
  }

  let mostCommonNumber = NaN
  let maxCount = -1
  for (let [num, count] of map.entries()) {
    if (count > maxCount) {
      maxCount = count
      mostCommonNumber = num
    }
  }
  return mostCommonNumber
}

const chunk = (arr, numChunks) => {
  let size = Math.ceil(arr.length / numChunks);
  let result = new Array();
  for (i = 0; i < numChunks; i++) {
    let tempArr = new Array();
    for (j = i * size; j < (i + 1) * size; j++) {
      if (j >= arr.length) { break; }
      tempArr.push(arr[j]);
    }
    result.push(tempArr);
  }
  return result;
}

const toCelsius = (kelvin) => { return `${Math.floor(kelvin - 273.15)} °C` };

const toFarenheit = (kelvin) => { return `${Math.floor(kelvin * 9 / 5 - 459.67)} °F` };