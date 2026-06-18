import { Suspense } from "react"
import AuthShell from "@/components/auth/AuthShell"
import VerifyPage from "@/components/auth/VerifyPage"

export default function Page() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent you"
    >
      <Suspense fallback={null}>
        <VerifyPage />
      </Suspense>
    </AuthShell>
  )
}