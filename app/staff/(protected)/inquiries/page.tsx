import type { Metadata } from 'next'
import Image from 'next/image'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { InquiryDetailButton } from '@/components/staff/InquiryDetailButton'
import { getInquiries } from '@/lib/staff/inquiries'
import { formatDate } from '@/lib/staff/format'

export const metadata: Metadata = {
  title: 'Inquiries | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffInquiriesPage() {
  const inquiries = await getInquiries()

  return (
    <div>
      <StaffPageHeader title="Inquiries" description={`${inquiries.length} total`} />

      <div className="px-4 py-6 md:px-8">
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-900/60 md:rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-5 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Name</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Contact</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Artist</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Style</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Placement</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Size</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Height</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Weight</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Description</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Reference</th>
                <th className="whitespace-nowrap px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-white/40">
                    No inquiries yet.
                  </td>
                </tr>
              )}
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="px-5 py-4">
                    <InquiryDetailButton inquiry={inquiry} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-white">{inquiry.full_name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-white/70">
                    <p>{inquiry.email}</p>
                    <p className="text-xs text-white/40">{inquiry.phone}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 capitalize text-white/70">{inquiry.preferred_artist}</td>
                  <td className="whitespace-nowrap px-5 py-4 capitalize text-white/70">{inquiry.tattoo_type}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-white/70">{inquiry.placement}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-white/70">{inquiry.size}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-white/70">{inquiry.height || '—'}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-white/70">{inquiry.weight || '—'}</td>
                  <td className="px-5 py-4 text-white/70">
                    <p className="w-64 whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/20 px-3 py-2 leading-relaxed">
                      {inquiry.message}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {inquiry.images.length === 0 ? (
                      <span className="text-xs text-white/30">none</span>
                    ) : (
                      <div className="flex gap-1.5">
                        {inquiry.images.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 transition-opacity hover:opacity-80"
                          >
                            <Image src={url} alt="Reference image sent with this inquiry" fill sizes="40px" className="object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-white/40">{formatDate(inquiry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
