"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [dob, setDob] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState(1) // 1: Email, 2: DOB, 3: New Password
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Check if user exists in the users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, dob')
        .eq('email', email)
        .single()

      if (userError || !user) {
        setError("No account found with this email address.")
        return
      }

      // Move to DOB verification step
      setStep(2)
    } catch (err) {
      console.error("Email verification error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDobSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Verify email and DOB combination
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, dob')
        .eq('email', email)
        .eq('dob', dob)
        .single()

      if (userError || !user) {
        setError("Incorrect date of birth.")
        return
      }

      // Move to new password step
      setStep(3)
    } catch (err) {
      console.error("DOB verification error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate new password and confirm password
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }

      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long.")
        return
      }

      // Update the user's password in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('email', email)

      if (updateError) {
        setError("Failed to update password. Please try again.")
        return
      }

      // Success! Redirect to login page
      router.push("/login")
    } catch (err) {
      console.error("Password update error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Password (🛑work in progress🛑)</CardTitle>
          {step === 1 && (
            <CardDescription>
              Enter your email address to begin the password reset process.
            </CardDescription>
          )}
          {step === 2 && (
            <CardDescription>
              Please verify your date of birth for security purposes.
            </CardDescription>
          )}
          {step === 3 && (
            <CardDescription>
              Enter and confirm your new password.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Continue"}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleDobSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Continue"}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}