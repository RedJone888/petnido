import { TRPCError } from "@trpc/server";

type Props = {
  tx: any;
  userId: string;
  photoIds: string[];
  petId?: string;
};
export async function linkPhotos({
  tx,
  userId,
  photoIds,
  petId,
}: Props) {
  if (!photoIds || photoIds.length === 0) return;
  const updateData: any = { status: 1 };
  if (petId) {
    updateData.petId = petId;
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
    petId,
  } = props;
  // 1. 确定当前操作的主体 ID 和字段名
  const ownerFilter: any = {};
  if (petId) {
    ownerFilter.petId = petId;
  }
  // 2. 【清理旧图】
  const unlinkData: any = { status: 2 };
  if (petId) unlinkData.petId = null;
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
