import * as process from 'child_process';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let commandDisposable = vscode.commands.registerCommand('vscode-tfvc.checkoutCurrentFile', () => {
		const fileName = vscode.window.activeTextEditor?.document.fileName;
		if (fileName === undefined) {
			vscode.window.showWarningMessage(`No file found for checking out!`);
			return;
		}
		checkout(fileName);
	});

	let onWillSaveDisposable = vscode.workspace.onWillSaveTextDocument(saveEvent => {
		const fileName = saveEvent.document.fileName;
		checkout(fileName);
	});

	context.subscriptions.push(commandDisposable, onWillSaveDisposable);
}

function checkout(fileName: string) {
	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
	const defTfPath = 'C:/Program Files (x86)/Microsoft Visual Studio/2019/Community/Common7/IDE/CommonExtensions/Microsoft/TeamFoundation/Team Explorer/tf.exe';
	const tfPath = configuration.get<string>('tfExePath') || defTfPath;
	// todo: check if exist and if not ask
	if (tfPath === undefined || tfPath.length === 0) { }

	vscode.window.withProgress(
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

export function deactivate() { }
