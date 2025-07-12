import React, { useState } from 'react';
import { 
  Download, 
  Play, 
  Shield, 
  Zap, 
  Heart, 
  CheckCircle, 
  Copy, 
  Share2,
  Smartphone,
  Monitor,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Clock,
  Globe,
  Sparkles,
  Award,
  Lock
} from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleDownload = () => {
    if (!url) return;
    setIsDownloading(true);
    // Simulate download process
    setTimeout(() => {
      setIsDownloading(false);
      // Reset URL after successful download
      setUrl('');
    }, 3000);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Speed",
      description: "Download any TikTok video in under 5 seconds with our blazing-fast servers"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Level Security",
      description: "Military-grade encryption protects your privacy. Zero data collection, guaranteed"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Crystal Clear Quality",
      description: "Get pristine HD videos without ugly watermarks ruining your content"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Universal Access",
      description: "Works flawlessly on every device - iPhone, Android, laptop, or tablet"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Grab That Link",
      description: "Found an amazing TikTok? Tap the share button and copy the link - it takes 2 seconds",
      icon: <Copy className="w-6 h-6" />
    },
    {
      number: "02", 
      title: "Drop It Here",
      description: "Paste your copied link into our magic box above and watch the magic happen",
      icon: <Share2 className="w-6 h-6" />
    },
    {
      number: "03",
      title: "Boom! Downloaded", 
      description: "Hit download and get your watermark-free video in stunning HD quality instantly",
      icon: <Download className="w-6 h-6" />
    }
  ];

  const faqs = [
    {
      question: "Is TikViddl really 100% free forever?",
      answer: "Absolutely! We believe great tools should be accessible to everyone. No hidden fees, no premium tiers, no BS. Download unlimited videos completely free, always."
    },
    {
      question: "Do I need to download sketchy software?",
      answer: "Never! TikViddl runs entirely in your browser. No downloads, no installations, no malware risks. Just pure, clean downloading power at your fingertips."
    },
    {
      question: "Will my videos have those annoying watermarks?",
      answer: "Not a chance! Every video you download through TikViddl comes completely clean - no watermarks, no logos, just pure content ready for whatever you need."
    },
    {
      question: "What's the video quality like?",
      answer: "We deliver the absolute best quality available - typically crystal-clear HD (720p) or even higher, depending on the original video. No compression, no quality loss."
    },
    {
      question: "Is downloading TikTok videos actually legal?",
      answer: "For personal use? Generally yes! Just remember to respect creators' rights and don't redistribute content without permission. When in doubt, ask the creator first."
    },
    {
      question: "How crazy fast are we talking here?",
      answer: "Most downloads complete in 3-8 seconds flat. Our servers are optimized for speed, so you'll spend more time watching than waiting."
    },
    {
      question: "Do you spy on my downloads or store my videos?",
      answer: "Absolutely not! We process everything in real-time and deliver directly to you. Zero storage, zero tracking, zero invasion of your privacy."
    },
    {
      question: "Can I download private or restricted videos?",
      answer: "Nope - we can only access publicly available content. Private videos stay private, and we respect creators' privacy settings completely."
    }
  ];

  const stats = [
    { value: "50M+", label: "Videos Downloaded" },
    { value: "2M+", label: "Happy Users" },
    { value: "99.9%", label: "Success Rate" },
    { value: "<5s", label: "Avg Download Time" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                TikViddl
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">Features</a>
              <a href="#tutorial" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">Tutorial</a>
              <a href="#faq" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">FAQ</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-teal-950/20 to-slate-950/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.1),transparent_50%)]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-sm">
            <Award className="w-4 h-4 text-emerald-400 mr-2" />
            <span className="text-emerald-300 text-sm font-semibold">World's #1 TikTok Downloader</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Download TikToks
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Like a Boss
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            The fastest, cleanest, and most reliable way to save TikTok videos. 
            <span className="text-emerald-400 font-semibold"> No watermarks, no BS, just pure video magic.</span>
          </p>

          {/* Download Form */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-emerald-500/5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your TikTok link here and watch the magic happen..."
                    className="w-full px-6 py-4 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  disabled={!url || isDownloading}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Working Magic...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Now
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center mt-6 space-x-6 text-sm">
                <div className="flex items-center text-emerald-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Always Free</span>
                </div>
                <div className="flex items-center text-emerald-400">
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="font-semibold">100% Secure</span>
                </div>
                <div className="flex items-center text-emerald-400">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="font-semibold">No Watermarks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Why TikViddl <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Dominates</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
              We didn't just build another downloader - we crafted the ultimate TikTok saving experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 h-full hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:from-emerald-500/30 group-hover:via-teal-500/30 group-hover:to-cyan-500/30 transition-all group-hover:scale-110">
                    <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed font-medium">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section id="tutorial" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Master TikViddl in <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">30 Seconds</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
              Three ridiculously simple steps to TikTok downloading mastery
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-110 transition-all">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 group-hover:bg-slate-800/50 group-hover:border-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-emerald-500/30 transition-all">
                        <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                          {step.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold group-hover:text-emerald-400 transition-colors">{step.title}</h3>
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed font-medium">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Got <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Questions?</span>
            </h2>
            <p className="text-xl text-slate-300 font-medium">
              We've got all the answers you need (and probably some you didn't know you wanted)
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden hover:border-emerald-500/30 transition-all">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-slate-800/60 transition-all focus:outline-none focus:bg-slate-800/60 group"
                >
                  <span className="text-lg font-bold pr-8 group-hover:text-emerald-400 transition-colors">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-6 h-6 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-8 pb-6">
                    <div className="border-t border-slate-700/50 pt-6">
                      <p className="text-slate-300 leading-relaxed font-medium text-lg">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Play className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                TikViddl
              </span>
            </div>
            <div className="flex items-center space-x-6 text-slate-400">
              <span className="font-medium">© 2024 TikViddl. Crafted with ❤️</span>
              <a href="#" className="hover:text-emerald-400 transition-colors font-medium">Privacy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors font-medium">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;