// @flow
const { ipcRenderer } = window.require('electron');

export const requestCopyWikiTemplate = (newFolderPath: string, folderName: string) =>
  ipcRenderer.invoke('copy-wiki-template', newFolderPath, folderName);
export const requestCreateSubWiki = (
  newFolderPath: string,
  folderName: string,
  mainWikiToLink: string,
  onlyLink?: boolean,
) => ipcRenderer.invoke('create-sub-wiki', newFolderPath, folderName, mainWikiToLink, onlyLink);
export const ensureWikiExist = (wikiPath: string, shouldBeMainWiki: boolean) =>
  ipcRenderer.invoke('ensure-wiki-exist', wikiPath, shouldBeMainWiki);
export const requestOpenInBrowser = url => ipcRenderer.send('request-open-in-browser', url);
export const requestShowMessageBox = (message, type) => ipcRenderer.send('request-show-message-box', message, type);
export const requestLoadUrl = (url, id) => ipcRenderer.send('request-load-url', url, id);

export const requestGoHome = () => ipcRenderer.send('request-go-home');
export const requestGoBack = () => ipcRenderer.send('request-go-back');
export const requestGoForward = () => ipcRenderer.send('request-go-forward');
export const requestReload = () => ipcRenderer.send('request-reload');

export const requestQuit = () => ipcRenderer.send('request-quit');
export const requestCheckForUpdates = isSilent => ipcRenderer.send('request-check-for-updates', isSilent);

export const requestShowAboutWindow = () => ipcRenderer.send('request-show-about-window');
export const requestShowAddWorkspaceWindow = () => ipcRenderer.send('request-show-add-workspace-window');
export const requestShowCodeInjectionWindow = type => ipcRenderer.send('request-show-code-injection-window', type);
export const requestShowCustomUserAgentWindow = () => ipcRenderer.send('request-show-custom-user-agent-window');
export const requestShowEditWorkspaceWindow = id => ipcRenderer.send('request-show-edit-workspace-window', id);
export const requestShowNotificationsWindow = () => ipcRenderer.send('request-show-notifications-window');
export const requestShowPreferencesWindow = scrollTo => ipcRenderer.send('request-show-preferences-window', scrollTo);
export const requestShowProxyWindow = () => ipcRenderer.send('request-show-proxy-window');
export const requestShowSpellcheckLanguagesWindow = () => ipcRenderer.send('request-show-spellcheck-languages-window');

// Notifications
export const requestShowNotification = opts => ipcRenderer.send('request-show-notification', opts);
export const requestUpdatePauseNotificationsInfo = () => ipcRenderer.send('request-update-pause-notifications-info');
export const getPauseNotificationsInfo = () => ipcRenderer.sendSync('get-pause-notifications-info');

// Preferences
// eslint-disable-next-line no-use-before-define
type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
interface JsonObject {
  [x: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> {} // tslint:disable-line no-empty-interface
export function getPreference<T = JsonValue>(name: string): T {
  return ipcRenderer.sendSync('get-preference', name);
}
export const getPreferences = () => ipcRenderer.sendSync('get-preferences');
export const requestSetPreference = (name: string, value: JsonValue) =>
  ipcRenderer.send('request-set-preference', name, value);
export const requestResetPreferences = () => ipcRenderer.send('request-reset-preferences');
export const requestShowRequireRestartDialog = () => ipcRenderer.send('request-show-require-restart-dialog');

// System Preferences
export const getSystemPreference = (name: string): JsonValue => ipcRenderer.sendSync('get-system-preference', name);
export const getSystemPreferences = (): JsonObject => ipcRenderer.sendSync('get-system-preferences');
export const requestSetSystemPreference = (name: string, value: JsonValue) =>
  ipcRenderer.send('request-set-system-preference', name, value);

// Workspace
export const countWorkspace = () => ipcRenderer.sendSync('count-workspace');
export const getWorkspace = (id: string) => ipcRenderer.sendSync('get-workspace', id);
export const getWorkspaces = () => ipcRenderer.sendSync('get-workspaces');
export const getWorkspaceRemote = (wikiFolderPath: string) =>
  ipcRenderer.invoke('get-workspaces-remote', wikiFolderPath);
export const requestClearBrowsingData = () => ipcRenderer.send('request-clear-browsing-data');
export const requestCreateWorkspace = (
  name: string,
  isSubWiki: boolean,
  mainWikiToLink: string,
  port: number,
  homeUrl: string,
  gitUrl: string,
  picture: string,
  transparentBackground: boolean,
) =>
  ipcRenderer.invoke(
    'request-create-workspace',
    name,
    isSubWiki,
    mainWikiToLink,
    port,
    homeUrl,
    picture,
    transparentBackground,
  );
export const requestWaitForWikiStart = (port: number, timeoutLimit: number = 5000) =>
  ipcRenderer.invoke('request-wait-for-wiki-start', port, timeoutLimit);
export const requestHibernateWorkspace = id => ipcRenderer.send('request-hibernate-workspace', id);
export const requestOpenUrlInWorkspace = (url, id) => ipcRenderer.send('request-open-url-in-workspace', url, id);
export const requestRealignActiveWorkspace = () => ipcRenderer.send('request-realign-active-workspace');
export const requestRemoveWorkspace = id => ipcRenderer.send('request-remove-workspace', id);
export const requestRemoveWorkspacePicture = id => ipcRenderer.send('request-remove-workspace-picture', id);
export const requestSetActiveWorkspace = id => ipcRenderer.send('request-set-active-workspace', id);
export const requestSetWorkspace = (id, opts) => ipcRenderer.send('request-set-workspace', id, opts);
export const requestSetWorkspaces = workspaces => ipcRenderer.send('request-set-workspaces', workspaces);
export const requestSetWorkspacePicture = (id, picturePath) =>
  ipcRenderer.send('request-set-workspace-picture', id, picturePath);
export const requestWakeUpWorkspace = id => ipcRenderer.send('request-wake-up-workspace', id);

export const getIconPath = () => ipcRenderer.sendSync('get-constant', 'ICON_PATH');
export const getReactPath = () => ipcRenderer.sendSync('get-constant', 'REACT_PATH');
export const getDesktopPath = () => ipcRenderer.sendSync('get-constant', 'DESKTOP_PATH');

// Workspace Meta
export const getWorkspaceMeta = id => ipcRenderer.sendSync('get-workspace-meta', id);
export const getWorkspaceMetas = () => ipcRenderer.sendSync('get-workspace-metas');

// Workspace Git
export const initWikiGit = (wikiFolderPath: string, githubRepoUrl: string, userInfo: Object, isMainWiki: boolean) =>
  ipcRenderer.invoke('request-init-wiki-git', wikiFolderPath, githubRepoUrl, userInfo, isMainWiki);

// Find In Page
export const requestFindInPage = (text, forward) => ipcRenderer.send('request-find-in-page', text, forward);
export const requestStopFindInPage = close => ipcRenderer.send('request-stop-find-in-page', close);

// Auth
export const requestValidateAuthIdentity = (windowId, username, password) =>
  ipcRenderer.send('request-validate-auth-identity', windowId, username, password);

// Native Theme
export const getShouldUseDarkColors = () => ipcRenderer.sendSync('get-should-use-dark-colors');

// Online Status
export const signalOnlineStatusChanged = online => ipcRenderer.send('online-status-changed', online);
