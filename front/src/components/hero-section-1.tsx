'use client'
import React, { useState } from 'react'
import { Sparkles, Zap, Globe, Target, Shield, Layers, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import FileUpload from '@/components/file-upload'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useResumeStore } from '@/store/resume-store'

export function HeroSection() {
    const router = useRouter()
    const { setSelectedResumeId } = useResumeStore()
    const [isHovered, setIsHovered] = useState(false)

    const handleUploadSuccess = async (resume_id: string) => {
        setSelectedResumeId(resume_id)
        toast.success("Identity Synced", {
            description: "Calculating market alignment...",
        })
        setTimeout(() => router.push('/matches'), 1500)
    }

    return (
        <>
            <HeroHeader />
            <main className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
                {/* Background Neural Network Viz (SVG) */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                    <NeuralBackground />
                </div>

                <div className="relative z-10 w-full max-w-7xl px-6 flex flex-col items-center text-center">
                    {/* Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass px-4 py-1.5 rounded-full mb-8 flex items-center gap-2 border-white/30"
                    >
                        <Sparkles className="size-3.5 text-primary" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Vector Version 4.0 Live</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6"
                    >
                        The Neural Link to <br />
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent italic">
                            Your Next Role.
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 md:mb-12 leading-relaxed"
                    >
                        Move beyond search. CareerForge uses a Dual-Vector algorithm to physically map your experience to the global market in real-time.
                    </motion.p>

                    {/* Central Matching Hub (Drop Zone) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="relative group cursor-default w-full max-w-xl"
                    >
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        
                        <div className="relative glass-panel p-6 sm:p-8 md:p-12 w-full border-white/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
                            <div className="flex flex-col items-center gap-4 sm:gap-6">
                                <div className="size-12 sm:size-16 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Cpu className={cn("size-6 sm:size-8 text-primary transition-transform duration-500", isHovered ? "scale-110" : "")} />
                                </div>
                                <div className="space-y-1 sm:space-y-2">
                                    <h2 className="text-xl sm:text-2xl font-bold">Sync Your Profile</h2>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Drop your resume here to initialize vector alignment.</p>
                                </div>
                                
                                <div className="w-full">
                                    <FileUpload onUploadComplete={handleUploadSuccess} />
                                </div>

                                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 transition-opacity group-hover:opacity-100">
                                    <span className="flex items-center gap-1"><Shield className="size-2.5 sm:size-3" /> Encrypted</span>
                                    <span className="opacity-20 hidden xs:inline">|</span>
                                    <span className="flex items-center gap-1"><Globe className="size-2.5 sm:size-3" /> Global Market</span>
                                    <span className="opacity-20 hidden xs:inline">|</span>
                                    <span className="flex items-center gap-1"><Layers className="size-2.5 sm:size-3" /> ATS Vectorized</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Secondary Metrics */}
                    <div className="mt-12 md:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 w-full max-w-5xl px-2">
                        {[
                            { icon: Target, label: "Match Accuracy", val: "99.4%" },
                            { icon: Zap, label: "Sync Speed", val: "Instant" },
                            { icon: Globe, label: "Active Roles", val: "1.2M+" },
                            { icon: Shield, label: "Privacy Shield", val: "Active" }
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + (i * 0.1) }}
                                className="flex flex-col items-center gap-1 sm:gap-2"
                            >
                                <div className="size-8 sm:size-10 rounded-xl sm:rounded-2xl glass flex items-center justify-center border-white/20">
                                    <stat.icon className="size-4 sm:size-5 text-primary" />
                                </div>
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center line-clamp-1">{stat.label}</span>
                                <span className="text-lg sm:text-xl font-bold tracking-tighter">{stat.val}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-background to-transparent z-10" />
            </main>

            {/* Feature Bento Grid */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ecosystem Intelligence</h2>
                        <p className="text-muted-foreground text-lg">Four integrated layers working in perfect synthesis.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <BentoCard 
                            title="Dual-Vector Core" 
                            desc="Not just keyword matching. We use embedding models to find semantic alignment between your soul and the job description." 
                            icon={Cpu}
                            className="lg:col-span-2 lg:row-span-2"
                        />
                         <BentoCard 
                            title="Reality Sync" 
                            desc="Real-time market insights from every major job board on Earth." 
                            icon={Globe}
                        />
                        <BentoCard 
                            title="Privacy Vault" 
                            desc="Your data is encrypted using military-grade standards. We never sell your identity." 
                            icon={Shield}
                        />
                        <BentoCard 
                            title="Cover Letter Neural Gen" 
                            desc="Generate letters that sound like you, just significantly more persuasive." 
                            icon={Sparkles}
                        />
                    </div>
                </div>
            </section>
        </>
    )
}

interface BentoCardProps {
    title: string;
    desc: string;
    icon: React.ElementType;
    className?: string;
}

function BentoCard({ title, desc, icon: Icon, className }: BentoCardProps) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={cn("glass-panel p-8 group transition-colors hover:bg-white/30", className)}
        >
            <div className="size-12 rounded-2xl glass mb-6 flex items-center justify-center border-white/20 group-hover:bg-primary/20 transition-colors">
                <Icon className="size-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
        </motion.div>
    )
}

function NeuralBackground() {
    return (
        <svg width="100%" height="100%" className="overflow-visible">
            <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            <motion.path 
                d="M-100,200 Q400,100 900,300 T1900,100" 
                stroke="url(#gradient-line)" 
                strokeWidth="1.5" 
                fill="none"
                animate={{
                    d: ["M-100,200 Q400,100 900,300 T1900,100", "M-100,100 Q400,300 900,100 T1900,200"],
                }}
                transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            />
            {/* Add more decorative neural paths here if needed */}
        </svg>
    )
}

const HeroHeader = () => {
    return null // We are using the SiteHeader in AppShell now
}