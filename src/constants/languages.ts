import fs from 'fs-extra';
import path from 'path';
import { LOCALIZATION_FOLDER } from '@/constants/paths';

export const supportedLanguagesMap = JSON.parse(fs.readFileSync(path.join(LOCALIZATION_FOLDER, 'supportedLanguages.json'))) as Record<string, string>;
export const tiddlywikiLanguagesMap = JSON.parse(fs.readFileSync(path.join(LOCALIZATION_FOLDER, 'tiddlywikiLanguages.json'))) as Record<
  string,
  string | undefined
>;

export const supportedLanguagesKNames = Object.keys(supportedLanguagesMap);
