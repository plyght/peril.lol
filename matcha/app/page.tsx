"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap';
    font.rel = 'stylesheet';
    document.head.appendChild(font);
  }, []);

  return (
    <div className="min-h-screen bg-[#2e322d] text-[#e1ddcf]" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <header className="p-6 bg-[#3a3f35]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image 
              src="/matcha-logo.svg" 
              alt="Matcha Logo" 
              width={32} 
              height={32} 
              className="rounded-sm"
            />
            <span className="text-xl font-medium">Matcha</span>
          </div>
          <nav>
            <ul className="flex gap-6">
              <li><Link href="#" className="hover:text-[#97b572] transition-colors">Home</Link></li>
              <li><Link href="#" className="hover:text-[#97b572] transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-[#97b572] transition-colors">Download</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        <section className="py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#f4f2e7]">Matcha</h1>
          <p className="text-xl md:text-2xl mb-8">An earthy, minimal Ghostty theme with soft pastel vibes 🍵</p>
          <Link 
            href="#" 
            className="inline-block bg-[#678d73] text-[#f4f2e7] px-6 py-3 rounded-sm hover:bg-[#87a491] transition-colors"
          >
            Get Matcha
          </Link>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold mb-12 text-[#c3b37c]">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#3a3f35] p-6 rounded-sm">
              <h3 className="text-xl font-bold mb-4 text-[#c3b37c]">Earthy Tones</h3>
              <p>Soothing colors inspired by nature and matcha tea.</p>
            </div>
            <div className="bg-[#3a3f35] p-6 rounded-sm">
              <h3 className="text-xl font-bold mb-4 text-[#c3b37c]">Minimal Design</h3>
              <p>Clean and distraction-free interface for focused work.</p>
            </div>
            <div className="bg-[#3a3f35] p-6 rounded-sm">
              <h3 className="text-xl font-bold mb-4 text-[#c3b37c]">Pastel Accents</h3>
              <p>Soft, pleasing highlights for a touch of color.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 py-6 bg-[#3a3f35] text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} Matcha Theme. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
