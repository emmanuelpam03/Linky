import AuthShell from "@/components/auth/AuthShell"
import LoginForm from "@/components/auth/LoginForm"

export default function Page() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your email and password"
    >
      <LoginForm />
    </AuthShell>
  )
}