import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {WorkspaceLeaf} from "obsidian";
import {VIEW_TYPE_EXAMPLE, ObsidianFilesView} from 'ObsidianFilesView'

// Remember to rename these classes and interfaces!

export interface MyPluginSettings {
	mySetting: string;
	showSearch: boolean
	showFolders: boolean
	paddingX: string
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	showSearch: true,
	showFolders: true,
	paddingX: '10%',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async activateView() {
		const {workspace} = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getLeaf(true);
			await leaf?.setViewState({type: VIEW_TYPE_EXAMPLE, active: true});
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}


	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ObsidianFilesView(leaf)
		);

		this.addRibbonIcon("folder-key", "Files index", () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-files-index',
			name: 'Open files index',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings')
			.setHeading()
			.setDesc('To apply changes reopen page index of files')

		new Setting(containerEl)
			.setName('Show search')
			.addToggle(async (value) => {
				value
					.setValue( this.plugin.settings.showSearch )
					.onChange(async (value) => {
						this.plugin.settings.showSearch = value;
						await this.plugin.saveSettings();
					})
			});

		new Setting(containerEl)
			.setName('Show folders')
			.addToggle(async (value) => {
				value
					.setValue( this.plugin.settings.showFolders )
					.onChange(async (value) => {
						this.plugin.settings.showFolders = value;
						await this.plugin.saveSettings();
					})
			});

		new Setting(containerEl)
			.setName('Horizontal padding')
			.setDesc('Example: 10, 20%, 30px, 40pt')
			.addText(text => text
				.setPlaceholder('Enter padding in px or percentage')
				.setValue(`${this.plugin.settings.paddingX}`)
				.onChange(async (value) => {
					this.plugin.settings.paddingX = value;
					await this.plugin.saveSettings();
				}));
	}
}
