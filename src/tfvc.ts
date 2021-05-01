import * as process from 'child_process';
import * as vscode from 'vscode';

function getConfiguration(): { tfPath: string } {
	const configuration = vscode.workspace.getConfiguration('vscode-tfvc');
	const tfPath = configuration.get<string>('tfExePath');

	// TODO: if path not exist ask
	if (tfPath === undefined || tfPath.length === 0) { throw new Error(`The path of TF.exe path is not configured.`); }

	return { tfPath };
}

export function execTf(params: string[], showMessages = true): Parameters<typeof vscode.window.withProgress>[1] {
	const configuration = getConfiguration();
	const tfPath = configuration.tfPath;

	return progress => new Promise<string>((resolve, reject) => {
		let message = '';
		let error = '';
		const childProcess = process.execFile(tfPath, params);
		childProcess.stdout?.on('data', data => {
			if (showMessages) { progress.report(data); }
			message += data.toString();
		});
		childProcess.stderr?.on('data', data => error += data.toString());
		childProcess.on("exit", code => {
			if (code === 0) {
				resolve(message);
			} else {
				reject({ code, message: error });
			}
		});
	});
}
