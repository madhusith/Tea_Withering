import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="w-full pt-16 px-6 sm:px-8 min-h-[calc(100vh-4rem)] pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}

