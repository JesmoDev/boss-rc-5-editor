interface FileSystemFileHandle {
  move(newName?: string): Promise<void>;
}

interface FileSystemFileHandle {
  move(destination: FileSystemDirectoryHandle): Promise<void>;
}

interface FileSystemFileHandle {
  move(destination: FileSystemDirectoryHandle, newName?: string): Promise<void>;
}
