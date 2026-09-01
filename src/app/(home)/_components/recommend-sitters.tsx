"use client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";
const sitters = [
  {
    name: "Sarah M.",
    specialty: "Dog & cat care",
    tags: ["Dogs", "Cats"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBgvk0nO0lRHxQZOPyRic199CKF7ykQjTuTONykwaBjdBF4DSSi6WCXYGlPmLf_hYkIPWsnDqzi3Ztu9nAz0eiLiYrq02p0CMeRkOA5BJnycOKbwE3M5p9S4YQZynJWInl9cjcIEiB73hRoVEKUUki34URvCnSlHwSaUPwbqAA5Y01fICFvEgt2gpvVZvQaIi_DjYiHnamOXhKMUgnQW1zJfDevUby4oCckU6f0O-Ygdj6zSKUWVpuBsggwkWW-7oddmxaiQKCaWSs",
  },
  {
    name: "David L.",
    specialty: "Rabbit & exotic pet care",
    tags: ["Exotics", "Rabbits"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMvNRaRxNKr0Z2Uxue1DgzUnnnKTmsoO_5u1Tfkt0MUxbCZ7ihgjFi_61jZk16cc6zFeA4OoYTenvU79Cv4zGwtF8yJvjRFUTiAcKt_F6Ux7-tXXlQDlC73UK7ZpzHgE4i_OI5kXcRkagh9N_9Qhyfi5O_irEMtkGSGN0auqDk4tbeb7IB9UvHnQHb5EXQxcnZHgyZvK1hgzEXy-86dPPwIW7epC209keDap2V4rtELLNwZf-MflYD3aYvZAGVbe-xxyNnR5maAAo",
  },
  {
    name: "Elena R.",
    specialty: "Puppy & dog care",
    tags: ["Puppies", "Dogs"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA8bxarGt02YVlf-Se6LraRK0H_0XVoK1vDi3bfGIGbDu5a5h6qaWxlNoH-sBteJ8msXOiQXRICY2iF9aMDmoxG3opAQllpF8i0rGhapMMTUM-Y8AsstZgsvHmjoJ0J-LhTDOInluIqvfxoNpbnYAJoDVuTSohw_HPTZQpPHi0WD61jUPN0jtjRH7hdbDgtD2-Cokg3dwJvNJeTUVzwzDNs503jq3vczY7zJBfQdk2Sbyte2X8qa2djSiqCArT0nD_Z0ApxM1khSdI",
  },
  {
    name: "Marcus W.",
    specialty: "Cat care & medication support",
    tags: ["Cats", "Medication"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDAHBi4XNIBcUNJCfpcP8Vkho4lUzRzk5b8PCjn6q6sRZGm8Y6HaXEV2lryRZgtmsEVd_xqYi8RPJz5AkvufywpKhjk3ENWKHuBNR0-YMk-VhKCGmeO6rNABupMfidtv1DSwpPd5ySPjYPqT8yvC4Kf4C8BVOhTJMlAumfNs_faNbClY3eDPi3MExHmnUV7XdTFbS6kVe7FHN9AG0NZuE1kNgrU-P9eWMbfOL8ENWYQD45wQbAIlDoB_GJOOjLkbHSoY-yLb495rTU",
  },
];
export function RecommendSitters() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <SectionHeader
        title={t.home.recommendSitters.title}
        text={t.home.recommendSitters.text}
        href="/public/sitters"
        label={t.home.recommendSitters.more}
      />
      <div className="grid gap-4 md:gap-6 md:grid-cols-4">
        {sitters.map((sitter) => (
          <article
            key={sitter.name}
            className="flex items-center gap-4 rounded-[18px] border border-outline-variant bg-white p-4 transition-colors hover:border-primary/30 active:scale-[0.99] md:flex-col md:gap-0 md:p-6 md:text-center"
          >
            {/* <div class="bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 border border-outline-variant shadow-sm active:scale-[0.98] transition-all"></div> */}
            <AppImage
              src={sitter.image}
              alt={sitter.name}
              className="h-16 w-16 rounded-2xl border border-outline-variant object-cover md:mx-auto md:mb-4 md:h-24 md:w-24 md:rounded-full"
            />
            <div className="flex-1">
              <div className="mb-0.5 flex items-center justify-between md:justify-center">
                <h3 className="text-base md:mb-1 md:text-lg font-bold">
                  {sitter.name}
                </h3>
              </div>
              <p className="mb-2 text-sm text-on-surface-variant md:mb-3">
                {sitter.specialty}
              </p>
              <div className="md:mb-6 flex flex-wrap md:justify-center gap-1.5">
                {sitter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-surface-container md:bg-surface-variant rounded-lg md:rounded text-on-surface-variant"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight size={24} className="md:hidden text-outline" />
            <Button
              href="/public/sitters"
              variant="outline"
              shape="default"
              className="home-button hidden h-11 w-full rounded-[10px] border-outline-variant bg-transparent shadow-none hover:border-primary hover:bg-primary-fixed hover:text-primary md:block"
            >
              {t.home.recommendSitters.detail}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
