import {TAbstractFile, TFolder} from "obsidian";
import {useState} from "react";
import {MyPluginSettings} from "./main";

export const FilesView = function () {
	const files: TAbstractFile[] = this.app.vault.getMarkdownFiles()
	const [folderRoot, setFolderRoot] = useState<TFolder>(this.app.vault.getRoot())

	const [search, setSearch] = useState<string>('');
	const [folders, setFolders] = useState<string[]>([]);

	const lastFolder = folders.length ? folders[folders.length - 1] : '';

	const plugin: any = this.app.plugins.plugins['files-index'];
	const settings: MyPluginSettings = plugin.settings;

	function getNumberFromName(name: string) {
		return Number.parseInt((name.split('.').join('').split(' ')[0] + '000000').slice(0, 6));
	}

	let filesFilter = files
		.filter(file => folders.length ? file.parent?.name === lastFolder : true)
		.filter(file => file.name.toLowerCase().includes(search.toLowerCase()))
		.map(file => ({...file, name: `${file.name}`}));

	filesFilter = filesFilter.sort((a: TAbstractFile, b: TAbstractFile) => {
		const nameA = settings.sortWithNumbers ? getNumberFromName(a.name) : a.name;
		const nameB = settings.sortWithNumbers ? getNumberFromName(b.name) : b.name;
		if (nameA < nameB) {
			return settings.sortByAsc ? -1 : 1;
		}
		if (nameA > nameB) {
			return settings.sortByAsc ? 1 : -1;
		}
		return 0;
	});

	function onClickByFile(file: TAbstractFile) {
		this.app.workspace.getLeaf().openFile(file);
	}

	function getValuePadding(val: string) {
		if (val.includes('%')) {
			return val;
		}
		if (val.includes('px')) {
			return val;
		}
		if (val.includes('pt')) {
			return val;
		}

		return `${val}px`;
	}

	return <div className={'file-list'} style={{padding: `0 ${getValuePadding(settings.paddingX)}`}}>
		{settings.showFolders && <>
			{folders.length ? <span className={'folder'} onClick={() => {
				setFolders([...folders.slice(0, -1)]);
				if (folderRoot.parent) {
					setFolderRoot(folderRoot.parent);
				}
			}}> &lt; </span> : null}
			{folderRoot.children.filter(folder => folder instanceof TFolder).map((folder2: TFolder) => {
				return <span
					key={`folders-${folder2.name}`}
					className={lastFolder === folder2.name ? 'folder active' : 'folder'}
					onClick={() => {
						if (folder2.name === lastFolder) {
							setFolders([...folders.slice(0, -1)]);
						} else {
							setFolders([...folders, folder2.name]);
							setFolderRoot(folder2);
						}
					}}>{folder2.name}</span>;
			})}
		</>}

		{settings.showSearch && <input
			type="text" value={search} onChange={(e) => setSearch(e.target.value)}
			className={'search-field'}
			placeholder={'Search file by name'}
		/>}

		{filesFilter.map((e) => {
			return <div
				key={`file-${e.name}`}
				className={'file'}
				onClick={() => onClickByFile(e)}
			>
				{e.name.replace('.md', '')}
			</div>;
		})}
	</div>;
};
