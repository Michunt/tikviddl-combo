import React, { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import DownloadOptionCard from './DownloadOptionCard';
import Spinner from './Spinner';
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
  Lock,
  Music,
  Video,
  Image,
  Settings,
  X,
  ExternalLink,
  Clipboard
} from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:9000';

// Types
type DownloadOption = { key: 'auto'|'audio'|'hd'; url: string; title: string; desc: string; icon: ReactNode };

interface DownloadOptions {
  downloadMode: 'auto' | 'audio' | 'hd';
  videoQuality: 'max' | '4320' | '2160' | '1440' | '1080' | '720' | '480' | '360' | '240' | '144';
  audioFormat: 'best' | 'mp3' | 'ogg' | 'wav' | 'opus';
  audioBitrate: '320' | '256' | '128' | '96' | '64' | '8';
  tiktokFullAudio: boolean;
}

interface ApiResponse {
  status: 'stream' | 'tunnel' | 'success' | 'redirect' | 'picker' | 'error';
  url?: string;
  urls?: string | string[];
  filename?: string;
  picker?: Array<{
    type: 'photo' | 'video';
    url: string;
    thumb?: string;
  }>;
  audio?: string | { url: string; mime: string };
  auto?: { url: string; mime: string };
  hd?: { url: string; mime: string };
  error?: {
    code: string;
    context?: any;
  };
}

