export default function FooterSimple() {
  return (
    <footer className="bg-background text-center text-xs text-neutral-400 py-4 border-t border-border">
      © {new Date().getFullYear()} PetNido
    </footer>
  );
}
