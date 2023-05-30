/*
 * (c) Copyright IBM Corp. 2023
 */

import { commands, EventEmitter, ExtensionContext, l10n, ProgressLocation, QuickPickItem, TreeDataProvider, TreeItem, window, workspace, WorkspaceFolder } from "vscode";
import { getInstance } from "../../ibmi";
import ErrorItem from "./errorItem";
import { IProject } from "../../iproject";
import Project from "./project";
import envUpdater from "../../envUpdater";
import { ProjectManager } from "../../projectManager";
import { DecorationProvider } from "./decorationProvider";
import { ProjectExplorerTreeItem } from "./projectExplorerTreeItem";
import IncludePaths from "./includePaths";
import LibraryList from "./libraryList";
import Library from "./library";
import LocalIncludePath from "./localIncludePath";
import RemoteIncludePath from "./remoteIncludePath";
import { migrateToIFS } from "./migrateToIFS";
import * as path from "path";

export default class ProjectExplorer implements TreeDataProvider<ProjectExplorerTreeItem> {
  private _onDidChangeTreeData = new EventEmitter<ProjectExplorerTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private projectTreeItems: Project[] = [];

  constructor(context: ExtensionContext) {
    const decorationProvider = new DecorationProvider();
    context.subscriptions.push(
      window.registerFileDecorationProvider(decorationProvider),
      commands.registerCommand(`vscode-ibmi-projectexplorer.setActiveProject`, async (element?: Project) => {
        if (element) {
          ProjectManager.setActiveProject(element.workspaceFolder!);
          this.refresh();
        } else {
          const projectItems: QuickPickItem[] = [];
          const activeProject = ProjectManager.getActiveProject();
          for (const iProject of ProjectManager.getProjects()) {
            const state = await iProject.getState();
            if (state) {
              const icon = activeProject && activeProject.workspaceFolder === iProject.workspaceFolder ? `$(root-folder)` : `$(symbol-folder)`;
              projectItems.push({ label: `${icon} ${iProject.getName()}`, description: state.description });
            }
          }

          const newActiveProject = await window.showQuickPick(projectItems, {
            placeHolder: l10n.t('Select a project')
          });

          if (newActiveProject) {
            const iProject = ProjectManager.getProjectFromName(newActiveProject.label.split(' ')[1]);
            if (iProject) {
              ProjectManager.setActiveProject(iProject.workspaceFolder);
              this.refresh();
            }
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.projectExplorer.migrateToIFS`, async (element: Library) => {
        if (element) {
          const migrationData = await migrateToIFS(element.label!.toString());
          if (migrationData) {
            const ibmi = getInstance();
            let deploymentDirs = ibmi?.getStorage().getDeployment()!;
            let remoteDir = deploymentDirs[element.workspaceFolder.uri.fsPath];
            if (!remoteDir) {
              await commands.executeCommand(`code-for-ibmi.setDeployLocation`, undefined, element.workspaceFolder, `${ibmi?.getConfig().homeDirectory}${element.workspaceFolder.name}`);

              deploymentDirs = ibmi?.getStorage().getDeployment()!;
              remoteDir = deploymentDirs[element.workspaceFolder.uri.fsPath];
              if (!remoteDir) {
                return;
              }
            }

            let migration = {
              numFiles: migrationData.sourceFiles.length,
              numSuccess: 0,
              numFail: 0,
              result: true
            };
            await window.withProgress({
              location: ProgressLocation.Notification,
              title: l10n.t('Migrating to IFS'),
            }, async (progress) => {
              for await (const file of migrationData.sourceFiles) {
                progress.report({ message: file });

                const result = await ibmi?.getConnection().sendCommand({
                  command: `export PATH="/QOpenSys/pkgs/bin:$PATH:" && /QOpenSys/pkgs/bin/makei cvtsrcpf -c ${migrationData.defaultCCSID} ${path.parse(file).name} ${element.label}`,
                  directory: remoteDir
                });

                if (result?.code === 0) {
                  migration.numSuccess++;
                } else {
                  migration.numFail++;
                  migration.result = false;
                }
              }
            });

            if (migration.result) {
              window.showInformationMessage(l10n.t('Successfully migrated {0}/{1} source file(s) to {2}',
                migration.numSuccess, migration.numFiles, remoteDir));
            } else {
              window.showErrorMessage(l10n.t('Failed to migrate {0}/{1} source file(s) to {2}',
                migration.numFail, migration.numFiles, remoteDir), l10n.t('View log')).then(async choice => {
                  if (choice === l10n.t('View log')) {
                    ibmi?.getConnection().outputChannel?.show();
                  }
                });
            }

            this.refresh();
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.projectExplorer.addLibraryListEntry`, async (element: LibraryList) => {
        if (element) {
          const iProject = ProjectManager.get(element.workspaceFolder);

          if (iProject) {
            const library = await window.showInputBox({
              prompt: l10n.t('Enter library name'),
              placeHolder: l10n.t('Library name')
            });

            if (library) {
              const selectedPosition = await window.showQuickPick([
                l10n.t('Beginning of Library List'),
                l10n.t('End of Library List')], {
                placeHolder: l10n.t('Choose where to position the library'),
              });

              if (selectedPosition) {
                const position = (selectedPosition === l10n.t('Beginning of Library List')) ? 'preUsrlibl' : 'postUsrlibl';
                await iProject.addToLibraryList(library, position);
              }
            }
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.projectExplorer.setCurrentLibrary`, async (element: LibraryList) => {
        if (element) {
          const iProject = ProjectManager.get(element.workspaceFolder);

          if (iProject) {
            const library = await window.showInputBox({
              prompt: l10n.t('Enter library name'),
              placeHolder: l10n.t('Library name')
            });

            if (library) {
              await iProject.setCurrentLibrary(library);
            }
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.projectExplorer.removeFromLibraryList`, async (element: Library) => {
        if (element) {
          const iProject = ProjectManager.get(element.workspaceFolder);

          if (iProject) {
            const library = element.label!.toString();
            await iProject.removeFromLibraryList(library, element.libraryType);
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.updateVariable`, async (workspaceFolder: WorkspaceFolder, varName: string, currentValue?: string) => {
        if (workspaceFolder && varName) {
          const iProject = ProjectManager.get(workspaceFolder);
          if (iProject) {
            const newValue = await window.showInputBox({
              prompt: l10n.t('Enter new value for {0}', varName),
              placeHolder: l10n.t('Variable value'),
              value: currentValue || ``,
            });

            if (newValue) {
              const envPath = iProject.getEnvFilePath();
              await envUpdater(envPath, {
                [varName]: newValue
              });
            }
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.createProject`, async (workspaceFolder: WorkspaceFolder) => {
        if (workspaceFolder) {
          const iProject = ProjectManager.get(workspaceFolder);
          if (iProject) {
            const description = await window.showInputBox({
              prompt: l10n.t('Enter project description'),
              placeHolder: l10n.t('Description')
            });

            if (description) {
              await iProject.createProject(description);
            }
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.createEnv`, async (workspaceFolder: WorkspaceFolder) => {
        if (workspaceFolder) {
          const iProject = ProjectManager.get(workspaceFolder);
          if (iProject) {
            await iProject.createEnv();
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.addToIncludePaths`, async (element: TreeItem) => {
        if (element instanceof IncludePaths) {
          const iProject = ProjectManager.get(element.workspaceFolder);

          if (iProject) {
            const includePath = await window.showInputBox({
              prompt: l10n.t('Enter include path'),
              placeHolder: l10n.t('Include Path')
            });

            if (includePath) {
              await iProject.addToIncludePaths(includePath);
            }
          }
        } else {
          const includePath = (element as any).path;
          if (includePath) {
            const iProject = ProjectManager.getActiveProject();
            if (iProject) {
              await iProject.addToIncludePaths(includePath);
            }
          } else {
            window.showErrorMessage(l10n.t('Failed to retrieve path to directory'));
          }
        }
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.revealInExplorer`, async (element: LocalIncludePath) => {
        await commands.executeCommand('revealInExplorer', element.uri);
      }),
      commands.registerCommand(`vscode-ibmi-projectexplorer.removeFromIncludePaths`, async (element: RemoteIncludePath | LocalIncludePath) => {
        if (element) {
          const iProject = ProjectManager.get(element.workspaceFolder);

          if (iProject) {
            await iProject.removeFromIncludePaths(element.label!.toString());
          }
        }
      })
    );
  }

  refresh(element?: ProjectExplorerTreeItem) {
    this._onDidChangeTreeData.fire(element);
  }

  getTreeItem(element: ProjectExplorerTreeItem): ProjectExplorerTreeItem | Thenable<ProjectExplorerTreeItem> {
    return element;
  }

  async getChildren(element?: ProjectExplorerTreeItem): Promise<ProjectExplorerTreeItem[]> {
    if (element) {
      return element.getChildren();
    } else {
      const items: ProjectExplorerTreeItem[] = [];

      const ibmi = getInstance();

      if (ibmi && ibmi.getConnection()) {
        const workspaceFolders = workspace.workspaceFolders;

        if (workspaceFolders && workspaceFolders.length > 0) {
          for await (const folder of workspaceFolders) {
            ProjectManager.load(folder);

            const iProject = ProjectManager.get(folder);
            if (iProject) {
              const metadataExists = await iProject.projectFileExists('iproj.json');
              if (metadataExists) {
                const state = await iProject.getState();
                if (state) {
                  items.push(new Project(folder, state.description));
                } else {
                  items.push(new Project(folder));
                }
              } else {
                items.push(new ErrorItem(
                  folder,
                  folder.name,
                  {
                    description: l10n.t('Please configure project metadata'),
                    command: {
                      command: 'vscode-ibmi-projectexplorer.createProject',
                      arguments: [folder],
                      title: l10n.t('Create project iproj.json')
                    }
                  }));
              }
            }

            this.projectTreeItems = items as Project[];
          };

          const activeProject = ProjectManager.getActiveProject();
          if (activeProject) {
            const projectTreeItem = this.getProjectTreeItem(activeProject);
            if (projectTreeItem) {
              projectTreeItem.setActive();
            }
          }

        } else {
          items.push(new ErrorItem(
            undefined,
            l10n.t('Please open a local workspace folder'),
            {
              command: {
                command: 'workbench.action.files.openFolder',
                title: l10n.t('Open folder')
              }
            }));
        }
      } else {
        items.push(new ErrorItem(undefined, l10n.t('Please connect to an IBM i')));
      }

      return items;
    }
  }

  getProjectTreeItem(iProject: IProject): Project | undefined {
    for (const projectTreeItem of this.projectTreeItems) {
      if (projectTreeItem.workspaceFolder === iProject.workspaceFolder) {
        return projectTreeItem;
      }
    }
  }
}