var map;
var currentProvider;
var geoJson;
var polylines = [], lineArray = [], propertiesTempArray = [], geometryPropertiesArray = [];
var responseTemp;
var counter = 0;
var routeIndex = 0;
var trigger;

var mapApp = angular.module('bahn', []);
mapApp.directive('map', [
  function() {
    return {
      restrict: 'E',
      controller: function($scope) {},
      scope: {
        control: '='
      },
      link: function(scope, element, attrs) {
        var el = document.createElement("div");
        el.style.width = "100%";
        el.style.height = "100%";
        element.prepend(el);
        map = new google.maps.Map(el, {
          center: new google.maps.LatLng(51.960665, 7.62613), //Muenster Centrum
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.TERRAIN
        });
        initMap();
        geoLocation();
        importRadioCoordinates();
      }
    };
  }
]);

mapApp.controller('formController',function($scope) {
     

     //checkbox list
      $scope.names = [
        {name: 'Complete', selected: true},
        {name: 'T-Mobile', selected: false},
        {name: 'Vodafone', selected: false},
        {name: 'E-Plus', selected: false},
        {name: 'o2', selected: false}
      ];

      currentProvider = 'Complete'; //for first load

      //only one checkbox is checked
      $scope.updateSelection = function(position,names){
        angular.forEach(names, function(name, index) {
          if(position != index)
            name.selected = false;
        });
        $scope.save();
        compareRoute(responseTemp);
      }

      $scope.save = function(){
        angular.forEach($scope.names, function(name){
          if (name.selected) currentProvider = name.name;
        })
      }
});

// -------- Initialize the Map -------- //

function initMap() {
  var origin_place_id = null;
  var destination_place_id = null;
  var travel_mode = google.maps.TravelMode.TRANSIT; 
  var directionsService = new google.maps.DirectionsService;
  // initialize directions polyline with specific options
  var directionsDisplay = initDirectionDisplay();

  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  var origin_input = document.getElementById('origin-input');
  var destination_input = document.getElementById('destination-input');
  var provider_panel = document.getElementById('provider-panel');

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(origin_input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(destination_input);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(provider_panel);

  var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);

  google.maps.event.addListener(directionsDisplay,'routeindex_changed',function(){
    var directionsDisplay;
    if(this.getRouteIndex() > 0){
      trigger = true;
      directionsDisplay = initDirectionDisplay();
      routeIndex = this.getRouteIndex(), //to get the right route
      displayRoute({'placeId': origin_place_id},{'placeId': destination_place_id},directionsService,directionsDisplay);
    }else if (this.getRouteIndex() == 0 && trigger) {
      directionsDisplay = initDirectionDisplay();
      routeIndex = this.getRouteIndex();
      displayRoute({'placeId': origin_place_id},{'placeId': destination_place_id},directionsService,directionsDisplay);
      trigger = false;
    }
  });

  origin_autocomplete.addListener('place_changed', function() {
    routeIndex = 0;
    var place = origin_autocomplete.getPlace();
    // place
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);

    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    origin_place_id = place.place_id;
    route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  destination_autocomplete.addListener('place_changed', function() {
    routeIndex = 0;
    var place = destination_autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);

    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    destination_place_id = place.place_id;
    route(origin_place_id, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });
}


function initDirectionDisplay(){
      var directionsDisplay = new google.maps.DirectionsRenderer({ // new Renderer that there is no pullback of the directions Service Route
        polylineOptions: {
        strokeColor: '#375FFF',
        strokeOpacity: 0.2,
        strokeWeight: 4
      }});

      return directionsDisplay;
}

// ------------- HTML 5 Geolocation--------------------------- //

function geoLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      map.setCenter(pos);
      map.setZoom(14);
    }, function() {
      handleLocationError(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false);
  }
}

