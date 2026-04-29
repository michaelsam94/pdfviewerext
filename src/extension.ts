import * as vscode from "vscode";
import * as path from "node:path";

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
        const panel = vscode.window.createWebviewPanel(
          "pdfviewerext.preview",
          `PDF Viewer: ${path.basename(sourceUri.fsPath)}`,
          {
            viewColumn,
            preserveFocus
          },
          {
            enableScripts: false,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.dirname(sourceUri.fsPath))]
          }
        );

        panel.webview.html = getPdfViewerHtml(
          panel.webview.asWebviewUri(sourceUri),
          sourceUri.fsPath
        );
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

function getPdfViewerHtml(pdfUri: vscode.Uri, filePath: string): string {
  const title = escapeHtml(path.basename(filePath));
  const source = escapeHtml(pdfUri.toString());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #1e1e1e;
        color: #e6edf3;
        font-family: sans-serif;
      }
      .viewer {
        width: 100%;
        height: 100%;
        border: 0;
      }
      .fallback {
        position: fixed;
        bottom: 12px;
        left: 12px;
        background: rgba(0, 0, 0, 0.7);
        padding: 8px 10px;
        border-radius: 6px;
      }
      .fallback a {
        color: #58a6ff;
      }
    </style>
  </head>
  <body>
    <embed class="viewer" src="${source}" type="application/pdf" />
    <div class="fallback">
      If preview does not load, <a href="${source}" target="_blank" rel="noreferrer">open PDF directly</a>.
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function deactivate() {}
