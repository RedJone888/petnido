"use client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
export function FinalCTA() {
  const { t } = useLanguage();
  return (
    <div className="bg-primary-container rounded-[3rem] py-20 px-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <h2 className="text-headline-xl relative z-10 mb-6 text-white">
        {t.home.finalCTA.title}
      </h2>
      <p className="relative z-10 mx-auto mb-10 max-w-2xl text-body-lg text-primary-fixed/80">
        {t.home.finalCTA.text}
      </p>
      <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
        {/* <Link href="/dashboard/needs/new" className="hv2-cta-light">
                  Post Your Need
                </Link> */}
        <Button
          variant="primary"
          size="lg"
          shape="pill"
          className="bg-white text-primary"
        >
          {t.home.postNeed}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          shape="pill"
          className="bg-primary text-white border-white/30 hover:bg-white/10"
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
  );
}
