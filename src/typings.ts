/*
 * (c) Copyright IBM Corp. 2023
 */

import { ProjectManager } from "./projectManager";
import ProjectExplorer from "./views/projectExplorer";

export interface ProjectExplorerApi {
  projectManager: ProjectManager,
  projectExplorer: ProjectExplorer
}

export enum ContextValue {
  project = 'project',
  variables = 'variables',
  objectLibrary = 'objectLibrary',
  library = 'library',
  objectFile = `objectFile`,
  memberFile = 'memberFile',
  ifsDirectory = 'ifsDirectory',
  ifsFile = 'ifsFile',
  variable = 'variable',
  error = 'error'
}