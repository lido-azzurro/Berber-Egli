import { useState } from 'react';
import { Calendar, Clock, Scissors, MapPin, Phone, Instagram, ArrowRight, Star, UserRound } from 'lucide-react';

const galleryImages = [
  'https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13138585/pexels-photo-13138585.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7518732/pexels-photo-7518732.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/3998408/pexels-photo-3998408.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/18503633/pexels-photo-18503633.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33448216/pexels-photo-33448216.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

type Props = {
  onReservo: () => void;
  onAdminClick: () => void;
  onAccount: () => void;
  accountLabel: string;
};

export default function HomePage({ onReservo, onAdminClick, onAccount, accountLabel }: Props) {
  const [hoveredImg, setHoveredImg] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-5">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/7518736/pexels-photo-7518736.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600"
            alt="Barber shop"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/85 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 to-transparent" />
        </div>

        {/* Top bar */}
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gold" />
            <span className="text-xs font-medium tracking-[0.3em] text-neutral-400">EST. 2018</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onAccount} className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-neutral-400 hover:text-gold transition-colors uppercase">
              <UserRound className="w-4 h-4" /> {accountLabel}
            </button>
            <button onClick={onAdminClick} className="text-xs font-medium tracking-wider text-neutral-500 hover:text-gold transition-colors uppercase">Admin</button>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl animate-fade-in-up">
          <div className="flex items-center gap-1 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
            ))}
            <span className="ml-2 text-xs text-neutral-400 tracking-wider">QINDRA KLIENTË TË KËNAQUR</span>
          </div>

          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl leading-[0.9] text-white mb-3">
            BERBER
          </h1>
          <h1 className="font-display text-7xl sm:text-8xl md:text-9xl leading-[0.9] gold-gradient-text mb-6">
            EGLI
          </h1>

          <p className="text-neutral-300 text-base sm:text-lg max-w-md mb-5 leading-relaxed">
            Qethje Profesionale, mjedis modern dhe përvojë premium. Rezervo takimin tënd në pak sekonda.
          </p>
          <p className="text-red-400 text-xs font-medium tracking-wide mb-8">Njoftim: E Mërkura është ditë pushimi</p>

          <button
            onClick={onReservo}
            className="group relative inline-flex items-center gap-3 bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 gold-glow hover:gold-glow-strong active:scale-95"
          >
            <Calendar className="w-5 h-5" />
            <span className="tracking-wide">REZERVO</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-5 text-xs text-neutral-500 tracking-wide">Pa llogari · Konfirmim i menjëhershëm</p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-pulse">
          <span className="text-[10px] tracking-[0.3em] text-neutral-600 uppercase">Më shumë</span>
          <div className="w-px h-8 bg-gradient-to-b from-neutral-600 to-transparent" />
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-5 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Shërbimet</p>
            <h2 className="font-display text-4xl sm:text-5xl text-white">Çfarë ofrojmë</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Scissors, title: 'Qethje', desc: 'Qethje moderne dhe klasike sipas stilit tuaj', price: '400 ALL' },
              { icon: Scissors, title: 'Rruajtje', desc: 'Rruajtje tradicionale me përkujdesje', price: '300 ALL' },
              { icon: Scissors, title: 'Rruajtje Makinë', desc: 'Rregullim i shpejtë dhe i pastër', price: '100 ALL' },
              { icon: Scissors, title: 'Lyerje Mjekre', desc: 'Ngjyrë dhe formësim profesional', price: '300 ALL' },
              { icon: Scissors, title: 'Larje Koke', desc: 'Larje e freskët para ose pas qethjes', price: '100 ALL' },
              { icon: Star, title: 'Trajtim me Avull', desc: 'Trajtim relaksues dhe pastrues', price: '1000 ALL' },
              { icon: Star, title: 'Black Mask', desc: 'Maskë pastruese për fytyrën', price: '300 ALL' },
              { icon: Star, title: 'Scrub Mask', desc: 'Eksfolim i butë për lëkurën', price: '200 ALL' },
              { icon: Star, title: 'Mask Dylli', desc: 'Trajtim i butë dhe hidratues', price: '200 ALL' },
            ].map((s, i) => (
              <div
                key={i}
                className="group relative bg-[#141414] border border-[#2a2a2a] rounded-2xl p-7 hover:border-[#d4af37]/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-5 group-hover:bg-[#d4af37]/20 transition-colors">
                  <s.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title.trim()}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-4">{s.desc}</p>
                <p className="text-gold font-display text-2xl tracking-wide">{s.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery placeholder */}
      <section className="py-20 px-5 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Galeria</p>
            <h2 className="font-display text-4xl sm:text-5xl text-white">Punët tona</h2>
            <p className="text-neutral-500 text-sm mt-3">Një pasqyrë e stileve dhe teknikave tona</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl bg-[#141414] border border-[#2a2a2a] ${
                  i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-square'
                }`}
                onMouseEnter={() => setHoveredImg(i)}
                onMouseLeave={() => setHoveredImg(null)}
              >
                <img
                  src={img}
                  alt={`Punim ${i + 1}`}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    hoveredImg === i ? 'scale-110' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Working hours + contact */}
      <section className="py-20 px-5 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Hours */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-gold" />
                <h3 className="font-display text-2xl text-white tracking-wide">ORARI</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-[#2a2a2a]">
                  <span className="text-neutral-400">Mëngjes</span>
                  <span className="text-white font-medium">09:00 — 15:00</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-[#2a2a2a]">
                  <span className="text-neutral-500">Pushim</span>
                  <span className="text-neutral-500">15:00 — 17:30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Mbrëmje</span>
                  <span className="text-white font-medium">17:30 — 22:00</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-gold" />
                <h3 className="font-display text-2xl text-white tracking-wide">KONTAKT</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-neutral-300">
                  <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>Rruga Fan Noli, Pogradec</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-300">
                  <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>+355 69 536 7019</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-300">
                  <Instagram className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>@berber.egli</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA bottom */}
          <div className="mt-10 text-center">
            <button
              onClick={onReservo}
              className="inline-flex items-center gap-3 bg-[#d4af37] hover:bg-[#e8c656] text-black font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 gold-glow active:scale-95"
            >
              <Calendar className="w-5 h-5" />
              <span className="tracking-wide">REZERVO TANI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold" />
            <span className="font-display text-xl text-white tracking-wider">BERBER EGLI</span>
          </div>
          <p className="text-xs text-neutral-600">© 2026 Berber Egli. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </footer>
    </div>
  );
}
