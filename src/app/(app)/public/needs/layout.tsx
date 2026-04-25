export default function NeedsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children} {/* 主列表 */}
      {modal} {/* modal 插槽 */}
    </>
  );
}
