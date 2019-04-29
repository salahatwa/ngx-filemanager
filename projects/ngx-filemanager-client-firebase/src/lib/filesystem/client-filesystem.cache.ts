import { CoreTypes } from 'ngx-filemanager-core/public_api';
import { ConsoleLoggerService } from '../logging/console-logger.service';

export class ClientCache {
  private logger = new ConsoleLoggerService();

  private cachedFolders: {
    [folderPath: string]: CoreTypes.ResFile[];
  } = {};
  private cacheLimit = 20;

  public GetCached(folderPath: string) {
    return this.cachedFolders[folderPath] || [];
  }
  public SetCached(folderPath: string, newFolderFiles: CoreTypes.ResFile[]) {
    const oldFolders = this.GetCached(folderPath);
    this.logger.info('SetCached()', {
      from: oldFolders.length,
      to: newFolderFiles.length
    });
    if (this.cachedCount > this.cacheLimit) {
      this.removeRandomFolderPath();
    }
    this.cachedFolders[folderPath] = newFolderFiles;
  }

  private get cachedCount() {
    return Object.keys(this.cachedFolders).length;
  }
  private removeRandomFolderPath() {
    const randomIndex = Math.floor(Math.random() * this.cachedCount);
    const randomKey = Object.keys(this.cachedFolders)[randomIndex];
    delete this.cachedFolders[randomKey];
  }
}
