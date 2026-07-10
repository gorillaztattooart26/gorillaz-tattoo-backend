'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccordionItem } from '@/components/ui/Accordion'

const FAQS = [
  {
    question: 'Can I reschedule?',
    answer:
      'Yes — let us know at least 48 hours before your appointment and your down payment transfers to the new date. Rescheduling within 48 hours or after a missed appointment forfeits the reservation fee.',
  },
  {
    question: 'Is my reservation fee refundable?',
    answer:
      'The down payment is non-refundable, but it can be transferred once to a new appointment date if you reschedule with at least 48 hours notice.',
  },
  {
    question: 'Can I change the tattoo design?',
    answer:
      'Minor adjustments (size, placement, small details) can be discussed with your artist before the session. Major concept changes may require a new consultation and updated quote.',
  },
  {
    question: 'What should I prepare before my appointment?',
    answer:
      'Bring a valid government ID, eat a full meal beforehand, stay hydrated, and avoid alcohol for 24 hours prior. Wear clothing that gives easy access to the tattoo placement.',
  },
]

export function BookingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent className="border-t border-white/10 px-0">
        {FAQS.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
