import { PhotoApi } from "@/domain/service/api.types";
import { ImageItem } from "@/domain/attachment/type";
export function photoApiToForm(p: PhotoApi): ImageItem {
  return {
    id: p.id,
    url: p.url,
    fileKey: p.fileKey,
    signature: p.signature,
    serviceKind: p.serviceKind,
    isUploading: false,
  };
}
