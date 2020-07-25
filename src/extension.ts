import * as process from 'child_process';
import * as vscode from 'vscode';
import { DOMParser } from 'xmldom';

import { Decorator } from './decoration';

export function activate(context: vscode.ExtensionContext) {

	if (vscode.workspace.workspaceFolders === undefined) { return; }
	if (vscode.workspace.workspaceFolders.length > 1) {
		vscode.window.showWarningMessage(`TFSC Extension don't works with multy-root workspace!`);
		return;
	}

	const decorator = new Decorator(context);

	const rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
	const scm = vscode.scm.createSourceControl('tfvc', "TF Version Control", rootUri);
	const changes = scm.createResourceGroup('changes', 'Changes');
	refreshSCM(scm, changes, decorator);


	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('vscode-tfvc.checkoutCurrentFile', editor => {
			const fileName = editor.document.fileName;
			if (fileName === undefined) {
				vscode.window.showWarningMessage(`No file found for checking out!`);
				return;
			}
			checkout(fileName);
		}),
		vscode.commands.registerTextEditorCommand('vscode-tfvc.checkInCurrentFile', editor => {
			const fileName = editor.document.fileName;
			if (fileName === undefined) {
				vscode.window.showWarningMessage(`No file found for checking in!`);
				return;
			}
			checkIn(fileName);
		}),
		vscode.commands.registerTextEditorCommand('vscode-tfvc.undoCurrentFile', editor => {
			const fileName = editor.document.fileName;
			if (fileName === undefined) {
				vscode.window.showWarningMessage(`No file found for undo!`);
				return;
			}
			undo(fileName);
		}),
		vscode.commands.registerCommand('vscode-tfvc.refreshSCM', () => {
			refreshSCM(scm, changes, decorator);
		}),

		vscode.commands.registerCommand('vscode-tfvc.undoFile', (state: vscode.SourceControlResourceState) => {
			undo(state.resourceUri.fsPath);
		}),
		vscode.commands.registerCommand('vscode-tfvc.checkInFile', (state: vscode.SourceControlResourceState) => {
			checkIn(state.resourceUri.fsPath);
		}),
		vscode.commands.registerCommand('vscode-tfvc.openFile', (state: vscode.SourceControlResourceState) => {
			vscode.commands.executeCommand('vscode.open', state.resourceUri);
		}),

		vscode.workspace.onWillSaveTextDocument(saveEvent => {
			const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
			const autoCheckout = configuration.get<boolean>('autoCheckout');
			if (!autoCheckout) { return; }

			const fileName = saveEvent.document.fileName;
			saveEvent.waitUntil(checkout(fileName));
		}),

		vscode.workspace.onDidCreateFiles(() => vscode.commands.executeCommand('vscode-tfvc.refreshSCM')),
		vscode.workspace.onDidDeleteFiles(() => vscode.commands.executeCommand('vscode-tfvc.refreshSCM')),
		vscode.workspace.onDidRenameFiles(() => vscode.commands.executeCommand('vscode-tfvc.refreshSCM')),
		vscode.workspace.onDidSaveTextDocument(() => vscode.commands.executeCommand('vscode-tfvc.refreshSCM')),
	);
}

function refreshSCM(scm: vscode.SourceControl, group: vscode.SourceControlResourceGroup, decorator: Decorator) {
	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
	const tfPath = configuration.get<string>('tfExePath');
	// todo: check if exist and if not ask
	if (tfPath === undefined || tfPath.length === 0) { return Promise.reject(); }

	return vscode.window.withProgress(
		{ title: `Refreshing the source control...`, location: vscode.ProgressLocation.SourceControl },
		_progress => new Promise((resolve, reject) => {
			const childProcess = process.execFile(tfPath, ['vc', 'status', scm.rootUri?.fsPath ?? '', '/recursive', '/format:xml']);
			let message = '', error = '';
			childProcess.stdout?.on('data', data => message += data.toString());
			childProcess.stderr?.on('data', data => error += data.toString());
			childProcess.on("exit", code => {
				if (code === 0) {
					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(message, "text/xml");
					const elements = Array.from(xmlDoc.getElementsByTagName('PendingChange'));
					group.resourceStates = elements.map(el => ({
						resourceUri: vscode.Uri.file(el.getAttribute('local')!),
						decorations: decorator.getDecorations(el.getAttribute('chg') ?? ''),
					}));
					resolve();
				}
				else {
					vscode.window.showErrorMessage(`Error: Cannot check the source control! (Code: ${code}; Error: ${error})`);
					reject();
				}
			});
		})
	);
}

function checkout(fileName: string) {
	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
	const tfPath = configuration.get<string>('tfExePath');
	// todo: check if exist and if not ask
	if (tfPath === undefined || tfPath.length === 0) { return Promise.reject(); }

	return vscode.window.withProgress(
		{ title: `Checking out ${fileName}...`, location: vscode.ProgressLocation.Notification },
		progress => new Promise((resolve, reject) => {
			const childProcess = process.execFile(tfPath, ['vc', 'checkout', fileName]);
			let error = '';
			childProcess.stdout?.on('data', message => progress.report({ message }));
			childProcess.stderr?.on('data', data => error += data.toString());
			childProcess.on("exit", code => {
				if (code === 0) {
					vscode.window.showInformationMessage(`The file has been checked out successfully.`);
					vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
					resolve();
				}
				else {
					vscode.window.showErrorMessage(`Error: The checkout failed! (Code: ${code}; Error: ${error})`);
					reject();
				}
			});
		})
	);
}

function checkIn(fileName: string) {
	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
	const tfPath = configuration.get<string>('tfExePath');
	// todo: check if exist and if not ask
	if (tfPath === undefined || tfPath.length === 0) { return Promise.reject(); }

	return vscode.window.withProgress(
		{ title: `Checking in ${fileName}...`, location: vscode.ProgressLocation.Notification },
		progress => new Promise((resolve, reject) => {
			const childProcess = process.execFile(tfPath, ['vc', 'checkin', fileName]);
			let error = '';
			childProcess.stdout?.on('data', message => progress.report({ message }));
			childProcess.stderr?.on('data', data => error += data.toString());
			childProcess.on("exit", code => {
				if (code === 0) {
					vscode.window.showInformationMessage(`The file has been checked in successfully.`);
					vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
					resolve();
				}
				else {
					vscode.window.showErrorMessage(`Error: The check-in failed! (Code: ${code}; Error: ${error})`);
					reject();
				}
			});
		})
	);
}


function undo(fileName: string) {
	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
	const tfPath = configuration.get<string>('tfExePath');
	// todo: check if exist and if not ask
	if (tfPath === undefined || tfPath.length === 0) { return Promise.reject(); }

	return vscode.window.withProgress(
		{ title: `Undoing ${fileName}...`, location: vscode.ProgressLocation.Notification },
		progress => new Promise((resolve, reject) => {
			const childProcess = process.execFile(tfPath, ['vc', 'undo', fileName]);
			let error = '';
			childProcess.stdout?.on('data', message => progress.report({ message }));
			childProcess.stderr?.on('data', data => error += data.toString());
			childProcess.on("exit", code => {
				if (code === 0) {
					vscode.window.showInformationMessage(`The undo complete successfully.`);
					vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
					resolve();
				}
				else {
					vscode.window.showErrorMessage(`Error: The undo failed! (Code: ${code}; Error: ${error})`);
					reject();
				}
			});
		})
	);
}

export function deactivate() { }
