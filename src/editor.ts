import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MUIComponent } from "./component";
import { FileManager } from "./fileManager";
import { repeat } from "lit/directives/repeat.js";
import "./custom-input"; // Import the custom input component
import { padNumber, xmlNameToString } from "./utils";
import { Track } from "./types";

@customElement("mui-editor")
export class MuiEditor extends MUIComponent {
  @property({ attribute: false }) memory01Handle?: FileSystemFileHandle;
  @property({ attribute: false }) memory02Handle?: FileSystemFileHandle;
  @property({ attribute: false }) mainDirectory?: FileSystemDirectoryHandle;
  @property({ attribute: false }) xmlDoc?: Document;
  @property({ attribute: false }) tracks: Track[] = [];

  onOpenFolder = async () => {
    const { directoryHandle, memory01Handle, memory02Handle, content } = await FileManager.openFile();

    if (!memory01Handle || !content) {
      console.error("Failed to open file or read content.");
      return;
    }
    this.mainDirectory = directoryHandle;
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

    // Save or remove track files if they have changed
    this.tracks.forEach(async (track, index) => {
      if (!track.fileChanged || !this.mainDirectory) return;

      if (!track.file) {
        // Remove the first file in the folder
        const folderHandle = await FileManager.navigateToSubfolders(this.mainDirectory, [`wave`, `${padNumber(index + 1)}_1`]);
        if (!folderHandle) return;
        await FileManager.removeFilesInFolder(folderHandle);
      }

      if (track.file) {
        // Save the file in the folder
        const folderHandle = await FileManager.navigateToSubfolders(this.mainDirectory, [`wave`, `${padNumber(index + 1)}_1`]);
        if (!folderHandle) return;
        await FileManager.saveFileInFolder(folderHandle, track.file.name, track.file.file);
      }
    });
  };

  onNameChange = (event: Event, track: Track) => {
    const target = event.target as HTMLInputElement;
    const newName = target.value;

    if (!track) {
      console.error("No memory element available.");
      return;
    }

    this.updateTrackName(track.element, newName);
  };

  onFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const index = parseInt(target.id.split("-")[1]);

    this.tracks[index].fileChanged = true;
    this.tracks[index].file = { name: file.name, file: file };
    this.requestUpdate("tracks");
  };

  onRemoveFile = async (index: number) => {
    this.tracks[index].fileChanged = true;
    this.tracks[index].file = undefined;
    this.requestUpdate("tracks");
  };

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

  renderInput(track: Track, index: number) {
    const name = xmlNameToString(track.element.firstElementChild);
    return html`
      <div class="inputContainer">
        <custom-input id="mem-${index}" value="${name}" @input="${(e: Event) => this.onNameChange(e, track)}"></custom-input>
        <div class="dropZoneContainer">
          <label for="file-${index}">${track.file ? track.file.name : ""}</label>
          <input id="file-${index}" type="file" @change="${this.onFileChange}" @drop=${this.onDrop} />
        </div>
        <button @click=${() => this.onRemoveFile(index)}>Remove</button>
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
        (track) => track.element.getAttribute("id"),
        (track, index) => this.renderInput(track, index)
      )}
    `;
  }

  // Render method to define the component's HTML structure
  render() {
    if (!this.mainDirectory) {
      return html`<button @click="${this.onOpenFolder}">Open Roland Folder</button>`;
    }

    return html`
      <div id="main">
        <div id="tracks">${this.renderInputs()}</div>
        <button @click="${this.onSave}">Save</button>
      </div>
    `;
  }

  // Style for the component
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    #main {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      width: 100%;
      height: 100%;
    }
    #tracks {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      height: 100%;
      overflow: auto;
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
