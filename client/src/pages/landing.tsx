import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="gradient-header text-white p-6 pt-16 pb-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Expense Tracker</h1>
          <p className="text-blue-100 text-sm">
            Take control of your finances with smart expense tracking
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="p-6 -mt-8 relative z-10">
        <div className="grid gap-4 mb-8">
          <Card className="border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Track Income & Expenses</h3>
                  <p className="text-sm text-gray-600">Monitor your money flow in real-time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Detailed Reports</h3>
                  <p className="text-sm text-gray-600">Analyze spending patterns and trends</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure & Private</h3>
                  <p className="text-sm text-gray-600">Your financial data is protected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Link href="/login">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white p-4 h-auto rounded-xl font-semibold text-lg touch-button group">
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}