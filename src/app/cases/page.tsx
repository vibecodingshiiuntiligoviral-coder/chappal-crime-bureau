import type { Metadata } from "next";

import { CasesFeedScreen } from "@/components/screens/cases-feed-screen";

export const metadata: Metadata = {
  title: "Live Cases | Chappal Crime Bureau",
  description: "Browse the public feed of missing chappal cases and send safe preset tips.",
};

export default function CasesPage() {
  return <CasesFeedScreen />;
}
