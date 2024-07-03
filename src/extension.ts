import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// Function to check for exemption
	const isExempt = (document: vscode.TextDocument, position: vscode.Position) => {
		const lineNumber = position.line - 1;
		if (lineNumber < 0) {
			return false;
		}
		const lineText = document.lineAt(lineNumber).text;
		return lineText.trim() === '# EXEMPT';
	};

	// Function to apply transformations
	const applyTransformations = (editor: vscode.TextEditor) => {
		const document = editor.document;
		const selection = editor.selection;
		const text = document.getText();

		// Define the regular expressions for each pattern
		const patterns = [
			{ regex: /\/\/(?!\w)/g, replacement: '# ' },
			{ regex: /\+\+(?!\w)/g, replacement: ' += 1' },
			{ regex: /\-\-(?!\w)/g, replacement: ' -= 1' }
		];

		// Create a single editor edit to apply all transformations
		editor.edit(editBuilder => {
			let match;
			patterns.forEach(({ regex, replacement }) => {
				while ((match = regex.exec(text)) !== null) {
					const { index } = match;
					const position = document.positionAt(index);
					if (isExempt(document, position)) {
						continue;
					}
					editBuilder.replace(new vscode.Range(position, position.translate(0, match[0].length)), replacement);
				}
			});
		});
	};

	// Event listener for text document changes
	const textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
		// Check if the change is in an active text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document !== event.document) {
			return;
		}

		// Call the applyTransformations function
		applyTransformations(editor);
	});

	// Add the listener to the context's subscriptions
	context.subscriptions.push(textChangeListener);
}

export function deactivate() { }