import { requireAuth } from '@/lib/auth/auth-complete'
import { redirect } from 'next/navigation'
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard'

export default async function SuperAdminPage() {
  const session = await requireAuth(['ADMIN'])
  
  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return <SuperAdminDashboard user={session.user} />
}