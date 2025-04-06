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
      return {}; // Return null if the file opening failed
    }
  }

  // Static method to save a file
  static async saveFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
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
}
