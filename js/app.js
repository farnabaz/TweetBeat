if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

var root = "app://tweetbeat.app"
// angular app
var app = angular.module('tweetbeat', ['ngStorage', 'ngAnimate'
        , 'ngSanitize','tweetbeat.services', 'ui.router', 'infinite-scroll']);
app.run(function($localStorage, $rootScope){
  $rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from, fromParams) {
      $rootScope.$previousState = from;
  });
   $localStorage.$default({
    settings: {
      "menubar-icon": true,
      "font-size": "12pt",
      "font-family": "Helvetica",
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
app.config(function($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/home')
    $stateProvider.state('user', {
      url:'/user/:id',
      templateUrl : 'pages/user.html',
      controller  : 'UserController',
      params: {
        title: false,
        back: false,
        user: {}
      }
    })
    $stateProvider.state('mention', {
      url:'/mention',
      templateUrl : 'pages/mention.html',
      controller  : 'MentionController',
      params: {
        title: false,
        back: false
      }
    })
      .state('image', {
        url: '/image/:url',
        templateUrl : 'pages/image.html',
        controller  : 'ImageController'
      })

      .state('instagram', {
        url: '/instagram/:url',
        templateUrl : 'pages/instagram-embed.html',
        controller  : 'InstagramController'
      })
      .state('home', {
        url: '/home',
        templateUrl : 'pages/home.html',
        controller  : 'TimelineController',
        params: {
          title: 'Home',
          back: false,
          user: {}
        }
      });

});

// filters
app.filter('html', ['$sce', function($sce){
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);
app.filter('profile_image', ['$sce', function($sce){
    return function(user) {
        return user.profile_image_url.replace('_normal', '_bigger');
    };
}]);

app.filter('tweetEntity', ['$sce', '$rootScope', function($sce, $rootScope){
  var el = document.createElement('p')
  return function(tweet) {
    var escapeHTML = function(text) {
      el.textContent = text
      return el.innerHTML
    }
    var linkify_entities = function(tweet) {
        if (!(tweet.entities)) {
            return escapeHTML(tweet.text)
        }
        // This is very naive, should find a better way to parse this
        var index_map = {}
        Array.prototype.forEach.call(tweet.entities.urls, function(entry, i) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {
              if (m = entry.expanded_url.match('https?:\/\/instagram\.com\/p\/[a-zA-Z0-9]+')) {
                return "<a class='instagram' data-url='"+m[0]+"' href='"+escapeHTML(entry.url)+"'>"+escapeHTML(entry.display_url)+"</a>"
                // return "<webview src='"+m[0]+"/embed/?v=4'></webview>";
              }
              return "<a class='url' target='_blank' href='"+escapeHTML(entry.url)+"'>"+escapeHTML(entry.display_url)+"</a>"
            }]
        })

        Array.prototype.forEach.call(tweet.entities.hashtags, function(entry, i) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a class='hashtag' href='http://twitter.com/search?q="+escape("#"+entry.text)+"'>"+escapeHTML(text)+"</a>"}]
        })

        Array.prototype.forEach.call(tweet.entities.symbols, function(entry, i) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a class='symbol' href='http://twitter.com/search?q="+escape("$"+entry.text)+"'>"+escapeHTML(text)+"</a>"}]
        })

        Array.prototype.forEach.call(tweet.entities.user_mentions, function(entry, i) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a class='mention' title='"+escapeHTML(entry.name)+"' href='http://twitter.com/"+escapeHTML(entry.screen_name)+"'>"+escapeHTML(text)+"</a>"}]
        })

        var media = tweet.entities.media
        if (tweet.extended_entities && tweet.extended_entities.media)
          media = tweet.extended_entities.media
        if (media) {
          var val = ""
          Array.prototype.forEach.call(media, function(entry, i) {
            if ($rootScope.settings['image-preview'])
              val +=  "<div class='media' data-url='"
                + escapeHTML(entry.media_url)
                + "' style='background-image:url("+escapeHTML(entry.media_url)+":small)'></div>"
            else
              val +=  "<a title='"+escapeHTML(entry.name)+"' href='http://twitter.com/"+escapeHTML(entry.screen_name)+"'>"+escapeHTML(entry.display_url)+"</a>"
          })
          index_map[media[0].indices[0]] = [media[0].indices[1], "<div class='medias num"+media.length+"'>" + val + "</div>" ]
        }

        var result = ""
        var last_i = 0
        var i = 0

        // iterate through the string looking for matches in the index_map
        for (i=0; i < tweet.text.length; ++i) {
            var ind = index_map[i]
            if (ind) {
                var end = ind[0]
                var func = ind[1]
                if (i > last_i) {
                    result += escapeHTML(tweet.text.substring(last_i, i))
                }
                if (typeof func === "string")
                  result += func;
                else
                  result += func(tweet.text.substring(i, end))
                i = end - 1
                last_i = end
            }
        }

        if (i > last_i) {
            result += escapeHTML(tweet.text.substring(last_i, i))
        }
        return result
    }
    return $sce.trustAsHtml(linkify_entities(tweet))
  };
}]);




app.directive("ngRepeatHooks", [function() {
    return {
        restrict: "A",

        link: function(scope, el, attrs) {
            var startExp = attrs.ngRepeatFirst,
                endExp = attrs.ngRepeatLast;

            if (scope.$first && startExp) {
                scope.$eval(startExp);
            }
            else if (scope.$last && endExp) {
                scope.$eval(endExp);
            }
        }
    };
}]);
