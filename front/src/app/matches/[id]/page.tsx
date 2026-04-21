"use client"

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconMapPin, IconBuilding, IconCalendar, IconBriefcase, IconRosette, IconChartBar } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separatorInteractive'
import { Badge } from '@/components/ui/badgeTable'
import { getAuthToken, jobsApi } from '@/lib/api'
import { EnrichedMatch } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCfAuthCookie } from '@/utils/cookie'
import { FileText } from 'lucide-react'
import { OpenJobCoverLetterModal } from '@/components/open-job-cover-letter-modal'
import dynamic from 'next/dynamic'

const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false })

export default function MatchDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise)
    const router = useRouter()
    const [matchData, setMatchData] = useState<EnrichedMatch | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Resume analysis state
    const [analyzing, setAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<{
        original_score: number;
        new_score: number;
        skill_comparison: Array<{
            skill: string;
            resume_mentions: number;
            job_mentions: number;
        }>;
        improvements: Array<{
            suggestion: string;
            lineNumber: string;
        }>;
        updated_resume_markdown?: string;
    } | null>(null)
    const [resumeId, setResumeId] = useState<string | null>(null)
    const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false)

    // Fetch resumes on mount to determine resumeId
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const token = getCfAuthCookie()
                const resumesResponse = await fetch(
                    `https://resume.bhaikaamdo.com/api/v1/resumes/getAllUserResumes?token=${token}`
                )
                const resumesData = await resumesResponse.json()

                if (
                    !resumesData.data ||
                    !resumesData.data.resumes ||
                    !Array.isArray(resumesData.data.resumes) ||
                    resumesData.data.resumes.length === 0
                ) {
                    console.error('No resumes found')
                    return
                }

                const defaultResumeId = resumesData.data.default_resume
                const userResumes = resumesData.data.resumes
                let targetResumeId = userResumes[0].id

                if (defaultResumeId) {
                    const defaultResumeExists = userResumes.find((r: { id: string }) => r.id === defaultResumeId)
                    if (defaultResumeExists) {
                        targetResumeId = defaultResumeId
                    }
                }

                setResumeId(targetResumeId)
            } catch (error) {
                console.error('Error fetching resumes:', error)
            }
        }

        fetchResumes()
    }, [])

    const analyzeResume = async () => {
        const token = getCfAuthCookie()
        if (!resumeId) {
            console.error('Resume ID not available')
            return
        }

        try {
            setAnalyzing(true)

            const payload: Record<string, unknown> = {
                match_id: params.id,
                resume_id: resumeId,
                token: token
            }

            if (analysisResult) {
                payload.analysis_again = true
            }

            const analysisResponse = await fetch('https://resume.bhaikaamdo.com/api/v1/resumes/improveOpenJob', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            const analysisData = await analysisResponse.json()
            console.log('Analysis Result:', analysisData.data)
            setAnalysisResult(analysisData.data)
        } catch (error) {
            console.error('Error analyzing resume:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    // Manage tab title animations while analyzing
    useEffect(() => {
        const originalTitle = 'Bhai Kaam Do'
        const marqueeBase = 'Bhai Kaam Do - Analyzing your Resume   '
        const marqueeSpeed = 250
        const flashSpeed = 600

        let marqueeInterval: number | null = null
        let flashInterval: number | null = null
        let currentMarquee = marqueeBase

        const startMarquee = () => {
            document.title = currentMarquee
            marqueeInterval = window.setInterval(() => {
                currentMarquee = currentMarquee.slice(1) + currentMarquee.charAt(0)
                document.title = currentMarquee
            }, marqueeSpeed)
        }

        const startFlashing = () => {
            let show = false
            flashInterval = window.setInterval(() => {
                document.title = show ? '● Analyzing...' : originalTitle
                show = !show
            }, flashSpeed)
        }

        const stopAll = () => {
            if (marqueeInterval !== null) {
                clearInterval(marqueeInterval)
                marqueeInterval = null
            }
            if (flashInterval !== null) {
                clearInterval(flashInterval)
                flashInterval = null
            }
            document.title = originalTitle
            currentMarquee = marqueeBase
        }

        const handleVisibility = () => {
            if (!analyzing) return
            if (!document.hidden) {
                if (flashInterval !== null) {
                    clearInterval(flashInterval)
                    flashInterval = null
                }
                if (marqueeInterval === null) startMarquee()
            } else {
                if (marqueeInterval !== null) {
                    clearInterval(marqueeInterval)
                    marqueeInterval = null
                }
                if (flashInterval === null) startFlashing()
            }
        }

        if (analyzing) {
            if (document.hidden) {
                startFlashing()
            } else {
                startMarquee()
            }
            document.addEventListener('visibilitychange', handleVisibility)
            window.addEventListener('focus', handleVisibility)
        }

        return () => {
            stopAll()
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('focus', handleVisibility)
        }
    }, [analyzing])

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = getAuthToken()
                if (!token) {
                    setError("Session expired")
                    setLoading(false)
                    return
                }

                const data = await jobsApi.getEnrichedMatches(token) as EnrichedMatch[]
                const found = data.find(m => m.match._id === params.id)

                if (found) {
                    setMatchData(found)
                    console.log("Job details:", found.job_details)

                    if (found.match.new_matched_job) {
                        try {
                            jobsApi.markMatchSeen(params.id, token);
                        } catch (err) {
                            console.error("Error marking match as seen:", err);
                        }
                    }
                } else {
                    setError("Job match not found.")
                }
            } catch (err: unknown) {
                console.error("Error fetching job details:", err)
                setError("Failed to load job details.")
            } finally {
                setLoading(false)
            }
        }

        fetchDetail()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Loading job details...</p>
                </div>
            </div>
        )
    }

    if (error || !matchData) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-6">
                    <CardHeader>
                        <CardTitle className="text-red-500">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">{error || "Could not find job details."}</p>
                        <Button onClick={() => router.push('/matches')} className="w-full">
                            Back to Matches
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { job_details, match } = matchData

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-primary/5 -ml-4"
                    onClick={() => router.back()}
                >
                    <IconArrowLeft className="mr-2 h-4 w-4" />
                    Back to Matches
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
                        <header className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="px-3 py-1">
                                    {job_details.employmentType}
                                </Badge>
                                {job_details.isRemote && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                                        Remote
                                    </Badge>
                                )}
                                {job_details.isVisaSponsored && (
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                                        Visa Sponsored
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{job_details.jobTitle}</h1>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <IconBuilding size={20} className="text-primary" />
                                    <span className="font-semibold text-foreground text-lg">
                                        {job_details.companyProfile?.companyName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IconMapPin size={20} />
                                    <span>
                                        {[
                                            job_details.location?.city,
                                            job_details.location?.state,
                                            job_details.location?.country
                                        ].filter(Boolean).join(", ") || job_details.location?.remoteStatus}
                                    </span>
                                </div>
                                {job_details.datePosted && (
                                    <div className="flex items-center gap-2">
                                        <IconCalendar size={20} />
                                        <span>Posted {job_details.datePosted}</span>
                                    </div>
                                )}
                            </div>
                        </header>

                        <Separator />

                        {job_details.extractedKeywords && job_details.extractedKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {job_details.extractedKeywords.map((keyword: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                                        {keyword}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold">Job Summary</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg italic bg-primary/5 p-4 rounded-xl border-l-4 border-primary">
                                {job_details.jobSummary || "No summary available."}
                            </p>
                        </section>

                        {job_details.keyResponsibilities && job_details.keyResponsibilities.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">Key Responsibilities</h2>
                                <ul className="grid gap-3">
                                    {job_details.keyResponsibilities.map((item, i) => (
                                        <li key={i} className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="text-muted-foreground leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {job_details.qualifications && (
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold">Qualifications</h2>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <IconRosette className="text-primary" />
                                        Required
                                    </h3>
                                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                        {job_details.qualifications.required.map((q, i) => (
                                            <li key={i}>{q}</li>
                                        ))}
                                    </ul>
                                </div>

                                {job_details.qualifications.preferred && job_details.qualifications.preferred.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-muted-foreground">Preferred</h3>
                                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground/80">
                                            {job_details.qualifications.preferred.map((q, i) => (
                                                <li key={i}>{q}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        )}

                    </div>

                    {/* Sidebar Column — shown first on mobile */}
                    <div className="space-y-6 order-1 lg:order-2">
                        <Card className="lg:sticky lg:top-8 border-primary/20 shadow-xl overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-primary to-primary/40" />
                            <CardHeader className="pb-0">
                                <CardTitle className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                    Match Score
                                </CardTitle>
                                <div className="text-center py-4 lg:py-6">
                                    <span className="text-5xl lg:text-6xl font-black text-primary">
                                        {Math.round(match.percentage_match)}%
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 p-4 rounded-xl bg-muted/30">
                                    <h4 className="font-bold flex items-center gap-2 text-sm">
                                        <IconBriefcase size={18} />
                                        Job Quick Facts
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Type</span>
                                            <span className="font-medium">{job_details.employmentType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Salary</span>
                                            <span className="font-medium">
                                                {job_details.compensationAndBenefits?.salaryRange || "Not Specified"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Industry</span>
                                            <span className="font-medium">
                                                {job_details.companyProfile?.industry || "Not Specified"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        className="w-full h-12 text-lg font-bold"
                                        size="lg"
                                        asChild
                                        onClick={async () => {
                                            const token = getAuthToken();
                                            if (token && params.id) {
                                                try {
                                                    await jobsApi.markMatchApplied(params.id, token);
                                                } catch (err) {
                                                    console.error("Error marking match as applied:", err);
                                                }
                                            }
                                        }}
                                    >
                                        <a href={job_details.job_url} target="_blank" rel="noopener noreferrer">
                                            Apply Now
                                        </a>
                                    </Button>
                                    {(() => {
                                        try {
                                            if (!job_details.applicationInfo?.applyLink) return null;
                                            const hostname = new URL(job_details.applicationInfo.applyLink).hostname;
                                            return (
                                                <p className="text-center text-xs text-muted-foreground">
                                                    Opens {hostname} in a new tab
                                                </p>
                                            );
                                        } catch {
                                            return null;
                                        }
                                    })()}
                                </div>

                                <Separator />

                                {/* Resume Analysis & Cover Letter */}
                                <div className="flex flex-col">
                                    {analyzing ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-col items-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                                <p className="text-sm text-muted-foreground text-center">
                                                    Analyzing your resume against this job posting...
                                                </p>
                                            </div>
                                        </div>
                                    ) : analysisResult && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col items-center">
                                                <GaugeComponent
                                                    type="semicircle"
                                                    arc={{
                                                        colorArray: ['#FF2121', '#FFA500', '#00FF15'],
                                                        padding: 0.02,
                                                        width: 0.2,
                                                        subArcs: [
                                                            { limit: 40 },
                                                            { limit: 60 },
                                                            { limit: 100 }
                                                        ]
                                                    }}
                                                    pointer={{ type: "blob", animationDelay: 0 }}
                                                    value={Math.round(analysisResult.original_score * 100)}
                                                />
                                                <div className="text-center mt-2">
                                                    <p className="text-sm font-medium">Resume Score</p>
                                                    <p className="text-2xl font-bold">{Math.round(analysisResult.original_score * 100)}%</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-muted/20 rounded-lg p-4">
                                                    <h4 className="font-medium mb-2">Skill Analysis</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {analysisResult.skill_comparison.map((skill, index) => (
                                                            skill.resume_mentions > 0 && (
                                                                <Badge key={index} variant="secondary" className="justify-between">
                                                                    {skill.skill}
                                                                    <span className="ml-2 text-xs">{skill.resume_mentions}✓</span>
                                                                </Badge>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium mb-2">Missing Skills</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysisResult.skill_comparison.map((skill, index) => (
                                                            skill.resume_mentions === 0 && (
                                                                <Badge key={index} variant="outline" className="border-red-200 text-red-500">
                                                                    {skill.skill}
                                                                </Badge>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>

                                                {analysisResult.improvements && (
                                                    <div>
                                                        <h4 className="font-medium mb-2">Suggested Improvements</h4>
                                                        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                                                            {analysisResult.improvements.slice(0, 3).map((imp, index) => (
                                                                <li key={index}>{imp.suggestion}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={analyzeResume}
                                    disabled={analyzing}
                                >
                                    {analyzing ? (
                                        <>
                                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                                            Analyzing Resume...
                                        </>
                                    ) : (
                                        <>
                                            <IconChartBar className="mr-2 h-4 w-4" />
                                            {analysisResult ? 'Analyze Again' : 'Analyze Resume'}
                                        </>
                                    )}
                                </Button>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setIsCoverLetterModalOpen(true)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate Cover Letter
                                </Button>

                                <OpenJobCoverLetterModal
                                    isOpen={isCoverLetterModalOpen}
                                    onClose={() => setIsCoverLetterModalOpen(false)}
                                    matchId={params.id}
                                />
                            </CardContent>
                        </Card>

                        {job_details.companyProfile?.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">About the Company</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {job_details.companyProfile.description}
                                    </p>
                                    {job_details.companyProfile.website && (
                                        <Button variant="link" className="px-0 mt-2 h-auto text-primary" asChild>
                                            <a href={job_details.companyProfile.website} target="_blank" rel="noopener noreferrer">
                                                Visit Website
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
