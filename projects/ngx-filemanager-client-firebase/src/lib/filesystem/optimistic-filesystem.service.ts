import { Injectable, OnDestroy } from '@angular/core';
import {
  FileSystemProvider,
  PermissionEntity
} from 'ngx-filemanager-core/public_api';
import { OptimisticFilesystem } from './optimistic-filesystem.interface';
import * as core from 'ngx-filemanager-core';
import { ClientFileSystemService } from './client-filesystem.service';
import { take } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import * as path from 'path-browserify';
import { NotificationService } from '../notifications/notification.service';

// tslint:disable:member-ordering

@Injectable()
export class OptimisticFilesystemService
  implements OptimisticFilesystem, OnDestroy {
  private serverFilesystem: FileSystemProvider;
  private clientFilesystem: ClientFileSystemService;

  private static instanceCount = 0;
  private instanceCountIncr() {
    OptimisticFilesystemService.instanceCount++;
    this.logger.info('new instance created', { instances: this.instances });
  }
  private instanceCountDecr() {
    OptimisticFilesystemService.instanceCount--;
    this.logger.info('instance destroyed', { instances: this.instances });
  }
  get instances() {
    return OptimisticFilesystemService.instanceCount;
  }

  constructor(
    private logger: LoggerService,
    private notifications: NotificationService
  ) {
    this.instanceCountIncr();
  }

  ngOnDestroy() {
    this.instanceCountDecr();
  }

  get $CurrentPath() {
    return this.clientFilesystem.$currentPath;
  }

  get $SelectedFile() {
    return this.clientFilesystem.$selectedFile;
  }

  get $FilesWithIcons() {
    return this.clientFilesystem.$FilesWithIcons;
  }

  initialize(
    serverFilesystem: FileSystemProvider,
    clientFilesystem: ClientFileSystemService
  ) {
    this.logger.info('initializing...', { serverFilesystem, clientFilesystem });
    this.serverFilesystem = serverFilesystem;
    this.clientFilesystem = clientFilesystem;
  }

  private reportError(error: Error, title: string, msg: string) {
    const isApiError = error.message.startsWith('API Error');
    console.error(`Error in "${title}" ->msg: "${msg}" -> Error.message:"${error.message}"`, {isApiError});
    if (isApiError) {
      return;
    }
    this.notifications.notify(msg, title);
  }

  async HandleList(directoryPath: string): Promise<any> {
    try {
      this.logger.info('HandleList', { directoryPath });
      this.clientFilesystem.OnList(directoryPath);
      const apiResult = await this.serverFilesystem.List(directoryPath);
      await this.clientFilesystem.UpdateCurrentList(apiResult);
      await this.selectFirstInCurrentDirectory();
    } catch (error) {
      this.reportError(error, 'Cannot get directory list', 'List Error');
    }
  }
  async HandleCreateFolder(newPath: string): Promise<any> {
    try {
      this.logger.info('HandleCreateFolder', { newPath });
      this.clientFilesystem.OnCreateFolder(newPath);
      await this.serverFilesystem.CreateFolder(newPath);
    } catch (error) {
      this.reportError(error, 'Cannot create folder', 'Create Folder Error');
      this.clientFilesystem.OnRemove([newPath]);
    }
  }
  async HandleCopy(singleFileName: string, newPath: string): Promise<any> {
    try {
      this.logger.info('HandleCopy', { singleFileName, newPath });
      this.clientFilesystem.OnCopy(singleFileName, newPath);
      await this.serverFilesystem.Copy(singleFileName, newPath);
    } catch (error) {
      this.reportError(error, 'Cannot copy item', 'Copy Error');
      this.clientFilesystem.OnRemove([newPath]);
    }
  }
  async HandleMove(item: string, newPath: string): Promise<any> {
    try {
      this.logger.info('HandleMove', { item, newPath });
      this.clientFilesystem.OnMove(item, newPath);
      return this.serverFilesystem.Move(item, newPath);
    } catch (error) {
      this.reportError(error, 'Cannot move item', 'Move Error');
      this.clientFilesystem.OnRemove([newPath]);
    }
  }
  async HandleRename(item: string, newItemPath: string): Promise<any> {
    try {
      this.logger.info('HandleRename', { item, newItemPath });
      this.clientFilesystem.OnRename(item, newItemPath);
      return this.serverFilesystem.Rename(item, newItemPath);
    } catch (error) {
      this.reportError(error, 'Cannot rename item', 'Rename Error');
      this.clientFilesystem.OnRename(newItemPath, item);
    }
  }
  async HandleEdit(item: string, content: string): Promise<any> {
    try {
      this.logger.info('HandleEdit', { item, content });
      this.clientFilesystem.OnEdit(item, content);
      return this.serverFilesystem.Edit(item, content);
    } catch (error) {
      this.reportError(error, 'Cannot edit item', 'Edit Error');
    }
  }
  async HandleGetcontent(item: string): Promise<string> {
    try {
      this.logger.info('HandleGetcontent', { item });
      this.clientFilesystem.OnGetcontent(item);
      const response = await this.serverFilesystem.Getcontent(item);
      return response.result;
    } catch (error) {
      this.reportError(error, 'Cannot get item', 'Get Content Error');
    }
  }
  async HandleSetPermissions(
    item: string,
    role: core.PermisionsRole,
    entity: PermissionEntity,
    recursive?: boolean
  ): Promise<any> {
    try {
      this.logger.info('HandleSetPermissions', {
        item,
        role,
        entity,
        recursive
      });
      this.clientFilesystem.OnSetPermissions(item, role, entity, recursive);
      return this.serverFilesystem.SetPermissions(item, role, entity, recursive);
    } catch (error) {
      this.reportError(error, 'Cannot set permissions to item', 'Permissions Error');
    }
  }
  async HandleMoveMultiple(items: string[], newPath: string): Promise<any> {
    try {
      this.logger.info('HandleMoveMultiple', { items, newPath });
      this.clientFilesystem.OnMoveMultiple(items, newPath);
      return this.serverFilesystem.MoveMultiple(items, newPath);
    } catch (error) {
      this.reportError(error, 'Cannot move items', 'Move Error');
    }
  }
  async HandleCopyMultiple(items: string[], newPath: string): Promise<any> {
    try {
      this.logger.info('HandleCopyMultiple', { items, newPath });
      this.clientFilesystem.OnCopyMultiple(items, newPath);
      return this.serverFilesystem.CopyMultiple(items, newPath);
    } catch (error) {
      this.reportError(error, 'Cannot copy items', 'Copy Error');
    }
  }
  async HandleSetPermissionsMultiple(
    items: string[],
    role: core.PermisionsRole,
    entity: PermissionEntity,
    recursive?: boolean
  ): Promise<any> {
    try {
      this.logger.info('HandleSetPermissionsMultiple', {
        items,
        role,
        entity,
        recursive
      });
  
      this.clientFilesystem.OnSetPermissionsMultiple(
        items,
        role,
        entity,
        recursive
      );
      return this.serverFilesystem.SetPermissionsMultiple(
        items,
        role,
        entity,
        recursive
      );
    } catch (error) {
      this.reportError(error, 'Cannot set permissions to items', 'Permissions Error')
    }
  }
  async HandleRemove(items: string[]): Promise<any> {
    try {
      this.logger.info('HandleRemove', { items });
      this.clientFilesystem.OnRemove(items);
      return this.serverFilesystem.Remove(items);
    } catch (error) {
      this.reportError(error, 'Cannot remove items', 'Remove Error');
    }
  }

  async HandleNavigateUp(): Promise<any> {
    try {
      this.logger.info('HandleNavigateUp');
      const currentPath = await this.$CurrentPath.pipe(take(1)).toPromise();
      const parentPath = path.dirname(currentPath);
      return this.HandleList(parentPath);
    } catch (error) {
      this.reportError(error, 'Cannot navigate to parent directory', 'Navigate Error');
      throw new Error(error.message);
    }
  }

  async onSelectItem(file: core.ResFile) {
    this.clientFilesystem.onSelectItem(file);
  }

  GetItemByName(filePath: string) {
    const currentFiles = this.clientFilesystem.CurrentFiles();
    const match = currentFiles.find(f => f.fullPath === filePath);
    return match;
  }

  onSelectItemByName(filePath: string) {
    const match = this.GetItemByName(filePath);
    this.clientFilesystem.onSelectItem(match);
  }

  private async selectFirstInCurrentDirectory() {
    const currentFiles = this.clientFilesystem.CurrentFiles();
    const firstSelected = [...currentFiles].shift();
    this.clientFilesystem.onSelectItem(firstSelected);
  }
}
