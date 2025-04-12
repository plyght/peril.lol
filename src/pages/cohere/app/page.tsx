import type { Metadata } from 'next';
import localFont from 'next/font/local';

const fliegeMono = localFont({
  src: './FliegeMonoVF.woff2',
  display: 'swap',
  variable: '--font-fliege-mono',
});

export const metadata: Metadata = {
  title: 'Cohere CLI',
  description: 'A powerful command-line interface for Cohere AI services',
};

export default function Home() {
  return (
    <main
      className={`${fliegeMono.variable} font-fliege-mono min-h-screen bg-[#1E1E1E] text-[#E0E0E0] flex justify-center items-center p-4`}
    >
      <div className="w-full max-w-3xl bg-white/5 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(176,136,255,0.2)]">
        <div className="bg-white/10 p-2 flex">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-50 mr-1.5"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-50 mr-1.5"></div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-50"></div>
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#B088FF] to-[#FF7B7B] text-transparent bg-clip-text">
            Cohere CLI
          </h1>
          <p className="mb-4">Welcome to Cohere CLI, your gateway to AI-powered interactions.</p>

          <div className="text-[#4AF626] mb-2">$ cohere --help</div>
          <div className="mb-4">
            <p>Available commands:</p>
            <ul className="list-none pl-4">
              <li className="before:content-['>'] before:text-[#B088FF] before:mr-2">
                /web &lt;query&gt; - Perform a web search
              </li>
              <li className="before:content-['>'] before:text-[#B088FF] before:mr-2">
                /chat - Start an AI conversation
              </li>
              <li className="before:content-['>'] before:text-[#B088FF] before:mr-2">
                /clear - Clear the terminal
              </li>
              <li className="before:content-['>'] before:text-[#B088FF] before:mr-2">
                :q - Quit the current session
              </li>
            </ul>
          </div>

          <div className="text-[#4AF626] mb-2">$ cohere /web "latest AI trends"</div>
          <div className="mb-4">
            Searching for latest AI trends...
            <br />
            1. Large Language Models (LLMs)
            <br />
            2. Multimodal AI
            <br />
            3. AI-assisted coding
            <br />
            4. Ethical AI and bias mitigation
          </div>

          <div className="text-[#4AF626] mb-2">$ cohere /chat</div>
          <div className="mb-4">
            AI: Hello! I'm your Cohere AI assistant. How can I help you today?
          </div>

          <div className="text-[#4AF626] flex items-center">
            $ <span className="w-2 h-4 bg-[#4AF626] ml-1 animate-blink"></span>
          </div>

          <div className="mt-4 bg-white/10 p-3 rounded overflow-x-auto whitespace-nowrap">
            <code>curl -sL https://cohere.ai/cli | bash</code>
          </div>
        </div>
      </div>
    </main>
  );
}
