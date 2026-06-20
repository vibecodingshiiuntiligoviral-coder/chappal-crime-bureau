import type { Metadata } from "next";

import { FileFirScreen } from "@/components/screens/file-fir-screen";

export const metadata: Metadata = {
  title: "File Footwear F.I.R | Chappal Crime Bureau",
  description: "Register a public missing chappal FIR with privacy-safe fields and public-safety guardrails.",
};

export default function FileFirPage() {
  return <FileFirScreen />;
}
