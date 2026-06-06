import { Button } from "@/components/ui/button";
import {
  CreateNeedButton,
  CreateServiceButton,
} from "@/components/shared/buttons";
import { Card } from "./_components/cards";
import Link from "next/link";
import { auth } from "@/lib/auth";
import cn from "@/lib/cn";
import {
  Globe,
  Heart,
  Home,
  House,
  Bike,
  HouseHeart,
  Lightbulb,
  MapPin,
  MessageCircle,
  PawPrint,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  MoveRight,
} from "lucide-react";
import { ServiceInfo } from "./_components/service-info";
import { SimpleJourney } from "./_components/simple-journey";
import { SectionHeader } from "./_components/section-header";
import { background } from "storybook/theming";
// const valueCard = [
//   {
//     icon: "🐾",
//     title: "家族のように大切に",
//     content:
//       "ペットは“ただのお世話”ではなく、大切な家族。心を込めて向き合えるシッターだけを。",
//   },
//   {
//     icon: "💬",
//     title: "安心できるコミュニケーション",
//     content:
//       "依頼前にチャットで相談できるから、初めてでも安心してお願いできます。",
//   },
//   {
//     icon: "🌿",
//     title: "やさしくつながる仕組み",
//     content:
//       "ペット好き同士がお互いを支え合う、思いやりに満ちたコミュニティです。",
//   },
// ];
const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAts9HHBD5HhcgQUouYFxMKnPcuQrm-5BY4JkixxXUSqVkJorJIGzJ8aOWENsymoC68lNXUnU3ZMu61srdnCRPoETHHJuGx0qyPkxbZVQzhab72lSzjXxsSPDxX-YcxAwGGa2aj7LqOkg6JhmRjtIuRtxJ9Yzij64IGmINBA--dPR2AB8PVAu4GSWuKmV5p7nkJYA8Zl8hFBEw6d4XE1_bB79I9bYUfl48ot-9DkaZIgNotR4icLupZOsz2JdWirlh0qcSces9nj5w";
const trustImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtE117gHNSc4vaqcVTz94U1itkvucJaAUoha0F0G_rQGib3NyOTr8w0LhnVBN5jr6H7kxiP3D6pbmioh_jqnzf_7zdTSXetilFq6KxyB4Rs7j-B5xxoZ2gZyVHwrkt4auW4dzT-tzLMjad8rg19jgR278jF1RpWhMNKuIiu--0NAHtIz1U9pb0wkGJuRy1a0wzX5hZejblGzPCJN3H4weKsMs-cJaBUHJ638aYuWjB3Y9RX3rJ37gEI2wVNmYk8JHZOz257lw2-9U",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD9YQOC60pdx-Ib0Zaf18_at8RH0JFffQfnuEkt377N17PyrTPPN2kQNsqpwkl_EVpRdmZi0VsmU41dRcLTVnwlV7219w_OndldB_eqEW_DvMQ_BtcKfG2CNDtEkZykgXMWXoYhfVlxDBaCRTkzHB83SGJGSB0IUGUhHucmCfTRy3XdbP0Q8YipyC8JDRE3YfmBxWgDdZPvCbNApkv7qT6vDiZ4BdoxXyOG-4gxTjB6BF0exFQA2jY9sub7FIFlirIw8IoryyKM6kI",
];
const services = [
  {
    title: "Sitter Visits",
    text: "Sitters visit your home for feeding, walking, or play sessions to keep routines consistent.",
    icon: Bike,
    tone: "primary",
  },
  {
    title: "Pet Boarding",
    text: "A loving home environment. Your pets stay with a trusted sitter in a cozy residence instead of a cramped kennel.",
    icon: HouseHeart,
    tone: "secondary",
  },
  {
    title: "Specialized Tasks",
    text: "The little things matter. Cleaning cages, nail trimming, or transport to vet appointments for all animal types.",
    icon: Lightbulb,
    tone: "tertiary",
  },
];
const needs = [
  {
    title: "Golden Retriever needs walking",
    alt: "A happy Golden Retriever sitting in a sunlit suburban park, looking alert and friendly. The environment is green and lush, reflecting a warm neighborhood atmosphere with soft afternoon lighting.",
    tag: "Dog Walking",
    price: "$20/hr",
    distance: "0.5 miles away",
    text: '"Buddy needs a 30-min walk while I am at work. He loves playing fetch!"',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4MTJmAs75oMkwqWF-ddn32vQdUs4SlSvtm_4P7selpQofsfK024dA30gmPad9Wir0VE73kXxWInjRlEzDTZSNV5393i8WOKxJPO0RcrCyjRuw16QHAXyKHUTS8VTf_o0gr5Yf5XWE1YPoTBvqvgfxyhO7IXSHqJJtfvaYqk7RMJLw_8f0mEvyQZ2-XykmqgwhGHP3Pahwjj_GPY8NWjszq5gmQy_BvYj9IKsVfA1mDq1R0ARF9kcn4obSRTju6DpqLnI36jvAL1o",
  },

  {
    title: "Rabbit cage cleaning",
    alt: "",
    tag: "Specialized Care",
    price: "$35/visit",
    distance: "1.2 miles away",
    text: '"Rabbit hutch cleaning and feeding needed while we are away for the weekend."',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdcfGJgEqatWsJTiwDrA4e-1MvcZBqj6sJocD9KT_v9U36x9uhkY8XgPay46HiAdgB7GlznG4-UP7Ca86dPvF_Sro-ie4PYtfollRh3DNkLmADPfCN7cHWbbI5O22r2l3u_2SnPYx4tjfb0vdTLoB8ErtJmUkg3Qe2MeWI-LpHg5qepSycMa8Cpd-3BCYrCc0HxYJLxjzVvJpCSLs1A6FCINFl0Vvse0WULBaaoeFqIlk0qVguTtRjA6v6RTPkDPtnPMewMuRQXyY",
  },
  {
    title: "Luna needs feeding & cuddles",
    alt: "",
    tag: "Sitter Visit",
    price: "$18/visit",
    distance: "0.8 miles away",
    text: '"Afternoon feeding and some cuddle time for Luna. She is very shy."',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_5OSfQR4t4WuiDRALmEoPazl03VwQbBwokNouMClyqTscVmRFLfMaa9Am5PckxISbpZE7jYmxidrAp7HelTqhC_t7HPZoUSWbEWJ7A87jIgvAwp_gPjjYV2ufdTrdsr9l2XPIqm17TYIT0as5_6AUFDs4H4tsIVVtJiy705TPJ1O_vUhSvqnEfUwj0dQ8Lg87houXCSL4Wo5g2PeBIF4ljdUm4lAGAvRbmVciHP2LhcK48uf6gauvElQAcABwJ6ywcgxVQdYyfzk",
  },
];
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

