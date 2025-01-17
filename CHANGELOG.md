# Change Log

All notable changes to the "vscode-ibmi-projectexplorer" extension will be documented in this file.

## `2.6.3`
- Create connection action in merlin should NOT be Code for IBM i dialog
- Hide Source Orbit migration options if Source Orbit not installed
- Missing iProject field when projects event is fired
- Make library type more explicit
- Fix missing deleted files in sub-directories
- Force refresh library list when changing library list description
- Rename configuration to `Disable User Library List View`
- Fix retrieval of members and objects

# Housekeeping
- Bump webpack from 5.89.0 to 5.90.3
- Bump @vscode/l10n-dev from 0.0.31 to 0.0.33
- Bump @types/tar from 6.1.10 to 6.1.11
- Bump dotenv from 16.3.2 to 16.4.4 by
- Bump @types/node from 20.11.5 to 20.11.19
- Bump @typescript-eslint/parser from 6.19.1 to 7.0.2
- Bump @typescript-eslint/eslint-plugin from 6.19.1 to 7.0.0
- Bump esbuild-loader from 4.0.2 to 4.0.3
- Bump ignore from 5.3.0 to 5.3.1

## `2.6.2`
- Add checkbox to generate bob Rules.mk files on migrate source by @edmundreinhardt in #329
- Adds checkbox to import member text on migrate source by @irfanshar in #298
- Changed IBM i panel to IBM i Project Explorer by @sebjulliand in #308
- Adds option during migrate source to have files in lowercase by @irfanshar in #322
- Fix incorrect link to library list and object library doc pages by @SanjulaGanepola in #316
- Fix file extension during file source orbit rename by @irfanshar in #325
- Fixes the iterable warning by @edmundreinhardt in #327

- Bump @halcyontech/vscode-ibmi-types from 2.6.0 to 2.6.5 by @dependabot in #314
- Bump typescript from 5.3.2 to 5.3.3 by @dependabot in #294
- Bump eslint from 8.55.0 to 8.56.0 by @dependabot in #292
- Bump actions/upload-artifact from 3 to 4 by @dependabot in #291
- Bump @typescript-eslint/parser from 6.18.0 to 6.19.1 by @dependabot in #321
- Bump dotenv from 16.3.1 to 16.3.2 by @dependabot in #320
- Bump @types/node from 20.10.7 to 20.11.5 by @dependabot in #319
- Bump @typescript-eslint/eslint-plugin from 6.13.2 to 6.19.1 by @dependabot in #318

## `2.6.0`
- Version numbers will now be in sync with the required `Code for i` extension.
  This caused extensions using this API to fail, including Merlin by @william-xiang
- When using the Compare filter on the Source node of the explorer, the temp files
  in the deployed directory will not be deleted upon refresh of the view. BOB builds
  that rely on generated `.Rules.mk.build` files will now succeed.
- When deleting deploy directories, the parent directory could mistakenly be synched
  and files not in the current project would be deleted.  This is now fixed.
- When the build and compile commands are not set, the prompt will now be prefilled
  with the BOB build and compile commands.  Once the command is set, it will also be
  run as invoked.
- If the `Set Build Command` or `Set Compile Command` are invoked from the command
  pallete, the prompt will appear.

## `1.2.6`
- The project state API threw an exception if no `iproj.json` is found in the project root.
  This caused extensions using this API to fail, including Merlin by @william-xiang
  
## `1.2.4`
- Gave explicit type to event's callback function by @sebjulliand in #201
- Add debug action to programs by @SanjulaGanepola in #86
- Fix update member text action by @SanjulaGanepola in #210
- Implement Job Log Updates by @irfanshar in #219
- Fixed explorer command calls by @sebjulliand in #225
- Fixed library actions by @sebjulliand in #228
- Fixed explorer crashing on non string values in iproj.json by @sebjulliand in #232
- Fixed launch configuration to run actual watch task by @sebjulliand in #233
- Fixed explorer crashing when refreshing project with extensible children by @sebjulliand in #234

## `1.2.2`
- Contribute the job log to the bottom panel
- Add docs about installation and Project Explorer features
- Add docs for release process
- Fix assign to variable from Project Explorer
- Fix build and compile when no `.logs` or `.evfevent`
- Fix job log error when no `iproj.json`

## `1.2.1`

- Fix missing action to resolve project metadata
- Fix file watcher exception
- Fix `libraryList` and `deployLocation` events not firing
- Fix incorrect file uri when running compile
- Create directories during source migration
- Add missing `Add to Include Paths` action in the file explorer and add actions to the Source

## `1.2.0`

- Add Connect to/Connect previous actions to project explorer
- Fix IProject state "extensions" mapping
- Add variable support for `extensions` attribute in `iproj.json`
- Add configuration to enable/disable Code4i user library list view
- Add `Set Deployment Method` and `Deploy Project` actions
- Add Environment Manager to detect if running in Merlin
- Add clean up from Source Orbit to source migration
- Add build/compile actions and improved optional action support

## `1.1.0`

- Add offline project support
- Improve error handling when no connection

## `1.0.2`

- Rename API to IBMiProjectExplorer
- Update docs with API changes

## `1.0.1`

- Update doc landing page
- Remove types submodule, update git workflow, and rename API

## `1.0.0`

- Initial release
