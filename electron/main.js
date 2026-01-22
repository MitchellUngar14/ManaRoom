const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// URL to load - development server or production build
const DEV_URL = 'http://localhost:3000';
const PROD_URL = 'https://manaroom.vercel.app'; // Your deployed site

function createWindow() {
  // Determine if we're in development or production (must be checked after app is ready)
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/icon-512.png'),
    title: 'ManaRoom',
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app - dev server in development, deployed site in production
  const url = isDev ? DEV_URL : PROD_URL;
  mainWindow.loadURL(url);

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow popout windows for the opponent battlefield feature
    if (url.includes('/opponent-view')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1200,
          height: 800,
          title: "Opponent's Battlefield - ManaRoom",
          autoHideMenuBar: true,
        },
      };
    }
    // Open other external links in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
