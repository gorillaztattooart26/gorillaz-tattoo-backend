export interface BookingFormValues {
  fullName: string
  email: string
  phone: string
  artist: string
  style: string
  placement: string
  size: string
  height: string
  weight: string
  idea: string
}

export interface BookingInquiryPayload extends BookingFormValues {
  referenceFileNames: string[]
}
