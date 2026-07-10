'use client'

import { motion } from 'framer-motion'
import { BookingStatus } from '@/components/booking/BookingStatus'
import type { Booking } from '@/types/booking-portal'

export function BookingHeader({ booking }: { booking: Pick<Booking, 'bookingId' | 'status'> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-white/40">
        gorillaz tattoo art
      </p>
      <h1 className="hero-title mt-4 text-white font-medium text-[13vw] md:text-[4.5vw]">
        Booking Confirmation
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
        Your consultation has been approved. Please review your booking
        details and complete your required down payment to reserve your
        tattoo appointment.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 md:text-sm">
          Booking ID <span className="font-semibold text-white">{booking.bookingId}</span>
        </span>
        <BookingStatus status={booking.status} />
      </div>
    </motion.div>
  )
}
