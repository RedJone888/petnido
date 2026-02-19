export interface ImageItem {
  id: string;
  url: string;
  fileKey?: string;
  signature: string;
  serviceKind?: string | null;
  isUploading: boolean;
  file?: File;
}
