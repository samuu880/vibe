import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Mic, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { BeRealDrop } from './BeRealDrop';
import { VoiceRecorder } from './VoiceRecorder';
import { useVibe } from '../context/VibeContext';
import { moderateText, moderateImage } from '../lib/moderation';

interface CreateVibeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVibeModal: React.FC<CreateVibeModalProps> = ({ isOpen, onClose }) => {
  const { createVibe } = useVibe();
  const [tab, setTab] = useState<'bereal' | 'photo' | 'audio'>('bereal');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('aesthetic, vibes');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // For audio tab
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number; waveform: number[] } | null>(null);

  const samplePhotoPresets = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishPhoto = async () => {
    if (!photoUrl) {
      setErrorMsg('select an image for your vibe');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    // AI Text & Image Moderation
    const textMod = moderateText(caption);
    if (textMod.isBlocked) {
      setErrorMsg(`blocked by ai moderation: ${textMod.reason}`);
      setIsSubmitting(false);
      return;
    }

    const imgMod = await moderateImage(photoUrl);
    if (imgMod.isBlocked) {
      setErrorMsg(`blocked by computer vision: ${imgMod.reason}`);
      setIsSubmitting(false);
      return;
    }

    const tagList = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const res = await createVibe({
      type: 'post',
      media_url: photoUrl,
      caption,
      tags: tagList,
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'failed to publish vibe');
    }
  };

  const handlePublishAudio = async () => {
    if (!recordedAudio) {
      setErrorMsg('record a voice note first');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    const textMod = moderateText(caption);
    if (textMod.isBlocked) {
      setErrorMsg(`blocked by ai moderation: ${textMod.reason}`);
      setIsSubmitting(false);
      return;
    }

    const tagList = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const res = await createVibe({
      type: 'audio',
      audio_url: recordedAudio.url,
      audio_duration: recordedAudio.duration,
      audio_waveform: recordedAudio.waveform,
      caption: caption || 'voice note 🎙️',
      tags: tagList,
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'failed to post voice vibe');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="w-full max-w-lg rounded-3xl glass-modal border border-white/[0.1] shadow-2xl p-5 sm:p-6 text-left relative my-8"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-syne font-bold text-lg text-white lowercase">
                drop a vibe
              </h3>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-2xl bg-white/[0.04] p-1 border border-white/[0.08] mb-5">
              <button
                onClick={() => setTab('bereal')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold lowercase flex items-center justify-center gap-1.5 transition-all ${
                  tab === 'bereal'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>bereal drop</span>
              </button>

              <button
                onClick={() => setTab('photo')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold lowercase flex items-center justify-center gap-1.5 transition-all ${
                  tab === 'photo'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>aesthetic photo</span>
              </button>

              <button
                onClick={() => setTab('audio')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold lowercase flex items-center justify-center gap-1.5 transition-all ${
                  tab === 'audio'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>voice note</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300 lowercase">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mode 1: BeReal Drop */}
            {tab === 'bereal' && (
              <BeRealDrop onClose={onClose} />
            )}

            {/* Mode 2: Photo Vibe */}
            {tab === 'photo' && (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-white/[0.08] flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 text-zinc-500">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs lowercase text-zinc-400">upload a photo or pick an aesthetic preset</p>
                    </div>
                  )}

                  <label className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs text-white cursor-pointer hover:bg-black/90 transition-all flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>choose file</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                {/* Aesthetic presets */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 lowercase">presets:</span>
                  {samplePhotoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPhotoUrl(preset)}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-purple-400 transition-all"
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="write a caption (ai-moderated)..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white lowercase"
                />

                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="tags (comma separated, e.g. vibe, night, art)"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white lowercase"
                />

                <button
                  onClick={handlePublishPhoto}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'screening with ai...' : 'publish photo (+100 aura)'}</span>
                </button>
              </div>
            )}

            {/* Mode 3: Voice Vibe */}
            {tab === 'audio' && (
              <div className="space-y-4">
                <VoiceRecorder
                  onRecorded={(url, duration, waveform) => {
                    setRecordedAudio({ url, duration, waveform });
                  }}
                />

                <input
                  type="text"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="caption for this voice vibe..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white lowercase"
                />

                <button
                  onClick={handlePublishAudio}
                  disabled={isSubmitting || !recordedAudio}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'verifying...' : 'drop voice note (+250 aura)'}</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
