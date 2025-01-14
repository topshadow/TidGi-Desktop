import { defaultServerIP } from '@/constants/urls';
import { internalIpV4 } from '@/helpers/ip';
import { logger } from './log';
import type { IWorkspace } from '@services/workspaces/interface';

/**
 * get wiki address with local machine ip, so QR code will be correct, instead of get `0.0.0.0`
 * https://github.com/Jermolene/TiddlyWiki5/issues/5669
 * @param originalUrl might be `"http://0.0.0.0:5212/"`
 */
export async function getLocalHostUrlWithActualIP(originalUrl: string): Promise<string> {
  const internalIp = await internalIpV4();
  const localHostUrlWithActualIP = originalUrl.replace(/((?:\d{1,3}\.){3}\d{1,3}|localhost)/, internalIp ?? defaultServerIP);
  return localHostUrlWithActualIP;
}

/** Sometimes workspace port is corrupted, we want it be fixed to what user set in the workspace setting. */
export function replaceUrlPortWithSettingPort(originalUrl: string, newPort: number): string {
  try {
    // maybe TypeError: Invalid URL
    const parsedUrl = new URL(originalUrl);
    parsedUrl.port = String(newPort);
    return parsedUrl.toString();
  } catch (error) {
    logger.error(
      `Failed to replaceUrlPortWithSettingPort for originalUrl ${originalUrl} to newPort ${newPort} , fallback to originalUrl. Error: ${
        (error as Error).message
      }`,
    );
    return originalUrl;
  }
}

export function isSameOrigin(a: string, b?: string | null): boolean {
  if (b === undefined || b === null) return false;
  try {
    const urlA = new URL(a);
    const urlB = new URL(b);
    return urlA.origin === urlB.origin;
  } catch {
    return false;
  }
}
