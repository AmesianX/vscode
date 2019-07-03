/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export interface WebviewResourceProvider {
	toWebviewResource(resource: vscode.Uri): Thenable<vscode.Uri>;

	readonly cspRule: Thenable<string>;
}