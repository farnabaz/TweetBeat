var app = require('app');
var Path = require('path')
var Menu = require('menu')
var Tray = require('tray')
var Url = require('url')
var IPC = require('ipc');  // Messaging module
var Notifier = require('node-notifier');
var Stream = require('./stream.js')
var AppMenu = require('./app-menu.js')

// app.commandLine.appendSwitch('proxy-server', 'http://165.139.179.225:8080');


var BrowserWindow = require('browser-window');
/**
 *  Apllicaiton Access tokens
 *
 **/
var access_token = 'bTlLaojY35mPdff9OiyQjhwbZ',
    access_token_secret = 'InibZYqGPcuI9b06hpj0gMi4YpKymx6bFUeKol3ZMIWot5YoJ2'
var Internal = {

  userStream: {},
  /**
   *  Setup Application Protocol
   *    create standard schema `app`
   *
   **/
  setupProtocol: function() {
    var Protocol = require('protocol');
    Protocol.registerStandardSchemes(['app']);
    Protocol.registerFileProtocol('app', function (request, callback) {
      // Parse the URL
      var parsedUri = Url.parse(request.url);

      var filePath = Path.join(TweetBeat.root, parsedUri.pathname || '');

      callback(filePath);
    });
  },
  registerIPC: function() {
    IPC.on('oauth-tokens', function(event, arg) {
      var tokens = JSON.parse(arg);
      for (i in tokens) {
        if (!Internal.userStream[tokens[i].name])
          Internal.connect(i, tokens[i].name, tokens[i].token, tokens[i].secret);
      }
    });
    IPC.on('preferences', function(event, arg){
      TweetBeat.preferences = arg
    })
  },
  connect: function(index, name, oauth_token, oauth_token_secret) {
    this.userStream[name] = new Stream({
        consumer_key: access_token,
        consumer_secret: access_token_secret,
        access_token_key: oauth_token,
        access_token_secret: oauth_token_secret
    });
    var _stream = this.userStream[name]
    _stream.stream()
    _stream.on('connected', function() {
      if (TweetBeat._mainWindow != null) {
        TweetBeat._mainWindow.webContents.send('stream-connected');
      }
      console.log('connected');
    })
    _stream.on('data', function(data) {
      if (TweetBeat.mainWindow() != null) {
        if (data.id_str) {
          TweetBeat.mainWindow().webContents.send('stream-tweet', data)
        } else if (data.delete) {
          TweetBeat.mainWindow().webContents.send('stream-delete', data)
        } else if (data.event == "favorite") {
          TweetBeat.mainWindow().webContents.send('stream-favorite', data)
        } else if (data.event == "follow") {
          TweetBeat.mainWindow().webContents.send('stream-follow', data)
        } else if (data.event == "quoted_tweet") {
          TweetBeat.mainWindow().webContents.send('stream-quoted_tweet', data)
        } else {
          console.log(data);
        }
      } else {
        Internal.notify(data);
      }
    })
    _stream.on('garbage', function(json) {
      // TODO: need implement
      console.log("garbage");
    });
    _stream.on('error', function(json) {
      // TODO: need implement
      console.log(json);
    });
    _stream.on('end', function() {
      // TODO: need implement
      console.log("end");
    });
    _stream.on('close', function() {
      // TODO: need implement
      console.log("close");
    });
  },

  notify: function(data) {
    var types = [],
      title = void 0,
      subtitle = void 0,
      message = void 0
    if (data.id_str) {
      types = TweetBeat.preferences['notify-tweets'] || []
      data = data.retweeted_status || data.quoted_status || data
      title = data.user.name + " - @" + data.user.screen_name
      message = data.text
    } else if (data.event == "favorite") {
      types = TweetBeat.preferences['notify-favorites'] || []
      title = data.source.name + " favorited"
      messages = json.target_object.text
    } else if (data.event == "quoted_tweet") {
      types = TweetBeat.preferences['notify-retweets'] || []
      title = data.source.name + " retweeted"
      messages = json.target_object.text
    }

    if (types.indexOf("notification center") > -1) {
      Notifier.notify({
        title: title,
        subtitle: subtitle,
        message: message,
        sender: "com.github.electron"
      })
    }
    if (types.indexOf("dock icon") > -1) {

    }
    if (types.indexOf("menubar") > -1) {

    }
  }
}
var TweetBeat = {
  /**
   *  application root directory
   *
   **/
  root: null,
  /**
   *  Main Widnow of App
   *
   **/
  _mainWindow: null,
  /**
   *  Application tray Icon
   *
   **/
  _tray: null,
  /**
   *  Number of unread Notifications
   *
   **/
  _unreadNotifications: 0,
  /**
   *  Number of unread messages
   *
   **/
  _unreadMessages: 0,
  /**
   *  User Preferences
   *
   **/
  preferences: {},
  /**
   *  Initialize Applicaiton
   *
   **/
  init: function(root){
    this.root = root
    // Electron crash reporter
    require('crash-reporter').start();

    // Quit when all windows are closed.
    app.on('window-all-closed', function() {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform != 'darwin') {
        app.quit();
      }
    });

    // Application focus when no open window
    app.on('activate-with-no-open-windows', function(){
      // Initialize Main Window
      TweetBeat.mainWindow(true).show()
    })

    app.on('ready', function(){
      Internal.setupProtocol()
      Internal.registerIPC()
      Notifier.on('click', function (notifierObject, options) {
        // Happens if `wait: true` and user clicks notification
        TweetBeat.mainWindow(true).show()
      })

      TweetBeat.updateDocMenu()

      TweetBeat.updateTray()

      TweetBeat.mainWindow(true)

      AppMenu.update(TweetBeat)

    })
  },
  /**
   *  Increase unread notifications count
   *
   **/
  addUnreadNotification: function(count) {
    this._unreadNotifications += parseInt(count || 1)
    this.updateDocMenu()
    this.updateTray()
  },
  /**
   *  Decrease unread notifications count
   *
   **/
  removeUnreadNotification: function(count) {
    this._unreadNotifications -= parseInt(count || 1)
    this._unreadNotifications = Math.max(0, this._unreadNotifications)
    this.updateDocMenu()
    this.updateTray()
  },
  /**
   *  Increase unread messages count
   *
   **/
  addUnreadMessage: function(count) {
    this._unreadMessages += parseInt(count || 1)
    this.updateDocMenu()
    this.updateTray()
  },
  /**
   *  Decrease unread messages count
   *
   **/
  removeUnreadMessage: function(count) {
    this._unreadMessages -= parseInt(count || 1)
    this._unreadMessages = Math.max(0, this._unreadMessages)
    this.updateDocMenu()
    this.updateTray()
  },
  /**
   *  Update Applicaiton Doc menu - currently only OSX supports this feature
   *
   **/
  updateDocMenu: function() {
    if ( process.platform == 'darwin') {
      var dockMenu = Menu.buildFromTemplate([
        { label: 'New Tweet', click: function() {
            TweetBeat.newTweet()
         } },
        { label: 'New Direct Message', click: function() {
            TweetBeat.newDirect()
         } },
      ]);
      app.dock.setMenu(dockMenu);

      if (this._unreadMessages + this._unreadNotifications > 0) {
        app.dock.setBadge((this._unreadMessages + this._unreadNotifications) + '')
      } else {
        app.dock.setBadge('')
      }
    }
  },
  /**
   *  Update applicatio tray icon
   *
   **/
  updateTray: function() {
    if (this._tray == null) {
      this._tray = new Tray(this.root + "/images/tray.png");
      this._tray.setPressedImage(this.root + "/images/tray_pressed.png")
      this._tray.on('clicked', function(){
        var mw = TweetBeat.mainWindow(true)
        mw.isVisible() && mw.isFocused() ? mw.hide() : mw.show()
      })
    }
    if (this._unreadMessages) {
      this._tray.setImage(this.root + "/images/tray_message.png")
    } else if (this._unreadNotifications) {
      this._tray.setImage(this.root + "/images/tray_notification.png")
    } else {
      this._tray.setImage(this.root + "/images/tray.png")
    }
  },
  /**
   *  Create Main Window or return current existing one
   *
   **/
  mainWindow: function(create){
    if (this._mainWindow == null && create) {
      this._mainWindow = new BrowserWindow({
        width: 370,
        height: 700,
        frame: false
      })
      this._mainWindow.loadUrl('app://tweetbeat.app/index.html')

      this._mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        TweetBeat._mainWindow = null;
      });
    }

    return this._mainWindow
  },
  /**
   *  Create new tweet window
   *
   **/
  newTweet: function() {
    var tweet = new BrowserWindow({
      width: 330,
      height: 150,
      title: 'New Tweet',
      'always-on-top': true,
      resizable: false,
      fullscreen: false,
      show: false
    })
    tweet.loadUrl('app://tweetbeat.app/tweet.html')
    tweet.webContents.on('did-finish-load', function() {
      tweet.show();
    });
  },
  // replyTo: function(tweet) {
  //   var reply = new BrowserWindow({
  //     width: 330,
  //     height: 150,
  //     title: 'Replay',
  //     'always-on-top': true,
  //     resizable: false,
  //     fullscreen: false,
  //     show: false
  //   })
  //   reply.loadUrl('app://tweetbeat.app/tweet.html/'+tweet.id_str+"/"+tweet.user.id)
  //   reply.webContents.on('did-finish-load', function() {
  //     tweet.reply();
  //   });
  // },
  /**
   *  Create new direct message window
   *
   **/
  newDirect: function() {
    var direct = new BrowserWindow({
      width: 330,
      height: 150,
      title: 'New Direct Message',
      'always-on-top': true,
      resizable: false,
      fullscreen: false,
      show: false
    })
    direct.loadUrl('app://tweetbeat.app/direct.html')
    direct.webContents.on('did-finish-load', function() {
      direct.show();
    });
  },
  /**
   *  Open preferences window
   *
   **/
  openPreferences: function() {
    var preferences = new BrowserWindow({
      width: 600,
      height: 400,
      title: 'New Direct Message',
      resizable: false,
      fullscreen: false,
      show: false
    })
    preferences.loadUrl('app://tweetbeat.app/preferences.html')
    preferences.webContents.on('did-finish-load', function() {
      preferences.show();
    });
  },
  /**
   *  return app module instance
   *
   **/
  appModule: function() {
    return app;
  },
  /**
   *  return BrowserWindow module instance
   *
   **/
  browserWindowModule: function() {
    return BrowserWindow;
  },
  /**
   *  return menu module instance
   *
   **/
  menuModue: function() {
    return Menu;
  }
};

module.exports = TweetBeat
