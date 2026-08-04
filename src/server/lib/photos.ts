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
  const updateData: any = {
    status: 1,
    serviceId: serviceId || null,
    needId: needId || null,
    petId: petId || null,
    needPetId: needPetId || null,
    serviceKind: serviceId ? serviceKind : null,
  };
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
  await tx.attachment.updateMany({
    where: {
      ...ownerFilter,
      userId,
      id: { notIn: photoIds },
    },
    data: {
      status: 2,
      serviceId: null,
      needId: null,
      petId: null,
      needPetId: null,
    },
  });
  // 2. 【认领新图 & 更新顺序】
  await linkPhotos(props);
}
