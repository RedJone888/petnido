import FooterHome from "./_components/FooterHome";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FooterHome />
    </>
  );
}
