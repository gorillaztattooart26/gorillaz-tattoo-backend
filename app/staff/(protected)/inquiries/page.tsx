import type { Metadata } from 'next'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { ArchiveViewTabs } from '@/components/staff/ArchiveViewTabs'
import { InquiriesDataTable } from '@/components/staff/InquiriesDataTable'
import { getInquiries } from '@/lib/staff/inquiries'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

export const metadata: Metadata = {
  title: 'Inquiries | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const artist = await getCurrentStaffArtist()
  const isOwner = artist?.is_owner ?? false

  const { view: viewParam } = await searchParams
  const view = viewParam === 'archived' && isOwner ? 'archived' : 'active'

  const [activeInquiries, archivedInquiries] = await Promise.all([
    getInquiries('active'),
    isOwner ? getInquiries('archived') : Promise.resolve([]),
  ])

  const inquiries = view === 'archived' ? archivedInquiries : activeInquiries

  return (
    <div>
      <StaffPageHeader title="Inquiries" description={`${activeInquiries.length} total`} />

      <div className="px-4 py-6 md:px-8">
        {isOwner && (
          <div className="mb-4">
            <ArchiveViewTabs
              basePath="/staff/inquiries"
              view={view}
              activeCount={activeInquiries.length}
              archivedCount={archivedInquiries.length}
            />
          </div>
        )}

        <InquiriesDataTable inquiries={inquiries} isOwner={isOwner} view={view} />
      </div>
    </div>
  )
}
