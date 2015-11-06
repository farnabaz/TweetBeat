app.directive('imgPreload', ['$rootScope', function($rootScope) {
    return {
      restrict: 'A',
      scope: {
        ngSrc: '@'
      },
      link: function(scope, element, attrs) {
        element.on('load', function() {
          element.addClass('in').show();
        }).on('error', function() {
          //
        });

        scope.$watch('ngSrc', function(newVal) {
          element.removeClass('in').hide();
        });
      }
    };
}]);

app.directive('tweet', [function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      tweet: '=data', favorite: '&favorite', retweet: '&retweet', reply: '&reply'
    },
    templateUrl: 'tweet-template.html'
  };
}]);
