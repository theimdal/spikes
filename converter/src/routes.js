polarToolsApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'tmpl/main.html',
            controller: 'mainController'

         }).when('/mssql', {
            templateUrl: 'tmpl/mssql.html',
            controller: 'mssqlController'
        //}).when('/bookings', {
        //    templateUrl: 'tmpl/bookings.html',
        //    controller: 'bookingDetailsController'
        //}).when('/bookTickets/:id', {
        //    templateUrl: 'tmpl/bookTickets.html',
        //    controller: 'bookTicketsController'
        }).otherwise({
            redirectTo: '/'
        });
});
