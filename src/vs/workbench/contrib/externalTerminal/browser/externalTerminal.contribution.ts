/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import * as paths from 'vs/base/common/path';
import { URI as uri } from 'vs/base/common/uri';
import { IExternalTerminalConfiguration, IExternalTerminalService } from 'vs/workbench/contrib/externalTerminal/common/externalTerminal';
import { MenuId, MenuRegistry } from 'vs/platform/actions/common/actions';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { ITerminalService as IIntegratedTerminalService, KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED } from 'vs/workbench/contrib/terminal/common/terminal';
import { IHistoryService } from 'vs/workbench/services/history/common/history';
import { ResourceContextKey } from 'vs/workbench/common/resources';
import { KeybindingsRegistry, KeybindingWeight } from 'vs/platform/keybinding/common/keybindingsRegistry';
import { IFileService } from 'vs/platform/files/common/files';
import { IListService } from 'vs/platform/list/browser/listService';
import { getMultiSelectedResources } from 'vs/workbench/contrib/files/browser/files';
import { CommandsRegistry } from 'vs/platform/commands/common/commands';
import { Schemas } from 'vs/base/common/network';
import { distinct } from 'vs/base/common/arrays';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';


const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
CommandsRegistry.registerCommand({
	id: OPEN_IN_TERMINAL_COMMAND_ID,
	handler: (accessor, resource: uri) => {
		const configurationService = accessor.get(IConfigurationService);
		const editorService = accessor.get(IEditorService);
		const fileService = accessor.get(IFileService);
		const integratedTerminalService = accessor.get(IIntegratedTerminalService);
		const terminalService = accessor.get(IExternalTerminalService);
		const resources = getMultiSelectedResources(resource, accessor.get(IListService), editorService);

		return fileService.resolveAll(resources.map(r => ({ resource: r }))).then(stats => {
			const directoriesToOpen = distinct(stats.filter(data => data.success).map(({ stat }) => stat!.isDirectory ? stat!.resource.fsPath : paths.dirname(stat!.resource.fsPath)));
			return directoriesToOpen.map(dir => {
				if (configurationService.getValue<IExternalTerminalConfiguration>().terminal.explorerKind === 'integrated') {
					const instance = integratedTerminalService.createTerminal({ cwd: dir });
					if (instance && (resources.length === 1 || !resource || dir === resource.fsPath || dir === paths.dirname(resource.fsPath))) {
						integratedTerminalService.setActiveInstance(instance);
						integratedTerminalService.showPanel(true);
					}
				} else {
					terminalService.openTerminal(dir);
				}
			});
		});
	}
});

const OPEN_NATIVE_CONSOLE_COMMAND_ID = 'workbench.action.terminal.openNativeConsole';
KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_C,
	when: KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED,
	weight: KeybindingWeight.WorkbenchContrib,
	handler: (accessor) => {
		const historyService = accessor.get(IHistoryService);
		const terminalService = accessor.get(IExternalTerminalService);
		const root = historyService.getLastActiveWorkspaceRoot(Schemas.file);
		if (root) {
			terminalService.openTerminal(root.fsPath);
		} else {
			// Opens current file's folder, if no folder is open in editor
			const activeFile = historyService.getLastActiveFile(Schemas.file);
			if (activeFile) {
				terminalService.openTerminal(paths.dirname(activeFile.fsPath));
			}
		}
	}
});

MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
	command: {
		id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
		title: { value: nls.localize('globalConsoleAction', "Open New Terminal"), original: 'Open New Terminal' }
	}
});

const openConsoleCommand = {
	id: OPEN_IN_TERMINAL_COMMAND_ID,
	title: nls.localize('scopedConsoleAction', "Open in Terminal")
};
MenuRegistry.appendMenuItem(MenuId.OpenEditorsContext, {
	group: 'navigation',
	order: 30,
	command: openConsoleCommand,
	when: ResourceContextKey.Scheme.isEqualTo(Schemas.file)
});

MenuRegistry.appendMenuItem(MenuId.ExplorerContext, {
	group: 'navigation',
	order: 30,
	command: openConsoleCommand,
	when: ResourceContextKey.Scheme.isEqualTo(Schemas.file)
});
