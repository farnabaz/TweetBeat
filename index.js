var app = require('app'),  // Module to control application life.
    path = require('path'),
    url = require('url'),
    ipc = require('ipc');  // Messaging module
var appMenu = require('./js/lib/app-menu.js'), // Main Menu
    Stream = require('./js/lib/stream.js'),   //  Stream
    BrowserWindow = require('browser-window');  // Module to create native browser window.

var access_token = 'bTlLaojY35mPdff9OiyQjhwbZ',
    access_token_secret = 'InibZYqGPcuI9b06hpj0gMi4YpKymx6bFUeKol3ZMIWot5YoJ2'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null,
    webContents = null,
    userStream = null;

global.tweets = []

// In main process.
ipc.on('oauth-tokens', function(event, arg) {
  if (userStream == null) {
    tokens = JSON.parse(arg);
    if (tokens.length > 0) {
      for (i in tokens) {
        connect(i, tokens[i].name, tokens[i].token, tokens[i].secret);
      }
    }
  }
});

function connect(index, name, oauth_token, oauth_token_secret) {
  userStream = new Stream({
      consumer_key: access_token,
      consumer_secret: access_token_secret,
      access_token_key: oauth_token,
      access_token_secret: oauth_token_secret
  });
  userStream.stream()
  userStream.on('connected', function() {
    if (webContents != null) {
      webContents.send('stream-connected');
    }
    console.log('connected');
  })
  userStream.on('data', function(data) {
    if (webContents != null) {
      if (data.id_str) {
        tweets.push(data)
        webContents.send('stream-tweet', data)
      } else if (data.delete) {
        webContents.send('stream-delete', data)
      } else if (data.event == "favorite") {
        webContents.send('stream-favorite', data)
      } else if (data.event == "follow") {
        webContents.send('stream-follow', data)
      } else if (data.event == "quoted_tweet") {
        webContents.send('stream-quoted_tweet', data)
      } else {
        console.log(data);
      }
    }
  })
  userStream.on('garbage', function(json) {
    // TODO: need implement
  });
  userStream.on('error', function(json) {
    // TODO: need implement
  });
  userStream.on('end', function() {
    // TODO: need implement
  });
  userStream.on('close', function() {
    // TODO: need implement
  });
}

function setupProtocol () {
  var protocol = require('protocol');
  protocol.registerStandardSchemes(['app']);
  protocol.registerFileProtocol('app', function (request, callback) {
    // Parse the URL
    var parsedUri = url.parse(request.url);

    // Get the app directory from the registry.
    var appPath = __dirname;

    var filePath = path.join(appPath, parsedUri.pathname || '');

    callback(filePath);
  });
}

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 370, height: 800, "min-width": 370});
  webContents = mainWindow.webContents
  // and load the index.html of the app.
  mainWindow.loadUrl('app://tweetbeat.app'  + '/index.html');

  // Open the devtools.
  // mainWindow.openDevTools({detach: true});

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    webContents = null
  });
}
// Report crashes to our server.
require('crash-reporter').start();

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  setupProtocol();

  // Initialize Menu
  appMenu.init()

  // Initialize Main Window
  createMainWindow()
});
app.on('activate-with-no-open-windows', function(){
  // Initialize Main Window
  createMainWindow()
})
