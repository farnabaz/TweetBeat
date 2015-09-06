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
