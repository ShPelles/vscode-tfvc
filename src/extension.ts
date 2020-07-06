import * as process from 'child_process';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-tfvc.checkoutCurrentFile', () => {
			const fileName = vscode.window.activeTextEditor?.document.fileName;
			if (fileName === undefined) {
				vscode.window.showWarningMessage(`No file found for checking out!`);
				return;
			}
			checkout(fileName);
		}),
		vscode.commands.registerCommand('vscode-tfvc.checkInCurrentFile', () => {
			const fileName = vscode.window.activeTextEditor?.document.fileName;
			if (fileName === undefined) {
				vscode.window.showWarningMessage(`No file found for checking in!`);
				return;
			}
			checkIn(fileName);
		}),
		vscode.commands.registerCommand('vscode-tfvc.undoCurrentFile', () => {
			const fileName = vscode.window.activeTextEditor?.document.fileName;
			if (fileName === undefined) {
				vscode.window.showWarningMessage(`No file found for undo!`);
				return;
			}
			undo(fileName);
		}),

		vscode.workspace.onWillSaveTextDocument(saveEvent => {
			const fileName = saveEvent.document.fileName;
			saveEvent.waitUntil(checkout(fileName));
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
		{ title: `Checking in ${fileName}...`, location: vscode.ProgressLocation.Notification },
		progress => new Promise((resolve, reject) => {
			const childProcess = process.execFile(tfPath, ['vc', 'undo', fileName]);
			let error = '';
			childProcess.stdout?.on('data', message => progress.report({ message }));
			childProcess.stderr?.on('data', data => error += data.toString());
			childProcess.on("exit", code => {
				if (code === 0) {
					vscode.window.showInformationMessage(`The file has been checked in successfully.`);
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

export function deactivate() { }
