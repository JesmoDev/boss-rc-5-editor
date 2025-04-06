import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MUIComponent } from "./component";
import { FileManager } from "./fileManager";
import { repeat } from "lit/directives/repeat.js";

type Mem = {
  mem: Element;
  file?: {
    name: string;
    file: File;
  };
};

@customElement("mui-editor")
export class MuiEditor extends MUIComponent {
  @property({ attribute: false }) fileHandle?: FileSystemFileHandle;
  @property({ attribute: false }) directoryHandle?: FileSystemDirectoryHandle;
  @property({ attribute: false }) xmlDoc?: Document;
  @property({ attribute: false }) mems: Mem[] = [];

  onOpenFolder = async () => {
    const { directoryHandle, handle, content } = await FileManager.openFile();

    if (!handle || !content) {
      console.error("Failed to open file or read content.");
      return;
    }
    this.directoryHandle = directoryHandle;
    this.fileHandle = handle;
    const parser = new DOMParser();
    this.xmlDoc = parser.parseFromString(content, "application/xml");

    if (!directoryHandle) return;

    const mems = Array.from(this.xmlDoc.querySelectorAll("mem")).map(async (mem, index) => {
      // Get the correct folder handle using navigateToSubfolders
      const fileFolderHandle = await this.navigateToSubfolders(directoryHandle, [`wave`, `${this.padNumber(index + 1)}_1`]);

      if (!fileFolderHandle) {
        console.error("Failed to navigate to subfolders.");
        return { mem };
      }

      const file = (await fileFolderHandle.values().next()).value as File;

      if (file) console.log(Number.parseInt(mem.getAttribute("id") ?? "") + 1, file?.name); // Print the name of the first file in the folder

      // Fill out the file object with the name and the actual file
      return {
        mem,
        file: file ? { name: file.name, file: file } : undefined,
      };
    });

    // Wait for all the promises to resolve before continuing
    this.mems = await Promise.all(mems);
  };

  padNumber(num: number) {
    return num.toString().padStart(3, "0");
  }

  updateMemName = (mem: Element, name: String) => {
    const nameElement = mem.querySelector("NAME");

    if (!nameElement) return;

    const paddedName = name.padEnd(12, " ").slice(0, 12);
    const nameCharElements = nameElement.children;

    for (let i = 0; i < 12; i++) {
      const charCode = paddedName.charCodeAt(i);
      nameCharElements[i].textContent = charCode.toString();
    }
  };
  onSave = () => {
    if (!this.fileHandle || !this.xmlDoc) {
      console.error("No file handle or XML document available for saving.");
      return;
    }

    this.xmlDoc?.documentElement.querySelectorAll("parsererror").forEach((error) => {
      error.parentNode?.removeChild(error);
    });
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(this.xmlDoc);

    FileManager.saveFile(this.fileHandle, xmlString);
  };

  onNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newName = target.value;

    if (!this.mems || this.mems.length === 0) {
      console.error("No memory elements available.");
      return;
    }

    this.updateMemName(this.mems[0].mem, newName);
  };

  onFileChange = async (event: Event) => {
    if (!this.directoryHandle) {
      console.error("No directory handle available.");
      return;
    }

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const index = parseInt(target.id.split("-")[1]);
    const folderName = `wave/00${index + 1}_1`;
    const folderHandle = await this.navigateToSubfolders(this.directoryHandle, folderName.split("/"));

    if (!folderHandle) {
      console.error(`Folder ${folderName} not found.`);
      return;
    }

    const fileHandle = await folderHandle.getFileHandle(file.name, { create: true });
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(file);
    await writableStream.close();
  };

  async navigateToSubfolders(directoryHandle: FileSystemDirectoryHandle, pathArray: string[]): Promise<FileSystemDirectoryHandle | null> {
    let currentDirectory = directoryHandle;

    for (let folder of pathArray) {
      try {
        // Navigate to the next folder in the path
        currentDirectory = await currentDirectory.getDirectoryHandle(folder);
      } catch (error) {
        console.error(`Failed to find directory: ${folder}`, error);
        return null; // If any folder in the path doesn't exist, stop
      }
    }

    // Return the handle of the final subfolder
    return currentDirectory;
  }

  xmlNameToString(element: Element | null): string {
    const children = element?.children;
    if (!children) return "";

    const chars: string[] = [];
    for (let i = 0; i < children.length; i++) {
      const charCode = parseInt(children[i].textContent || "0");
      chars.push(String.fromCharCode(charCode)); // Convert ASCII code to character
    }
    return chars.join("");
  }

  onRemoveFile = async (mem: Mem, index: number) => {
    if (!this.directoryHandle) return;

    const folderHandle = await this.navigateToSubfolders(this.directoryHandle, [`wave`, `${this.padNumber(index + 1)}_1`]);
    if (!folderHandle || !mem.file) return;
    folderHandle.removeEntry(mem.file.name, { recursive: false });
    console.log(`Removed file: ${mem.file.name} from folder: ${folderHandle.name}`);
  };

  renderInput(mem: Mem, index: number) {
    const name = this.xmlNameToString(mem.mem.firstElementChild);
    return html`
      <div class="inputContainer">
        <input id="mem-${index}" type="text" value="${name}" @input="${this.onNameChange}" />
        <div class="dropZoneContainer">
          <label for="file-${index}">${mem.file ? html`<p>${mem.file.name}</p>` : ""}</label>
          <input id="file-${index}" type="file" @change="${this.onFileChange}" />
        </div>
        <button @click=${() => this.onRemoveFile(mem, index)}>Remove</button>
      </div>
    `;
  }

  renderInputs() {
    if (!this.mems || this.mems.length === 0) {
      return html`<p>No memory elements available.</p>`;
    }
    return html`
      ${repeat(
        this.mems,
        (mem) => mem.mem.getAttribute("id"),
        (mem, index) => this.renderInput(mem, index)
      )}
    `;
  }

  // Render method to define the component's HTML structure
  render() {
    return html`
      <button @click="${this.onOpenFolder}">Open MEMORY1.RC0</button>
      ${this.renderInputs()}
      <button @click="${this.onSave}">Save</button>
    `;
  }

  // Style for the component
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 32px;
      width: 100%;
      height: 100%;
    }
    .dropZoneContainer {
      position: relative;
      &:focus-within {
        outline: 2px solid white;
      }
      & > label {
        display: block;
        width: 100%;
        height: 100%;
      }
      & > input {
        pointer-events: none;
        opacity: 0;
        position: absolute;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "mui-editor": MuiEditor;
  }
}
