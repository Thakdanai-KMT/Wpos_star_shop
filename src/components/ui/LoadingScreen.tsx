export default function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-brand-900">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 relative">
        <span className="text-gold-500 text-2xl font-bold">★</span>
        <span className="absolute inset-0 rounded-2xl border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
      </div>
      <p className="text-white/90 text-sm font-medium tracking-wide">
        WPOS STAR SHOP
      </p>
      <p className="text-white/40 text-xs mt-1">กำลังโหลดระบบ...</p>
    </div>
  )
}