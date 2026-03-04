import FooterHome from "@/components/FooterHome";

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
