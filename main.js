// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { TcpServer } = require('./tcp_server.js');
const { MazeLoader } = require('./maze_loader.js');

const TCP_PORT = 3000;

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    useContentSize: true,
  });

  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  const server = new TcpServer();
  server.listen(TCP_PORT);

  // server.handlePoint = (point) => {
  //   mainWindow.webContents.send('point', point);
  // };

  server.on('set_mouse_position', (x, y, a) => {
    console.log(`Event received (set_mouse_position): ${x}, ${y}, ${a}`);
    mainWindow.webContents.send('mouse_position', { x: x, y: y, a: a });
  });
  server.on('get_mouse_imu_data', () => {
    console.log('Event received (get_mouse_imu_data)');
  });
  server.on('set_maze_title', (str) => {
    console.log('Event received (set_maze_title): ' + str);
    MazeLoader(str).then(
      (result) => {
        console.log(`Maze ${str} loaded successfly`);

        // reload command send for viewer.js
        mainWindow.webContents.send('maze_load', result);
      },
      (err) => {
        console.error(err);
      }
    );
  });
  server.on('set_maze_marker', (arr) => {
    console.log('Event received (set_maze_marker): ' + arr.length);
  });
  server.on('set_path_by_grid', (arr) => {
    console.log('Event received (set_path_by_grid): ' + arr.length);
  });
  server.on('set_path_by_float', (arr) => {
    console.log('Event received (set_path_by_float): ' + arr.length);
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
