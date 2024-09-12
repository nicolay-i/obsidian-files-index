import {App, FileSystemAdapter, TAbstractFile, TFile, TFolder} from "obsidian";
import {useEffect, useState} from "react";
import {MyPluginSettings} from "./main";
import markdown from '@wcj/markdown-to-html';

const publicPropsName = 'tags'
const publicPropsVal = 'публичное'

export const FilesView = function () {
	const app = this.app as App;


	function getFiles() {
		return app.vault.getMarkdownFiles()
			.filter(file => {
				const props = app.metadataCache.getFileCache(file)?.frontmatter;
				const vals = (props ?? {})[publicPropsName]

				return vals === publicPropsVal || [...vals].includes(publicPropsVal)
			})
	}

	const files: TFile[] = getFiles();

	async function prepareAllFiles() {
		const allFiles = getFiles()
		const files = [...allFiles]
			.map(async file => {
				let content = await app.vault.read(file)

				// find links
				const regex = /\[\[(.*?)\]\]/gs;
				const matches = content.matchAll(regex);
				const links = [...matches].map(match => match[1]).map(link => ({
					path: link.split('|')[0],
					title: link.split('|')[1] ?? link.split('|')[0],
					textLink: link,
				}));

				const linksObj: {[x:string]: string} = {};
				for (const link of links) {
					linksObj[link.path] = link.title;

					// replace link to text view or html
					const fileLink = allFiles.find(file => file.basename === link.path);
					if (!fileLink) {
						content = content
							.replace(`[[${link.textLink}]]`, link.title);
					} else {
						content = content
							.replace(`[[${link.textLink}]]`, `<a href="${fileLink.path}">${link.title}</a>`);
					}
				}

				// convert md to html and hidden frontmatter data
				let html = markdown(content)
				html = html.toString().split('<hr>').slice(1).join('<hr>');

				return {...file, content, linksObj, html};
			})

		return Promise.all(files);
	}

	async function updResultFiles() {
		try {
			const data = await prepareAllFiles();
			const res = data.map(file => {
				return {
					path: file.path,
					content: file.content,
					linksObj: file.linksObj,
					html: file.html,
				}
			})


			const configPath = app.vault.configDir + "/plugins/obsidian-files-index/data.json";
			await app.vault.adapter.write(configPath, JSON.stringify(res, null, 2));

			for (let item of data) {
				const configPath = app.vault.configDir + `/plugins/obsidian-files-index/output/${item.path.replace('.md', '.html')}`;
				const pathToFile = configPath.split('/');
				pathToFile.pop();
				const pathToFile2 = pathToFile.join('/');
				await app.vault.adapter.mkdir(pathToFile2);

				await app.vault.adapter.write(configPath, item.html);
			}

		} catch (e) {
			console.error(e);
		}

	}

	useEffect(() => {
		updResultFiles();
	}, [files]);

	const [folderRoot, setFolderRoot] = useState<TFolder>(app.vault.getRoot())

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
		.map(file => ({...file, name: `${file.name}`, props: this.app.metadataCache.getFileCache(file)?.frontmatter}));

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

	function onClickByFile(file: TFile) {
		app.workspace.getLeaf().openFile(file);
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

	(window as any).FilesIndex = {
		filesFilter,
		app,
	}

	return <div className={'file-list'} style={{padding: `0 ${getValuePadding(settings.paddingX)}`}}>
		{settings.showFolders && <>
			{folders.length ? <span className={'folder'} onClick={() => {
				setFolders([...folders.slice(0, -1)]);
				if (folderRoot.parent) {
					setFolderRoot(folderRoot.parent);
				}
			}}> &lt; </span> : null}

			{folderRoot.children.filter(folder => folder instanceof TFolder)
				.map((folder2: TFolder) => {
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
