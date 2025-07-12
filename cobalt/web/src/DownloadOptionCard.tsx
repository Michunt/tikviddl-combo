import React, { ReactNode } from 'react';

interface DownloadOptionCardProps {
  key: string;
  url: string;
  title: string;
  desc: string;
  icon: ReactNode;
  onDownload?: () => void;
}

const DownloadOptionCard: React.FC<DownloadOptionCardProps> = ({
  url,
  title,
  desc,
  icon,
  onDownload
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = url;
      // Add appropriate file extension based on download type
      const isAudio = title.toLowerCase().includes('audio');
      const extension = isAudio ? '.mp3' : '.mp4';
      const filename = title.toLowerCase().replace(/\s+/g, '_') + extension;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all duration-300 group cursor-pointer"
         onClick={handleDownload}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:from-emerald-500/30 group-hover:via-teal-500/30 group-hover:to-cyan-500/30 transition-all">
          <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
            {icon}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-emerald-400 text-sm font-semibold">Click to download</div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
        {title}
      </h3>
      
      <p className="text-slate-300 text-sm leading-relaxed">
        {desc}
      </p>
      
      <div className="mt-4 pt-4 border-t border-slate-700/50 group-hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
            Ready to download
          </span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-colors"></div>
        </div>
      </div>
    </div>
  );
};

export default DownloadOptionCard;
