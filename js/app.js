var root = "app://tweetbeat.app"
// angular app
var app = angular.module('tweetbeat', ['ngStorage', 'ngRoute', 'ngAnimate', 'ngSanitize','tweetbeat.services']);
app.run(function($localStorage, $rootScope){
   $localStorage.$default({
    settings: {
      "menubar-icon": true,
      "font-size": "12pt",
      "font-family": "'Helvetica Neue',Helvetica,Arial,sans-serif",
      "style": "light",
      "image-preview": true,

      "notify-tweets": ["menubar", "dock icon", "notification center"],
      "notify-mentions": ["menubar", "dock icon", "notification center"],
      "notify-favorites": ["menubar", "dock icon", "notification center"],
      "notify-retweets": ["menubar", "dock icon", "notification center"],
      "notify-followers": ["menubar", "dock icon", "notification center"],
      "notify-messages": ["menubar", "dock icon", "notification center"],
      "notify-lists": ["menubar", "dock icon", "notification center"]
    }
  })
  $rootScope.settings = $localStorage.settings
})
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