function App() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  // Removed showOptions state since we're skipping the options step
  const [downloadResult, setDownloadResult] = useState<ApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadOptions, setDownloadOptions] = useState<DownloadOption[]>([]);
  
  // Remove auto-show options since we're skipping the options step
  
  // Download options state
  const [options, setOptions] = useState<DownloadOptions>({
    downloadMode: 'auto',
    videoQuality: '1080',
    audioFormat: 'mp3',
    audioBitrate: '128',
    tiktokFullAudio: false
  });

  const handleDownload = async (mode?: 'auto' | 'audio' | 'hd') => {
    if (!url) return;
    
    // Validate TikTok URL before proceeding
    const isTikTokUrl = url.includes('tiktok.com') || url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com') || url.includes('tiktok.com/t/');
    
    if (!isTikTokUrl) {
      setErrorMessage(t('errors.invalidUrl'));
      return;
    }
    
    setIsDownloading(true);
    setErrorMessage('');
    setDownloadResult(null);
    
    try {
      const requestBody = {
        url: url,
        downloadMode: mode || options.downloadMode,
        videoQuality: options.videoQuality,
        audioFormat: options.audioFormat,
        audioBitrate: options.audioBitrate,
        tiktokFullAudio: options.tiktokFullAudio
      };
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (result.status === 'error') {
        setErrorMessage(result.error?.code || 'Unknown error occurred');
      } else {
        setDownloadResult(result);
        

        // Always provide the three standard download options
        const options: DownloadOption[] = [];
        
        // 1. Auto Video option
        const autoUrl = result.auto?.url || result.url;
        if (autoUrl) {
          options.push({ key: 'auto', url: autoUrl, title: 'Auto Video', desc: 'Standard quality without watermark', icon: <span className="text-2xl">🎬</span> });
        }
        
        // 2. HD No Watermark option  
        const hdUrl = result.hd?.url || result.url;
        if (hdUrl) {
          options.push({ key: 'hd', url: hdUrl, title: 'HD No Watermark', desc: 'Highest resolution, no watermark', icon: <span className="text-2xl">📺</span> });
        }
        
        // 3. Audio Only option - always available
        options.push({ 
          key: 'audio', 
          url: 'audio-request', // Special marker for audio downloads
          title: 'Audio Only', 
          desc: 'Extract audio as MP3', 
          icon: <span className="text-2xl">🎵</span>
        });
        setDownloadOptions(options);
      }
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage('Failed to connect to download service. Make sure the API is running on port 9000.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleDownloadWithMode = (mode: 'auto' | 'audio' | 'hd') => {
    handleDownload(mode);
  };
  
const downloadFile = (downloadUrl: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const resetDownload = () => {
    setDownloadResult(null);
    setErrorMessage('');
    setUrl('');
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
            <div className="flex items-center space-x-6">
              <a href="#" className="flex items-center space-x-3 hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  TikViddl
                </h1>
              </a>
              <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Award className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                <span className="text-emerald-300 text-xs font-semibold">World's #1 TikTok Downloader</span>
              </div>
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
        
        <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Banner */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Download TikToks
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Like a Boss
              </span>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed font-medium">
              The fastest, cleanest, and most reliable way to save TikTok videos. 
              <span className="text-emerald-400 font-semibold"> No watermarks, no BS, just pure video magic.</span>
            </p>
          </div>

          {/* Download Form */}
          <div className="max-w-full mx-auto mb-16 px-4">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-emerald-500/5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 sm:flex-[3] relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your TikTok link here and watch the magic happen..."
                    className="w-full px-6 py-4 pr-12 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
                  />
                  {url && (
                    <button
                      onClick={() => setUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                      title="Clear URL"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-3 sm:w-auto w-full">
                  <button
                    onClick={() => navigator.clipboard.readText().then(clipText => setUrl(clipText))}
                    className="px-4 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-2xl text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownload()}
                    disabled={!url || isDownloading}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex-shrink-0 min-w-fit backdrop-blur-sm"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        <span className="hidden sm:inline">Processing...</span>
                        <span className="sm:hidden">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Download</span>
                        <span className="sm:hidden">Download Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Download options removed - using default settings */}
              
              {/* Error Message */}
              {errorMessage && (
                <div className="mt-6 bg-red-900/40 border border-red-500/50 rounded-2xl p-4">
                  <div className="flex items-center">
                    <X className="w-5 h-5 text-red-400 mr-3" />
                    <span className="text-red-300 font-medium">{errorMessage}</span>
                  </div>
                </div>
              )}
              
              {/* Download Result */}
              {downloadResult && (
                <div className="mt-6 bg-emerald-900/40 border border-emerald-500/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-emerald-300 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Download Ready!
                    </h3>
                    <button
                      onClick={resetDownload}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {downloadResult.status === 'picker' && downloadResult.picker ? (
                    <div>
                      <p className="text-emerald-200 mb-4">Multiple files available. Choose what to download:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {downloadResult.picker.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => downloadFile(item.url, `image_${index + 1}.jpg`)}
                            className="relative bg-slate-800/60 rounded-lg border border-slate-600/50 p-3 hover:border-emerald-500/50 transition-all group"
                          >
                            <div className="aspect-square bg-slate-700/50 rounded-lg mb-2 flex items-center justify-center">
                              {item.type === 'photo' ? (
                                <Image className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                              ) : (
                                <Video className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                              )}
                            </div>
                            <p className="text-xs text-slate-300 group-hover:text-emerald-300 transition-colors">
                              {item.type === 'photo' ? 'Image' : 'Video'} {index + 1}
                            </p>
                          </button>
                        ))}
                      </div>
                      {downloadResult.audio && (
                        <button
                          onClick={() => downloadFile(downloadResult.audio!, 'audio.mp3')}
                          className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 rounded-lg p-3 flex items-center justify-center transition-all"
                        >
                          <Music className="w-5 h-5 mr-2 text-emerald-400" />
                          <span className="text-emerald-300 font-medium">Download Audio</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Download Options Cards */}
                      {downloadOptions.length > 0 ? (
                        <div className="mb-6">
                          <p className="text-emerald-200 mb-4">Choose your download option:</p>
                          {isDownloading ? <Spinner className="mb-4" caption="Processing… fetching available formats" /> : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {downloadOptions.map(o => (
                                <DownloadOptionCard 
                                  key={o.key} 
                                  {...o} 
                                  onDownload={() => {
                                    if (o.key === 'audio') {
                                      handleDownloadWithMode('audio');
                                    } else if (o.key === 'hd') {
                                      handleDownloadWithMode('hd');
                                    } else {
                                      const filename = downloadResult.filename || 'video.mp4';
                                      downloadFile(o.url, filename);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                      
                      {/* Download Another Video Button */}
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={resetDownload}
                          className="px-6 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-emerald-500/50 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2 font-medium"
                        >
                          <X className="w-4 h-4" />
                          Download Another Video
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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