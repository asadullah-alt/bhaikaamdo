"use client"

import React from "react"
import { Badge } from "@/components/ui/badgeTable"
import { EnrichedMatch } from "@/lib/types"
import { IconMapPin, IconBuilding, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface JobMatchCardProps {
    match: EnrichedMatch
    isActive?: boolean
    onClick?: () => void
}

export function JobMatchCard({ match, isActive, onClick }: JobMatchCardProps) {
    const { job_details, match: matchInfo } = match
    const percentage = Math.round(matchInfo.percentage_match)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={onClick}
            className={cn(
                "glass-panel p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group",
                isActive ? "bg-white/30 border-primary ring-1 ring-primary/20 shadow-2xl" : "hover:bg-white/20 border-white/10"
            )}
        >
            {/* Background Glow for Active State */}
            {isActive && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none animate-pulse" />
            )}

            <div className="flex gap-4 items-start relative z-10">
                {/* Luminous Meter (SVG Arc) */}
                <div className="relative size-16 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-white/5"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray="176"
                            initial={{ strokeDashoffset: 176 }}
                            animate={{ strokeDashoffset: 176 - (176 * percentage) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={cn(
                                "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]",
                                percentage >= 80 ? "text-green-500" : percentage >= 60 ? "text-primary" : "text-orange-500"
                            )}
                        />
                    </svg>
                    <span className="absolute text-xs font-bold font-mono tracking-tighter">
                        {percentage}%
                    </span>
                </div>

                <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5 overflow-hidden">
                            <h3 className="text-sm sm:text-base font-bold leading-tight group-hover:text-primary transition-colors truncate">
                                {job_details.jobTitle || "Untitled Position"}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground/80 font-medium">
                                <IconBuilding size={12} className="sm:size-[14px]" />
                                <span className="truncate">{job_details.companyProfile?.companyName || "Confidential"}</span>
                            </div>
                        </div>
                        {matchInfo.new_matched_job && (
                            <Badge className="bg-primary/20 text-primary border-primary/20 text-[8px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5 font-bold uppercase animate-pulse shrink-0">
                                New
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            <div className="flex items-center gap-1">
                                <IconMapPin size={10} className="sm:size-3" />
                                <span className="truncate max-w-[70px] sm:max-w-[120px]">
                                    {[job_details.location?.city, job_details.location?.state].filter(Boolean).join(", ") || "Remote"}
                                </span>
                            </div>
                            <span className="opacity-30 hidden xs:inline">|</span>
                            <div className="flex items-center gap-1">
                                <span>{job_details.employmentType || "FT"}</span>
                            </div>
                        </div>
                        
                        <div className="bg-white/10 rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconChevronRight size={14} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
