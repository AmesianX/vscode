/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IFrameWebview as WebviewElement } from 'vs/workbench/contrib/webview/browser/webviewElement';
import { IWebviewService, WebviewOptions, WebviewContentOptions, Webview } from 'vs/workbench/contrib/webview/common/webview';
import { URI } from 'vs/base/common/uri';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';

export class WebviewService implements IWebviewService {
	_serviceBrand: any;

	constructor(
		@IInstantiationService private readonly _instantiationService: IInstantiationService,
		@IEnvironmentService private readonly _environmentService: IEnvironmentService,
	) { }

	createWebview(
		options: WebviewOptions,
		contentOptions: WebviewContentOptions
	): Webview {
		return this._instantiationService.createInstance(WebviewElement,
			options,
			contentOptions);
	}

	toWebviewResource(resource: URI): URI {
		return URI.parse(this._environmentService.webviewResourceRoot + resource.path);
	}

	get cspRule(): string {
		return this._environmentService.webviewResourceRoot;
	}
}