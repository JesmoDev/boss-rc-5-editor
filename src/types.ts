export type Track = {
  element: Element;
  file?: {
    name: string;
    file: File;
  };
  fileChanged?: boolean;
};
