import { ServicePhotoKind } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type Props = {
  tx: any;
  userId: string;
  photoIds: string[];
  serviceId?: string;
  needId?: string;
  petId?: string;
  needPetId?: string;
  serviceKind?: ServicePhotoKind;
};
export async function linkPhotos({
  tx,
  userId,
  photoIds,
  serviceId,
  needId,
  petId,
  needPetId,
  serviceKind,
}: Props) {
  if (!photoIds || photoIds.length === 0) return;
  const updateData: any = { status: 1 };
  if (serviceId) {
    updateData.serviceId = serviceId;
    updateData.serviceKind = serviceKind;
  } else if (needId) {
    updateData.needId = needId;
  } else if (petId) {
    updateData.petId = petId;
  } else if (needPetId) {
    updateData.needPetId = needPetId;
  }
  await Promise.all(
    photoIds.map(async (id, index) => {
      const result = await tx.attachment.updateMany({
        where: { id, userId },
        data: {
          ...updateData,
          order: index + 1,
        },
      });
      if (result.count !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
    }),
  );
}
export async function syncPhotos(props: Props) {
  const {
    tx,
    userId,
    photoIds,
    serviceId,
    needId,
    petId,
    needPetId,
    serviceKind,
  } = props;
  // 1. 确定当前操作的主体 ID 和字段名
  const ownerFilter: any = {};
  if (serviceId) {
    ownerFilter.serviceId = serviceId;
    ownerFilter.serviceKind = serviceKind;
  } else if (needId) {
    ownerFilter.needId = needId;
  } else if (petId) {
    ownerFilter.petId = petId;
  } else if (needPetId) {
    ownerFilter.needPetId = needPetId;
  }
  // 2. 【清理旧图】
  const unlinkData: any = { status: 2 };
  if (serviceId) unlinkData.serviceId = null;
  else if (needId) unlinkData.needId = null;
  else if (petId) unlinkData.petId = null;
  else if (needPetId) unlinkData.needPetId = null;
  await tx.attachment.updateMany({
    where: {
      ...ownerFilter,
      userId,
      id: { notIn: photoIds },
    },
    data: unlinkData,
  });
  // 2. 【认领新图 & 更新顺序】
  await linkPhotos(props);
}
