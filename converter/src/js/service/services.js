spikeApp.factory('movieStubFactory', function ($resource) {
  return $resource('http://moviestub.cloudno.de/movies');
});

spikeApp.factory('movieStubBookingsFactory', function ($resource) {
return $resource('http://moviestub.cloudno.de/bookings');
});
