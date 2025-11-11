import { DashboardLayout } from "../dashboard-layout"

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}

