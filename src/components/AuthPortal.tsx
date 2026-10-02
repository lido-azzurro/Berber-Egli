import { useState } from 'react';
import { ArrowLeft, Lock, Mail, Phone, User, Loader2, Scissors, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Props = { onBack: () => void; initialMode?: 'signin' | 'signup' };
type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPortal({ onBack, initialMode = 'signin' }: Props) {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
      else setMessage('Hyrja u krye me sukses.');
    } else if (mode === 'signup') {
      if (!fullName.trim() || !phone.trim()) setError('Emri dhe numri i telefonit janë të detyrueshëm.');
      else {
        const result = await signUp({ email, password, fullName, phone });
        if (result.error) setError(result.error);
        else setMessage('Llogaria u krijua me sukses.');
      }
    } else {
      const result = await sendPasswordReset(email);
      if (result.error) setError(result.error);
      else setMessage('Nëse emaili është i regjistruar, do të merrni një lidhje rikuperimi.');
    }
    setLoading(false);
  };

  const title = mode === 'signup' ? 'KRIJO LLOGARI' : mode === 'forgot' ? 'RIVENDOS FJALËKALIMIN' : 'HYR NË LLOGARI';
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 py-8">
      <button onClick={onBack} className="absolute top-6 left-5 flex items-center gap-1 text-sm text-neutral-500 hover:text-white"><ArrowLeft className="w-4 h-4" />Kthehu</button>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8"><div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center mb-4"><Scissors className="w-8 h-8 text-gold" /></div><h1 className="font-display text-3xl text-white tracking-wide">BERBER EGLI</h1><p className="text-xs text-neutral-500 tracking-[0.25em] uppercase mt-2">{title}</p></div>
        <form onSubmit={submit} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
          {mode === 'signup' && <><Field icon={<User className="w-4 h-4 text-gold" />} label="Emër Mbiemër"><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Emri dhe mbiemri" required className={inputClass} /></Field><Field icon={<Phone className="w-4 h-4 text-gold" />} label="Numër Telefoni"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+355 6X XXX XXXX" required className={inputClass} /></Field></>}
          <Field icon={<Mail className="w-4 h-4 text-gold" />} label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@shembull.com" required className={inputClass} /></Field>
          {mode !== 'forgot' && <Field icon={<Lock className="w-4 h-4 text-gold" />} label="Fjalëkalimi"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Të paktën 10 karaktere" minLength={10} required className={inputClass} /><p className="text-[11px] text-neutral-500 mt-2">Përdorni shkronja të mëdha e të vogla, numër dhe simbol. Mos përdorni fjalëkalim të përdorur më parë.</p></Field>}
          {message && <div className="flex gap-2 text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{message}</div>}
          {error && <div className="flex gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <button disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signup' ? 'KRIJO LLOGARI' : mode === 'forgot' ? 'DËRGO LIDHJEN' : 'HYR'}</button>
          <div className="text-center space-y-2 pt-1">{mode === 'signin' && <><button type="button" onClick={() => setMode('forgot')} className="text-xs text-gold hover:underline">Ke harruar fjalëkalimin?</button><p className="text-xs text-neutral-500">Nuk ke llogari? <button type="button" onClick={() => setMode('signup')} className="text-white hover:text-gold">Regjistrohu</button></p></>}{mode === 'signup' && <p className="text-xs text-neutral-500">Ke llogari? <button type="button" onClick={() => setMode('signin')} className="text-white hover:text-gold">Hyr</button></p>}{mode === 'forgot' && <button type="button" onClick={() => setMode('signin')} className="text-xs text-neutral-400 hover:text-white">Kthehu te hyrja</button>}</div>
        </form>
      </div>
    </div>
  );
}

const inputClass = 'w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#d4af37] focus:outline-none';
function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) { return <div><label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">{icon}{label}</label>{children}</div>; }
