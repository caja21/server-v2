import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "./sidebar";
import PromoPopup from "./promo-popup";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-white">
      <Sidebar session={session} />
      <main className="flex-1 p-4 lg:p-6 overflow-x-auto">{children}</main>
      <PromoPopup />
    </div>
  );
}
