var ipc = require('ipc');
var shell = require('shell');

//inject the twitterService into the controller
app.controller('MainController', function($rootScope, $scope, $api, $compile, $ui, $localStorage) {

  // send ouath token to main process
  ipc.send('oauth-tokens', localStorage.oauthTokens || "[]");
  ipc.send('preferences', $rootScope.settings);
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
     */
    var el = document.createElement('p')
    var escapeHTML = function(text) {
      el.innerHTML = text
      return el.textContent
    }
    $scope.linkify_entities = function(tweet) {
        if (!(tweet.entities)) {
            return escapeHTML(tweet.text)
        }
        // This is very naive, should find a better way to parse this
        var index_map = {}
        Array.prototype.forEach.call(tweet.entities.urls, function(entry, i) {
            index_map[entry.indices[0]] = [entry.indices[1], function(text) {
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

        if (tweet.entities.media) {
          Array.prototype.forEach.call(tweet.entities.media, function(entry, i) {
              index_map[entry.indices[0]] = [entry.indices[1], function(text) {
                if ($rootScope.settings['image-preview'])
                  return "<div class='media' data-url='"
                    + escapeHTML(entry.media_url)
                    + "' style='background-image:url("+escapeHTML(entry.media_url)+":small)'></div>"
                else
                  return "<a title='"+escapeHTML(entry.name)+"' href='http://twitter.com/"+escapeHTML(entry.screen_name)+"'>"+escapeHTML(text)+"</a>"
              }]
          })
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
});
app.controller('WindowController', function($scope, $api, $compile, $ui) {

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
    e.preventDefault()
    var el = $(e.target)
    if ( el.is('.media') ) {
      var w = window.open('/window.html#/image/'+btoa(el.data('url')),
      {
        // toolbar: false
      })
    } else if (el.is('[target="_blank"]')) {
      shell.openExternal(el.attr('href'));
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
