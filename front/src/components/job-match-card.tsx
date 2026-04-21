"use client"

import React from "react"
import { Card, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badgeTable"
import { Progress } from "@/components/ui/progress"
import { EnrichedMatch } from "@/lib/types"
import { IconMapPin, IconBuilding } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
// import Link from "next/link" // Removing Link as we use onClick now

interface JobMatchCardProps {
    match: EnrichedMatch
    isActive?: boolean
    onClick?: () => void
}

export function JobMatchCard({ match, isActive, onClick }: JobMatchCardProps) {
    const { job_details, match: matchInfo } = match
    const percentage = Math.round(matchInfo.percentage_match)

    // Color based on match percentage
    const getMatchColor = (p: number) => {
        if (p >= 80) return "text-green-600 dark:text-green-400"
        if (p >= 60) return "text-blue-600 dark:text-blue-400"
        return "text-orange-600 dark:text-orange-400"
    }

    const getProgressColor = (p: number) => {
        if (p >= 80) return "bg-green-600"
        if (p >= 60) return "bg-blue-600"
        return "bg-orange-600"
    }

    return (
        <Card
            className={cn(
                "hover:shadow-md transition-all duration-200 border-primary/10 overflow-hidden cursor-pointer",
                isActive ? "ring-2 ring-primary bg-primary/5 shadow-md" : "hover:bg-accent/5"
            )}
            onClick={onClick}
        >
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-grow overflow-hidden">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm md:text-base font-bold line-clamp-1">
                                {job_details.jobTitle || "Untitled"}
                            </CardTitle>
                            {matchInfo.new_matched_job && (
                                <Badge className="bg-primary text-white text-[10px] h-4 px-1.5 py-0 leading-none font-bold uppercase tracking-wider animate-pulse shrink-0">
                                    New
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconBuilding size={14} className="shrink-0" />
                            <span className="truncate font-medium text-foreground/80">
                                {job_details.companyProfile?.companyName || "Unknown"}
                            </span>
                        </div>
                    </div>
                    <div className={cn("text-xs md:text-sm font-black shrink-0 px-2 py-1 rounded bg-accent/10 whitespace-nowrap", getMatchColor(percentage))}>
                        {percentage}%
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <IconMapPin size={12} />
                            <span className="truncate max-w-[100px] md:max-w-[150px]">
                                {[
                                    job_details.location?.city,
                                    job_details.location?.state
                                ].filter(Boolean).join(", ") || job_details.location?.remoteStatus || "Remote"}
                            </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] md:text-xs py-0 h-4 md:h-5 px-1.5 leading-none font-normal">
                            {job_details.employmentType || "FT"}
                        </Badge>
                    </div>

                    <div className="w-14 md:w-20 shrink-0">
                        <Progress value={percentage} className="h-1" indicatorClassName={getProgressColor(percentage)} />
                    </div>
                </div>
            </div>
        </Card>
    )
}
