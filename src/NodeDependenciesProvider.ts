import * as vscode from "vscode";
import { PackageManager } from "./PackageManager";
import { HtmlGenerator } from "./HtmlGenerator";

export class NodeDependenciesProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "nodeDependencies";

    private _view?: vscode.WebviewView;
    private _packageManager: PackageManager;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._packageManager = new PackageManager();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = HtmlGenerator.generate(
            webviewView.webview,
            this._extensionUri,
        );

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "refresh": {
                    await this.refreshDependencies();
                    break;
                }
                case "update": {
                    this.updateDependency(data.name, data.version);
                    break;
                }
                case "install": {
                    this.installDependency(data.name);
                    break;
                }
                case "bulkUpdate": {
                    this.bulkUpdateDependencies(data.updates);
                    break;
                }
                case "search": {
                    await this.searchDependencies(data.query);
                    break;
                }
                case "onInfo": {
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    private async refreshDependencies() {
        if (!this._view) {
            return;
        }

        this._view.webview.postMessage({ type: "startLoading" });

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this._view.webview.postMessage({
                type: "error",
                value: "No workspace folder open",
            });
            return;
        }

        try {
            const dependencies = await this._packageManager.getDependencies(
                workspaceFolders[0].uri.fsPath,
            );
            this._view.webview.postMessage({
                type: "showDependencies",
                dependencies,
            });
        } catch (error: any) {
            this._view.webview.postMessage({
                type: "error",
                value: error.message || "Failed to refresh dependencies",
            });
        }
    }

    private updateDependency(packageName: string, version: string = "latest") {
        const terminal = vscode.window.createTerminal(`Update ${packageName}`);
        terminal.show();
        terminal.sendText(`npm install ${packageName}@${version}`);
        vscode.window.showInformationMessage(
            `Updating ${packageName} to ${version}...`,
        );
    }

    private installDependency(packageName: string) {
        const terminal = vscode.window.createTerminal(`Install ${packageName}`);
        terminal.show();
        terminal.sendText(`npm install ${packageName}`);
        vscode.window.showInformationMessage(`Installing ${packageName}...`);
    }

    private bulkUpdateDependencies(
        updates: { name: string; version: string }[],
    ) {
        // eslint-disable-next-line curly
        if (updates.length === 0) return;

        const terminal = vscode.window.createTerminal("Bulk Update");
        terminal.show();

        const installArgs = updates
            .map((u) => `${u.name}@${u.version}`)
            .join(" ");
        terminal.sendText(`npm install ${installArgs}`);

        vscode.window.showInformationMessage(
            `Updating ${updates.length} packages...`,
        );
    }

    private async searchDependencies(query: string) {
        // eslint-disable-next-line curly
        if (!query) return;

        try {
            const results = await this._packageManager.search(query);
            this._view?.webview.postMessage({
                type: "searchResults",
                results,
            });
        } catch (error: any) {
            this._view?.webview.postMessage({
                type: "error",
                value: error.message || "Search failed",
            });
        }
    }
}
