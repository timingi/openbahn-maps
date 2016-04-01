var map;
var locationMuenster;

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
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        searchBar()
        geoLocation()
      }
    };
  }
]);

function searchBar() {

  //create a input Box like google maps
  var input = document.getElementById('start');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
    map.setZoom(16);
  });

}



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
  map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
}