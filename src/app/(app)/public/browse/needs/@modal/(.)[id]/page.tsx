// (..)[id] 拦截了上一级目录的 [id] 路由，即 /requests/[id]

import prisma from "@/lib/prisma";
import { Modal } from "@/components/Modal"; // 模态框容器组件
import NeedDetailPage from "@/components/browse/needs/NeedDetailPage"; // 您的详情页内容组件

interface ModalDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ModalDetailsPage({
  params,
}: ModalDetailsPageProps) {
  const requestId = params.id;
  const need = await prisma.need.findUnique({
    where: { id: requestId },
  });
  if (!need) {
    return (
      <Modal>
        <div className="p-8">请求未找到</div>
      </Modal>
    );
  }

  return (
    <Modal>
      {/* 图3的详情页内容放在这里 */}
      <NeedDetailPage initialNeed={need} />
    </Modal>
  );
}
