# Change Log

All notable changes to the "vscode-tfvc" extension will be documented in this file.

## [Unreleased]
### Added
- `checkInAll` & `undoAll` commands in the SCM sidebar & the Command Palette.
- automatic checking out on edit.
- `tfvc.autoCheckout` configuration (None, On save, or On edit).

### Fixed
- Refresh the SCM sidebar after the side-bar commands (`Check in` & `Undo`) are called.


### Changed
- Rename the `vscode-tfvc.tfExePath` configuration to `tfvc.tfExePath`.

## [0.3.0] 2020-07-15
### Added
- Basic `SCM sidebar`. Include:
  - Display the changed files and their status (`Added`, `Deleted`, `Edited` or `Renamed`).
  - Allow to check-in, undo & open files.
  - Manual refresh (via `refreshSCM`) and auto refresh on changes and after TFVC commands.


## [0.2.0] 2020-07-06
### Added
- `Check in the current file` command.
- `Undo the pending changes in the current file` command.

## [0.1.1] 2020-07-05
### fixed
- Saving a file will wait until the checkout is over.

### Changed
- `activationEvents` is `*` instead of `onStartupFinished`.

## [0.1.0] 2020-07-05

### Added
- `Check out the current file` command.
- Automatic checking out on save.
- `vscode-tfvc.tfExePath` configuration.
