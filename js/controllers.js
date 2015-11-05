var ipc = require('ipc');
var shell = require('shell');

//inject the twitterService into the controller
app.controller('MainController', function($rootScope, $scope, $state, $api, $compile, $ui, $localStorage) {
  $scope.searchForm = {
    action: '@',
    show: false
  };
  $scope.isLoggedIn = false
  $scope.isRefreshing = false
  $scope.me = $localStorage.me || {}
  $api.me(function(error, data, response){
    if (!error) {
      $scope.$apply(function(){
        $localStorage.me = JSON.parse(data)
        $scope.me = $localStorage.me
      })
    }
  })

  // send ouath token to main process
  ipc.send('oauth-tokens', localStorage.oauthTokens || "[]");
  ipc.send('preferences', $rootScope.settings);
  ipc.on('stream-tweet', function(arg) {
    $scope.$apply(function(){
      $scope.tweets[arg.id_str] = arg
      $scope.tweets_order.unshift(arg.id_str)
    })
  });
  ipc.on('stream-favorite', function(item) {
    $ui.notify(item.source.name + " favorited", item.target_object.text, function(){
      // TODO: goto notifications
    })
  });
  ipc.on('stream-quoted-tweet', function(item) {
    $ui.notify(item.source.name + " quote one of your tweets", item.target_object.text, function(){
      // TODO: goto notifications
    })
  });
  ipc.on('menu-goto-user', function(){
    $scope.$apply(function(){
      $scope.searchForm.q = ''
      $scope.searchForm.action = '@'
      $scope.searchForm.show = true
      document.querySelector('#searchbar .query').focus()
    })
  })
  ipc.on('menu-tweet-search', function(){
    $scope.$apply(function(){
      $scope.searchForm.q = ''
      $scope.searchForm.action = '?'
      $scope.searchForm.show = true
      document.querySelector('#searchbar .query').focus()
    })
  })
  document.onkeyup = function(e) {
    if (e.keyCode == 27) { // ESC
      if ($scope.searchForm.show) {
        $scope.$apply(function(){
          $scope.searchForm.show = false
        })
      }
    }
  }
  $scope.doSearch = function(data) {
    if (!data.q)
      return;
    if (data.action == '@') {
      $('#main').removeClass('back')
      $state.go('user', {
        id: data.q,
        back: $state.params.title,
        title: ""
      });
    }

    $scope.searchForm.show = false
  }


  $scope.tweets = {}; //array of tweets
  $scope.tweets_order = [];
  $scope.updateOrder = function() {
    $scope.tweets_order = Object.keys($scope.tweets)
    $scope.tweets_order.sort().reverse()
  }

  $scope.favorite = function(tid) {
    var tweet = $scope.tweets[tid]
    tweet = tweet.retweeted_status || tweet
    tweet.favorited = true
    $api.favoriteCreate(tweet, function(er, data, res){
      if (!er) {
        var item = JSON.parse(data)
        $scope.$apply(function(){
          $scope.tweets[item.id_str] = item
        })
      } else {
        $scope.$apply(function(){
          $scope.tweets[tid].favorited = false
        })
      }
    });
  }
  $scope.reply = function(tid) {
    var tweet = $scope.tweets[tid]
    $ui.replyTo(tweet)
  }
  $scope.retweet = function(tid) {
    var tweet = $scope.tweets[tid]
    $ui.retweet(tweet)
  }

  $scope.getTitle = function() {
    var $out = "";
    if ($state.params.back)
      $out += '<back>'+$state.params.back+'</back>'

    if ($state.params.title)
      $out += '<b>'+$state.params.title+'</b>'

    if ($out == "") {
      $out = "<b>Home</b>"
    }
    return $out
  }
  $scope.titleClicked = function(e) {
    var el = $(e.target)
    if (el.is('back')) {
      $('#main').addClass('back')
      window.history.back()
    }
  }

  $scope.click = function(e) {
    e.preventDefault()
    var el = $(e.target)
    if ( el.is('.media') ) {
      var w = window.open('/window.html#/image/'+btoa(el.data('url')),
      {
        // toolbar: false
      })
    } else if (el.is('.instagram')){
        var w = window.open('/window.html#/instagram/'+btoa(el.data('url')),
        {
          toolbar: false,
          width:500,
          height: 600
        },"width=500, height=600, title=TweetBeat")
    } else if (el.is('[target="_blank"]')) {
      shell.openExternal(el.attr('href'));
    } else if (el.is('.user-image')) {
      var tid = el.parents('.tweet').attr('id')
      var user = $scope.tweets[tid].retweeted_status && $scope.tweets[tid].retweeted_status.user
        || $scope.tweets[tid].user
      $('#main').removeClass('back')
      $state.go('user', {
        id: user.screen_name,
        back: $state.params.title,
        title: user.name,
        user: user
      });
    } else if (el.is('.mention')) {
        var match = el.attr('href').match(/https?:\/\/(www\.)?twitter.com\/([^\/]*)/i)
        if (match) {
          $('#main').removeClass('back')
          $state.go('user', {
            id: match[2],
            back: $state.params.title,
            title: ""
          });
        }
    } else if (el.is('div.text')){
      $state.go('status', {
        id: el.parents('.tweet').attr('id'),
        back: $state.params.title,
        title: ""
      });
    }
  }

  $scope.activeSection = function(section) {
    $('#sidebar .icon').removeClass('active')
    $('#sidebar .'+section).addClass('active')
  }


  $scope.startLoading = function() {
    $scope.isRefreshing = true
  }

  $scope.stopLoading = function() {
    $scope.isRefreshing = false
  }

  $scope.loggedIn = function() {
    $scope.isLoggedIn = true
  }

});
app.controller('WindowController', function($scope, $api, $compile, $ui) {

})