function handleLocationError(browserHasGeolocation, infoWindow) {
  browserHasGeolocation ? initMapAfterWifiLocationFailed() :
    new google.maps.InfoWindow({
      map: map
    }).setContent('Error: Your browser doesn\'t support geolocation.');
}

function initMapAfterWifiLocationFailed() {
  map.setCenter(new google.maps.LatLng(51.960665, 7.62613)); // Münster as Standard City Point
  map.setZoom(10);
  map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
}

function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(13);
      map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
    }
  }

function route(origin_place_id, destination_place_id, travel_mode,
                 directionsService, directionsDisplay) {
    if (!origin_place_id || !destination_place_id) {
      return;
    }
    displayRoute({'placeId': origin_place_id},{'placeId': destination_place_id},directionsService,directionsDisplay);
  }

// ------- Directions Service ------- //

function displayRoute(origin, destination, service, display) {

service.route({
      origin: origin,
      destination: destination,
      provideRouteAlternatives: true,
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        modes: [google.maps.TransitMode.TRAIN]
          }
    }, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        display.setDirections(response);
        responseTemp = response.routes[routeIndex];
        compareRoute(response.routes[routeIndex]);
      } else {
        window.alert('Directions request failed due to ' + status);
      }}
  );
}

function compareRoute(directionResults){

  removePolylines();
  var stepLength = directionResults.legs[0].steps.length;
  
    for (var k = stepLength; k--;) {
      routePath(directionResults.legs[0].steps[k].path, directionResults.legs[0].steps[k].path.length);
    }
}

function routePath(path,pathLength){

     for (var l = pathLength; l--;) {
       routeTogeoJson(path[l]);
     }
}

function routeTogeoJson(path){

  var featuresLength = geoJson.features.length;

     for(var x = featuresLength; x--;){
      var bahnRadioCoordinates = geoJson.features[x].geometry.coordinates;  //iterate over the geoJson coordinates
      bahnRadioCoordinates = swapArrayValues(bahnRadioCoordinates); 
      compareGeoJson(bahnRadioCoordinates, path, x, bahnRadioCoordinates.length);
     }
}

function compareGeoJson(bahnData,path,index,coordinatesLength){

   for(var i = coordinatesLength;i--;){
        if((Math.floor(bahnData[i][0] *1000)/1000) == (Math.floor(path.lat() *1000) /1000) //3.decimal place for streets
        && (Math.floor(bahnData[i][1] *1000)/1000) == (Math.floor(path.lng() *1000) / 1000) )
          {
            lineArray.push(new google.maps.LatLng(bahnData[i][0],bahnData[i][1]));  
            propertiesTempArray.push(geoJson.features[index].properties);
            counter++;
            if(counter == 5){
              geometryPropertiesArray.push(lineArray,propertiesTempArray);
              drawRadioLine(geometryPropertiesArray);
              counter = 0;
              lineArray = [];
              propertiesTempArray = [];
              geometryPropertiesArray = [];
            }
          }
      }
}

//initiatie JsonDataFile with RadioData from OpenBahn
function importRadioCoordinates() {

  getJSON('http://localhost:8080/connectivity_2015_09.geojson', function(data) {
    geoJson = data;
    }, function(status) {
  alert('Something went wrong.');
  });
}

//get the geoJson file from url and into a string to handle coordinates
var getJSON = function(url, successHandler, errorHandler) {
  var xhr = typeof XMLHttpRequest != 'undefined'
    ? new XMLHttpRequest()
    : new ActiveXObject('Microsoft.XMLHTTP');
  xhr.open('get', url, true);
  xhr.responseType = 'json';
  xhr.onreadystatechange = function() {
    var status;
    var data;
    // https://xhr.spec.whatwg.org/#dom-xmlhttprequest-readystate
    if (xhr.readyState == 4) { // `DONE`
      status = xhr.status;
      if (status == 200) {
        successHandler && successHandler(xhr.response);
      } else {
        errorHandler && errorHandler(status);
      }
    }
  };
  xhr.send();
};


