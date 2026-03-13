import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Бартерия — Дашборд",
  description: "Дашборд мероприятия в реальном времени",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      {children}
    </div>
  );
}
