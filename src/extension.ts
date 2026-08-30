// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

async function getTargetFiles(targets: vscode.Uri[] | vscode.Uri | undefined): Promise<vscode.Uri[]> {
	const entries = Array.isArray(targets) ? targets : targets ? [targets] : [];

	if (entries.length === 0 && vscode.window.activeTextEditor) {
		entries.push(vscode.window.activeTextEditor.document.uri);
	}

	const files: vscode.Uri[] = [];

	for (const entry of entries) {
		if (!entry) {
			continue;
		}

		try {
			const stat = await vscode.workspace.fs.stat(entry);
			if ((stat.type & vscode.FileType.File) !== 0) {
				files.push(entry);
				continue;
			}

			if ((stat.type & vscode.FileType.Directory) !== 0) {
				const children = await vscode.workspace.fs.readDirectory(entry);
				for (const [name, fileType] of children) {
					const childUri = vscode.Uri.joinPath(entry, name);
					if ((fileType & vscode.FileType.File) !== 0) {
						files.push(childUri);
					}
					if ((fileType & vscode.FileType.Directory) !== 0) {
						const nested = await getTargetFiles(childUri);
						files.push(...nested);
					}
				}
			}
		} catch {
			console.log('error');
		}
	}

	return Array.from(new Map(files.map((uri) => [uri.toString(), uri])).values());
}

async function runPythonCommentCleanup(file: vscode.Uri): Promise<boolean> {
	const pythonCommand = await findPython();
	if (!pythonCommand) {
		vscode.window.showWarningMessage('Python is required to remove comments. Please install Python and ensure it is on PATH.');
		return false;
	}

	const scriptPath = path.join(__dirname, '..', 'tools', 'remove_comments.py');
	const configPath = path.join(__dirname, '..', 'tools', 'vergemakkelijken.yml');
	const dependencyCheck = cp.spawnSync(pythonCommand, ['-c', 'import libcst, yaml'], { encoding: 'utf8' });
	if (dependencyCheck.status !== 0) {
		vscode.window.showWarningMessage(
			`Python dependency is missing: libcst or pyyaml. The resolved interpreter is ${pythonCommand}. Run: "${pythonCommand} -m pip install -r tools/requirements.txt"`
		);
		return false;
	}

	return new Promise<boolean>((resolve) => {
		const child = cp.spawn(pythonCommand, [scriptPath, file.fsPath, configPath], {
			stdio: ['ignore', 'pipe', 'pipe']
		});

		let stderr = '';

		child.stderr.on('data', (chunk) => {
			stderr += chunk.toString();
		});

		child.on('close', (code) => {
			if (code !== 0) {
				console.error(stderr);
				resolve(false);
				return;
			}

			resolve(true);
		});
	});
}

async function visitFiles(
	targets: vscode.Uri[] | vscode.Uri | undefined,
	visitor: (file: vscode.Uri) => Promise<boolean>
): Promise<void> {
	const files = await getTargetFiles(targets);

	if (files.length === 0) {
		vscode.window.showWarningMessage('No files were selected for cleanup.');
		return;
	}

	let processed = 0;

	for (const file of files) {
		try {
			const ok = await visitor(file);
			if (ok) {
				processed += 1;
			}
		} catch {
			// Skip unreadable or binary files.
		}
	}

	vscode.window.showInformationMessage(`Processed ${processed} file(s).`);
}

async function findPython(): Promise<string | null> {
	const workspaceCandidates = [
		process.env.VIRTUAL_ENV ? path.join(process.env.VIRTUAL_ENV, 'bin', 'python') : null,
		path.join(process.cwd(), '.venv', 'bin', 'python'),
		path.join(process.cwd(), 'venv', 'bin', 'python'),
	];

	for (const candidate of workspaceCandidates) {
		if (!candidate) {
			continue;
		}
		const result = cp.spawnSync(candidate, ['--version'], { stdio: 'ignore' });
		if (result.status === 0) {
			return candidate;
		}
	}

	for (const candidate of ['python3', 'python']) {
		const result = cp.spawnSync(candidate, ['--version'], { stdio: 'ignore' });
		if (result.status === 0) {
			return candidate;
		}
	}

	return null;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vergemakkelijken-vsc" is now active!');

	const disposable = vscode.commands.registerCommand('vergemakkelijken-vsc.cleanupComments', (target?: vscode.Uri[] | vscode.Uri) => {
		void visitFiles(target, runPythonCommentCleanup);
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