// .geoJson saves geospatiol data like lng & lat, but most of Map Services use it as lat&lng
// the array data has to swap for using map services
function swapArrayValues(originArray){

  var swappedArray = originArray;  
  var arrayLength = originArray.length;

  for(var x = arrayLength; x--;){
    var y=0;
    var temp = originArray[x][y];
    swappedArray[x][y] = originArray[x][y+1];
    swappedArray[x][y+1] = temp; 
    }
  return swappedArray;
}

function drawRadioLine (geoData) {

  var customPolyline = new google.maps.Polyline;
  var geoDataLength = geoData.length;
  
  for(var i=0; i < geoDataLength; i++){
    i +=1; // properties

      var provider = getProvider();
      var averageProperties = calculateAverageProperties(geoData[i],provider);
      customStrokeWeight  = calculateMeasurements(averageProperties.measurements);
      customStrokeColor = calculateStability(averageProperties.stability);

        customPolyline = new google.maps.Polyline({
          path: geoData[i-1],//coordinate Array[5] from geoData
          strokeColor: customStrokeColor,
          strokeOpacity: 1,
          strokeWeight: customStrokeWeight
         });

      polylines.push(customPolyline);
      customPolyline.setMap(map); 
  } 
}

function removePolylines(){

  for(var i=polylines.length;i--;){
    polylines[i].setMap(null);
  }
  polylines = [];
  lineArray = [];
  propertiesTempArray = [];
  geometryPropertiesArray = [];
}     

function calculateAverageProperties(properties,provider){
  var tempMeasure = 0;
  var tempStability = 0;
  var propertiesLength = properties.length;

  for(var i=propertiesLength;i--;){
    tempMeasure += properties[i][provider.measurements];
    tempStability += properties[i][provider.stability];
  }
  return {measurements:tempMeasure,stability:tempStability/propertiesLength};

}

function calculateMeasurements(providerData){
   if(providerData < 100)
    return customStrokeWeight = 3;
  if(providerData > 100 && providerData < 500)
    return customStrokeWeight = 5;
  if(providerData > 500)
    return customStrokeWeight = 7;
}

function calculateStability(providerData){

  if(providerData < 0.2 )
    return customStrokeColor = "#000000";  //black
  if(providerData > 0.2 && providerData < 0.87)
    return customStrokeColor = "#EB420E"; //red
  if(providerData > 0.87 && providerData < 0.93)
    return customStrokeColor = "#C4AC0F"; //darkOrange
  if(providerData > 0.93 && providerData < 0.98)
    return customStrokeColor = "#FFEF00"; //yellow
  if(providerData > 0.98)
    return customStrokeColor = "#07C600"; //green
}

function getProvider(){

 if(angular.element(document.getElementById("lteCheckbox").checked)){
  switch(currentProvider){
    case "Complete":
      return {measurements:"all_measurements",stability:"all_stability"};
    case "T-Mobile":
      return {measurements:"t-mobile_measurements",stability:"t-mobile_stability"};
    case "Vodafone":
      return {measurements:"vodafone_measurements",stability:"vodafone_stability"};
    case "E-Plus":
      return {measurements:"e-plus_measurements",stability:"e-plus_stability"};
    case "o2":
      return {measurements:"o2_measurements",stability:"o2_stability"};    
    }
  }else{
    switch(currentProvider){
      case "Complete":
        return {measurements:"all,no4g_measurements",stability:"all,no4g_stability"};
      case "T-Mobile":
        return {measurements:"t-mobile,no4g_measurements",stability:"t-mobile,no4g_stability"};
      case "Vodafone":
        return {measurements:"vodafone,no4g_measurements",stability:"vodafone,no4g_stability"};
      case "E-Plus":
        return {measurements:"e-plus,no4g_measurements",stability:"e-plus,no4g_stability"};
      case "o2":
        return {measurements:"o2,no4g_measurements",stability:"o2,no4g_stability"};
      }
    }
}