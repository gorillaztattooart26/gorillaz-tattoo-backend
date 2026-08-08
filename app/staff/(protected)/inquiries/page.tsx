import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
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
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--foreground)]/40">
                <th scope="col" className="px-5 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Name</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Contact</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Artist</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Style</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Placement</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Size</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Height</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Weight</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Description</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Reference</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--foreground)]/5">
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                    No inquiries yet.
                  </td>
                </tr>
              )}
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <InquiryDetailButton inquiry={inquiry} />
                      <Link
                        href={`/staff/create-booking?fromInquiry=${inquiry.id}`}
                        className="whitespace-nowrap rounded-full border border-[var(--primary)]/40 px-3 py-1.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
                      >
                        convert to booking
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-[var(--foreground)]">{inquiry.full_name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[var(--foreground)]/70">
                    <p>{inquiry.email}</p>
                    <p className="text-xs text-[var(--foreground)]/40">{inquiry.phone}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 capitalize text-[var(--foreground)]/70">{inquiry.preferred_artist}</td>
                  <td className="whitespace-nowrap px-5 py-4 capitalize text-[var(--foreground)]/70">{inquiry.tattoo_type}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[var(--foreground)]/70">{inquiry.placement}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[var(--foreground)]/70">{inquiry.size}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[var(--foreground)]/70">{inquiry.height || '—'}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[var(--foreground)]/70">{inquiry.weight || '—'}</td>
                  <td className="px-5 py-4 text-[var(--foreground)]/70">
                    <p className="w-64 whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--background)]/20 px-3 py-2 leading-relaxed">
                      {inquiry.message}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {inquiry.images.length === 0 ? (
                      <span className="text-xs text-[var(--foreground)]/30">none</span>
                    ) : (
                      <div className="flex gap-1.5">
                        {inquiry.images.map((url, index) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border)] transition-opacity hover:opacity-80"
                          >
                            <Image
                              src={url}
                              alt={`Reference image ${index + 1} of ${inquiry.images.length} from ${inquiry.full_name}`}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[var(--foreground)]/40">{formatDate(inquiry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
