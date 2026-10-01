/**
 * Flow Kit Desktop â€” Electron Main Process
 *
 * Manages:
 * 1. Python FastAPI Backend lifecycle (auto-spawn on port 8100, health check, graceful kill on exit)
 * 2. Chrome Extension loader (Manifest V3 bridge)
 * 3. Flow Kit Dashboard Window (React SPA on port 8100)
 * 4. Google Flow Window (embedded session with Google sign-in support)
 */

const { app, BrowserWindow, Menu, shell, ipcMain, session, dialog } = require('electron');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_URL = 'http://127.0.0.1:8100';
const HEALTH_URL = `${BACKEND_URL}/health`;
const FLOW_URL = 'https://flow.google.com/';
const EXTENSION_PATH = path.join(ROOT_DIR, 'extension');
const OUTPUT_PATH = path.join(ROOT_DIR, 'output');

// Standard Chrome User-Agent to prevent Google Account Sign-In blocks
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let mainWindow = null;
let splashWindow = null;
let flowWindow = null;
let pythonProcess = null;
let isQuitting = false;

// Set global fallback User-Agent
app.userAgentFallback = CHROME_UA;

// â”€â”€â”€ Python Environment Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function findPythonExecutable() {
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe')
    : path.join(ROOT_DIR, 'venv', 'bin', 'python');

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  // Check PATH fallback
  return isWin ? 'python.exe' : 'python3';
}

// â”€â”€â”€ Backend Health Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function checkHealth(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ ok: res.statusCode === 200, data: json });
        } catch {
          resolve({ ok: res.statusCode === 200, data: null });
        }
      });
    });

    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false });
    });
  });
}

// â”€â”€â”€ Backend Process Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function startBackend(onStatusUpdate) {
  const initialHealth = await checkHealth();
  if (initialHealth.ok) {
    if (onStatusUpdate) onStatusUpdate('Backend Ä‘Ã£ Ä‘ang cháº¡y trÃªn cá»•ng 8100...');
    return true;
  }

  const pythonExec = findPythonExecutable();
  if (onStatusUpdate) onStatusUpdate(`Äang khá»Ÿi Ä‘á»™ng Python (${path.basename(pythonExec)})...`);

  const env = {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    FLOW_AGENT_DIR: ROOT_DIR,
  };

  try {
    pythonProcess = spawn(pythonExec, ['-m', 'agent.main'], {
      cwd: ROOT_DIR,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    pythonProcess.stdout.on('data', (chunk) => {
      const msg = chunk.toString().trim();
      console.log(`[Python stdout] ${msg}`);
    });

    pythonProcess.stderr.on('data', (chunk) => {
      const msg = chunk.toString().trim();
      console.warn(`[Python stderr] ${msg}`);
    });

    pythonProcess.on('exit', (code, signal) => {
      console.log(`[Python] Exited with code ${code}, signal ${signal}`);
      pythonProcess = null;
    });
  } catch (err) {
    console.error('Failed to spawn Python process:', err);
    if (onStatusUpdate) onStatusUpdate(`Lá»—i khá»Ÿi Ä‘á»™ng Python: ${err.message}`);
    return false;
  }

  // Poll until healthy
  const maxAttempts = 40;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (onStatusUpdate) onStatusUpdate(`Äang kiá»ƒm tra káº¿t ná»‘i server (${attempt}/${maxAttempts})...`);
    await new Promise((r) => setTimeout(r, 600));

    const health = await checkHealth();
    if (health.ok) {
      if (onStatusUpdate) onStatusUpdate('Khá»Ÿi Ä‘á»™ng thÃ nh cÃ´ng! Äang táº£i giao diá»‡n...');
      return true;
    }
  }

  return false;
}

