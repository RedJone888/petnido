import FieldSection from "@/components/ui/FieldSection";
import ImageUploader from "@/components/ui/ImageUploader";
import { ImageItem } from "@/domain/attachment/type";
import {
  MAX_EXPERIENCE_PHOTOS,
  MAX_HOME_PHOTOS,
} from "@/domain/service/constant";
import cn from "@/lib/cn";
import { ServiceForm } from "@/lib/zod/services";
import { ServiceCategory, ServicePhotoKind } from "@prisma/client";
import { Image, ImagePlus } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  serviceType: ServiceCategory;
  experiencePhotos: ImageItem[];
  homePhotos: ImageItem[];
};
export default function ServicePhoto({
  experiencePhotos,
  serviceType,
  homePhotos,
}: Props) {
  const { control } = useFormContext<ServiceForm>();
  return (
    <div className="space-y-4">
      <FieldSection
        title="過去の経験写真"
        icon={Image}
        right={
          <span className="text-xs text-gray-400">
            {experiencePhotos.length} / {MAX_EXPERIENCE_PHOTOS}
          </span>
        }
      >
        <div>
          <Controller
            name="photos"
            control={control}
            render={({ field }) => (
              <ImageUploader
                value={experiencePhotos}
                onChange={(newExpfiles) => {
                  const others = field.value.filter(
                    (p) => p.serviceKind !== ServicePhotoKind.EXPERIENCE,
                  );
                  field.onChange([...newExpfiles, ...others]);
                }}
                folder="service"
                serviceKind={ServicePhotoKind.EXPERIENCE}
                onRemove={(id: string) => {
                  field.onChange(field.value.filter((p) => p.id !== id));
                }}
              />
            )}
          />
          <p className="mt-2 text-[10px] text-gray-400 px-1">
            ※ お世話の様子や、ペットと過ごした写真など
          </p>
        </div>
      </FieldSection>
      <div
        className={cn(
          "overflow-hidden duration-300 transition-all",
          serviceType === ServiceCategory.FOSTER
            ? "opacity-100 mt-4"
            : "max-h-0 opacity-0",
        )}
      >
        <FieldSection
          title="飼育・受入環境の写真"
          icon={ImagePlus}
          right={
            <span className="text-xs text-gray-400">
              {homePhotos.length} / {MAX_HOME_PHOTOS}
            </span>
          }
        >
          <div>
            <Controller
              name="photos"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={homePhotos}
                  onChange={(newHomefiles) => {
                    const others = field.value.filter(
                      (p) => p.serviceKind !== ServicePhotoKind.HOME,
                    );
                    field.onChange([...others, ...newHomefiles]);
                  }}
                  folder="service"
                  serviceKind={ServicePhotoKind.HOME}
                  onRemove={(id: string) => {
                    field.onChange(field.value.filter((p) => p.id !== id));
                  }}
                />
              )}
            />
            <p className="mt-2 text-[10px] text-gray-400 px-1">
              ※ お預かりする環境がわかる写真を追加してください
            </p>
          </div>
        </FieldSection>
      </div>
    </div>
  );
}
