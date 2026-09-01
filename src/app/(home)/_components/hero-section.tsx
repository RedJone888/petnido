"use client";
import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import cn from "@/lib/cn";
import { BadgePlus, ClipboardPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAts9HHBD5HhcgQUouYFxMKnPcuQrm-5BY4JkixxXUSqVkJorJIGzJ8aOWENsymoC68lNXUnU3ZMu61srdnCRPoETHHJuGx0qyPkxbZVQzhab72lSzjXxsSPDxX-YcxAwGGa2aj7LqOkg6JhmRjtIuRtxJ9Yzij64IGmINBA--dPR2AB8PVAu4GSWuKmV5p7nkJYA8Zl8hFBEw6d4XE1_bB79I9bYUfl48ot-9DkaZIgNotR4icLupZOsz2JdWirlh0qcSces9nj5w";

export function HeroSection() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

  const openCreateFlow = (destination: string) => {
    if (destination === "/needs/create") {
      router.push(destination);
      return;
    }
    if (!session) {
      openAuthModal(destination);
      return;
    }
    router.push(destination);
  };

  return (
    <div
      className={cn(
        "relative grid w-full gap-12",
        "h-full max-w-container-max-width items-end px-margin-mobile py-12",
        "md:mx-auto md:h-auto md:items-center md:px-margin-desktop md:py-0 md:grid-cols-2",
        "transition-all duration-700 opacity-100 translate-y-0",
      )}
    >
      <div className="relative z-10 animate-fade-in-up">
        <span
          className={cn(
            "mb-5 inline-block text-xs font-bold uppercase tracking-[0.18em] text-white/85",
            "md:mb-6 md:text-primary",
          )}
        >
          {t.home.hero.badge}
        </span>
        <h1
          className={cn(
            "mb-4 max-w-xl text-[2.15rem] font-bold leading-[1.08] tracking-[-0.025em] text-white",
            "md:mb-6 md:text-[3.5rem] md:leading-[1.05] md:tracking-[-0.04em] md:text-on-surface",
          )}
        >
          {t.home.hero.title}
        </h1>
        <p
          className={cn(
            "mb-8 max-w-sm text-body-md text-white/90",
            "md:mb-10 md:max-w-lg md:text-body-lg md:text-on-surface-variant",
          )}
        >
          {t.home.hero.text}
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          {/* <Link href="/dashboard/needs/new" className="hv2-button-primary">
                      Post Your Need
                      <PawPrint size={20} />
                    </Link> */}
          <Button
            variant="primary"
            size="lg"
            shape="default"
            className="home-button h-12 rounded-[11px] bg-white text-primary shadow-none hover:scale-100 hover:bg-white/90 hover:shadow-none active:scale-[0.98] md:bg-primary md:text-on-primary md:hover:bg-primary/90"
            onClick={() => openCreateFlow("/needs/create")}
          >
            {t.home.postNeed}
            <ClipboardPlus size={19} aria-hidden="true" />
          </Button>

          {/* <Link
                      href="/dashboard/serviceprofile/services/new"
                      className="hv2-button-secondary"
                    >
                      Become a Sitter
                    </Link> */}
          <Button
            variant="secondary"
            size="lg"
            shape="default"
            className={cn(
              "border-white/30 bg-white/20 text-white backdrop-blur-md hover:bg-white/30",
              "home-button h-12 rounded-[11px] shadow-none hover:scale-100 hover:shadow-none active:scale-[0.98]",
              "md:border-outline-variant md:bg-transparent md:text-primary md:backdrop-blur-0 md:hover:bg-primary-fixed",
            )}
            onClick={() =>
              openCreateFlow("/dashboard/serviceprofile/services/new")
            }
          >
            {t.home.becomeSitter}
            <BadgePlus size={19} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="absolute inset-0 z-0 md:relative md:inset-auto">
        <div className="relative h-full overflow-hidden md:aspect-[16/10] md:rounded-[24px] md:border md:border-white/80 md:shadow-[0_24px_70px_-38px_rgba(42,29,50,0.45)]">
          <AppImage
            src={heroImage}
            alt="Woman with rabbits and guinea pigs"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent md:hidden"></div>
        </div>
      </div>
    </div>
  );
}
