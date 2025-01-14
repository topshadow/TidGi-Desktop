import { Observable, BehaviorSubject } from 'rxjs';
import { SetOptional } from 'type-fest';
import { ProxyPropertyType } from 'electron-ipc-cat/common';
import { WorkspaceChannel } from '@/constants/channels';
import { SupportedStorageServices } from '@services/types';

export interface IWorkspace {
  /**
   * Is this workspace selected by user, and showing corresponding webview?
   */
  active: boolean;
  /**
   * When this workspace is a local workspace, we can still use local git to backup
   */
  backupOnInterval: boolean;
  disableAudio: boolean;
  disableNotifications: boolean;
  /**
   * The online repo to back data up to
   */
  gitUrl: string | null;
  /**
   * Hibernate workspace on startup and when switch to another workspace.
   */
  hibernateWhenUnused: boolean;
  /**
   * Is this workspace hibernated. You can hibernate workspace manually, without setting its hibernateWhenUnused. So we record this field in workspace.
   */
  hibernated: boolean;
  /**
   * Localhost server url to load in the electron webview
   */
  homeUrl: string;
  id: string;
  /**
   * Is this workspace a subwiki that link to a main wiki, and doesn't have its own webview?
   */
  isSubWiki: boolean;
  /**
   * Last visited url, used for rememberLastPageVisited in preferences
   */
  lastUrl: string | null;
  /**
   * ID of main wiki of the sub-wiki. Only useful when isSubWiki === true
   */
  mainWikiID: string | null;
  /**
   * Absolute path of main wiki of the sub-wiki. Only useful when isSubWiki === true , this is the wiki repo that this subwiki's folder soft links to
   */
  mainWikiToLink: string | null;
  /**
   * Display name for this wiki workspace
   */
  name: string;
  /**
   * You can drag workspaces to reorder them
   */
  order: number;
  /**
   * workspace icon's path in file system
   */
  picturePath: string | null;
  /**
   * Localhost tiddlywiki server port
   */
  port: number;
  /**
   * Storage service this workspace sync to
   */
  storageService: SupportedStorageServices;
  /**
   * We basically place sub-wiki in main wiki's `tiddlers/subwiki/` folder, but the `subwiki` part can be configured. Default is `subwiki`
   */
  subWikiFolderName: string;
  /**
   * Sync wiki every interval.
   * If this is false (false by default to save the CPU usage from chokidar watch), then sync will only happen if user manually trigger by click sync button in the wiki, or sync at the app open.
   */
  syncOnInterval: boolean;
  /**
   * Commit and Sync when App starts.
   */
  syncOnStartup: boolean;
  /**
   * Tag name in tiddlywiki's filesystemPath, tiddler with this tag will be save into this subwiki
   */
  tagName: string | null;
  transparentBackground: boolean;
  userName: string;
  /**
   * folder path for this wiki workspace
   */
  wikiFolderLocation: string;
}

export interface IWorkspaceMetaData {
  badgeCount?: number;
  /**
   * Error message if this workspace fails loading
   */
  didFailLoadErrorMessage?: string | null | undefined;
  /**
   * indicating server or webpage is still loading
   */
  isLoading?: boolean;
}

export interface IWorkspaceWithMetadata extends IWorkspace {
  metadata: IWorkspaceMetaData;
}

/**
 * Ignore some field that will assign default value in workspaceService.create, these field don't require to be filled in AddWorkspace form
 */
export type INewWorkspaceConfig = SetOptional<
  Omit<IWorkspace, 'active' | 'hibernated' | 'id' | 'order' | 'lastUrl' | 'syncOnInterval' | 'syncOnStartup'>,
  'homeUrl' | 'transparentBackground' | 'picturePath' | 'disableNotifications' | 'disableAudio' | 'hibernateWhenUnused' | 'subWikiFolderName' | 'userName'
>;

/**
 * Manage workspace level preferences and workspace metadata.
 */
export interface IWorkspaceService {
  /** Enter a state that no workspace is active (show welcome page) */
  clearActiveWorkspace(oldActiveWorkspaceID: string | undefined): Promise<void>;
  countWorkspaces(): Promise<number>;
  create(newWorkspaceConfig: INewWorkspaceConfig): Promise<IWorkspace>;
  get(id: string): Promise<IWorkspace | undefined>;
  get$(id: string): Observable<IWorkspace | undefined>;
  getActiveWorkspace: () => Promise<IWorkspace | undefined>;
  /**
   * Only meant to be used in TidGi's services internally.
   */
  getActiveWorkspaceSync: () => IWorkspace | undefined;
  getAllMetaData: () => Promise<Record<string, Partial<IWorkspaceMetaData>>>;
  getByWikiFolderLocation(name: string): Promise<IWorkspace | undefined>;
  getFirstWorkspace: () => Promise<IWorkspace | undefined>;
  getMetaData: (id: string) => Promise<Partial<IWorkspaceMetaData>>;
  getNextWorkspace: (id: string) => Promise<IWorkspace | undefined>;
  getPreviousWorkspace: (id: string) => Promise<IWorkspace | undefined>;
  getWorkspaces(): Promise<Record<string, IWorkspace>>;
  getWorkspacesAsList(): Promise<IWorkspace[]>;
  remove(id: string): Promise<void>;
  removeWorkspacePicture(id: string): Promise<void>;
  set(id: string, workspace: IWorkspace, immediate?: boolean): Promise<void>;
  /**
   * Set new workspace to active, and make the old active workspace inactive
   * @param id id to active
   */
  setActiveWorkspace(id: string, oldActiveWorkspaceID: string | undefined): Promise<void>;
  setWorkspacePicture(id: string, sourcePicturePath: string): Promise<void>;
  setWorkspaces(newWorkspaces: Record<string, IWorkspace>): Promise<void>;
  update(id: string, workspaceSetting: Partial<IWorkspace>, immediate?: boolean): Promise<void>;
  updateMetaData: (id: string, options: Partial<IWorkspaceMetaData>) => Promise<void>;
  workspaceDidFailLoad(id: string): Promise<boolean>;
  workspaces$: BehaviorSubject<Record<string, IWorkspaceWithMetadata>>;
}
export const WorkspaceServiceIPCDescriptor = {
  channel: WorkspaceChannel.name,
  properties: {
    countWorkspaces: ProxyPropertyType.Function,
    clearActiveWorkspace: ProxyPropertyType.Function,
    create: ProxyPropertyType.Function,
    get: ProxyPropertyType.Function,
    get$: ProxyPropertyType.Function$,
    getActiveWorkspace: ProxyPropertyType.Function,
    getAllMetaData: ProxyPropertyType.Function,
    getByName: ProxyPropertyType.Function,
    getFirstWorkspace: ProxyPropertyType.Function,
    getMetaData: ProxyPropertyType.Function,
    getNextWorkspace: ProxyPropertyType.Function,
    getPreviousWorkspace: ProxyPropertyType.Function,
    getWorkspaces: ProxyPropertyType.Function,
    getWorkspacesAsList: ProxyPropertyType.Function,
    remove: ProxyPropertyType.Function,
    removeWorkspacePicture: ProxyPropertyType.Function,
    set: ProxyPropertyType.Function,
    setActiveWorkspace: ProxyPropertyType.Function,
    setWorkspacePicture: ProxyPropertyType.Function,
    setWorkspaces: ProxyPropertyType.Function,
    update: ProxyPropertyType.Function,
    updateMetaData: ProxyPropertyType.Function,
    workspaceDidFailLoad: ProxyPropertyType.Function,
    workspaces$: ProxyPropertyType.Value$,
  },
};