const valueCard = [
  {
    icon: "🐾",
    title: "家族と同じ、深い愛情を",
    content:
      "“ただのお世話”ではなく、家族の一員として向き合う。愛情あふれるシッターとの出会いを提供します。",
  },
  {
    icon: "💬",
    title: "顔が見える、安心の対話",
    content:
      "事前チャットで気になることを相談。お互いの信頼を深めてから、納得して依頼ができます。",
  },
  {
    icon: "🌿",
    title: "支え合うコミュニティ",
    content:
      "ペット好き同士が助け合う、思いやりの輪。地域のつながりが、ペットの幸せを守ります。",
  },
];
const ownerSteps = [
  {
    icon: "①",
    title: "ニーズを投稿",
    content: "お世話の内容や期間、予算を投稿します。",
  },
  {
    icon: "②",
    title: "シッターと相談",
    content: "応募があったシッターとチャットで打ち合わせ。",
  },
  {
    icon: "③",
    title: "依頼確定",
    content: "安心してペットを任せて、お出かけへ。",
  },
];

const sitterSteps = [
  {
    icon: "①",
    title: "サービスを登録",
    content: "対応可能なペット種類や得意なお世話をアピール。",
  },
  {
    icon: "②",
    title: "依頼を探す",
    content: "募集中のニーズを見て、自分に合うものに応募。",
  },
  {
    icon: "③",
    title: "お世話スタート",
    content: "新しいペットとの出会いと、感謝の報酬を。",
  },
];
export default function HomePage() {
  return (
    <>
      {/* <!-- Hero Section --> */}
      <section className="relative overflow-hidden hero-gradient py-16 md:py-24">
        <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop grid items-center gap-12 md:grid-cols-2">
          <div className="z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-label-md mb-6">
              Reliable Neighborhood Care
            </span>
            <h1 className="text-headline-xl mb-6 text-on-background">
              Care for your furry family, right in your neighborhood.
            </h1>
            <p className="text-body-lg text-on-surface-variant mb-10 max-w-lg">
              Find experienced local sitters for dogs, cats, and exotic pets.
              Professional care with a personal, neighborly touch.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* <Link href="/dashboard/needs/new" className="hv2-button-primary">
                      Post Your Need
                      <PawPrint size={20} />
                    </Link> */}
              <Button variant="primary" size="lg" shape="default">
                Post Your Need
                <PawPrint size={20} />
              </Button>

              {/* <Link
                      href="/dashboard/serviceprofile/services/new"
                      className="hv2-button-secondary"
                    >
                      Become a Sitter
                    </Link> */}
              <Button variant="secondary" size="lg" shape="default">
                Become a Sitter
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
      </section>
      {/* <!-- Trust Section --> */}
      <section className="bg-surface-container-low py-20">
        <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col items-center gap-16 md:flex-row">
            <div className="grid gap-4 md:w-1/2 grid-cols-2">
              {trustImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={
                    index === 0 ? "Person with small pet" : "Cat interaction"
                  }
                  className={`h-64 w-full rounded-3xl object-cover shadow-md ${
                    index === 0 ? "mt-8" : ""
                  }`}
                />
              ))}
            </div>
            <div className="md:w-1/2">
              <h2 className="text-headline-lg mb-6">Trust your neighbors.</h2>
              <p className="text-body-lg text-on-surface-variant mb-8">
                Sitters on PetNido are fellow pet owners and animal lovers, not
                clinical staff. We believe the best care comes from someone who
                understands the bond you share with your pet. From daily walks
                to specialized exotic care, find the perfect match through real
                conversations.
              </p>
              <ul className="space-y-4">
                {[
                  [ShieldCheck, "Neighbor-Verified Profiles"],
                  [Heart, "Personalized Home-based Care"],
                  [MessageCircle, "Direct Messaging for Peace of Mind"],
                ].map(([Icon, label]) => {
                  const TrustIcon = Icon as typeof ShieldCheck;
                  return (
                    <li
                      key={label as string}
                      className="flex items-center gap-3"
                    >
                      <TrustIcon className="text-primary" size={22} />
                      <span className="text-label-md">{label as string}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* <!-- Services Bento Grid --> */}
      <section className="bg-white py-24">
        <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="text-headline-lg mb-16 text-center">
            Tailored Care for Every Pet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {services.map((service, index) => (
              <ServiceInfo
                service={service}
                key={service.title}
                className={cn(index === 1 && "bg-primary/5 border-primary/10")}
              ></ServiceInfo>
            ))}
          </div>
        </div>
      </section>
      {/* <!-- Simple Journeys Section --> */}
      <section className="bg-surface-dim/10 py-24">
        <SimpleJourney></SimpleJourney>
      </section>
      {/* <!-- Nearby Needs --> */}
      <section className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-24">
        <SectionHeader
          title="Nearby Needs"
          text="Pets looking for care in your area right now."
          href="/public/needs"
          label="View All Needs"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {needs.map((need) => (
            <article
              key={need.title}
              className="bg-white border border-outline-variant rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={need.image}
                  alt={need.alt}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold">
                  {need.tag}
                </span>
              </div>
              <div className="p-6 text-on-surface-variant">
                <h3 className="mb-2 font-bold text-primary">{need.title}</h3>
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <MapPin size={16} />
                  <span>東京都 港区 ({need.distance})</span>
                </div>
                <p className="text-body-md mb-4">{need.text}</p>
                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                  <span className="font-bold text-primary">{need.price}</span>
                  <Button href="/public/needs" variant="link">
                    Details
                    <MoveRight size={16} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      {/* <!-- Recommended Sitters --> */}
      <section className="bg-surface-container py-24">
        <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <SectionHeader
            title="Meet Your Local Experts"
            text="Highly-rated sitters in your community."
            href="/public/sitters"
            label="View All Sitters"
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
                  View Profile
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* <!-- Final CTA --> */}
      <section className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
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
            Join our global community of pet lovers today.
          </h2>
          <p className="relative z-10 mx-auto mb-10 max-w-2xl text-body-lg text-primary-fixed/80">
            Whether you are looking for a trusted hand or wanting to share your
            love for animals, PetNido is where neighbors become family.
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
              Post Your Need
            </Button>
            <Button
              variant="secondary"
              size="lg"
              shape="pill"
              className="bg-primary text-white border-white/30 hover:bg-white/10"
            >
              Become a Sitter
            </Button>
            {/* <Link
              href="/dashboard/serviceprofile/services/new"
              className="hv2-cta-dark"
            >
              Become a Sitter
            </Link> */}
          </div>
        </div>
      </section>
    </>
  );
}
async function test() {
  const session = await auth();
  return (
    <div>
      {/* ---------------- Hero Section ---------------- */}
      <section className="bg-linear-to-br from-purple-50 to-blue-50 py-16 md:py-36">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-800">
            ペットがつなぐ、
            <br className="md:hidden" />
            やさしい助け合い。
          </h1>

          <p className="text-gray-600 mt-6 text-base md:text-xl leading-relaxed">
            大切な家族を預けたい人も、
            <br className="md:hidden" />
            空いた時間で支えたい人も。
          </p>

          {/* 响应式按钮组：手机端上下堆叠，电脑端并排 */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-10">
            <CreateNeedButton initialSession={session} />
            <CreateServiceButton initialSession={session} />
            {/* <Button
              href="/public/browse/sitters"
              variant="outlineDark"
              className="px-8 py-3 rounded-full w-[80%] md:w-auto text-lg"
            >
              シッターを探す
            </Button> */}
          </div>
        </div>
      </section>

      {/* ---------------- 核心价值 ---------------- */}
      {/* <Section title="PetNido が大切にしていること" cardList={valueCard} /> */}
      {/* <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            PetNido が大切にしていること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {valueCard.map((card) => (
              <Card
                key={card.title}
                icon={card.icon}
                title={card.title}
                content={card.content}
              />
            ))}
          </div>
        </div>
      </section> */}
      {/* <section className="py-20 bg-liner-to-b from-transparent to-gray-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              PetNido が大切にしていること
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {valueCard.map((card) => (
              <Card
                key={card.title}
                icon={card.icon}
                title={card.title}
                content={card.content}
              />
            ))}
          </div>
        </div>
      </section> */}
      {/* ---------------- 双向流程版块 ---------------- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">
            使い方は、かんたん
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            {/* 宠物主视角 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center">
              <h3 className="text-2xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                🐾 お世話を依頼する
              </h3>
              <div className="space-y-6">
                {ownerSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-orange-400 font-bold">
                      {step.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-gray-600 text-sm">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                href="/public/sitters"
                className="w-full mt-8 lg:w-[80%]"
                variant="outlineLight"
              >
                シッターを探す
              </Button>
            </div>

            {/* Sitter 视角 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center">
              <h3 className="text-2xl font-bold text-blue-600 mb-6 flex items-center gap-2">
                🏠 シッターとして活動する
              </h3>
              <div className="space-y-6">
                {sitterSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-blue-400 font-bold">{step.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-gray-600 text-sm">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                href="/public/needs"
                className="w-full mt-8 lg:w-[80%]"
                variant="outlineLight"
              >
                依頼を探す
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 预览展示 (数据需动态抓取) ---------------- */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">募集中のお世話依頼</h2>
            <Link href="/public/needs" className="text-primary hover:underline">
              もっと見る →
            </Link>
          </div>
          {/* 这里放置你的需求展示卡片组件，记得做 grid-cols-1 md:grid-cols-3 适配 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock Card */}
            <div className="p-4 border rounded-xl">大阪市：うさぎの給餌...</div>
            <div className="p-4 border rounded-xl">
              吹田市：猫のトイレ掃除...
            </div>
            <div className="p-4 border rounded-xl">堺市：犬のお散歩...</div>
          </div>
        </div>
      </section>
      {/* ---------------- 预览展示 (数据需动态抓取) ---------------- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">
              サービスを提供するシッターさんたち
            </h2>
            <Link href="/public/needs" className="text-primary hover:underline">
              もっと見る →
            </Link>
          </div>
          {/* 这里放置你的需求展示卡片组件，记得做 grid-cols-1 md:grid-cols-3 适配 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock Card */}
            <div className="p-4 border rounded-xl">大阪市：うさぎの給餌...</div>
            <div className="p-4 border rounded-xl">
              吹田市：猫のトイレ掃除...
            </div>
            <div className="p-4 border rounded-xl">堺市：犬のお散歩...</div>
          </div>
        </div>
      </section>
      {/* ---------------- Community Message ---------------- */}
      {/* <section
        id="thought"
        className="max-w-4xl mx-auto px-4 py-20 text-center mb-20"
      >
        <h2 className="text-3xl font-bold mb-6">PetNido の思い</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
          “ペットの幸せは、飼い主さんの安心から”。{"\n"}
          忙しい時も、遠くに行く時も、ペットが安心して過ごせる場所がある。
          {"\n"}
          誰かのやさしさが、あなたとペットをそっと支えます。
        </p>
      </section> */}
    </div>
  );
}
