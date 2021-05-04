/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/require-await */
import { Menu, MenuItemConstructorOptions, shell, ContextMenuParams, WebContents, MenuItem, ipcMain } from 'electron';
import { debounce, take, drop, reverse } from 'lodash';
import { injectable } from 'inversify';
import { IMenuService, DeferredMenuItemConstructorOptions, IOnContextMenuInfo } from './interface';
import { WindowNames } from '@services/windows/WindowProperties';
import { lazyInject } from '@services/container';
import serviceIdentifier from '@services/serviceIdentifier';
import { IWindowService } from '@services/windows/interface';
import i18next from '@services/libs/i18n';
import ContextMenuBuilder from './contextMenuBuilder';
import { IpcSafeMenuItem, mainMenuItemProxy } from './rendererMenuItemProxy';

@injectable()
export class MenuService implements IMenuService {
  @lazyInject(serviceIdentifier.Window) private readonly windowService!: IWindowService;

  private _menuTemplate?: DeferredMenuItemConstructorOptions[];
  private get menuTemplate(): DeferredMenuItemConstructorOptions[] {
    // wait for translations to be initialized
    if (i18next.t('Menu.TiddlyGit') === undefined || i18next.t('Menu.TiddlyGit') === 'Menu.TiddlyGit') {
      return [];
    }
    if (this._menuTemplate === undefined) {
      this.loadDefaultMenuTemplate();
    }
    return this._menuTemplate!;
  }

  /**
   * Rebuild or create menubar from the latest menu template, will be call after some method change the menuTemplate
   * You don't need to call this after calling method like insertMenu, it will be call automatically.
   */
  public async buildMenu(): Promise<void> {
    const latestTemplate = (await this.getCurrentMenuItemConstructorOptions(this.menuTemplate)) ?? [];
    const menu = Menu.buildFromTemplate(latestTemplate);
    Menu.setApplicationMenu(menu);
  }

  /**
   * We have some value in template that need to get latest value, they are functions, we execute every functions in the template
   * @param submenu menu options to get latest value
   * @returns MenuTemplate that `Menu.buildFromTemplate` wants
   */
  private async getCurrentMenuItemConstructorOptions(
    submenu?: Array<DeferredMenuItemConstructorOptions | MenuItemConstructorOptions>,
  ): Promise<MenuItemConstructorOptions[] | undefined> {
    if (submenu === undefined) return;
    return await Promise.all(
      submenu.map(async (item) => ({
        ...item,
        label: typeof item.label === 'function' ? item.label() : item.label,
        enabled: typeof item.enabled === 'function' ? await item.enabled() : item.enabled,
        submenu:
          typeof item.submenu === 'function'
            ? await this.getCurrentMenuItemConstructorOptions(item.submenu())
            : item.submenu instanceof Menu
            ? item.submenu
            : await this.getCurrentMenuItemConstructorOptions(item.submenu),
      })),
    );
  }

