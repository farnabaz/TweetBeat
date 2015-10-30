module.exports = {
  template: function(application) {
    var template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Tweet',
            accelerator: 'CmdOrCtrl+N',
            click: function(item, focusedWindow) {
              application.newTweet()
            }
          },
          {
            label: 'New Direct Message',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: function(item, focusedWindow) {
              application.newDirect()
            }
          },
          { type: 'separator' },
          {
            label: 'Go to user',
            accelerator: 'CmdOrCtrl+U',
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.webContents.send("menu-goto-user");
            }
          },
          { type: 'separator' },
          {
            label: 'Refresh',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.webContents.send("menu-reload");
            }
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          },
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
          },{
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
          },
          { type: 'separator' },{
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
          },{
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
          },{
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
          },{
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
          },
        ]
      },
      {
        label: 'Tweet',
        submenu: [
          {
            label: 'Search',
            accelerator: 'CmdOrCtrl+F',
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.webContents.send("menu-tweet-search");
            }
          },
          { type: 'separator' },
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
          {
            label: 'Toggle Developer Tools',
            accelerator: (function() {
              if (process.platform == 'darwin')
                return 'Alt+Command+I';
              else
                return 'Ctrl+Shift+I';
            })(),
            click: function(item, focusedWindow) {
              if (focusedWindow)
                focusedWindow.toggleDevTools();
            }
          },
        ]
      },
      {
        label: 'Window',
        role: 'window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          { type: 'separator' },
          {
            label: 'Main Widnow',
            accelerator: 'CmdOrCtrl+\\',
            click: function(item, focusedWindow) {
              // TODO: focus or create main window
            }
          },
          { type: 'separator' },
          {
            label: 'Home',
            accelerator: 'CmdOrCtrl+1',
            click: function(item, focusedWindow) {
              // TODO: goto Home
            }
          },
          {
            label: 'Notifications',
            accelerator: 'CmdOrCtrl+2',
            click: function(item, focusedWindow) {
              // TODO: goto Notifications
            }
          },
          {
            label: 'Messages',
            accelerator: 'CmdOrCtrl+3',
            click: function(item, focusedWindow) {
              // TODO: goto Messages
            }
          },
          {
            label: 'Lists',
            accelerator: 'CmdOrCtrl+4',
            click: function(item, focusedWindow) {
              // TODO: goto Lists
            }
          },
          {
            label: 'Search',
            accelerator: 'CmdOrCtrl+5',
            click: function(item, focusedWindow) {
              // TODO: goto Search
            }
          },
        ]
      },
      {
        label: 'Help',
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: function() { require('shell').openExternal('http://farnabaz.ir') }
          },
        ]
      },
    ];


    if (process.platform == 'darwin') {
      var name = application.appModule().getName();
      template.unshift({
        label: name,
        submenu: [
          {
            label: 'About ' + name,
            selector: 'orderFrontStandardAboutPanel:'
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'Command+,',
            click: function(){
              application.openPreferences()
            }
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          { type: 'separator' },
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
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            selector: 'terminate:'
          },
        ]
      });
      // Window menu.
      template[3].submenu.push(
        { type: 'separator' },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      );
    }
    return template
  },
  update: function(application){
    var menu = application.menuModue().buildFromTemplate(this.template(application))
    application.menuModue().setApplicationMenu(menu);
  }
}
