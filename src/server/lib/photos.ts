import { ServicePhotoKind } from "@prisma/client";

type Props = {
  tx: any;
  photoIds: string[];
  serviceId?: string;
  needId?: string;
  petId?: string;
  needPetId?: string;
  serviceKind?: ServicePhotoKind;
};
export async function linkPhotos({
  tx,
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
    photoIds.map((id, index) => {
      return tx.attachment.update({
        where: { id },
        data: {
          ...updateData,
          order: index + 1,
        },
      });
    }),
  );
}
export async function syncPhotos(props: Props) {
  const { tx, photoIds, serviceId, needId, petId, needPetId, serviceKind } =
    props;
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
