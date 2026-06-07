"use client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
const sitters = [
  {
    name: "Sarah M.",
    rating: "4.9",
    reviews: "124",
    tags: ["Dogs", "Cats"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBgvk0nO0lRHxQZOPyRic199CKF7ykQjTuTONykwaBjdBF4DSSi6WCXYGlPmLf_hYkIPWsnDqzi3Ztu9nAz0eiLiYrq02p0CMeRkOA5BJnycOKbwE3M5p9S4YQZynJWInl9cjcIEiB73hRoVEKUUki34URvCnSlHwSaUPwbqAA5Y01fICFvEgt2gpvVZvQaIi_DjYiHnamOXhKMUgnQW1zJfDevUby4oCckU6f0O-Ygdj6zSKUWVpuBsggwkWW-7oddmxaiQKCaWSs",
  },
  {
    name: "David L.",
    rating: "5.0",
    reviews: "86",
    tags: ["Exotics", "Rabbits"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMvNRaRxNKr0Z2Uxue1DgzUnnnKTmsoO_5u1Tfkt0MUxbCZ7ihgjFi_61jZk16cc6zFeA4OoYTenvU79Cv4zGwtF8yJvjRFUTiAcKt_F6Ux7-tXXlQDlC73UK7ZpzHgE4i_OI5kXcRkagh9N_9Qhyfi5O_irEMtkGSGN0auqDk4tbeb7IB9UvHnQHb5EXQxcnZHgyZvK1hgzEXy-86dPPwIW7epC209keDap2V4rtELLNwZf-MflYD3aYvZAGVbe-xxyNnR5maAAo",
  },
  {
    name: "Elena R.",
    rating: "4.8",
    reviews: "210",
    tags: ["Puppies", "Dogs"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA8bxarGt02YVlf-Se6LraRK0H_0XVoK1vDi3bfGIGbDu5a5h6qaWxlNoH-sBteJ8msXOiQXRICY2iF9aMDmoxG3opAQllpF8i0rGhapMMTUM-Y8AsstZgsvHmjoJ0J-LhTDOInluIqvfxoNpbnYAJoDVuTSohw_HPTZQpPHi0WD61jUPN0jtjRH7hdbDgtD2-Cokg3dwJvNJeTUVzwzDNs503jq3vczY7zJBfQdk2Sbyte2X8qa2djSiqCArT0nD_Z0ApxM1khSdI",
  },
  {
    name: "Marcus W.",
    rating: "4.9",
    reviews: "142",
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
      <div className="grid gap-6 md:grid-cols-4">
        {sitters.map((sitter) => (
          <article
            key={sitter.name}
            className="bg-white p-6 rounded-[2rem] text-center shadow-sm hover:-translate-y-2 transition-all"
          >
            <img
              src={sitter.image}
              alt={sitter.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary-fixed object-cover"
            />
            <h3 className="mb-1 text-lg font-bold">{sitter.name}</h3>
            <div className="mb-3 flex items-center justify-center gap-1 text-secondary">
              <Star size={16} fill="currentColor" />
              <span className="font-bold">{sitter.rating}</span>
              <span className="text-sm font-normal text-on-surface-variant">
                ({sitter.reviews} reviews)
              </span>
            </div>
            <div className="mb-6 flex flex-wrap justify-center gap-1.5">
              {sitter.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-surface-variant rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button
              href="/public/sitters"
              variant="outline"
              shape="pill"
              className="w-full"
            >
              {t.home.recommendSitters.detail}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
