import type { Metadata } from "next";

import { FileFirScreen } from "@/components/screens/file-fir-screen";

export const metadata: Metadata = {
  title: "File Footwear FIR | Chappal Crime Bureau",
  description: "Register a public missing chappal FIR with privacy-safe fields and anonymous auth.",
};

export default function FileFirPage() {
  return <FileFirScreen />;
}
