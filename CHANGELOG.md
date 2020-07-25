# Change Log

All notable changes to the "vscode-tfvc" extension will be documented in this file.

## [Unreleased]
### Fixed
- Run `refreshSCM()` after side-bar commands (`Check in` & `Undo`).

### Added
- `vscode-tfvc.autoCheckout` configuration.

## [0.3.0] 2020-07-15
### Added
- Basic `SCM Side Bar`. Include:
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
- `vscode-tfvc.checkoutCurrentFile` configuration.
