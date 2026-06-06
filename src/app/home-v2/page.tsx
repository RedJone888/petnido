"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe,
  Heart,
  Home,
  House,
  MapPin,
  MessageCircle,
  PawPrint,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { inter } from "@/components/fonts";

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
    icon: Home,
    tone: "primary",
  },
  {
    title: "Pet Boarding",
    text: "A loving home environment. Your pets stay with a trusted sitter in a cozy residence instead of a cramped kennel.",
    icon: House,
    tone: "secondary",
  },
  {
    title: "Specialized Tasks",
    text: "Cleaning cages, nail trimming, or transport to vet appointments for all animal types.",
    icon: Sparkles,
    tone: "tertiary",
  },
];

const ownerFlows = [
  {
    marker: "A",
    title: "On-Demand Matching",
    tone: "primary",
    steps: [
      "Post Your Need",
      "Sitter applies",
      "Chat & Match",
      "Peace of Mind",
    ],
  },
  {
    marker: "B",
    title: "Direct Discovery",
    tone: "secondary",
    steps: ["Browse Sitters", "Filter by Skills", "Direct Contact", "Confirm"],
  },
];

const sitterFlows = [
  {
    marker: "A",
    title: "Build Your Presence",
    tone: "secondary",
    steps: ["Create Profile", "Set Services", "Owner Contacts", "Confirm"],
  },
  {
    marker: "B",
    title: "Proactive Booking",
    tone: "primary",
    steps: ["Browse Needs", "One-tap Apply", "Chat", "Confirm"],
  },
];

