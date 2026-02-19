import {
  DistanceRange,
  FrequencyType,
  ServiceCategory,
  NeedStatus,
  PetType,
  TransportMethod,
} from "@prisma/client";

import { ImageItem } from "@/domain/attachment/type";

// export type NeedPetForm = {
//   id?: string;
//   tempId: string;
//   petType: PetType;
//   customType: string | null;
//   count: number;
//   description: string | null;
//   photos: ImageItem[];
//   petIds: string[];
//   tags: string[];
// };

// export type NeedFormValues = {
//   title: string;
//   category: ServiceCategory;
//   requirement: string;
//   startDate: string;
//   endDate: string;
//   frequencyType: FrequencyType | null;
//   customFrequency: string | null;
//   addressRaw: string;
//   addressLat: number;
//   addressLon: number;
//   fosterRange: DistanceRange | null;
//   transportMethod: TransportMethod | null;
//   status: NeedStatus;
//   needPets: NeedPetForm[];
//   photos: ImageItem[];
//   priceAmount: number | null;
//   totalPrice: number;
// };
