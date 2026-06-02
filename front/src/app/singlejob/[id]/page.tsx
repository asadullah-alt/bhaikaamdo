"use client"

import React, { use } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconChartBar, IconChevronDown } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separatorInteractive'
import { Badge } from '@/components/ui/badgeTable'
import { useJobStore } from '@/store/job-store'
import { getCfAuthCookie } from '@/utils/cookie'
import dynamic from "next/dynamic";
import { Link, Share2, FileText, Download } from "lucide-react";
import { CoverLetterModal } from '@/components/cover-letter-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarkdownResumeViewer } from '@/components/markdown-resume-viewer';
import { generateResumePDF } from '@/lib/resume-pdf';
import { useResumeStore } from '@/store/resume-store';
import { toast } from 'sonner';

import { ExtendedJob } from '@/store/job-store'

const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false });

export default function SingleJobPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [jobData, setJobData] = React.useState<ExtendedJob | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isCompanyExpanded, setIsCompanyExpanded] = React.useState(false)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysisResult, setAnalysisResult] = React.useState<{
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

  const selectedJob = useJobStore((s) => s.selectedJob)
  const setSelectedJob = useJobStore((s) => s.setSelectedJob)
  const [copied, setCopied] = React.useState(false)
  const [resumeId, setResumeId] = React.useState<string | null>(null)
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = React.useState(false)
  const [isImproveResumeModalOpen, setIsImproveResumeModalOpen] = React.useState(false)

  React.useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleShareClick = async () => {
    if (!jobData) return
    const url = (jobData.job_url ?? jobData.jobUrl ?? jobData.src ?? jobData.applicationInfo?.applyLink) as string | undefined
    if (!url) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: jobData.jobPosition || jobData.jobTitle || 'Job',
          url,
        })
        return
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        return
      }

      // fallback: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore user cancel or errors
      // fallback to copy if possible
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url)
          setCopied(true)
        }
      } catch { }
    }
  }

  const analyzeResume = async () => {
    const token = getCfAuthCookie();
    if (!resumeId) {
      console.error('Resume ID not available')
      return
    }

    try {
      setAnalyzing(true)

      // Send analysis request
      const payload: Record<string, unknown> = {
        job_id: params.id,
        resume_id: resumeId,
        token: token
      }

      // When analysis has already been run and the user clicked "Analyze Again",
      // include analysis_again flag so the backend can handle re-analysis differently.
      if (analysisResult) {
        payload.analysis_again = true
      }

      const analysisResponse = await fetch('https://resume.bhaikaamdo.com/api/v1/resumes/improve', {
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
  React.useEffect(() => {
    const originalTitle = 'Bhai Kaam Do'
    const marqueeBase = 'Bhai Kaam Do - Analyzing your Resume   '
    const marqueeSpeed = 250 // ms per frame
    const flashSpeed = 600 // ms per flash

    let marqueeInterval: number | null = null
    let flashInterval: number | null = null
    let currentMarquee = marqueeBase

    const startMarquee = () => {
      // set initial
      document.title = currentMarquee
      marqueeInterval = window.setInterval(() => {
        // rotate string by one char
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
      // when tab becomes visible -> marquee
      if (!document.hidden) {
        if (flashInterval !== null) {
          clearInterval(flashInterval)
          flashInterval = null
        }
        if (marqueeInterval === null) startMarquee()
      } else {
        // tab hidden -> flashing
        if (marqueeInterval !== null) {
          clearInterval(marqueeInterval)
          marqueeInterval = null
        }
        if (flashInterval === null) startFlashing()
      }
    }

    // React to analyzing state
    if (analyzing) {
      // initialize based on visibility
      if (document.hidden) {
        startFlashing()
      } else {
        startMarquee()
      }

      // If user returns to tab, stop flashing and start marquee
      document.addEventListener('visibilitychange', handleVisibility)
      // also stop flashing when window gains focus (some browsers trigger focus)
      window.addEventListener('focus', handleVisibility)
    }

    // cleanup / when analyzing ends
    return () => {
      stopAll()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
    // we only want to run when analyzing toggles
  }, [analyzing])

  React.useEffect(() => {
    let mounted = true

    const fetchResumesAndImprovements = async () => {
      try {
        const token = getCfAuthCookie()

        // Fetch all user resumes first
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

        // Logic to determine which resume to use
        const defaultResumeId = resumesData.data.default_resume
        const userResumes = resumesData.data.resumes

        let targetResumeId = userResumes[0].id

        if (defaultResumeId) {
          const defaultResumeExists = userResumes.find((r: { id: string }) => r.id === defaultResumeId)
          if (defaultResumeExists) {
            targetResumeId = defaultResumeId
          }
        }

        if (!mounted) return
        setResumeId(targetResumeId)

        // Fetch cached improvements using the resume ID and job ID
        const improvementsResponse = await fetch(
          `https://resume.bhaikaamdo.com/api/v1/resumes/getImprovements?resume_id=${targetResumeId}&job_id=${params.id}&token=${token}`
        )
        const improvementsData = await improvementsResponse.json()
        if (improvementsData.data && mounted) {
          setAnalysisResult(improvementsData.data)
        }
      } catch (error) {
        console.error('Error fetching resumes or cached improvements:', error)
      }
    }

    const getJobId = (job: ExtendedJob): string | undefined => {
      const id = job.id || job.jobId || job.job_id
      return id ? String(id) : undefined
    }

    const load = async () => {
      try {
        const token = getCfAuthCookie()

        // If the store already has the selected job matching this id, use it and skip the fetch
        if (selectedJob) {
          const selId = getJobId(selectedJob as ExtendedJob)
          if (selId && selId === String(params.id)) {
            if (!mounted) return
            setJobData(selectedJob as ExtendedJob)
            setLoading(false)
            return
          }
        }

        // Otherwise fetch from API and cache into the store
        const response = await fetch(`https://resume.bhaikaamdo.com/api/v1/jobs?job_id=${params.id}&token=${token}`)
        const data = await response.json()

        if (!mounted) return

        // Ensure the fetched job has the required fields
        const processedJob = data.data.processed_job
        const fetched: ExtendedJob = {
          ...processedJob,
          // Ensure the job_id is present and matches params.id
          job_id: String(params.id),
          // Keep original id if present, otherwise use params.id
          id: processedJob.id || Number(params.id)
        }

        setJobData(fetched)

        // Only update the store if the fetched job is different to avoid triggering loops
        const fetchedId = getJobId(fetched)
        const selIdAfter = selectedJob ? getJobId(selectedJob) : undefined

        if (!selIdAfter || selIdAfter !== String(fetchedId)) {
          setSelectedJob(fetched)
        }
      } catch (error) {
        console.error('Error fetching job data:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void fetchResumesAndImprovements()
    void load()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!jobData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <IconArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Job Details Section */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{jobData.jobPosition || jobData.jobTitle}</h1>
              {(() => {
                const jobUrl = (jobData.job_url ?? jobData.jobUrl ?? jobData.src ?? jobData.applicationInfo?.applyLink) as string | undefined
                if (!jobUrl) return null
                return (
                  <>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleShareClick}
                        title={copied ? 'Copied!' : 'Share'}
                        className="inline-flex items-center justify-center hover:bg-muted rounded-lg p-2 transition-colors"
                        aria-label="Share job posting"
                      >
                        <Share2 className="h-5 w-5 text-muted-foreground" />
                      </button>

                      {/* Visual copied indicator */}
                      {copied && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Copied!</span>
                      )}

                      <a
                        href={jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center hover:bg-muted rounded-lg p-2 transition-colors"
                        aria-label="Open job posting"
                      >
                        {/* larger, higher-contrast link icon for accessibility */}
                        <Link className="h-6 w-6 text-primary" aria-hidden />
                      </a>
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="font-medium text-lg">{jobData.companyProfile?.companyName}</span>
              <span>•</span>
              <span>{[
                jobData.location.city,
                jobData.location.state,
                jobData.location.country

              ].filter(Boolean).join(', ') || 'Remote'}</span>
            </div>
            {(jobData.isRemote || jobData.isVisaSponsored) && (
              <div className="flex items-center gap-2 mt-2">
                {jobData.isVisaSponsored && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 text-xs">
                    Visa Sponsored
                  </Badge>
                )}
                {jobData.isRemote && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 text-xs">
                    Remote
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <button
              onClick={() => setIsCompanyExpanded(!isCompanyExpanded)}
              className="w-full flex items-center justify-between text-xl font-semibold mb-4 hover:text-primary transition-colors"
            >
              <span>Company Details</span>
              <IconChevronDown
                className={`transform transition-transform duration-200 ${isCompanyExpanded ? 'rotate-180' : ''
                  }`}
                size={24}
              />
            </button>
            <div className={`space-y-4 overflow-hidden transition-all duration-200 ${isCompanyExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
              <div>
                <h3 className="font-medium mb-1">Industry</h3>
                <p className="text-muted-foreground">{jobData.companyProfile?.industry || '—'}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Website</h3>
                {jobData.companyProfile?.website ? (
                  <a
                    href={jobData.companyProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {jobData.companyProfile.website}
                  </a>
                ) : '—'}
              </div>
              <div>
                <h3 className="font-medium mb-1">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {jobData.companyProfile?.description || '—'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Job Summary</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {jobData.jobSummary || '—'}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Employment Type</h3>
                <Badge variant="secondary">
                  {jobData.employmentType || '—'}
                </Badge>
              </div>

              <div>
                <h3 className="font-medium mb-2">Key Responsibilities</h3>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {jobData.keyResponsibilities?.map((responsibility: string, index: number) => (
                    <li key={index}>{responsibility}</li>
                  )) || <li>—</li>}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Required Qualifications</h3>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {jobData.qualifications?.required?.map((qual: string, index: number) => (
                    <li key={index}>{qual}</li>
                  )) || <li>—</li>}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Preferred Qualifications</h3>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {jobData.qualifications?.preferred?.map((qual: string, index: number) => (
                    <li key={index}>{qual}</li>
                  )) || <li>—</li>}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.extractedKeywords?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  )) || '—'}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Preferred Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.qualifications.preferred?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  )) || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-0.5">
            <h2 className="text-xl font-semibold mb-4">Application Progress</h2>
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
                      <p className="text-sm font-medium">Match Score</p>
                      <p className="text-2xl font-bold">{Math.round(analysisResult.original_score * 100)}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Skill Analysis</h4>
                      <div className="grid grid-cols-2 gap-2">
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
              className="w-full mt-6"
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
            {analysisResult?.updated_resume_markdown && (
              <Button
                className="w-full mt-4"
                variant="outline"
                size="lg"
                onClick={() => setIsImproveResumeModalOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Show Improved Resume
              </Button>
            )}

            <Button
              className="w-full mt-4"
              variant="outline"
              size="lg"
              onClick={() => setIsCoverLetterModalOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Cover Letter
            </Button>
            {/* Improved Resume Modal */}
            <Dialog open={isImproveResumeModalOpen} onOpenChange={setIsImproveResumeModalOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <FileText className="text-primary" size={22} />
                    Improved Resume
                  </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                  {/* Render improved resume markdown */}
                  <MarkdownResumeViewer markdown={analysisResult?.updated_resume_markdown ?? ''} />
                </div>
                <div className="flex justify-end px-6 py-4 border-t bg-muted/50">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      // Generate PDF from the existing resume data (structured) as a fallback
                      try {
                        const resume = useResumeStore.getState().resume;
                        if (!resume) return;
                        const blob = await generateResumePDF(resume);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${resume.personal_data.first_name || 'resume'}_${resume.personal_data.last_name || ''}_Improved.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success('Improved PDF downloaded');
                      } catch (e) {
                        toast.error('Failed to generate PDF');
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <CoverLetterModal
              isOpen={isCoverLetterModalOpen}
              onClose={() => setIsCoverLetterModalOpen(false)}
              jobId={params.id}
            />


          </div>
        </div>
      </div>
    </div>
  )
}