import { SiteHeader } from "@/components/site-header";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      {children}
    </div>
  );
}
