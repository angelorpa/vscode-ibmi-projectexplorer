/*
 * (c) Copyright IBM Corp. 2023
 */

import { ThemeIcon, TreeItemCollapsibleState, Uri, WorkspaceFolder, l10n, workspace } from "vscode";
import { ContextValue } from "../../projectExplorerApi";
import { ProjectExplorerTreeItem } from "./projectExplorerTreeItem";
import { ProjectManager } from "../../projectManager";
import LocalIncludePath from "./localIncludePath";
import RemoteIncludePath from "./remoteIncludePath";
import * as path from "path";
import ErrorItem from "./errorItem";

/**
 * Tree item for Include Paths heading
 */
export default class IncludePaths extends ProjectExplorerTreeItem {
  static contextValue = ContextValue.includePaths;

  constructor(public workspaceFolder: WorkspaceFolder) {
    super(l10n.t('Include Paths'), TreeItemCollapsibleState.Collapsed);

    this.contextValue = IncludePaths.contextValue;
    this.iconPath = new ThemeIcon(`list-flat`);
  }

  async getChildren(): Promise<ProjectExplorerTreeItem[]> {
    let items: ProjectExplorerTreeItem[] = [];

    const iProject = ProjectManager.get(this.workspaceFolder);
    const unresolvedState = await iProject?.getUnresolvedState();
    const state = await iProject?.getState();
    if (unresolvedState && unresolvedState.includePath) {
      for await (let [index, includePath] of unresolvedState.includePath.entries()) {
        let variable = undefined;
        if (includePath.startsWith('&')) {
          variable = includePath;
          includePath = state!.includePath![index];
        }

        if (includePath.startsWith('&')) {
          items.push(new ErrorItem(
            this.workspaceFolder,
            includePath,
            {
              description: l10n.t('Not specified'),
              contextValue: ContextValue.includePath
            }));
          continue;
        }

        let includePathUri = Uri.file(includePath);
        try {
          const statResult = await workspace.fs.stat(includePathUri);

          // Absolute local include path
          items.push(new LocalIncludePath(this.workspaceFolder, includePath, includePathUri, { description: variable }));
        } catch (e) {
          includePathUri = Uri.joinPath(this.workspaceFolder.uri, includePath);

          try {
            const statResult = await workspace.fs.stat(includePathUri);

            // Relative local include path
            items.push(new LocalIncludePath(this.workspaceFolder, includePath, includePathUri, { description: variable }));
          } catch (e) {
            if (includePath.startsWith('/')) {
              // Absolute remote include path
              items.push(new RemoteIncludePath(this.workspaceFolder, includePath, { description: variable }));
            } else {
              // Relative remote include path
              const remoteDir = await iProject!.getRemoteDir();
              const absoluteIncludePath = path.posix.join(remoteDir, includePath);
              items.push(new RemoteIncludePath(this.workspaceFolder, absoluteIncludePath, { label: includePath, description: variable }));
            }
          }
        }
      }
    }

    return items;
  }
}