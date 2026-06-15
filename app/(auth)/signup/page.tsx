import AuthShell from "@/components/auth/AuthShell"
import SignupForm from "@/components/auth/SignupForm"

export default function Page() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join to start chatting with friends"
    >
      <SignupForm />
    </AuthShell>
  )
}