// create the controller and inject Angular's $scope
app.controller('TimelineController', function($scope, $rootScope, $api, $ui, $state, $templateCache) {
  $scope.title = "Home"
  $scope.hasMore = true;
  $scope.activeSection('home')
  $scope.loadMore = function() {
    console.log('loadMore');
    if ($api.isReady()) {
      $scope.loggedIn()
      $scope.refreshTimeline()
    }
  }

  $scope.refreshTimeline = function(options) {
    $scope.startLoading()
    options = options || {}
// TODO:
    if ($scope.tweets_order.length > 0) {
      options.max_id = $scope.tweets_order[$scope.tweets_order.length-1]
    }
    options.count = 60


    $api.homeTimeline(options, function(error, data){
      if (error) {
        var data = JSON.parse(error.data)
        if ( data.errors && data.errors[0] )
          $ui.alert('error', 'Sending Fail!!!',  data.errors[0].message)
        else
          $ui.alert('error', 'Sending Fail!!!',  "Something went wrong, Please try again.")

        $scope.$apply(function(){
          $scope.stopLoading()
        })
      } else {
        $scope.$apply(function(){
          var items = JSON.parse(data)
          if (items.length == 0)
            $scope.hasMore = false
          items.forEach(function(item){
            $scope.tweets[item.id_str] = item
          })
          $scope.updateOrder()
          $scope.stopLoading()
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
         $scope.loggedIn()
         ipc.send('oauth-tokens', localStorage.oauthTokens || "[]")
       }
     })
   }



  window.reload = function() {
    $scope.$apply(function(){
      if ($api.isReady()) {
        $scope.loggedIn()
        $scope.refreshTimeline()
      }
    })
  }
});
app.controller('UserController', function($scope, $state, $api){
  $scope.userTweets = {}
  $scope.userTweetsOrder = {}
  $scope.user = $state.params.user || {screen_name:$state.params.id}

  $scope.hasMore = true;
  var options = {
    screen_name: $state.params.id,
  }
  $api.userInfo(options, function(error, data){
    if (!error) {
      $scope.$apply(function(){
        $scope.user = JSON.parse(data)
        $state.params.title = $scope.user.name;
      })
    }
  })

  $scope.loadMore = function() {
    $scope.startLoading()
    var options = {
      screen_name: $state.params.id,
      count: 60
    }
    if ($scope.userTweetsOrder.length > 0) {
      options.max_id = $scope.userTweetsOrder.last()
    }
    $api.userTimeline(options, function(error, data){
      if (!error) {
        $scope.$apply(function(){
          var items = JSON.parse(data).reverse()
          items.forEach(function(item){
            $scope.userTweets[item.id_str] = item
          })
          $scope.userTweetsOrder = Object.keys($scope.userTweets).sort().reverse()


        })
      }
      $scope.stopLoading()
    })
  }


})

app.controller('MentionController', function($scope, $state, $api){
  $scope.userTweets = {}
  $scope.userTweetsOrder = {}
  $scope.user = $state.params.user
  $scope.activeSection('mentions')
  $scope.hasMore = true;

  $scope.loadMore = function() {
    $scope.startLoading()
    var options = {
      screen_name: $state.params.id,
      count: 60
    }
    if ($scope.userTweetsOrder.length > 0) {
      options.max_id = $scope.userTweetsOrder.last()
    }
    $api.mentionTimeline(options, function(error, data){
      if (!error) {
        $scope.$apply(function(){
          var items = JSON.parse(data).reverse()
          console.log(items);
          items.forEach(function(item){
            $scope.userTweets[item.id_str] = item
          })
          $scope.userTweetsOrder = Object.keys($scope.userTweets).sort().reverse()


        })
      }
      $scope.stopLoading()
    })
  }


})
/*
 * StatusController
 */
 app.controller('StatusController', function($scope, $state, $api){
    $scope.status = $scope.tweets[$state.params.id] || {};
    var id = $state.params.id
    if (id) {
      $api.status(id, function(error, data){
        $scope.$apply(function(){
          if (!error) {
            $scope.status = JSON.parse(data)
            console.log($scope.status);
          }
        })
      })
    }
})


app.controller('ImageController', function($scope,$state) {
  $scope.url = atob($state.params.url);
});
app.controller('InstagramController', function($scope,$state, $sce) {
  $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  }
  $scope.url = $sce.trustAsResourceUrl(atob($state.params.url) + '/embed/?v=4');
});