  /**
   * Defer to i18next ready to call this
   */
  private loadDefaultMenuTemplate(): void {
    this._menuTemplate = [
      {
        label: i18next.t('Menu.TiddlyGit'),
        id: 'TiddlyGit',
      },
      {
        label: i18next.t('Menu.Edit'),
        id: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
        ],
      },
      {
        label: i18next.t('Menu.View'),
        id: 'View',
      },
      {
        label: i18next.t('Menu.Language'),
        id: 'Language',
      },
      {
        label: i18next.t('Menu.History'),
        id: 'History',
      },
      {
        label: i18next.t('Menu.Workspaces'),
        id: 'Workspaces',
        submenu: [],
      },
      {
        label: i18next.t('Menu.Window'),
        role: 'window',
        id: 'window',
        submenu: [{ role: 'minimize' }, { role: 'close' }, { type: 'separator' }, { role: 'front' }, { type: 'separator' }],
      },
      {
        label: i18next.t('Menu.Help'),
        role: 'help',
        id: 'help',
        submenu: [
          {
            label: i18next.t('ContextMenu.TiddlyGitSupport'),
            click: async () => await shell.openExternal('https://github.com/tiddly-gittly/tiddlygit-desktop/issues'),
          },
          {
            label: i18next.t('Menu.ReportBugViaGithub'),
            click: async () => await shell.openExternal('https://github.com/tiddly-gittly/tiddlygit-desktop/issues'),
          },
          {
            label: i18next.t('Menu.RequestFeatureViaGithub'),
            click: async () => await shell.openExternal('https://github.com/tiddly-gittly/tiddlygit-desktop/issues/new?template=feature.md&title=feature%3A+'),
          },
          {
            label: i18next.t('Menu.LearnMore'),
            click: async () => await shell.openExternal('https://github.com/tiddly-gittly/tiddlygit-desktop/'),
          },
        ],
      },
    ];
  }

  constructor() {
    // debounce so build menu won't be call very frequently on app launch, where every services are registering menu items
    this.buildMenu = debounce(this.buildMenu.bind(this), 50) as () => Promise<void>;
  }

  /** Register `on('context-menu', openContextMenuForWindow)` for a window, return an unregister function */
  public async initContextMenuForWindowWebContents(webContents: WebContents): Promise<() => void> {
    const openContextMenuForWindow = async (event: Electron.Event, parameters: ContextMenuParams): Promise<void> =>
      await this.buildContextMenuAndPopup([], parameters, webContents);
    webContents.on('context-menu', openContextMenuForWindow);

    return () => {
      if (webContents.isDestroyed()) {
        return;
      }

      webContents.removeListener('context-menu', openContextMenuForWindow);
    };
  }

  /**
   * Insert provided sub menu items into menubar, so user and services can register custom menu items
   * @param menuID Top level menu name to insert menu items
   * @param menuItems An array of menu item to insert or update, if some of item is already existed, it will be updated instead of inserted
   * @param afterSubMenu The `id` or `role` of a submenu you want your submenu insert after. `null` means inserted as first submenu item; `undefined` means inserted as last submenu item;
   * @param withSeparator Need to insert a separator first, before insert menu items
   */
  public async insertMenu(menuID: string, menuItems: DeferredMenuItemConstructorOptions[], afterSubMenu?: string | null, withSeparator = false): Promise<void> {
    let foundMenuName = false;
    // try insert menu into an existed menu's submenu
    for (const menu of this.menuTemplate) {
      // match top level menu
      if (menu.id === menuID) {
        foundMenuName = true;
        // TODO: check some menu item existed, we update them and pop them out
        const filteredMenuItems: DeferredMenuItemConstructorOptions[] = [];
        for (const item of menuItems) {
          const currentSubMenu = typeof menu.submenu === 'function' ? menu.submenu() : menu.submenu ?? [];
          const existedItemIndex = currentSubMenu.findIndex(
            (existedItem) => existedItem.id === item.id || existedItem.label === item.label || existedItem.role === item.role,
          );
          if (existedItemIndex !== -1) {
            // TODO: update menu item
          }
        }

        // directly insert whole sub menu
        if (Array.isArray(menu.submenu)) {
          if (afterSubMenu === undefined) {
            // inserted as last submenu item
            if (withSeparator) {
              menu.submenu.push({ type: 'separator' });
            }
            menu.submenu = [...menu.submenu, ...menuItems];
          } else if (afterSubMenu === null) {
            // inserted as first submenu item
            if (withSeparator) {
              menuItems.push({ type: 'separator' });
            }
            menu.submenu = [...menuItems, ...menu.submenu];
          } else if (typeof afterSubMenu === 'string') {
            // insert after afterSubMenu
            const afterSubMenuIndex = menu.submenu.findIndex((item) => item.id === afterSubMenu || item.role === afterSubMenu);
            if (afterSubMenuIndex === -1) {
              throw new Error(
                `You try to insert menu with afterSubMenu "${afterSubMenu}" in menu "${menuID}", but we can not found it in menu "${
                  menu.id ?? menu.role ?? JSON.stringify(menu)
                }", please specific a menuitem with correct id attribute`,
              );
            }
            menu.submenu = [...take(menu.submenu, afterSubMenuIndex + 1), ...menuItems, ...drop(menu.submenu, afterSubMenuIndex - 1)];
          }
        } else {
          // if menu existed but submenu is undefined
          menu.submenu = menuItems;
        }
      }
    }
    // if user wants to create a new menu in menubar
    if (!foundMenuName) {
      this.menuTemplate.push({
        label: menuID,
        submenu: menuItems,
      });
    }
    await this.buildMenu();
  }

  public async buildContextMenuAndPopup(
    template: MenuItemConstructorOptions[] | IpcSafeMenuItem[],
    info: IOnContextMenuInfo,
    webContentsOrWindowName: WindowNames | WebContents = WindowNames.main,
  ): Promise<void> {
    let webContents: WebContents;
    if (typeof webContentsOrWindowName === 'string') {
      const windowToPopMenu = this.windowService.get(webContentsOrWindowName);
      const webContentsOfWindowToPopMenu = windowToPopMenu?.webContents;
      if (windowToPopMenu === undefined || webContentsOfWindowToPopMenu === undefined) {
        return;
      }
      webContents = webContentsOfWindowToPopMenu;
    } else {
      webContents = webContentsOrWindowName;
    }
    const contextMenuBuilder = new ContextMenuBuilder(webContents);
    const menu = contextMenuBuilder.buildMenuForElement(info);
    menu.append(
      new MenuItem({
        label: i18next.t('ContextMenu.Back'),
        enabled: webContents.canGoBack(),
        click: () => {
          webContents.goBack();
        },
      }),
    );
    menu.append(
      new MenuItem({
        label: i18next.t('ContextMenu.Forward'),
        enabled: webContents.canGoForward(),
        click: () => {
          webContents.goForward();
        },
      }),
    );
    menu.append(
      new MenuItem({
        label: i18next.t('ContextMenu.Reload'),
        click: () => {
          webContents.reload();
        },
      }),
    );
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(
      new MenuItem({
        label: i18next.t('ContextMenu.More'),
        submenu: [
          {
            label: i18next.t('ContextMenu.About'),
            click: () => ipcMain.emit('request-show-about-window'),
          },
          { type: 'separator' },
          {
            label: i18next.t('ContextMenu.CheckForUpdates'),
            click: () => ipcMain.emit('request-check-for-updates'),
          },
          {
            label: i18next.t('ContextMenu.Preferences'),
            click: () => ipcMain.emit('request-show-preferences-window'),
          },
          { type: 'separator' },
          {
            label: i18next.t('ContextMenu.TiddlyGitSupport'),
            click: async () => await shell.openExternal('https://github.com/tiddly-gittly/TiddlyGit-Desktop/issues/new/choose'),
          },
          {
            label: i18next.t('ContextMenu.TiddlyGitWebsite'),
            click: async () => await shell.openExternal('https://github.com/tiddly-gittly/TiddlyGit-Desktop'),
          },
          { type: 'separator' },
          {
            label: i18next.t('ContextMenu.Quit'),
            click: () => ipcMain.emit('request-quit'),
          },
        ],
      }),
    );

    // add custom menu items
    if (template !== undefined && Array.isArray(template) && template.length > 0) {
      // if our menu item config is pass from the renderer process, we reconstruct callback from the ipc.on channel id.
      const menuItems = ((typeof template?.[0]?.click === 'string'
        ? mainMenuItemProxy(template as IpcSafeMenuItem[], webContents)
        : template) as unknown) as MenuItemConstructorOptions[];
      menu.insert(0, new MenuItem({ type: 'separator' }));
      // we are going to prepend items, so inverse first, so order will remain
      reverse(menuItems)
        .map((menuItem) => new MenuItem(menuItem))
        .forEach((menuItem) => menu.insert(0, menuItem));
    }

    menu.popup();
  }
}
