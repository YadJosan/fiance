import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Shield, ArrowRight } from "lucide-react";

export default function Login() {
  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="gradient-header text-white p-6 pt-16 pb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-blue-100 text-sm">
            Sign in to continue managing your expenses
          </p>
        </div>
      </div>

      {/* Login Form */}
      <div className="p-6 -mt-4 relative z-10">
        <Card className="border border-gray-100 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Sign In to Your Account</CardTitle>
            <p className="text-sm text-gray-600">
              Access your personal expense dashboard
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Secure Authentication</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Your data is protected with enterprise-grade security. We never store your passwords.
                  </p>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-primary hover:bg-primary/90 text-white p-4 h-auto rounded-xl font-semibold text-base touch-button group"
            >
              <span>Continue with Secure Login</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Benefits */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Track unlimited transactions</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Generate detailed reports</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Sync across all devices</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                New to Expense Tracker?{" "}
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-primary hover:underline font-medium"
                >
                  Learn more
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}