"use client"

import React, { useEffect, useState, useCallback } from "react"
import AuthGuard from "@/components/auth-guard"
import { getAuthToken, jobsApi, userApi, resumesApi } from "@/lib/api"
import { EnrichedMatch } from "@/lib/types"
import { JobMatchCard } from "@/components/job-match-card"
import {
    IconSearch,
    IconAdjustmentsHorizontal,
    IconTarget,
    IconBuilding,
    IconMapPin,
    IconCloudUpload
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badgeTable"
import { UserPreferences } from "@/lib/api/user"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import FileUpload from "@/components/file-upload"
import { toast } from "sonner"
import { setCookie } from "@/utils/cookie"
import { useResumeStore } from "@/store/resume-store"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"


export default function MatchesPage() {
    const [loading, setLoading] = useState(true)
    const [matches, setMatches] = useState<EnrichedMatch[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const { selectedResumeId, setSelectedResumeId } = useResumeStore()
    const [weightedCount, setWeightedCount] = useState<number | string>("thousands of")
    const CACHE_KEY = 'enriched_matches_cache_v1'
    const CACHE_EXPIRY = 6 * 60 * 60 * 1000 // 6 hours

    // Resume analysis state
    const [analyzing] = useState(false)

    const fetchMatches = useCallback(async (forceRefresh = false) => {
        try {
            const token = getAuthToken()
            if (!token) {
                setLoading(false)
                return
            }

            // Check cache
            if (!forceRefresh) {
                const cached = localStorage.getItem(CACHE_KEY)
                if (cached) {
                    try {
                        const { data: cachedData, timestamp } = JSON.parse(cached)
                        if (Date.now() - timestamp < CACHE_EXPIRY) {
                            setMatches(cachedData)
                            if (cachedData.length > 0 && !selectedId) {
                                setSelectedId(cachedData[0].match._id || null)
                            }
                            setLoading(false)
                            return
                        }
                    } catch (e) {
                        console.error("Error parsing cache:", e)
                        localStorage.removeItem(CACHE_KEY)
                    }
                }
            }

            const data = await jobsApi.getEnrichedMatches(token) as EnrichedMatch[]
            const now = new Date()

            // 1. Process dates: if posted in the future, move back 20 days
            const processedDates = data.map(m => {
                if (!m.job_details.datePosted) return m;

                try {
                    const postedDate = new Date(m.job_details.datePosted)

                    // Check if date is in the future
                    if (postedDate > now) {
                        const adjustedDate = new Date(now);
                        adjustedDate.setDate(now.getDate() - 20);

                        return {
                            ...m,
                            job_details: {
                                ...m.job_details,
                                // Format back to string (ISO or locale dependent on your API needs)
                                datePosted: adjustedDate.toISOString().split('T')[0]
                            }
                        };
                    }
                } catch (e) {
                    console.error("Error adjusting future date:", e)
                }
                return m;
            })

            // 2. Filter out matches older than one month
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

            const filtered = processedDates.filter(m => {
                if (!m.job_details.datePosted) return false

                try {
                    const postedDate = new Date(m.job_details.datePosted)
                    return postedDate >= oneMonthAgo
                } catch {
                    return true
                }
            })

            // 3. Sanitize IDs
            const sanitized = filtered.map(m => {
                const matchId = m.match._id;
                return {
                    ...m,
                    job_details: {
                        ...m.job_details,
                        job_id: matchId || m.job_details.job_id
                    }
                };
            });

            // Save to cache and state
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: sanitized,
                timestamp: Date.now()
            }))

            setMatches(sanitized)
            if (sanitized.length > 0 && !selectedId) {
                setSelectedId(sanitized[0].match._id || null)
            }
        } catch (err: unknown) {
            console.error("Error fetching matches:", err)
        } finally {
            setLoading(false)
        }
    }, [CACHE_EXPIRY, CACHE_KEY, selectedId])

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const token = getAuthToken()
                if (!token) return
                const data = await userApi.getUserPreferences(token)
                setPreferences(data)
            } catch (err) {
                console.error("Error fetching preferences:", err)
            }
        }

        const fetchWeightedCount = async () => {
            try {
                const data = await jobsApi.getWeightedVectorCount()
                if (data && data.weighted_count) {
                    setWeightedCount(data.weighted_count.toLocaleString())
                }
            } catch (err) {
                console.error("Error fetching weighted count:", err)
            }
        }

        const handlePrefsUpdated = () => {
            fetchPreferences()
        }

        const handleResumeUploaded = () => {
            console.log("Resume uploaded event received, refreshing matches...")
            setLoading(true)
            fetchMatches(true)
        }

        fetchMatches()
        fetchPreferences()
        fetchWeightedCount()

        window.addEventListener('preferences-updated', handlePrefsUpdated)
        window.addEventListener('resume-uploaded', handleResumeUploaded)
        return () => {
            window.removeEventListener('preferences-updated', handlePrefsUpdated)
            window.removeEventListener('resume-uploaded', handleResumeUploaded)
        }
    }, [fetchMatches])

    // Fetch resumes to determine resumeId if needed
    useEffect(() => {
        // Reserved for future use
    }, [])

    // Reset analysis when selected match changes
    const analyzeResume = async () => {
        // Implementation for deep diagnostic analysis
        // This will eventually trigger the analysis modal
        console.log("Initializing deep diagnostic...")
    }

    const handleUploadSuccess = async (resume_id: string) => {
        try {
            const token = getAuthToken()
            if (token) {
                await resumesApi.setDefaultResume(resume_id, token)
                setSelectedResumeId(resume_id)
                setCookie('bhaikaamdo_defaultresume', resume_id)
            }
        } catch (e) {
            console.error('Error setting default resume:', e)
        }
        toast.success("Resume uploaded successfully!", {
            description: "Your file has been processed. Refreshing matches…",
        })
        setSheetOpen(false)
        fetchMatches(true)
    }

    const filteredMatches = matches.filter(m => {
        const title = m.job_details.jobTitle?.toLowerCase() || ""
        const company = m.job_details.companyProfile?.companyName?.toLowerCase() || ""
        const query = searchQuery.toLowerCase()
        return title.includes(query) || company.includes(query)
    })

    const selectedMatch = matches.find(m => m.match._id === selectedId)

    return (
        <AuthGuard>
            <div className="h-screen flex flex-col pt-20 sm:pt-24 overflow-hidden">
                {/* Search & Filter Dock (Secondary) */}
                <header className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="glass px-4 sm:px-6 py-2 sm:py-3 rounded-2xl flex items-center justify-between gap-4 border-white/20 max-w-6xl mx-auto">
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                             <div className="size-1.5 sm:size-2 bg-primary animate-pulse rounded-full" />
                             <h1 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Rec. Engine</h1>
                        </div>
                        
                        <div className="flex-1 max-w-sm relative">
                            <IconSearch className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                placeholder="Search vectors..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 sm:pl-10 pr-4 py-1.5 sm:py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60">
                             <span className="uppercase tracking-widest">Vector: <span className="text-primary">{selectedResumeId?.slice(0, 8) || "None"}</span></span>
                             {preferences && (
                                <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black px-2 py-0.5">
                                    {preferences.country || "Global"}
                                </Badge>
                             )}
                        </div>
                    </div>
                </header>

                <div className="flex-grow flex overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6 gap-6 relative">
                    {/* Left Sidebar: Results List */}
                    <aside className={cn(
                        "w-full md:w-[350px] lg:w-[400px] flex flex-col gap-4 transition-all duration-300",
                        selectedId && "hidden md:flex" // Hide sidebar on mobile when detail is open
                    )}>
                        <div className="glass-panel p-4 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">High Alignment ({filteredMatches.length})</h2>
                                <button className="glass p-1.5 rounded-lg border-white/10 hover:bg-white/20 transition-all" onClick={() => fetchMatches(true)}>
                                    <IconAdjustmentsHorizontal size={14} className="text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                                    ))
                                ) : filteredMatches.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                        <div className="size-12 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                                            <IconSearch size={20} className="text-muted-foreground/40" />
                                        </div>
                                        <p className="text-xs font-medium text-muted-foreground">No matches found in this region.</p>
                                    </div>
                                ) : (
                                    filteredMatches.map((match) => (
                                        <JobMatchCard
                                            key={match.match._id}
                                            match={match}
                                            isActive={selectedId === match.match._id}
                                            onClick={() => setSelectedId(match.match._id || null)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Right Main Content: Detail View */}
                    <main className={cn(
                        "flex-1 relative transition-all duration-300",
                        !selectedId && "hidden md:block" // Hide detail on mobile when sidebar is open
                    )}>
                        {selectedMatch ? (
                            <div className="h-full glass-panel overflow-hidden flex flex-col relative">
                                {/* Mobile Back Button */}
                                <button 
                                    className="md:hidden absolute top-4 left-4 z-30 size-10 rounded-full glass border-white/20 flex items-center justify-center text-white"
                                    onClick={() => setSelectedId(null)}
                                >
                                    <IconSearch size={18} className="rotate-180" />
                                </button>

                                {/* Elevated Header Section */}
                                <div className="relative h-48 sm:h-64 shrink-0 overflow-hidden border-b border-white/10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent z-0" />
                                    <div className="absolute -top-12 -right-12 sm:-top-24 sm:-right-24 size-48 sm:size-64 bg-primary/20 blur-[60px] sm:blur-[100px] rounded-full" />
                                    
                                    <div className="relative z-10 h-full p-4 sm:p-8 flex flex-col justify-end gap-2 sm:gap-4">
                                        <div className="flex gap-2">
                                            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md uppercase font-bold text-[8px] sm:text-[10px] px-2 sm:px-3 py-1">
                                                {selectedMatch.job_details.employmentType}
                                            </Badge>
                                            {selectedMatch.job_details.isRemote && (
                                                <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md uppercase font-bold text-[8px] sm:text-[10px] px-2 sm:px-3 py-1">
                                                    Remote
                                                </Badge>
                                            )}
                                        </div>
                                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-2xl line-clamp-2 md:line-clamp-none">
                                            {selectedMatch.job_details.jobTitle}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/70">
                                            <div className="flex items-center gap-1.5">
                                                <IconBuilding size={14} className="text-primary" />
                                                <span className="text-white font-bold truncate max-w-[150px]">{selectedMatch.job_details.companyProfile?.companyName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <IconMapPin size={14} />
                                                <span className="truncate">{[selectedMatch.job_details.location?.city, selectedMatch.job_details.location?.state].filter(Boolean).join(", ")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Content Scroll Area */}
                                <div className="flex-grow overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-12 pb-32 custom-scrollbar">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                                            <section className="space-y-3 sm:space-y-4">
                                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Market Intent</h2>
                                                <p className="text-sm sm:text-lg text-foreground leading-relaxed font-medium bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 italic">
                                                    &quot;{selectedMatch.job_details.jobSummary}&quot;
                                                </p>
                                            </section>

                                            <section className="space-y-4 sm:space-y-6">
                                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Core Vectors</h2>
                                                <div className="grid gap-2 sm:gap-3">
                                                    {selectedMatch.job_details.keyResponsibilities?.map((item, i) => (
                                                        <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
                                                            <span className="size-5 sm:size-6 shrink-0 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black mt-0.5 group-hover:scale-110 transition-transform">{i + 1}</span>
                                                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>

                                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-0">
                                            <div className="glass bg-white/5 p-6 rounded-3xl border-white/10 space-y-6">
                                                <div className="space-y-4">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground">Neural Match</h3>
                                                    <div className="flex justify-center">
                                                        <div className="relative size-24 sm:size-32 flex items-center justify-center">
                                                            <svg className="size-full -rotate-90">
                                                                <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                                                <motion.circle 
                                                                    cx="50%" 
                                                                    cy="50%" 
                                                                    r="45%" 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="8" 
                                                                    strokeDasharray="283%" 
                                                                    initial={{ strokeDashoffset: "283%" }} 
                                                                    animate={{ strokeDashoffset: `${283 - (283 * selectedMatch.match.percentage_match) / 100}%` }} 
                                                                    transition={{ duration: 2, ease: "circOut" }} 
                                                                    className="text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                                                                />
                                                            </svg>
                                                            <span className="absolute text-xl sm:text-2xl font-black">{Math.round(selectedMatch.match.percentage_match)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-3 pt-4">
                                                    <Button className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20" asChild>
                                                        <a href={selectedMatch.job_details.job_url} target="_blank">Deploy Application</a>
                                                    </Button>
                                                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold bg-white/5 border-white/10" onClick={() => analyzeResume()}>
                                                        {analyzing ? "Syncing..." : "View Alignment Data"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full glass-panel flex flex-col items-center justify-center p-6 sm:p-12 text-center">
                                {selectedResumeId ? (
                                    <div className="space-y-6 sm:space-y-8 max-w-md">
                                        <div className="relative size-32 sm:size-48 mx-auto flex items-center justify-center">
                                            {/* Neural Cord Animation */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {[...Array(3)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="absolute rounded-full border border-primary/30"
                                                        initial={{ width: 40, height: 40, opacity: 0 }}
                                                        animate={{ 
                                                            width: [40, 160], 
                                                            height: [40, 160], 
                                                            opacity: [0, 0.5, 0],
                                                            rotate: [0, 180, 360]
                                                        }}
                                                        transition={{ 
                                                            duration: 3, 
                                                            repeat: Infinity, 
                                                            delay: i * 1,
                                                            ease: "linear"
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="z-10 size-16 sm:size-20 rounded-3xl glass flex items-center justify-center shadow-2xl border-white/30 rotate-12">
                                                <IconTarget size={30} className="text-primary animate-pulse sm:size-[40px]" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Syncing Neural Vectors</h2>
                                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Scanning the global market logic for {weightedCount} alignment points.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                         <div className="size-20 sm:size-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                                            <IconCloudUpload size={30} className="text-primary sm:size-[40px]" />
                                         </div>
                                         <h2 className="text-xl sm:text-2xl font-bold">Neural Engine Offline</h2>
                                         <p className="text-xs sm:text-sm text-muted-foreground max-w-[240px] sm:max-w-xs mx-auto">Upload your career vector to activate the global matching engine.</p>
                                         <Button onClick={() => setSheetOpen(true)} className="rounded-xl px-6 sm:px-8 h-10 sm:h-12 font-bold text-sm sm:text-base">Activate Engine</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right data-[state=open]:duration-500">
                    <SheetHeader>
                        <SheetTitle>Upload Resume</SheetTitle>
                        <SheetDescription>Upload your resume to start matching with jobs. Supports PDF and DOCX formats.</SheetDescription>
                    </SheetHeader>
                    <div className="p-4">
                        <FileUpload onUploadComplete={handleUploadSuccess} />
                    </div>
                    <SheetFooter>
                        <div className="text-xs text-muted-foreground">Resume will be uploaded and processed by our AI.</div>
                    </SheetFooter>
                    <SheetClose />
                </SheetContent>
            </Sheet>
        </AuthGuard>
    )
}