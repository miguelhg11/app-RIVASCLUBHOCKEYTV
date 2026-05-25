import { requireAdmin } from "@/src/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return <>{children}</>;
}
