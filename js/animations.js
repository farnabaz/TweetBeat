app.animation('.views', function($rootScope) {
    return {
        setup : function(element) {
            element.css({'opacity': 0});
        },
        enter : function(element, done, memo) {
          if ($rootScope.direction == 'back') {
            element.css('left', '-100%').animate({'left': 0}, function() {
              $rootScope.direction = '';
              done();
            });
          } else {
            element.css('left', '100%').animate({'left': 0}, function() {
              done();
            });
          }
        },
        leave : function(element, done, memo) {
          if ($rootScope.direction == 'back') {
            element.css('left', '0').animate({'left': '100%'}, function() {
              $rootScope.direction = '';
              done();
            });
          } else {
            element.css('left', 0).animate({'left': '-100%'}, function() {
              done();
            });
          }
        }
    };
});
