var Menu = require('menu');
var BrowserWindow = require('browser-window');
var template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Tweet',
        accelerator: 'CmdOrCtrl+N',
        click: function(item, focusedWindow) {
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
        }
      },
      {
        label: 'New Direct Message',
        accelerator: 'CmdOrCtrl+Shift+N',
      },
      {
        type: 'separator'
      },
      {
        label: 'Go to user',
        accelerator: 'CmdOrCtrl+U',
      },
      {
        type: 'separator'
      },
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.executeJavaScript("reload()");
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      // {
      //   label: 'Toggle Developer Tools',
      //   accelerator: (function() {
      //     if (process.platform == 'darwin')
      //       return 'Alt+Command+I';
      //     else
      //       return 'Ctrl+Shift+I';
      //   })(),
      //   click: function(item, focusedWindow) {
      //     if (focusedWindow)
      //       focusedWindow.toggleDevTools();
      //   }
      // },
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        selector: 'performMiniaturize:'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        selector: 'performClose:'
      },
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Learn More',
        click: function() { require('shell').openExternal('http://farnabaz.ir') }
      },
    ]
  },
];


if (process.platform == 'darwin') {
  var name = require('app').getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        selector: 'orderFrontStandardAboutPanel:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + name,
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        selector: 'terminate:'
      },
    ]
  });
  // Window menu.
  template[3].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      selector: 'arrangeInFront:'
    }
  );
}


module.exports = {
  menu: Menu.buildFromTemplate(template),
  init: function(){
    Menu.setApplicationMenu(this.menu);
  }
}
