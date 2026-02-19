import type {
  Currency,
  ServicePhotoKind,
  ServiceCategory,
  AvailabilityRangeType,
  AvailabilityWeekPattern,
  PriceUnit,
  PetType,
} from "@prisma/client";
import { ImageItem } from "@/domain/attachment/type";

export type UploadingPhoto = {
  tempId: string;
  fileKey: string;
  previewUrl: string;
  kind: ServicePhotoKind;
  uploading: true;
  order: number;
};
export type UploadedPhoto = {
  id?: string;
  tempId: string;
  url: string;
  uploading: false;
  kind: ServicePhotoKind;
  order: number;
};
// export type PhotoItemForm = UploadingPhoto | UploadedPhoto;

// export type Availability={
//   rangeType:
// }
