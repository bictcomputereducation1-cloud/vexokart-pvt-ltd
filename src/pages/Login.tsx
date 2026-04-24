import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login button clicked");
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login for:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log("Supabase Auth Response:", { data, error: signInError });
      
      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          const customError = "Your email is not confirmed. Please check your inbox for the verification link or disable 'Confirm Email' in Supabase settings.";
          setError(customError);
          toast.error("Email verification required");
          return;
        }
        if (signInError.message.includes("Invalid login credentials")) {
          const customError = "Invalid email or password. If you don't have an account, please sign up first.";
          setError(customError);
          toast.error("Invalid credentials");
          return;
        }
        throw signInError;
      }
      
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4 relative z-10">
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="relative z-20">
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