function stopBackend() {
  if (pythonProcess && pythonProcess.pid) {
    console.log(`Stopping Python process tree PID: ${pythonProcess.pid}`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${pythonProcess.pid} /T /F`);
      } else {
        process.kill(-pythonProcess.pid, 'SIGTERM');
      }
    } catch (e) {
      console.warn('Error killing Python process:', e.message);
    }
    pythonProcess = null;
  }
}

// â”€â”€â”€ Windows Creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 440,
    height: 360,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
}

function updateSplashStatus(text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('status-update', text);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Flow Kit Desktop',
    backgroundColor: '#090a10',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(BACKEND_URL);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://flow.google.com')) {
      openFlowWindow();
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  setupAppMenu();
}

function openFlowWindow() {
  if (flowWindow && !flowWindow.isDestroyed()) {
    flowWindow.focus();
    return;
  }

  flowWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    title: 'Google Flow â€” Session Browser',
    backgroundColor: '#111827',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:flowkit_google', // persists cookies & login session
    },
  });

  flowWindow.webContents.setUserAgent(CHROME_UA);
  flowWindow.loadURL(FLOW_URL);

  flowWindow.on('closed', () => {
    flowWindow = null;
  });
}

// â”€â”€â”€ Application Menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function setupAppMenu() {
  const template = [
    {
      label: 'Flow Kit',
      submenu: [
        {
          label: 'Má»Ÿ Google Flow trong App',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => openFlowWindow(),
        },
        {
          label: 'Má»Ÿ Google Flow trong Chrome ngoÃ i',
          click: () => shell.openExternal(FLOW_URL),
        },
        { type: 'separator' },
        {
          label: 'Má»Ÿ thÆ° má»¥c Video Ä‘áº§u ra (output)',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (!fs.existsSync(OUTPUT_PATH)) {
              fs.mkdirSync(OUTPUT_PATH, { recursive: true });
            }
            shell.openPath(OUTPUT_PATH);
          },
        },
        {
          label: 'Kiá»ƒm tra tráº¡ng thÃ¡i há»‡ thá»‘ng',
          click: async () => {
            const health = await checkHealth();
            const statusMsg = health.ok
              ? `Backend: OK (Port 8100)\nExtension káº¿t ná»‘i: ${health.data?.extension_connected ? 'ÄÃ£ káº¿t ná»‘i' : 'ChÆ°a káº¿t ná»‘i'}\nPhiÃªn báº£n: ${health.data?.version || '1.3'}`
              : 'Backend: KhÃ´ng pháº£n há»“i trÃªn port 8100!';
            dialog.showMessageBox(mainWindow, {
              type: health.ok ? 'info' : 'error',
              title: 'Tráº¡ng thÃ¡i Flow Kit',
              message: statusMsg,
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Khá»Ÿi Ä‘á»™ng láº¡i Backend',
          click: async () => {
            stopBackend();
            await startBackend((t) => console.log(t));
            if (mainWindow) mainWindow.reload();
          },
        },
        { type: 'separator' },
        {
          label: 'ThoÃ¡t á»©ng dá»¥ng',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Giao diá»‡n',
      submenu: [
        { role: 'reload', label: 'Táº£i láº¡i trang (F5)' },
        { role: 'forceReload', label: 'Táº£i láº¡i cÆ°á»¡ng bá»©c' },
        { role: 'toggleDevTools', label: 'CÃ´ng cá»¥ phÃ¡t triá»ƒn (DevTools)' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Cá»¡ chá»¯ chuáº©n' },
        { role: 'zoomIn', label: 'PhÃ³ng to' },
        { role: 'zoomOut', label: 'Thu nhá»' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ToÃ n mÃ n hÃ¬nh' },
      ],
    },
    {
      label: 'Trá»£ giÃºp',
      submenu: [
        {
          label: 'TÃ i liá»‡u hÆ°á»›ng dáº«n (CLAUDE.md)',
          click: () => {
            const docPath = path.join(ROOT_DIR, 'CLAUDE.md');
            if (fs.existsSync(docPath)) shell.openPath(docPath);
          },
        },
        {
          label: 'Vá» Flow Kit Desktop',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Flow Kit Desktop',
              message: 'Flow Kit Desktop v1.0.0\nHá»‡ thá»‘ng tá»± Ä‘á»™ng hÃ³a sáº£n xuáº¥t video AI cháº¥t lÆ°á»£ng cao.',
              detail: 'TÃ­ch há»£p Google Flow, Veo 3 & Omni Flash.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// â”€â”€â”€ IPC Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ipcMain.on('open-flow-window', () => openFlowWindow());
ipcMain.on('open-external-url', (_, url) => shell.openExternal(url));
ipcMain.on('open-output-folder', () => {
  if (!fs.existsSync(OUTPUT_PATH)) fs.mkdirSync(OUTPUT_PATH, { recursive: true });
  shell.openPath(OUTPUT_PATH);
});

ipcMain.handle('get-system-status', async () => {
  return await checkHealth();
});

ipcMain.handle('restart-backend', async () => {
  stopBackend();
  const ok = await startBackend((t) => console.log(t));
  if (mainWindow && ok) mainWindow.reload();
  return ok;
});

// â”€â”€â”€ App Lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.whenReady().then(async () => {
  createSplashWindow();

  // Strip Electron identifier headers from requests to avoid Google Sign-In blocking
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['X-Requested-With'];
    details.requestHeaders['User-Agent'] = CHROME_UA;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Load Chrome Extension into Electron
  if (fs.existsSync(EXTENSION_PATH)) {
    try {
      await session.defaultSession.loadExtension(EXTENSION_PATH, {
        allowFileAccess: true,
      });
      console.log('âœ“ Chrome Extension loaded successfully into Electron');
    } catch (err) {
      console.warn('Extension load notice:', err.message);
    }
  }

  // Start Python backend
  const backendReady = await startBackend(updateSplashStatus);

  if (backendReady) {
    createMainWindow();
  } else {
    updateSplashStatus('KhÃ´ng thá»ƒ káº¿t ná»‘i Backend. Vui lÃ²ng kiá»ƒm tra Python!');
    dialog.showErrorBox(
      'Khá»Ÿi Ä‘á»™ng tháº¥t báº¡i',
      'KhÃ´ng thá»ƒ khá»Ÿi Ä‘á»™ng tiáº¿n trÃ¬nh Python backend (FastAPI).\nVui lÃ²ng kiá»ƒm tra mÃ´i trÆ°á»ng áº£o venv hoáº·c cÃ i Ä‘áº·t thÆ° viá»‡n.'
    );
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
