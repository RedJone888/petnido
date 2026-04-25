// (.)[id] 拦截了上一级目录的 [id] 路由，即 /requests/[id]

import { Modal } from "@/components/Modal"; // 模态框容器组件
import NeedDetailPage from "../../_components/NeedDetailPage"; // 您的详情页内容组件
import { getNeedById } from "@/lib/need";

interface ModalDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ModalDetailsPage({
  params,
}: ModalDetailsPageProps) {
  const needData = await getNeedById(params.id);
  if (!needData) {
    return (
      <Modal>
        <div className="p-8">请求未找到</div>
      </Modal>
    );
  }

  return (
    <Modal>
      <NeedDetailPage initialNeed={needData} />
    </Modal>
  );
}
