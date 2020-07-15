import * as vscode from 'vscode';

export class Decorator {
    constructor(
        private context: vscode.ExtensionContext,
    ) {}

    private DELETED: vscode.SourceControlResourceDecorations = {
        strikeThrough: true,
        faded: false,
        tooltip: "Deleted",
        dark: {
            iconPath: this.context.asAbsolutePath('resources/icons/dark/status-deleted.svg')
        },
        light: {
            iconPath: this.context.asAbsolutePath('resources/icons/light/status-deleted.svg')
        }
    };
    
    private ADDED: vscode.SourceControlResourceDecorations = {
        strikeThrough: false,
        faded: false,
        tooltip: "Added",
        dark: {
            iconPath:  this.context.asAbsolutePath('resources/icons/dark/status-added.svg')
        },
        light: {
            iconPath:  this.context.asAbsolutePath('resources/icons/light/status-added.svg')
        }
    };
    
    private EDITED: vscode.SourceControlResourceDecorations = {
        strikeThrough: false,
        faded: false,
        tooltip: "Edited",
        dark: {
            iconPath:  this.context.asAbsolutePath('resources/icons/dark/status-modified.svg')
        },
        light: {
            iconPath:  this.context.asAbsolutePath('resources/icons/light/status-modified.svg')
        }
    };
    
    private RENAMED: vscode.SourceControlResourceDecorations = {
        strikeThrough: false,
        faded: false,
        tooltip: "Renamed",
        dark: {
            iconPath:  this.context.asAbsolutePath('resources/icons/dark/status-renamed.svg')
        },
        light: {
            iconPath:  this.context.asAbsolutePath('resources/icons/light/status-renamed.svg')
        }
    };
    
    private statuses = {
        Delete: this.DELETED,
        Add: this.ADDED,
        Edit: this.EDITED,
        Rename: this.RENAMED,
    };
    

    getDecorations(status: string): vscode.SourceControlResourceDecorations | undefined {
        return Object.entries(this.statuses).find(([sta])=> status.includes(sta))?.[1];
    }
}
