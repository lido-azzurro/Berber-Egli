import { useState } from 'react';
import { Scissors, Lock, Mail, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Props = {
  onBack: () => void;
};

export default function AdminLogin({ onBack }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError('Email ose fjalëkalim e pasaktë.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5">
      <button
        onClick={onBack}
        className="absolute top-6 left-5 flex items-center gap-1 text-sm text-neutral-500 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Kreu
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center mb-4">
            <Scissors className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl text-white tracking-wide">BERBER EGLI</h1>
          <p className="text-xs text-neutral-500 tracking-[0.3em] uppercase mt-2">Hyrje Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Mail className="w-4 h-4 text-gold" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="berberegli@gmail.com"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Lock className="w-4 h-4 text-gold" />
              Fjalëkalimi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none transition-colors"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold py-3.5 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Duke hyrë...
              </>
            ) : (
              'HYR'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
