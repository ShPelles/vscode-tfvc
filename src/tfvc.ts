import * as process from 'child_process';
import * as vscode from 'vscode';

function getCliPath(): string {
	const configuration = vscode.workspace.getConfiguration('tfvc');
	const tfPath = configuration.get<string>('tfExePath');

	// TODO: if path not exist ask
	if (tfPath === undefined || tfPath.length === 0) { throw new Error(`The path of TF.exe path is not configured.`); }

	return tfPath;
}

export function execTf(params: string[]): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let message: string[] = [];
		let error: string[] = [];

		const childProcess = process.execFile(getCliPath(), params);

		childProcess.stdout?.on('data', data => {
			console.debug('tf.exe', data);
			message.push(data.toString());
		});
		childProcess.stderr?.on('data', data => {
			console.warn('tf.exe', data);
			error.push(data.toString());
		});
		childProcess.on("exit", code => {
			if (code === 0) {
				resolve(message.join('; '));
			} else {
				reject({ code, message: error.join('; ') });
			}
		});
	});
}
