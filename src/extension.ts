import * as vscode from 'vscode';
import { DOMParser } from 'xmldom';

import { Decorator } from './decoration';
import { execTf } from './tfvc';

let scm: vscode.SourceControl;

export function activate(context: vscode.ExtensionContext) {

	if (vscode.workspace.workspaceFolders === undefined) { return; }
	if (vscode.workspace.workspaceFolders.length > 1) {
		vscode.window.showWarningMessage(`TFVC Extension don't works with multi-root workspace!`);
		return;
	}

	const decorator = new Decorator(context);

	const rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
	scm = vscode.scm.createSourceControl('tfvc', "TF Version Control", rootUri);
	scm.inputBox.placeholder = 'Enter a check-in message';

	const changes = scm.createResourceGroup('changes', 'Changes');
	refreshSCM(changes, decorator);


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
			refreshSCM(changes, decorator);
		}),

		vscode.commands.registerCommand('vscode-tfvc.undoAll', () => {
			undoAll();
		}),
		vscode.commands.registerCommand('vscode-tfvc.checkInAll', () => {
			checkInAll();
		}),

		vscode.commands.registerCommand('vscode-tfvc.undoFile', (...states: vscode.SourceControlResourceState[]) => {
			const paths = states.map(state => state.resourceUri.fsPath);
			let commonPath = longestCommonPrefix(paths);
			undo(commonPath);
		}),
		vscode.commands.registerCommand('vscode-tfvc.checkInFile', (...state: vscode.SourceControlResourceState[]) => {
			checkIn(state[0].resourceUri.fsPath);
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

function refreshSCM(group: vscode.SourceControlResourceGroup, decorator: Decorator) {
	const progressOptions: vscode.ProgressOptions = {
		title: `Refreshing the source control...`,
		location: vscode.ProgressLocation.SourceControl,
	};
	const params = ['vc', 'status', getRootUri(), '/recursive', '/format:xml'];

	return vscode.window.withProgress(progressOptions, execTf(params, false)).then(xml => {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xml as string, "text/xml");
		const elements = Array.from(xmlDoc.getElementsByTagName('PendingChange'));
		group.resourceStates = elements.map(el => ({
			resourceUri: vscode.Uri.file(el.getAttribute('local')!),
			decorations: decorator.getDecorations(el.getAttribute('chg') ?? ''),
		}));
		// vscode.window.showInformationMessage(`The source control has been refreshed successfully.`);
	}, (error: { code: number, message: string }) => {
		vscode.window.showErrorMessage(`Error: Cannot check the source control! (Code: ${error.code}; Error: ${error.message})`);
	});
}

function checkout(fileName: string) {
	const progressOptions: vscode.ProgressOptions = {
		title: `Checking out ${fileName}...`,
		location: vscode.ProgressLocation.Notification,
	};
	const params = ['vc', 'checkout', fileName];

	return vscode.window.withProgress(progressOptions, execTf(params)).then(() => {
		vscode.window.showInformationMessage(`The file has been checked out successfully.`);
		vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
	}, (error: { code: number, message: string }) => {
		vscode.window.showErrorMessage(`Error: The checkout failed! (Code: ${error.code}; Error: ${error.message})`);
	});
}

function checkIn(path: string) {
	const progressOptions: vscode.ProgressOptions = {
		title: `Checking in ${path}...`,
		location: vscode.ProgressLocation.Notification,
	};
	const params = ['vc', 'checkin', path, '/recursive'];

	return vscode.window.withProgress(progressOptions, execTf(params)).then(() => {
		vscode.window.showInformationMessage(`The file has been checked in successfully.`);
		vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
	}, (error: { code: number, message: string }) => {
		vscode.window.showErrorMessage(`Error: The check-in failed! (Code: ${error.code}; Error: ${error.message})`);
	});
}

// function getConfiguration(): { tfPath: string } {
// 	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
// 	const tfPath = configuration.get<string>('tfExePath');

// 	// TODO: if path not exist ask
// 	if (tfPath === undefined || tfPath.length === 0) { throw new Error(`The path of TF.exe path is not configured.`); }

// 	return { tfPath };
// }

// function execTf(params: string[], showMessages = true): Parameters<typeof vscode.window.withProgress>[1] {
// 	const configuration = getConfiguration();
// 	const tfPath = configuration.tfPath;

// 	return progress => new Promise<string>((resolve, reject) => {
// 		let message = '';
// 		let error = '';
// 		const childProcess = process.execFile(tfPath, params);
// 		childProcess.stdout?.on('data', data => {
// 			if (showMessages) { progress.report(data); }
// 			message += data.toString();
// 		});
// 		childProcess.stderr?.on('data', data => error += data.toString());
// 		childProcess.on("exit", code => {
// 			if (code === 0) {
// 				resolve(message);
// 			} else {
// 				reject({ code, message: error });
// 			}
// 		});
// 	});
// }

function getRootUri(): string {
	const rootUri = scm.rootUri?.fsPath;
	if (rootUri === undefined) {
		throw new Error('The root path not configured!');
	}
	return rootUri;
}

function checkInAll() {
	const progressOptions: vscode.ProgressOptions = {
		title: `Checking in all of the changes...`,
		location: vscode.ProgressLocation.Notification,
	};

	return new Promise<string | null>(resolve => {
		const comment = scm.inputBox.value;
		if (comment) { resolve(comment); }
		// TODO: ask for comment
		resolve(null);
	}).then(comment => {
		const commentArgs = comment ? ['/comment', `"${comment}"`] : [];
		const params = ['vc', 'checkin', getRootUri(), '/recursive', ...commentArgs];
		return vscode.window.withProgress(progressOptions, execTf(params));
	}).then(() => {
		vscode.window.showInformationMessage(`TThe files have been checked in successfully.`);
		vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
	}, (error: { code: number, message: string }) => {
		vscode.window.showErrorMessage(`Error: The check-in failed! (Code: ${error.code}; Error: ${error.message})`);
	});
}

function undo(fileName: string) {
	const progressOptions: vscode.ProgressOptions = {
		title: `Undoing ${fileName}...`,
		location: vscode.ProgressLocation.Notification,
	};
	const params = ['vc', 'undo', '/recursive', fileName];

	return vscode.window.withProgress(progressOptions, execTf(params)).then(() => {
		vscode.window.showInformationMessage(`The undo complete successfully..`);
		vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
	}, (error: { code: number, message: string }) => {
		vscode.window.showErrorMessage(`Error: The undo failed! (Code: ${error.code}; Error: ${error.message})`);
	});
}

function undoAll() {
	const progressOptions: vscode.ProgressOptions = {
		title: `Undoing all of the changes...`,
		location: vscode.ProgressLocation.Notification,
	};
	const params = ['vc', 'undo', getRootUri(), '/recursive'];

	return vscode.window.withProgress(progressOptions, execTf(params)).then(() => {
		vscode.window.showInformationMessage(`The undo complete successfully.`);
		vscode.commands.executeCommand('vscode-tfvc.refreshSCM');
	}, (error: { code: number, message: string }) => {
		vscode.window.showErrorMessage(`Error: The undo failed! (Code: ${error.code}; Error: ${error.message})`);
	});
}

export function deactivate() { }


// base on: https://www.linkedin.com/pulse/find-longest-common-prefix-array-strings-javascript-bradshaw/
function longestCommonPrefix(arr: string[]): string {
	if (!arr || arr.length === 0) {
		return '';
	}

	const sortedArray = arr.sort((a, b) => a.length - b.length);
	let shortestString = sortedArray[0];
	while (!arr.every(str => str.startsWith(shortestString))) {
		shortestString = shortestString.slice(0, -1);
	}
	return shortestString;
}
