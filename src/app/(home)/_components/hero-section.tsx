"use client";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";
const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAts9HHBD5HhcgQUouYFxMKnPcuQrm-5BY4JkixxXUSqVkJorJIGzJ8aOWENsymoC68lNXUnU3ZMu61srdnCRPoETHHJuGx0qyPkxbZVQzhab72lSzjXxsSPDxX-YcxAwGGa2aj7LqOkg6JhmRjtIuRtxJ9Yzij64IGmINBA--dPR2AB8PVAu4GSWuKmV5p7nkJYA8Zl8hFBEw6d4XE1_bB79I9bYUfl48ot-9DkaZIgNotR4icLupZOsz2JdWirlh0qcSces9nj5w";

export function HeroSection() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop grid items-center gap-12 md:grid-cols-2">
      <div className="z-10">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-label-md mb-6">
          {t.home.hero.badge}
        </span>
        <h1 className="text-headline-xl mb-6 text-on-background">
          {t.home.hero.title}
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-10 max-w-lg">
          {t.home.hero.text}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* <Link href="/dashboard/needs/new" className="hv2-button-primary">
                      Post Your Need
                      <PawPrint size={20} />
                    </Link> */}
          <Button variant="primary" size="lg" shape="default">
            {t.home.postNeed}
            <PawPrint size={20} />
          </Button>

          {/* <Link
                      href="/dashboard/serviceprofile/services/new"
                      className="hv2-button-secondary"
                    >
                      Become a Sitter
                    </Link> */}
          <Button variant="secondary" size="lg" shape="default">
            {t.home.becomeSitter}
          </Button>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary-fixed opacity-40 rounded-full blur-3xl" />
        <div className="relative rounded-[2rem] overflow-hidden pill-shadow border-8 border-white aspect-[16/10]">
          <img
            src={heroImage}
            alt="Woman with rabbits and guinea pigs"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
