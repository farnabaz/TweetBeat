var root = "app://tweetbeat.app"
// angular app
var app = angular.module('tweetbeat', ['ngRoute', 'ngAnimate', 'ngSanitize','tweetbeat.services']);
// configure our routes
app.config(function($routeProvider) {
    $routeProvider
      .when('/image/:url', {
          templateUrl : 'pages/image.html',
          controller  : 'ImageController'
      })
      .otherwise({
          templateUrl : 'pages/home.html',
          controller  : 'TimelineController'
      });
});

// filters
app.filter('html', ['$sce', function($sce){
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);
app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
