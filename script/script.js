var map;
var locationMuenster;
var originBounds;
var destBounds;
var directionsDisplay = new google.maps.DirectionsRenderer;
var directionsService = new google.maps.DirectionsService;
var travel_mode = google.maps.TravelMode.TRANSIT; 


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
        locationMuenster = new google.maps.LatLng(51.960665, 7.62613)
        map = new google.maps.Map(el, {
          center: locationMuenster,
          zoom: 8
        });
        initMap()
        geoLocation()
      }
    };
  }
]);

// -------- Initialize the Map -------- //
function initMap() {
  var origin_place_id = null;
  var destination_place_id = null;
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  var origin_input = document.getElementById('origin-input');
  var destination_input = document.getElementById('destination-input');

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(origin_input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(destination_input);

  var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);

  function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(13);
    }
  }

  origin_autocomplete.addListener('place_changed', function() {
    var place = origin_autocomplete.getPlace();
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

  function route(origin_place_id, destination_place_id, travel_mode,
                 directionsService, directionsDisplay) {
    if (!origin_place_id || !destination_place_id) {
      return;
    }
    displayRoute({'placeId': origin_place_id},{'placeId': destination_place_id},directionsService,directionsDisplay);
  }
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
  map.setCenter(locationMuenster); // Münster as Standard City Point
  map.setZoom(10);
  map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
}

// ------- Directions Service ------- //

function displayRoute(origin, destination, service, display) {
service.route({
      origin: origin,
      destination: destination,
      travelMode: travel_mode
    }, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        display.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }}
  );
}