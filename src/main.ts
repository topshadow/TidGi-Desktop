/* eslint-disable @typescript-eslint/no-misused-promises */
import { uninstall } from './helpers/installV8Cache';
import 'source-map-support/register';
import 'reflect-metadata';
import './helpers/singleInstance';
import './helpers/configSetting';
import fs from 'fs-extra';
import path from 'path';
import { ipcMain, protocol, powerMonitor, app } from 'electron';
import settings from 'electron-settings';
import unhandled from 'electron-unhandled';

import { buildLanguageMenu } from '@services/menu/buildLanguageMenu';
import { MainChannel } from '@/constants/channels';
import { isTest } from '@/constants/environment';
import { container } from '@services/container';
import { logger } from '@services/libs/log';
import { initRendererI18NHandler } from '@services/libs/i18n';

import serviceIdentifier from '@services/serviceIdentifier';
import { WindowNames } from '@services/windows/WindowProperties';
import { bindServiceAndProxy } from '@services/libs/bindServiceAndProxy';

import type { IPreferenceService } from './services/preferences/interface';
import type { IWikiService } from './services/wiki/interface';
import type { IWindowService } from './services/windows/interface';
import type { IWorkspaceViewService } from './services/workspacesView/interface';
import type { IUpdaterService } from '@services/updater/interface';
import { reportErrorToGithubWithTemplates } from '@services/native/reportError';
import { IWikiGitWorkspaceService } from '@services/wikiGitWorkspace/interface';
import { isLinux, isMac } from './helpers/system';

logger.info('App booting');

app.commandLine.appendSwitch('--disable-web-security');
protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: 'https', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: 'mailto', privileges: { standard: true } },
]);
bindServiceAndProxy();
const preferenceService = container.get<IPreferenceService>(serviceIdentifier.Preference);
const windowService = container.get<IWindowService>(serviceIdentifier.Window);
const updaterService = container.get<IUpdaterService>(serviceIdentifier.Updater);
const wikiGitWorkspaceService = container.get<IWikiGitWorkspaceService>(serviceIdentifier.WikiGitWorkspace);
const workspaceViewService = container.get<IWorkspaceViewService>(serviceIdentifier.WorkspaceView);
app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  const mainWindow = windowService.get(WindowNames.main);
  if (mainWindow !== undefined) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});
// make sure "Settings" file exists
// if not, ignore this chunk of code
// as using electron-settings before app.on('ready') and "Settings" is created
// would return error
// https://github.com/nathanbuchar/electron-settings/issues/111
if (fs.existsSync(settings.file())) {
  void preferenceService.get('useHardwareAcceleration').then((useHardwareAcceleration) => {
    if (!useHardwareAcceleration) {
      app.disableHardwareAcceleration();
    }
  });
  void preferenceService.get('ignoreCertificateErrors').then((ignoreCertificateErrors) => {
    if (ignoreCertificateErrors) {
      // https://www.electronjs.org/docs/api/command-line-switches
      app.commandLine.appendSwitch('ignore-certificate-errors');
    }
  });
}
let commonInitFinished = false;
/** mock app.whenReady */
ipcMain.once(MainChannel.commonInitFinished, () => {
  commonInitFinished = true;
});
/**
 * Make sure some logic only run after window and services are truly ready
 */
const whenCommonInitFinished = async (): Promise<void> => {
  if (commonInitFinished) {
    return await Promise.resolve();
  }
  return await new Promise((resolve) => {
    ipcMain.once(MainChannel.commonInitFinished, () => {
      commonInitFinished = true;
      resolve();
    });
  });
};
const commonInit = async (): Promise<void> => {
  // eslint-disable-next-line promise/catch-or-return
  await app.whenReady();
  if (
    !protocol.registerFileProtocol('file', (request, callback) => {
      const pathname = decodeURIComponent(request.url.replace('file:///', ''));
      if (path.isAbsolute(pathname) ? fs.existsSync(pathname) : fs.existsSync(`/${pathname}`)) {
        callback(pathname);
      } else {
        // on production, __dirname will be in .webpack/main
        const filePath = path.join(app.getAppPath(), '.webpack', 'renderer', pathname);
        callback(filePath);
      }
    })
  ) {
    logger.error('Failed to registerFileProtocol file:///');
    app.quit();
  }
  // if user want a menubar, we create a new window for that
  await Promise.all([
    windowService.open(WindowNames.main),
    preferenceService.get('attachToMenubar').then((attachToMenubar) => {
      attachToMenubar && windowService.open(WindowNames.menuBar);
    }),
  ]);
  // perform wiki startup and git sync for each workspace
  await workspaceViewService.initializeAllWorkspaceView();

  ipcMain.emit('request-update-pause-notifications-info');
  // Fix webview is not resized automatically
  // when window is maximized on Linux
  // https://github.com/atomery/webcatalog/issues/561
  // run it here not in mainWindow.createAsync()
  // because if the `mainWindow` is maximized or minimized
  // before the workspaces's BrowserView fully loaded
  // error will occur
  // see https://github.com/atomery/webcatalog/issues/637
  // eslint-disable-next-line promise/always-return
  if (isLinux) {
    const mainWindow = windowService.get(WindowNames.main);
    if (mainWindow !== undefined) {
      const handleMaximize = (): void => {
        // getContentSize is not updated immediately
        // try once after 0.2s (for fast computer), another one after 1s (to be sure)
        setTimeout(() => {
          void workspaceViewService.realignActiveWorkspace();
        }, 200);
        setTimeout(() => {
          void workspaceViewService.realignActiveWorkspace();
        }, 1000);
      };
      mainWindow.on('maximize', handleMaximize);
      mainWindow.on('unmaximize', handleMaximize);
    }
  }
  // trigger whenTrulyReady
  ipcMain.emit(MainChannel.commonInitFinished);
};

app.on('ready', async () => {
  whenCommonInitFinished()
    // eslint-disable-next-line promise/always-return
    .then(async () => {
      buildLanguageMenu();
      if (await preferenceService.get('syncBeforeShutdown')) {
        wikiGitWorkspaceService.registerSyncBeforeShutdown();
      }
      await updaterService.checkForUpdates();
    })
    .catch((error) => console.error(error));
  powerMonitor.on('shutdown', () => {
    app.quit();
  });
  await initRendererI18NHandler();
  await commonInit();
});
app.on(MainChannel.windowAllClosed, () => {
  // prevent quit on MacOS. But also quit if we are in test.
  if (!isMac || isTest) {
    app.quit();
  }
});
app.on('activate', async () => {
  await windowService.open(WindowNames.main);
});
app.on(
  'before-quit',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (): Promise<void> => {
    logger.info('App before-quit');
    // https://github.com/atom/electron/issues/444#issuecomment-76492576
    if (isMac) {
      const mainWindow = windowService.get(WindowNames.main);
      if (mainWindow !== undefined) {
        logger.info('App force quit on MacOS, ask window not preventDefault');
        await windowService.updateWindowMeta(WindowNames.main, { forceClose: true });
      }
    }
    app.exit(0);
  },
);
app.on('quit', () => {
  uninstall?.uninstall();
  logger.info('App quit');
});

if (!isTest) {
  unhandled({
    showDialog: true,
    logger: logger.error.bind(logger),
    reportButton: (error) => {
      reportErrorToGithubWithTemplates(error);
    },
  });
}

// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
if (require('electron-squirrel-startup')) {
  app.quit();
}
