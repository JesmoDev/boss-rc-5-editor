export type Track = {
  element: Element;
  file?: {
    name: string;
    handle?: FileSystemHandle;
    file?: File;
  };
  fileChanged?: boolean;
};
