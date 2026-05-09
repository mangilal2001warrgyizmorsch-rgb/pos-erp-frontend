import { ERPLayout } from "@/components/layouts/ERPLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ERPLayout>{children}</ERPLayout>;
}
