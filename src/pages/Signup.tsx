import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup button clicked");
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting signup for:", email);
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: fullName
          }
        }
      });
      
      console.log("Supabase Auth Response:", { data, error: signUpError });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        console.log("Inserting user for auth id:", data.user.id);
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ id: data.user.id, email, name: fullName, role: 'user' }]);
        
        if (insertError) {
          console.error("User insertion error:", insertError);
          setError(insertError.message);
          return;
        }
      }
      
      toast.success('Account created! Please check your email for verification.');
      navigate('/login');
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || 'An error occurred during signup');
      toast.error(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4 relative z-10">
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription>
            Join Vexokart for a smarter shopping experience
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
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input 
                placeholder="John Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white"
              />
            </div>
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
                <UserPlus className="mr-2 h-5 w-5" />
              )}
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <div className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
