# PdfViewer

Open PDF files quickly inside VS Code.

![PdfViewer banner](pdfviewerext-banner.png)

## Features

- Command: `PDF Viewer: Open File`
- Right-click `.pdf` in Explorer and open directly from the context menu
- Open selected PDF in an in-extension preview panel
- Optional preserve-focus behavior

## Extension Settings

- `pdfviewerext.openToSide`: Open PDFs in side editor.
- `pdfviewerext.preserveFocus`: Keep focus in current editor after opening PDF.

## Scripts

- `npm run compile`: Compile TypeScript
- `npm run watch`: Watch and compile on changes
- `npm run lint`: Run ESLint
- `npm test`: Run extension tests

## Run locally

1. Install dependencies: `npm install`
2. Press `F5` in VS Code to launch Extension Development Host
3. Open using either:
   - Explorer right-click on a `.pdf` file -> `PDF Viewer: Open File`
   - Command Palette -> `PDF Viewer: Open File`

## Publish

1. Install VSCE globally: `npm i -g @vscode/vsce`
2. Login once: `vsce login michaelsam94`
3. Publish: `vsce publish`