const needs = [
  {
    title: "Golden Retriever needs walking",
    tag: "Dog Walking",
    price: "$20/hr",
    distance: "0.5 miles away",
    text: '"Buddy needs a 30-min walk while I am at work. He loves playing fetch!"',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4MTJmAs75oMkwqWF-ddn32vQdUs4SlSvtm_4P7selpQofsfK024dA30gmPad9Wir0VE73kXxWInjRlEzDTZSNV5393i8WOKxJPO0RcrCyjRuw16QHAXyKHUTS8VTf_o0gr5Yf5XWE1YPoTBvqvgfxyhO7IXSHqJJtfvaYqk7RMJLw_8f0mEvyQZ2-XykmqgwhGHP3Pahwjj_GPY8NWjszq5gmQy_BvYj9IKsVfA1mDq1R0ARF9kcn4obSRTju6DpqLnI36jvAL1o",
  },
  {
    title: "Rabbit cage cleaning",
    tag: "Specialized Care",
    price: "$35/visit",
    distance: "1.2 miles away",
    text: '"Rabbit hutch cleaning and feeding needed while we are away for the weekend."',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdcfGJgEqatWsJTiwDrA4e-1MvcZBqj6sJocD9KT_v9U36x9uhkY8XgPay46HiAdgB7GlznG4-UP7Ca86dPvF_Sro-ie4PYtfollRh3DNkLmADPfCN7cHWbbI5O22r2l3u_2SnPYx4tjfb0vdTLoB8ErtJmUkg3Qe2MeWI-LpHg5qepSycMa8Cpd-3BCYrCc0HxYJLxjzVvJpCSLs1A6FCINFl0Vvse0WULBaaoeFqIlk0qVguTtRjA6v6RTPkDPtnPMewMuRQXyY",
  },
  {
    title: "Luna needs feeding & cuddles",
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

export default function HomeV2Page() {
  const [flowType, setFlowType] = useState<"owner" | "sitter">("owner");
  const flows = flowType === "owner" ? ownerFlows : sitterFlows;

  return (
    <div className={`home-v2 overflow-x-hidden ${inter.className}`}>
      <section className="hv2-hero-gradient py-16 md:py-24">
        <div className="hv2-container grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="hv2-badge mb-6">Reliable Neighborhood Care</span>
            <h1 className="hv2-heading-xl mb-6">
              Care for your furry family, right in your neighborhood.
            </h1>
            <p className="hv2-body-lg mb-10 max-w-xl">
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
            <div className="hv2-glow" />
            <div className="hv2-hero-image">
              <img src={heroImage} alt="Woman with rabbits and guinea pigs" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--hv2-surface-low)] py-20">
        <div className="hv2-container">
          <div className="flex flex-col items-center gap-16 md:flex-row">
            <div className="grid gap-4 md:w-1/2 md:grid-cols-2">
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
              <h2 className="hv2-heading-lg mb-6">Trust your neighbors.</h2>
              <p className="hv2-body-lg mb-8">
                Sitters on PetNido are fellow pet owners and animal lovers. We
                believe the best care comes from someone who understands the
                bond you share with your pet.
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
                      <TrustIcon
                        className="text-[var(--hv2-primary)]"
                        size={22}
                      />
                      <span className="hv2-label">{label as string}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="hv2-container">
          <h2 className="hv2-heading-lg mb-16 text-center">
            Tailored Care for Every Pet
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className="hv2-service-card group">
                <div className={`hv2-service-icon hv2-tone-${service.tone}`}>
                  <service.icon size={24} />
                </div>
                <h3 className="hv2-heading-md mb-4">{service.title}</h3>
                <p className="hv2-body-md mb-6">{service.text}</p>
                <Link
                  href="/public/sitters"
                  className="hv2-link-action mt-auto"
                >
                  Learn More
                  <ArrowRight size={18} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[rgba(209,219,236,0.18)] py-24">
        <div className="hv2-container text-center">
          <h2 className="hv2-heading-lg mb-4">Simple, safe connections.</h2>
          <div className="mb-16 inline-flex rounded-full bg-[var(--hv2-surface-container)] p-1">
            <button
              className={`hv2-flow-tab ${flowType === "owner" ? "is-active" : ""}`}
              onClick={() => setFlowType("owner")}
            >
              For Pet Owners
            </button>
            <button
              className={`hv2-flow-tab ${flowType === "sitter" ? "is-active" : ""}`}
              onClick={() => setFlowType("sitter")}
            >
              For Local Sitters
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {flows.map((flow) => (
              <article key={flow.title} className="hv2-flow-card">
                <div className="mb-8 flex items-center gap-3">
                  <span className={`hv2-flow-marker hv2-tone-${flow.tone}`}>
                    {flow.marker}
                  </span>
                  <h3 className={`hv2-heading-md hv2-title-${flow.tone}`}>
                    {flow.title}
                  </h3>
                </div>
                <div className="hv2-step-list">
                  {flow.steps.map((step, index) => (
                    <div key={step} className="relative flex gap-6">
                      <span className={`hv2-step-number hv2-tone-${flow.tone}`}>
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="mb-1 font-bold">{step}</h4>
                        <p className="text-sm text-[var(--hv2-on-surface-muted)]">
                          {flowType === "owner"
                            ? "Review options, chat directly, and confirm care with confidence."
                            : "Set your availability, connect with owners, and build trusted local relationships."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv2-container py-24">
        <SectionHeader
          title="Nearby Needs"
          text="Pets looking for care in your area right now."
          href="/public/needs"
          label="View All Needs"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {needs.map((need) => (
            <article key={need.title} className="hv2-need-card">
              <div className="relative h-36 overflow-hidden">
                <img src={need.image} alt={need.title} />
                <span className="hv2-card-tag">{need.tag}</span>
              </div>
              <div className="p-6">
                <h3 className="mb-2 font-bold text-[var(--hv2-primary)]">
                  {need.title}
                </h3>
                <div className="mb-4 flex items-center gap-2 text-sm text-[var(--hv2-on-surface-muted)]">
                  <MapPin size={16} />
                  <span>東京都 港区 ({need.distance})</span>
                </div>
                <p className="hv2-body-md mb-4">{need.text}</p>
                <div className="flex items-center justify-between border-t border-[rgba(204,195,216,0.35)] pt-4">
                  <span className="font-bold text-[var(--hv2-primary)]">
                    {need.price}
                  </span>
                  <Link
                    href="/public/needs"
                    className="text-sm font-bold text-[var(--hv2-primary)]"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--hv2-surface-container)] py-24">
        <div className="hv2-container">
          <SectionHeader
            title="Meet Your Local Experts"
            text="Highly-rated sitters in your community."
            href="/public/sitters"
            label="View All Sitters"
          />
          <div className="grid gap-6 md:grid-cols-4">
            {sitters.map((sitter) => (
              <article key={sitter.name} className="hv2-sitter-card">
                <img src={sitter.image} alt={sitter.name} />
                <h3 className="mb-1 text-lg font-bold">{sitter.name}</h3>
                <div className="mb-3 flex items-center justify-center gap-1 text-[var(--hv2-secondary)]">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold">{sitter.rating}</span>
                  <span className="text-sm font-normal text-[var(--hv2-on-surface-muted)]">
                    ({sitter.reviews} reviews)
                  </span>
                </div>
                <div className="mb-6 flex flex-wrap justify-center gap-1.5">
                  {sitter.tags.map((tag) => (
                    <span key={tag} className="hv2-mini-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/public/sitters" className="hv2-profile-button">
                  View Profile
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv2-container py-24 text-center">
        <div className="hv2-final-cta">
          <div className="hv2-dot-pattern" />
          <h2 className="hv2-heading-xl relative z-10 mb-6 text-white">
            Join our global community of pet lovers today.
          </h2>
          <p className="relative z-10 mx-auto mb-10 max-w-2xl text-lg leading-7 text-[rgba(234,221,255,0.82)]">
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

      <footer className="border-t border-[rgba(204,195,216,0.3)] bg-[var(--hv2-surface-container)]">
        <div className="hv2-container flex flex-col items-start justify-between gap-12 py-16 md:flex-row">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="PetNido Logo"
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-2xl font-bold text-[var(--hv2-primary)]">
                PetNido
              </span>
            </div>
            <p className="hv2-body-md mb-8 max-w-xs">
              Connecting neighbors for a safer, happier pet community.
            </p>
            {/* <Link href="/dashboard/needs/new" className="hv2-footer-button">
              Post Your Need
            </Link> */}
            <Button variant="primary" size="md" shape="pill">
              Post Your Need
            </Button>
          </div>
          <div className="flex flex-wrap gap-12 md:gap-24">
            <FooterLinks
              title="Platform"
              links={["View All Needs", "View All Sitters", "Safety Measures"]}
            />
            <FooterLinks
              title="Support"
              links={[
                "Help Center",
                "Community Guidelines",
                "Verification Info",
              ]}
            />
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-[var(--hv2-primary)]">Follow Us</h3>
              <div className="flex gap-4 text-[var(--hv2-on-surface-muted)]">
                <Globe className="cursor-pointer hover:text-[var(--hv2-primary)]" />
                <Share2 className="cursor-pointer hover:text-[var(--hv2-primary)]" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <h2 className="hv2-heading-lg mb-2">{title}</h2>
        <p className="text-[var(--hv2-on-surface-muted)]">{text}</p>
      </div>
      <Link href={href} className="hv2-link-action">
        {label}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-[var(--hv2-primary)]">{title}</h3>
      {links.map((link) => (
        <Link
          key={link}
          href="#"
          className="text-[var(--hv2-on-surface-muted)] transition-colors hover:text-[var(--hv2-primary)]"
        >
          {link}
        </Link>
      ))}
    </div>
  );
}
