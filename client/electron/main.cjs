const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 420,
    minHeight: 600,
    autoHideMenuBar: true,
    title: '雑談パーティー！',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 本番ビルド時はdist/index.htmlをロード
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (app.isPackaged) {
    win.loadFile(indexPath);
  } else {
    // 開発時はlocalhostまたはdistを試す
    win.loadURL('http://localhost:5173').catch(() => {
      win.loadFile(indexPath);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
