"use client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
export function FinalCTA() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
      <div className="relative overflow-hidden rounded-[24px] bg-primary-container px-6 py-14 md:px-8 md:py-20">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-headline-lg-mobile mb-4 md:text-headline-xl relative z-10 md:mb-6 text-white">
            {t.home.finalCTA.title}
          </h2>
          <p className="relative z-10 mx-auto max-w-2xl text-base md:text-body-lg text-primary-fixed/80">
            {t.home.finalCTA.text}
          </p>
        </div>
        <div className="relative z-10 flex flex-col justify-center gap-3 sm:flex-row md:gap-4">
          {/* <Link href="/dashboard/needs/new" className="hv2-cta-light">
                  Post Your Need
                </Link> */}
          <Button
            href="/needs/create"
            variant="primary"
            size="lg"
            shape="default"
            className="home-button h-12 rounded-[11px] bg-white text-primary shadow-none hover:scale-100 hover:bg-white/90 hover:shadow-none active:scale-[0.98]"
          >
            {t.home.postNeed}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            shape="default"
            className="home-button h-12 rounded-[11px] border border-white/35 bg-transparent text-white shadow-none hover:scale-100 hover:bg-white/10 hover:shadow-none active:scale-[0.98]"
          >
            {t.home.becomeSitter}
          </Button>
          {/* <Link
                  href="/dashboard/serviceprofile/services/new"
                  className="hv2-cta-dark"
                >
                  Become a Sitter
                </Link> */}
        </div>
      </div>
    </div>
  );
}
