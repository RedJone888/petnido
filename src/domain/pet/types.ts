import { Lang } from "@/domain/lang/types";

export type LabelObj = {
  name: string;
  placeholder?: string;
  keywords: string[];
};
export type PetMeta = {
  headImg: string;
  placeImg: string;
  label: Record<Lang, LabelObj>;
};
