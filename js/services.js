angular.module('tweetbeat.services', [])
.factory('$api', function() {
  var urls = {
    oauthUrl: "https://api.twitter.com/oauth/authenticate?oauth_token=",
    homeTimeline: "https://api.twitter.com/1.1/statuses/home_timeline.json",
    userTimeline: "https://api.twitter.com/1.1/statuses/user_timeline.json",
    mentionTimeline: "https://api.twitter.com/1.1/statuses/mentions_timeline.json",
    statusUpdate: "https://api.twitter.com/1.1/statuses/update.json",
    userStream: "https://userstream.twitter.com/1.1/user.json",
    userInfo: "https://api.twitter.com/1.1/users/show.json",
    favoriteCreate: "https://api.twitter.com/1.1/favorites/create.json",
    verify : "https://api.twitter.com/1.1/account/verify_credentials.json",
    retweet: "https://api.twitter.com/1.1/statuses/retweet/:id.json",
    upload: "https://upload.twitter.com/1.1/media/upload.json",

    // GET
    status: "https://api.twitter.com/1.1/statuses/show/:id.json"
  }
  var BrowserWindow = Remote.require('browser-window'),
      OAuth = require('oauth').OAuth;

  var oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    'bTlLaojY35mPdff9OiyQjhwbZ',
    'InibZYqGPcuI9b06hpj0gMi4YpKymx6bFUeKol3ZMIWot5YoJ2',
    '1.0A',
    null,
    'HMAC-SHA1'
  );
  var access = JSON.parse(localStorage.oauthTokens || "[]"),
      activeAccount = 0
  return  {
    me: function(callback){
      this.isReady() && oauth.get(urls.verify, access[activeAccount].token, access[activeAccount].secret
        , function(error, data, response){
        callback(error, data, response)
      })
    },
    favoriteCreate: function(tweet, callback) {
      this.isReady() && oauth.post(urls.favoriteCreate, access[activeAccount].token, access[activeAccount].secret
        , {id: tweet.id_str}
        , function(error, data, response){
        callback(error, data, response)
      })
    },
    upload:function(file, callback) {
      opt = {
        media_data: file
      }
      this.isReady() && oauth.post(urls.upload, access[activeAccount].token, access[activeAccount].secret, opt, 'multipart/form-data', function(error, data, response){
        callback(error, data, response)
      })
    },
    tweet: function(status, opt , callback) {
      opt = opt || {}
      opt.status = status
      this.isReady() && oauth.post(urls.statusUpdate, access[activeAccount].token, access[activeAccount].secret, opt, function(error, data, response){
        callback(error, data, response)
      })
    },
    retweet: function(id , callback) {
      opt = {}
      this.isReady() && oauth.post(urls.retweet.replace(':id', id), access[activeAccount].token, access[activeAccount].secret, opt, function(error, data, response){
        callback(error, data, response)
      })
    },
    isReady: function(account) {
      account = account || activeAccount
      return !!access[account]
    },
    status: function(id, callback) {
      this.isReady() && oauth.get(urls.status.replace(':id', id), access[activeAccount].token, access[activeAccount].secret, function (error, data, response) {
        callback(error, data, response)
      })
    },
    homeTimeline: function(opt, callback) {
      opt = opt || {}
      this.isReady() && oauth.get(urls.homeTimeline + '?' + $.param(opt), access[activeAccount].token, access[activeAccount].secret, function (error, data, response) {
        callback(error, data, response)
      })
    },
    userTimeline: function(opt, callback) {
      opt = opt || {}
      this.isReady() && oauth.get(urls.userTimeline + '?' + $.param(opt), access[activeAccount].token, access[activeAccount].secret, function (error, data, response) {
        callback(error, data, response)
      })
    },
    userInfo: function(opt, callback) {
      opt = opt || {}
      this.isReady() && oauth.get(urls.userInfo + '?' + $.param(opt), access[activeAccount].token, access[activeAccount].secret, function (error, data, response) {
        callback(error, data, response)
      })
    },
    mentionTimeline: function(opt, callback) {
      opt = opt || {}
      this.isReady() && oauth.get(urls.mentionTimeline + '?' + $.param(opt), access[activeAccount].token, access[activeAccount].secret, function (error, data, response) {
        callback(error, data, response)
      })
    },
    oauth: function(callback, account) {
      if (this.isReady(account)) {
        callback(null, access[account].token, access[account].secret);
        return;
      }
      oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if(error) {
          callback(error);
          return;
        }
        var loginWindow = new BrowserWindow({width: 300, height: 500});
        loginWindow.webContents.on('will-navigate', function (event, url) {
          var urlinfo = require('url').parse(url, true);
          if(urlinfo.query.oauth_verifier) {
            oauth.getOAuthAccessToken(oauth_token, oauth_token_secret, urlinfo.query.oauth_verifier, function(error, oauth_access_token, oauth_access_token_secret) {
              if(error) {
                callback(error);
                return;
              }

              access.push({
                name: "Main",
                token: oauth_access_token,
                secret: oauth_access_token_secret
              })
              localStorage.oauthTokens = JSON.stringify(access)
              callback(null, oauth_access_token, oauth_access_token_secret);
              loginWindow.close();
            });
          } else {
            callback("oauth not verified")
            loginWindow.close();
          }
          event.preventDefault();
        });
        loginWindow.loadUrl(urls.oauthUrl + oauth_token);
      });
    },
    setAccount: function(account) {
      activeAccount = account
    },
    getAccount: function() {
      return activeAccount
    }
  }
})
// alert
.factory('$ui', function() {
  var BrowserWindow = Remote.require('browser-window')
  var Dialog = Remote.require('dialog')

  return {
    notify: function(title, message, callback) {
      new Notification(title ,{
        title: title,
        body: message
      })
      .onclick = callback
    },
    /**
     *  Show system alerts in current window
     **/
    alert: function(type, message, detail, callback){
      Dialog.showMessageBox(Remote.getCurrentWindow(), {
        buttons: [ "OK" ],
        type: type,
        message: message,
        detail: detail
      }, function(){
        callback && callback()
      });
    },
    openWindow: function(url, opt) {
      opt = opt || {}
      if (url[0] == '/') {
        url = root + url
      }
      // Create the browser window.
      var win = new BrowserWindow({width: 800, height: 600});
      // and load the index.html of the app.
      win.loadUrl(url);
      win.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
      })
    },

    replyTo: function(tweet) {
      // Create the browser window.
      var win = new BrowserWindow({
        width: 330,
        height: 150,
        title: 'Replay',
        'always-on-top': true,
        resizable: false,
        fullscreen: false,
        show: false
      });
      // and load the index.html of the app.
      win.loadUrl('app://tweetbeat.app/tweet.html')
      win.webContents.on('did-finish-load', function() {
        win.webContents.send('data', 'reply', tweet);
        win.show();
      });
    },
    retweet: function(tweet) {
      // Create the browser window.
      var win = new BrowserWindow({
        width: 330,
        height: 150,
        title: 'Retweet',
        'always-on-top': true,
        resizable: false,
        fullscreen: false,
        show: false
      });
      // and load the index.html of the app.
      win.loadUrl('app://tweetbeat.app/tweet.html')
      win.webContents.on('did-finish-load', function() {
        win.webContents.send('data', 'retweet', tweet);
        win.show();
      });
    },
    closeWindow: function(){
      Remote.getCurrentWindow().close()
    },
    showWindow: function(){
      Remote.getCurrentWindow().show()
    },
    hideWindow: function(){
      Remote.getCurrentWindow().hide()
    }
  }
})
