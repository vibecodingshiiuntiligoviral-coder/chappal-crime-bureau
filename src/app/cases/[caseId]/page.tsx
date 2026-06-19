import type { Metadata } from "next";

import { CaseDetailScreen } from "@/components/screens/case-detail-screen";

type CaseDetailPageProps = {
  params: Promise<{ caseId: string }>;
};

export async function generateMetadata({
  params,
}: CaseDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: `${resolvedParams.caseId} | Chappal Crime Bureau`,
    description: "View a public missing chappal case file, send tips, and download the poster.",
  };
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const resolvedParams = await params;

  return <CaseDetailScreen caseId={resolvedParams.caseId} />;
}
