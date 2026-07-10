export interface BookingFormValues {
  fullName: string
  email: string
  phone: string
  artist: string
  style: string
  placement: string
  size: string
  date: string
  idea: string
}

export interface BookingInquiryPayload extends BookingFormValues {
  referenceFileNames: string[]
}
