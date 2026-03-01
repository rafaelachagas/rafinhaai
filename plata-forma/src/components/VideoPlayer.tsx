'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, RotateCcw, RotateCw, SkipForward, SkipBack } from 'lucide-react';

interface VideoPlayerProps {
    videoUrl: string;
    initialPosition?: number;
    onProgress?: (seconds: number) => void;
    onComplete?: () => void;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export default function VideoPlayer({ videoUrl, initialPosition = 0, onProgress, onComplete }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isYouTube, setIsYouTube] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Detect provider
    useEffect(() => {
        setIsYouTube(videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
    }, [videoUrl]);

    // YouTube API Setup
    useEffect(() => {
        if (!isYouTube) return;

        const loadYT = () => {
            if (window.YT && window.YT.Player) {
                initYTPlayer();
            } else {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
                window.onYouTubeIframeAPIReady = initYTPlayer;
            }
        };

        const initYTPlayer = () => {
            const videoId = extractYTId(videoUrl);
            playerRef.current = new window.YT.Player('yt-player', {
                videoId,
                playerVars: {
                    controls: 0,
                    disablekb: 1,
                    modestbranding: 1,
                    rel: 0,
                    start: Math.floor(initialPosition)
                },
                events: {
                    onReady: (event: any) => {
                        setDuration(event.target.getDuration());
                        if (initialPosition > 0) event.target.seekTo(initialPosition);
                    },
                    onStateChange: (event: any) => {
                        // 1 = playing, 2 = paused
                        setIsPlaying(event.data === 1);
                        if (event.data === 0 && onComplete) onComplete();
                    }
                }
            });
        };

        loadYT();

        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [isYouTube]);

    // Track progress
    useEffect(() => {
        if (isPlaying) {
            progressIntervalRef.current = setInterval(() => {
                if (isYouTube && playerRef.current?.getCurrentTime) {
                    const time = playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                    if (onProgress) onProgress(time);
                }
            }, 1000);
        } else {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [isPlaying, isYouTube]);

    const extractYTId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        return match ? match[1] : '';
    };

    const togglePlay = () => {
        if (isYouTube && playerRef.current) {
            if (isPlaying) playerRef.current.pauseVideo();
            else playerRef.current.playVideo();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (isYouTube && playerRef.current) {
            playerRef.current.seekTo(time);
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (isYouTube && playerRef.current) {
            playerRef.current.setVolume(val * 100);
        }
    };

    const changeSpeed = (speed: number) => {
        setPlaybackSpeed(speed);
        if (isYouTube && playerRef.current) {
            playerRef.current.setPlaybackRate(speed);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full aspect-video bg-black overflow-hidden group rounded-lg shadow-2xl"
        >
            {/* The Video Source */}
            <div className="absolute inset-0 z-0">
                {isYouTube ? (
                    <div id="yt-player" className="w-full h-full pointer-events-none scale-105" />
                ) : (
                    <iframe
                        src={videoUrl}
                        className="w-full h-full border-0 pointer-events-auto"
                        allow="autoplay; fullscreen"
                    />
                )}
            </div>

            {/* Click Surface - YouTube Only */}
            {isYouTube && (
                <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={togglePlay}
                />
            )}

            {/* Custom Controls Overlay - YouTube Only */}
            {isYouTube && (
                <div className={`absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none flex flex-col justify-end ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Big Center Icon on Pause */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center animate-in zoom-in">
                                <Play size={40} className="text-white fill-white ml-2" />
                            </div>
                        </div>
                    )}

                    {/* Bottom Bar */}
                    <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pointer-events-auto">
                        {/* Progress Slider */}
                        <div className="flex items-center gap-4 mb-4 group/slider">
                            <span className="text-xs font-medium text-white/70 w-12">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 flex items-center h-2">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer outline-none active:scale-y-125 transition-transform"
                                    style={{
                                        background: `linear-gradient(to right, #E50914 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.2) 0%)`
                                    }}
                                />
                            </div>
                            <span className="text-xs font-medium text-white/70 w-12">{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                                    {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
                                </button>

                                <div className="flex items-center gap-2 group/vol">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                                        {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolume}
                                        className="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 accent-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="relative group/speed">
                                    <button className="flex items-center gap-1 text-white text-sm font-bold bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors">
                                        {playbackSpeed}x
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover/speed:flex flex-col bg-[#181818] rounded-md shadow-xl border border-white/10 overflow-hidden">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => changeSpeed(s)}
                                                className={`px-6 py-2 text-sm hover:bg-white/10 transition-colors ${playbackSpeed === s ? 'text-red-500 font-bold' : 'text-white'}`}
                                            >
                                                {s}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button className="text-white hover:scale-110 transition-transform">
                                    <Maximize size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom CSS for range inputs */}
            <style jsx>{`
                input[type='range']::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    background: #E50914;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                input[type='range']::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    background: #E50914;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
}
