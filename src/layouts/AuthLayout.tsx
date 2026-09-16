import { Link, Outlet } from 'react-router-dom'
import logo from '@/assets/logo.png'
import bg from '@/assets/bg.png'

export function AuthLayout() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/25" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/login" className="inline-flex flex-col items-center gap-2">
            <img
              src={logo}
              alt="Haze"
              className="h-36 w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            />
          </Link>
          <p className="mt-1 text-sm text-white/80">Admin control panel</p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-black/45 p-6 shadow-2xl backdrop-blur-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
