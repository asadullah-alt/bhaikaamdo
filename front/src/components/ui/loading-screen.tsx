"use client";

import { motion } from "framer-motion";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-slate-950 dark:text-white"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths() {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden mesh-gradient">
            {/* Background Neural Paths */}
            <div className="absolute inset-0 opacity-40">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-2xl mx-auto space-y-12"
                >
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <div className="relative size-24">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <div className="absolute inset-4 rounded-full border-2 border-primary/10 border-b-primary animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                            </div>
                        </motion.div>

                        <div className="space-y-2">
                            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-foreground">
                                Neural <span className="text-primary italic">Alignment</span>
                            </h1>
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
                                Reconstructing Opportunity Vectors
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel p-1 rounded-3xl overflow-hidden shadow-2xl border-white/20 bg-white/5 inline-block">
                        <div className="px-8 py-5 flex items-center gap-4 bg-white/5 backdrop-blur-3xl rounded-[1.4rem]">
                             <div className="size-2 bg-green-500 rounded-full animate-ping" />
                             <span className="text-sm font-bold tracking-tight text-foreground/80">
                                Synchronizing session with the Match Cluster…
                             </span>
                        </div>
                    </div>

                    <div className="pt-8">
                        <div className="flex justify-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0.2 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        delay: i * 0.2
                                    }}
                                    className="size-1.5 rounded-full bg-primary"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
