import { requireAuth } from '@/lib/auth/auth-complete'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/dashboards/AdminDashboard'

export default async function AdminPage() {
  const session = await requireAuth(['ADMIN', 'ORGANIZER'])
  
  if (!session) {
    redirect('/auth/login')
  }

  if (!['ADMIN', 'ORGANIZER'].includes(session.user.role)) {
    redirect('/unauthorized')
  }

  return <AdminDashboard user={session.user} />
}