var ipc = require('ipc');

//inject the twitterService into the controller
app.controller('MainController', function($scope, $api, $compile, $ui) {

  // send ouath token to main process
  ipc.send('oauth-tokens', localStorage.oauthTokens || "[]");
  ipc.on('stream-tweet', function(arg) {
    $scope.$apply(function(){
      $scope.tweets.push(arg)
    })
  });
  ipc.on('stream-favorite', function(json) {
    $ui.notify(json.source.name + " favorited", json.target_object.text, function(){
      // TODO: goto notifications
    })
  });


  $scope.tweets = []; //array of tweets


  $scope.favorite = function(tweet) {
    $api.favoriteCreate(tweet, function(er, data, res){
      console.log(er,data,res);
    });
  }



    /*
     * twitter-entities.js
     * This function converts a tweet with "entity" metadata
     * from plain text to linkified HTML.
     *
     * See the documentation here: http://dev.twitter.com/pages/tweet_entities
     * Basically, add ?include_entities=true to your timeline call
     *
     * Copyright 2010, Wade Simmons
     * Licensed under the MIT license
     * http://wades.im/mons
     *
     * Requires jQuery
     */
    $scope.escapeHTML = function(text) {
        return $('<div/>').text(text).html()
    }
    $scope.linkify_entities = function(tweet) {
        if (!(tweet.entities)) {
            return $scope.escapeHTML(tweet.text)
        }
        // This is very naive, should find a better way to parse this
        var index_map = {}

        $.each(tweet.entities.urls, function(i,entry) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {
              return "<a class='url' target='_blank' href='"+$scope.escapeHTML(entry.url)+"'>"+$scope.escapeHTML(entry.display_url)+"</a>"
            }]
        })

        $.each(tweet.entities.hashtags, function(i,entry) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a href='http://twitter.com/search?q="+escape("#"+entry.text)+"'>"+$scope.escapeHTML(text)+"</a>"}]
        })

        $.each(tweet.entities.user_mentions, function(i,entry) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a class='mention' title='"+$scope.escapeHTML(entry.name)+"' href='http://twitter.com/"+$scope.escapeHTML(entry.screen_name)+"'>"+$scope.escapeHTML(text)+"</a>"}]
        })
        if (tweet.entities.media)
        $.each(tweet.entities.media, function(i,entry) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {
              if (entry.type == "photo")
                return "<div class='media' ng-click='console.log($scope)' data-url='"
                  + $scope.escapeHTML(entry.media_url)
                  + "' style='background-image:url("+$scope.escapeHTML(entry.media_url)+":small)'></div>"
              else
                return "<a title='"+$scope.escapeHTML(entry.name)+"' href='http://twitter.com/"+$scope.escapeHTML(entry.screen_name)+"'>"+$scope.escapeHTML(text)+"</a>"
            }]
        })

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
                    result += $scope.escapeHTML(tweet.text.substring(last_i, i))
                }
                result += func(tweet.text.substring(i, end))
                i = end - 1
                last_i = end
            }
        }

        if (i > last_i) {
            result += $scope.escapeHTML(tweet.text.substring(last_i, i))
        }
        return result
    }
});
app.controller('WindowController', function($scope,$q, $api, $compile, $ui) {
console.log(location.hash);
})

// create the controller and inject Angular's $scope
app.controller('TimelineController', function($scope, $api, $ui) {
  $scope.isLoggedIn = false
  $scope.isRefreshing = false

  $scope.refreshTimeline = function() {
    $scope.isRefreshing = true
    var options = {}
    if ($scope.tweets.length > 0) {
      options.since_id = $scope.tweets[0].id_str
    }

    $api.homeTimeline(options, function(error, data){
      if (error) {
        var data = JSON.parse(error.data)
        if ( data.errors && data.errors[0] )
          $ui.alert('error', 'Sending Fail!!!',  data.errors[0].message)
        else
          $ui.alert('error', 'Sending Fail!!!',  "Something went wrong, Please try again.")

        $scope.$apply(function(){
          $scope.isRefreshing = false
        })
      } else {
        $scope.$apply(function(){
          var items = JSON.parse(data).reverse()
          console.log(items);
          items.forEach(function(item){
            $scope.tweets.push(item)
          })
          $scope.isRefreshing = false
        })
      }
    })
  }

  /**
   *  Retrive oauth access token
   *
   **/
   $scope.login = function() {
     $api.oauth(function(error, oat, pats){
       if (error) {
         console.log(error);
       } else {
         $scope.isLoggedIn = true
         ipc.send('oauth-tokens', localStorage.oauthTokens || "[]")
       }
     })
   }

  $scope.click = function(e) {
    var el = $(e.target)
    if ( el.is('.media') ) {
      var w = window.open('/window.html#/image/'+btoa(el.data('url')),
      {
        // toolbar: false
      })
    } else if (el.is('a')) {
      if (el.is('.fa-star')) {
        var id = el.parents('.tweet').attr('id')

      }
    }
  }



  window.reload = function() {
    $scope.$apply(function(){
      if ($api.isReady()) {
        $scope.isLoggedIn = true
        $scope.refreshTimeline()
      }
    })
    console.log($scope.tweets);
  }
  if ($api.isReady()) {
    $scope.isLoggedIn = true
    $scope.refreshTimeline()
  }
});

app.controller('ImageController', function($scope,$routeParams) {
    $scope.url = atob($routeParams.url);
});
