import { Track } from "./types";
import { padNumber } from "./utils";

// Extend the Window interface to include showDirectoryPicker for TypeScript
declare global {
  interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    FileSystemFileHandle: {
      move: (newName: string) => Promise<FileSystemFileHandle>;
    };
  }
}

export class FileManager {
  // Static method to open a file
  static async openFile(): Promise<{
    directoryHandle?: FileSystemDirectoryHandle;
    memory01Handle?: FileSystemFileHandle;
    memory02Handle?: FileSystemFileHandle;
    file?: File;
    content?: string;
  }> {
    try {
      // Request the user to pick a directory
      const directoryHandle = await window.showDirectoryPicker();

      // Get the 'data' folder inside the selected directory
      const dataFolderHandle = await directoryHandle.getDirectoryHandle("data");

      // Access the 'MEMORY1.RC0' file inside the 'data' folder
      const memory01Handle = await dataFolderHandle.getFileHandle("MEMORY1.RC0");
      const memory02Handle = await dataFolderHandle.getFileHandle("MEMORY2.RC0");

      const file = await memory01Handle.getFile();
      const fileContent = await file.text(); // Read the file content as text

      return {
        directoryHandle: directoryHandle,
        memory01Handle: memory01Handle,
        memory02Handle: memory02Handle,
        file: file,
        content: fileContent,
      };
    } catch (error) {
      console.error("Error opening the file:", error);
      return {};
    }
  }

  // Static method to save a file
  static async saveFile(fileHandle: FileSystemFileHandle, content: string | File) {
    try {
      // Create a writable stream to the existing file (this will overwrite it)
      const writableStream = await fileHandle.createWritable();

      // Write the new content to the file
      await writableStream.write(content);

      // Close the writable stream to finalize the changes
      await writableStream.close();
    } catch (error) {
      console.error("Error saving the file:", error);
    }
  }

  static async saveFileInFolder(folderHandle: FileSystemDirectoryHandle, fileName: string, content: File) {
    try {
      // Create a writable stream to the new file
      const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
      const writableStream = await fileHandle.createWritable();

      // Write the content to the file
      await writableStream.write({ type: "write", data: content });

      // Close the writable stream to finalize the changes
      await writableStream.close();
    } catch (error) {
      console.error("Error saving the file in folder:", error);
    }
  }

  static async getTracks(xmlDoc: Document, directoryHandle: FileSystemDirectoryHandle): Promise<Track[]> {
    const mems = Array.from(xmlDoc.querySelectorAll("mem")).map(async (mem, index) => {
      // Get the correct folder handle using navigateToSubfolders
      const fileFolderHandle = await this.navigateToSubfolders(directoryHandle, [`wave`, `${padNumber(index + 1)}_1`]);

      if (!fileFolderHandle) {
        console.error("Failed to navigate to subfolders.");
        return { element: mem };
      }

      const fileHandle = (await (fileFolderHandle as any).values().next()).value as FileSystemFileHandle;

      // Fill out the file object with the name and the actual file
      return {
        element: mem,
        file: fileHandle ? { name: fileHandle.name, handle: fileHandle } : undefined,
      };
    });

    return Promise.all(mems);
  }

  // static async removeFilesInFolder(folderHandle: FileSystemDirectoryHandle) {
  //   try {
  //     for await (const [name, handle] of (folderHandle as any).entries()) {
  //       if (handle.kind === "file") {
  //         await handle.remove(); // Remove the file
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error removing files in folder:", error);
  //   }
  // }

  static async navigateToSubfolders(directoryHandle: FileSystemDirectoryHandle, subfolderNames: string[]): Promise<FileSystemDirectoryHandle | null> {
    let currentHandle: FileSystemDirectoryHandle = directoryHandle;

    for (const name of subfolderNames) {
      try {
        currentHandle = await currentHandle.getDirectoryHandle(name);
      } catch (error) {
        console.error(`Error navigating to subfolder ${name}:`, error);
        return null; // Return null if any subfolder is not found
      }
    }

    return currentHandle;
  }

  static async moveFileToFolder(fileHandle: FileSystemFileHandle, folderHandle: FileSystemDirectoryHandle) {
    await fileHandle.move(folderHandle);
  }

  static async renameFile(fileHandle: FileSystemFileHandle, newName: string) {
    await fileHandle.move(newName);
  }
}
