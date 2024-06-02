import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { FilesView } from "./FilesView";

export const VIEW_TYPE_EXAMPLE = "obisidian-files-view";

export class ObsidianFilesView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Files index";
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<FilesView />
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}


