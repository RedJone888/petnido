import type { Metadata } from "next";

import { KnowledgeLibrary } from "./knowledge-library";

export const metadata: Metadata = {
  title: "Pet care knowledge library | PetNido",
  description: "Browse sourced pet-care references by animal and care topic.",
};

export default function KnowledgePage() {
  return <KnowledgeLibrary />;
}
