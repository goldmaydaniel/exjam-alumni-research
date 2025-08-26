"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetAdminPasswordPage() {
  const [email, setEmail] = useState("goldmay@gmail.com");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin-dashboard`,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ 
          type: "success", 
          text: "Password reset email sent! Check your inbox and click the link immediately." 
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // This is a fallback - you'll need to set a temporary password in Supabase dashboard
      setMessage({ 
        type: "success", 
        text: "Please set a temporary password in Supabase Dashboard > Authentication > Users > goldmay@gmail.com" 
      });
    } catch (error) {
      setMessage({ type: "error", text: "Error with direct login setup." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Password Reset</CardTitle>
          <p className="text-gray-600">Reset password for goldmay@gmail.com</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {message && (
            <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="goldmay@gmail.com"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDirectLogin}
            disabled={loading}
          >
            Setup Direct Login
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>Having trouble? Try these steps:</p>
            <ol className="mt-2 text-left space-y-1">
              <li>1. Check your email spam folder</li>
              <li>2. Click the reset link immediately</li>
              <li>3. Use a strong password</li>
              <li>4. Contact support if issues persist</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
