export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#fabb42]" />
    </div>
  )
}
