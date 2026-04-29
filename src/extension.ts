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
            enableScripts: true,
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
  const source = escapeJsString(pdfUri.toString());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; connect-src https: http: data: blob: vscode-resource: file:;">
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
      #pages {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 12px;
        overflow: auto;
        box-sizing: border-box;
        height: 100%;
      }
      canvas {
        max-width: 100%;
        height: auto;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
      }
      .status {
        position: fixed;
        top: 12px;
        left: 12px;
        background: rgba(0, 0, 0, 0.75);
        padding: 8px 12px;
        border-radius: 6px;
        z-index: 2;
      }
    </style>
  </head>
  <body>
    <div id="status" class="status">Loading PDF preview...</div>
    <div id="pages"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs" type="module"></script>
    <script type="module">
      import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs";
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs";

      const source = "${source}";
      const pagesContainer = document.getElementById("pages");
      const status = document.getElementById("status");

      async function renderPdf() {
        try {
          const loadingTask = pdfjsLib.getDocument({ url: source });
          const pdf = await loadingTask.promise;
          status.textContent = "Rendering " + pdf.numPages + " pages...";

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.3 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) {
              throw new Error("Canvas context is unavailable.");
            }
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            pagesContainer.appendChild(canvas);
          }

          status.textContent = "PDF preview loaded";
          setTimeout(() => status.remove(), 1200);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          status.textContent = "Preview failed: " + message;
        }
      }

      renderPdf();
    </script>
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

function escapeJsString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

export function deactivate() {}
