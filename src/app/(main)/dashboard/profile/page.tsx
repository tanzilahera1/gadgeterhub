// src/app/(main)/dashboard/profile/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { ShieldCheck, User as UserIcon } from 'lucide-react'

export const metadata = {
  title: 'My Profile | GadgeterHub',
  description: 'Manage your account settings and personal information.',
}

async function getUserData(userId: string) {
  await dbConnect()
  const user = await User.findById(userId).lean()
  return JSON.parse(JSON.stringify(user))
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await getUserData(session.user.id!)

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
             <UserIcon className="size-8 text-primary" />
             My Profile
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Manage your personal information and security.</p>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
           <ShieldCheck className="size-5 text-emerald-600" />
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Verified Account</span>
        </div>
      </div>

      <ProfileForm initialData={user} />
    </div>
  )
}
