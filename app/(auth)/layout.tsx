// Owner: FE2
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030507] w-full m-0 p-0 overflow-hidden">
      {children}
    </div>
  )
}
