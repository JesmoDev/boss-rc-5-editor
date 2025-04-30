import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MUIComponent } from "./component";
import { FileManager } from "./fileManager";
import { repeat } from "lit/directives/repeat.js";
import "./custom-input"; // Import the custom input component
import { padNumber, xmlNameToString } from "./utils";

type TrackElement = {
  element: Element;
  file?: {
    name: string;
    file: File;
  };
};

@customElement("mui-editor")
export class MuiEditor extends MUIComponent {
  @property({ attribute: false }) memory01Handle?: FileSystemFileHandle;
  @property({ attribute: false }) memory02Handle?: FileSystemFileHandle;
  @property({ attribute: false }) directoryHandle?: FileSystemDirectoryHandle;
  @property({ attribute: false }) xmlDoc?: Document;
  @property({ attribute: false }) tracks: TrackElement[] = [];

  onOpenFolder = async () => {
    const { directoryHandle, memory01Handle, memory02Handle, content } = await FileManager.openFile();

    if (!memory01Handle || !content) {
      console.error("Failed to open file or read content.");
      return;
    }
    this.directoryHandle = directoryHandle;
    this.memory01Handle = memory01Handle;
    this.memory02Handle = memory02Handle;
    this.xmlDoc = new DOMParser().parseFromString(content, "application/xml");

    if (!directoryHandle) return;

    this.tracks = await FileManager.getTracks(this.xmlDoc, directoryHandle);
  };

  updateTrackName = (mem: Element, name: String) => {
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
    if (!this.memory01Handle || !this.xmlDoc || !this.memory02Handle) {
      console.error("No file handle or XML document available for saving.");
      return;
    }

    this.xmlDoc?.documentElement.querySelectorAll("parsererror").forEach((error) => {
      error.parentNode?.removeChild(error);
    });
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(this.xmlDoc);

    // Also open file
    FileManager.saveFile(this.memory01Handle, xmlString);
    FileManager.saveFile(this.memory02Handle, xmlString);
  };

  onNameChange = (event: Event, track: TrackElement) => {
    const target = event.target as HTMLInputElement;
    const newName = target.value;
    console.log("Name changed", newName);

    if (!track) {
      console.error("No memory element available.");
      return;
    }

    this.updateTrackName(track.element, newName);
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
    const folderHandle = await FileManager.navigateToSubfolders(this.directoryHandle, [`wave`, `${padNumber(index + 1)}_1`]);

    if (!folderHandle) {
      console.error("Failed to navigate to subfolders.");
      return;
    }

    // Remove any old files in the folder
    this.onRemoveFile(this.tracks[index], index);

    const fileHandle = await folderHandle.getFileHandle(file.name, { create: true });
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(file);
    await writableStream.close();

    // Update the mems array with the new file information
    this.tracks[index].file = { name: file.name, file: file };
    this.requestUpdate("mems");
  };

  onRemoveFile = async (mem: TrackElement, index: number) => {
    if (!this.directoryHandle) return;

    const folderHandle = await FileManager.navigateToSubfolders(this.directoryHandle, [`wave`, `${padNumber(index + 1)}_1`]);
    if (!folderHandle || !mem.file) return;
    folderHandle.removeEntry(mem.file.name, { recursive: false });
    this.tracks[index].file = undefined;

    // Clear the file input
    if (this.shadowRoot) {
      const fileInput = this.shadowRoot.getElementById(`file-${index}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
    this.requestUpdate("mems");
  };

  renderInput(mem: TrackElement, index: number) {
    const name = xmlNameToString(mem.element.firstElementChild);
    return html`
      <div class="inputContainer">
        <custom-input id="mem-${index}" value="${name}" @input="${(e: Event) => this.onNameChange(e, mem)}"></custom-input>
        <div class="dropZoneContainer">
          <label for="file-${index}">${mem.file ? mem.file.name : ""}</label>
          <input id="file-${index}" type="file" @change="${this.onFileChange}" @drop=${this.onDrop} />
        </div>
        <button @click=${() => this.onRemoveFile(mem, index)}>Remove</button>
      </div>
    `;
  }

  renderInputs() {
    if (!this.tracks || this.tracks.length === 0) {
      return html`<p>No memory elements available.</p>`;
    }
    return html`
      ${repeat(
        this.tracks,
        (mem) => mem.element.getAttribute("id"),
        (mem, index) => this.renderInput(mem, index)
      )}
    `;
  }

  onDrop = (e: DragEvent) => {
    e.preventDefault();

    const target = e.target as HTMLInputElement;
    if (!e.dataTransfer || !target) return;

    const file = e.dataTransfer.files.item(0);
    if (!file) return;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file); // Add the first file

    target.files = dataTransfer.files;
    this.onFileChange(e);
  };

  // Render method to define the component's HTML structure
  render() {
    return html`
      <button @click="${this.onOpenFolder}">Open Roland Folder</button>
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
    .inputContainer {
      display: flex;
      gap: 16px;
      width: 100%;
      align-items: center;
    }
    input,
    .dropZoneContainer > label {
      display: flex;
      padding-inline: 12px;
      height: 100%;
      align-items: center;
    }
    .dropZoneContainer {
      position: relative;
      width: 100%;
      border: 1px solid var(--color-border);
      height: 40px;
      &:focus-within {
        outline: 2px solid white;
      }

      & > label {
        pointer-events: none;
      }

      & > input {
        opacity: 0;
        position: absolute;
        inset: 0;
        padding: 0;
        border: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "mui-editor": MuiEditor;
  }
}
