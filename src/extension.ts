import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "pdfviewerext.openPdfFile",
    async (resource?: vscode.Uri) => {
      const sourceUri = await resolveSourceUri(resource);
      if (!sourceUri) {
        return;
      }

      const config = vscode.workspace.getConfiguration("pdfviewerext");
      const openToSide = config.get<boolean>("openToSide", true);
      const preserveFocus = config.get<boolean>("preserveFocus", false);

      try {
        const viewColumn = openToSide
          ? vscode.ViewColumn.Beside
          : vscode.ViewColumn.Active;
        await vscode.commands.executeCommand("vscode.open", sourceUri, {
          preview: false,
          preserveFocus,
          viewColumn
        });

        vscode.window.showInformationMessage(`Opened PDF: ${sourceUri.fsPath}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`PDF open failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function resolveSourceUri(
  resource?: vscode.Uri
): Promise<vscode.Uri | undefined> {
  if (resource && resource.fsPath.toLowerCase().endsWith(".pdf")) {
    return resource;
  }

  const selection = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: "Open PDF in Viewer",
    filters: {
      "PDF Documents": ["pdf"]
    }
  });

  if (!selection || selection.length === 0) {
    return undefined;
  }

  return selection[0];
}

export function deactivate() {}
