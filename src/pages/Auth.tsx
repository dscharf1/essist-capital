import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { z } from 'zod';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, signInWithGoogle, isLoading } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user && !isLoading) navigate(from, { replace: true });
  }, [user, isLoading, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: err.errors[0].message, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
    }
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      toast({ title: error.message.includes('Invalid login') ? 'Invalid email or password.' : error.message, variant: 'destructive' });
    } else {
      navigate(from, { replace: true });
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: err.errors[0].message, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
    }
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    const { error } = await signUp(signupEmail, signupPassword, { first_name: firstName, last_name: lastName });
    if (error) {
      toast({ title: error.message.includes('already registered') ? 'An account with this email already exists.' : error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Welcome to Essist Capital.' });
      navigate(from, { replace: true });
    }
    setIsSubmitting(false);
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      setIsGoogleLoading(false);
    }
    // on success Supabase redirects — no need to navigate
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1f1e' }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#0d9488' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1f1e' }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 20% 100%,rgba(13,148,136,0.15) 0%,transparent 65%)',
      }} />

      {/* Back link */}
      <header className="relative z-10 p-5">
        <Link to="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
      </header>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/"><Logo size="sm" light={true} /></Link>
          </div>

          {/* Panel */}
          <div className="rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl mb-6"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              {(['login', 'signup'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    tab === t ? 'text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {t === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Login */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-white/50 text-xs">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input type="email" placeholder="you@example.com" value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)} required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input type="password" placeholder="••••••••" value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)} required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-[#0d1f1e] text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)' }}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-white/25 text-xs">or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <button type="button" onClick={handleGoogle} disabled={isGoogleLoading}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                  {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>
              </form>
            )}

            {/* Sign Up */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/50 text-xs">First Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/50 text-xs">Last Name</Label>
                    <Input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input type="email" placeholder="you@example.com" value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)} required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input type="password" placeholder="••••••••" value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)} required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <Input type="password" placeholder="••••••••" value={signupConfirmPassword}
                      onChange={e => setSignupConfirmPassword(e.target.value)} required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-[#0d1f1e] text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)' }}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-white/25 text-xs">or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <button type="button" onClick={handleGoogle} disabled={isGoogleLoading}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                  {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            By continuing you agree to our{' '}
            <Link to="/terms" className="underline hover:text-white/40 transition-colors">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-white/40 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
