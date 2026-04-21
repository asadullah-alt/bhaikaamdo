"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/buttonTable"
import { Separator } from "@/components/ui/separatorInteractive"
import { SidebarTrigger } from "@/components/ui/sidebar"
import FileUpload from "@/components/file-upload"
import { usePathname, useRouter } from "next/navigation"
import { resumesApi } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { UploadCloud, Mail, ChevronDown, BookOpenCheck, Download, Briefcase, Settings, Menu, LogOut } from "lucide-react"
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/theme-context'
import { userApi } from "@/lib/api"
import UserPreferencesModal from "./user-preferences-modal"
import { UserPreferences } from "@/lib/api/user"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCfAuthCookie, setCookie } from "@/utils/cookie"
import { useResumeStore } from "@/store/resume-store"

// Add button blink animation styles
const buttonAnimationStyle = `
  @keyframes double-blink {
    0%, 100% { opacity: 1; }
    25% { opacity: 0.3; }
    50% { opacity: 1; }
    75% { opacity: 0.3; }
  }
  .animate-double-blink {
    animation: double-blink 0.6s ease-in-out;
  }
`

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname() || "/"
  const isLifecycle = pathname.startsWith("/lifecycle")
  const title = isLifecycle ? "Lifecycle" : "Dashboard"

  const [sheetOpen, setSheetOpen] = useState(false)
  const { selectedResumeId, setSelectedResumeId } = useResumeStore()

  const handleUploadSuccess = async (resume_id: string) => {
    // 1. Set default resume (using existing function)
    await handleSetDefaultResume(resume_id);

    // 2. Show the toast
    toast.success("Resume uploaded successfully!", {
      description: "Refreshing matches…",
    });

    // 3. Refresh or Navigate
    if (pathname === '/matches') {
      window.dispatchEvent(new CustomEvent('resume-uploaded'));
    } else {
      router.push('/matches');
    }

    // 4. Close the sheet
    setSheetOpen(false);
  };
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [resumes, setResumes] = useState<Array<{ id: string; resume_name?: string }>>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [blinkingButton, setBlinkingButton] = useState<string | null>(null)
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)

  // Inject animation styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = buttonAnimationStyle
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Preload PDF worker when user is authenticated
  useEffect(() => {
    const token = getCfAuthCookie()
    if (token && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = 'https://bhaikaamdo.com/pdf.worker.min.mjs'
      document.head.appendChild(link)
    }
  }, [])

  const handleButtonClick = (buttonId: string) => {
    setBlinkingButton(buttonId)
    setTimeout(() => setBlinkingButton(null), 600)
  }

  const { theme, toggle } = useTheme()


  // Fetch resumes on mount
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true)
        const token = getCfAuthCookie()
        if (!token) return

        const data = await resumesApi.getAllUserResumes(token)
        if (data.data && data.data.resumes && Array.isArray(data.data.resumes)) {
          setResumes(data.data.resumes)

          // Logic to set default resume
          const defaultResumeId = data.data.default_resume

          if (defaultResumeId && !selectedResumeId) {
            // Verify the default resume exists in the list
            const defaultResumeExists = data.data.resumes.find((r: { id: string }) => r.id === defaultResumeId)
            if (defaultResumeExists) {
              setSelectedResumeId(defaultResumeId)
              setCookie('bhaikaamdo_defaultresume', defaultResumeId)
            } else if (data.data.resumes.length > 0) {
              // Fallback if default not found in list (shouldn't happen but good for safety)
              setSelectedResumeId(data.data.resumes[0].id)
              setCookie('bhaikaamdo_defaultresume', data.data.resumes[0].id)
            }
          } else if (data.data.resumes.length > 0 && !selectedResumeId) {
            // Fallback if no default_resume returned
            setSelectedResumeId(data.data.resumes[0].id)
            setCookie('bhaikaamdo_defaultresume', data.data.resumes[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching resumes:', error)
      } finally {
        setLoadingResumes(false)
      }
    }

    void fetchResumes()
  }, [selectedResumeId, setSelectedResumeId])

  // Fetch user preferences on mount
  useEffect(() => {
    let mounted = true
    const fetchPreferences = async () => {
      try {
        const token = getCfAuthCookie()
        if (!token) return

        const prefs = await userApi.getUserPreferences(token)
        if (!mounted) return
        setUserPreferences(prefs)

        // Auto-open if preferences are not set
        // Loosen the check: if most critical fields are null/unset
        const isMinSalaryNotSet = prefs.salary_min === null || prefs.salary_min === 0;
        const isMaxSalaryNotSet = prefs.salary_max === null || prefs.salary_max === 0;
        const isCountryNotSet = !prefs.country;
        const isCityNotSet = !prefs.city;
        const isExperienceNotSet = prefs.experience === null;

        // If most main identity/matching fields are basically unset, show prompt
        if (isMinSalaryNotSet && isMaxSalaryNotSet && isCountryNotSet && isCityNotSet && isExperienceNotSet) {
          // Add a small delay for better UX
          setTimeout(() => {
            if (mounted) setPreferencesModalOpen(true)
          }, 1000)
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error)
      }
    }

    // Immediate attempt
    void fetchPreferences()

    // Retry once after a short delay in case AuthGuard was still setting the cookie
    const timer = setTimeout(fetchPreferences, 2000)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [pathname]) // Re-run slightly on path changes to ensure it hits when landing on dashboard

  // Listen for global 'open-preferences' event
  useEffect(() => {
    const handleOpenPrefs = () => {
      console.log('[SiteHeader] Received open-preferences event')
      setPreferencesModalOpen(true)
    }
    window.addEventListener('open-preferences', handleOpenPrefs)
    return () => window.removeEventListener('open-preferences', handleOpenPrefs)
  }, [])


  function handleLogout() {
    // Clear cf_auth cookie by setting it to expired
    document.cookie = 'cf_auth=; path=/; max-age=0; SameSite=Lax'
    router.replace('/')
  }

  const getResumeDisplayName = (resume: { id: string; resume_name?: string }): string => {
    return resume.resume_name || resume.id || 'Resume'
  }

  const handleSetDefaultResume = async (resumeId: string) => {
    try {
      const token = getCfAuthCookie()
      if (!token) {
        toast.error("Authentication token missing")
        return
      }

      await resumesApi.setDefaultResume(resumeId, token)

      // Verify success (api client throws on error, so we just proceed)
      if (true) {
        setSelectedResumeId(resumeId)
        setCookie('bhaikaamdo_defaultresume', resumeId)
        toast.success("Default resume updated successfully")
      } else {
        toast.error("Failed to Make Resume Active")
      }
    } catch (error) {
      console.error("Error setting default resume:", error)
      toast.error("Failed to Make Resume Active")
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1
          className={`text-base font-medium ${title === 'Dashboard' ? 'cursor-pointer' : ''}`}
          role={title === 'Dashboard' ? 'button' : undefined}
          tabIndex={title === 'Dashboard' ? 0 : undefined}
          onClick={() => {
            if (title === 'Dashboard') router.push('/dashboard')
          }}
          onKeyDown={(e) => {
            if ((e as React.KeyboardEvent).key === 'Enter' && title === 'Dashboard') router.push('/dashboard')
          }}
        >
          {title}
        </h1>

        <div className="ml-4 hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick('matches')
              router.push('/matches')
            }}
            className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'matches' ? 'animate-double-blink' : ''}`}
          >
            <Briefcase className="size-4 mr-2" />
            <span className="hidden md:inline">Matched Jobs</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick('upload')
              setSheetOpen(true)
            }}
            className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'upload' ? 'animate-double-blink' : ''}`}
          >
            <UploadCloud className="size-4 mr-2" />
            <span className="hidden md:inline">Upload Base CV</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'email' ? 'animate-double-blink' : ''}`}
            onClick={() => {
              handleButtonClick('email')
              setEmailModalOpen(true)
            }}
          >
            <Mail className="size-4 mr-2" />
            <span className="hidden md:inline">Connect with Email</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick('resumebuilder')
              router.push('/dashboard/resumes')
            }}
            className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'resumebuilder' ? 'animate-double-blink' : ''}`}
          >
            <BookOpenCheck className="size-4 mr-2" />
            <span className="hidden md:inline">Resume Builder</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick('extension')
              window.open('https://chromewebstore.google.com/detail/bhaikaamdo-streamline-you/cfhjopkjaegoadmcfmepdbnmkikkpjjk', '_blank')
            }}
            className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'extension' ? 'animate-double-blink' : ''}`}
          >
            <Download className="size-4 mr-2" />
            <span className="hidden md:inline">Download extension</span>
          </Button>
        </div>

        {/* Mobile-only "More" dropdown — shows all hidden actions */}
        <div className="ml-2 flex sm:hidden items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="border border-gray-200 dark:border-gray-700 rounded-md px-2">
                <Menu className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => { handleButtonClick('matches'); router.push('/matches') }}>
                <Briefcase className="size-4 mr-2" />Matched Jobs
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { handleButtonClick('upload'); setSheetOpen(true) }}>
                <UploadCloud className="size-4 mr-2" />Upload Base CV
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { handleButtonClick('email'); setEmailModalOpen(true) }}>
                <Mail className="size-4 mr-2" />Connect with Email
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { handleButtonClick('resumebuilder'); router.push('/dashboard/resumes') }}>
                <BookOpenCheck className="size-4 mr-2" />Resume Builder
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { handleButtonClick('extension'); window.open('https://chromewebstore.google.com/detail/bhaikaamdo-streamline-you/cfhjopkjaegoadmcfmepdbnmkikkpjjk', '_blank') }}>
                <Download className="size-4 mr-2" />Download Extension
              </DropdownMenuItem>

              {resumes.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Active Resume</DropdownMenuLabel>
                  {resumes.map((resume) => (
                    <DropdownMenuItem
                      key={resume.id}
                      onClick={() => handleSetDefaultResume(resume.id)}
                      className={selectedResumeId === resume.id ? 'bg-accent' : ''}
                    >
                      <span className="text-sm truncate">{getResumeDisplayName(resume)}</span>
                      {selectedResumeId === resume.id && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { handleButtonClick('settings'); setPreferencesModalOpen(true) }}>
                <Settings className="size-4 mr-2" />Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { handleButtonClick('logout'); handleLogout() }} className="text-red-500 focus:text-red-500">
                <LogOut className="size-4 mr-2" />Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Email Modal */}
        <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect with Email</DialogTitle>
              <DialogDescription>
                Coming soon, but thanks for clicking!
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <div className="ml-auto flex items-center gap-2">
          {/* Resume Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="border border-gray-200 dark:border-gray-700 rounded-md px-2 hidden sm:flex items-center gap-1"
                disabled={loadingResumes || resumes.length === 0}
              >
                <span className="text-xs truncate max-w-[150px]">
                  {loadingResumes ? 'Loading...' : selectedResumeId ? getResumeDisplayName(resumes.find(r => r.id === selectedResumeId) || { id: selectedResumeId }) : 'Select Resume'}
                </span>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Active Resume</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {resumes.length > 0 ? (
                resumes.map((resume) => (
                  <DropdownMenuItem
                    key={resume.id}
                    onClick={() => handleSetDefaultResume(resume.id)}
                    className={selectedResumeId === resume.id ? 'bg-accent' : ''}
                  >
                    <span className="text-sm">{getResumeDisplayName(resume)}</span>
                    {selectedResumeId === resume.id && <span className="ml-2">✓</span>}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No resumes found
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={() => { console.log('[SiteHeader] toggle clicked'); handleButtonClick('theme'); toggle() }} className={`border border-gray-200 dark:border-gray-700 rounded-md px-2 transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'theme' ? 'animate-double-blink' : ''}`}>
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}

          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick('settings')
              setPreferencesModalOpen(true)
            }}
            className={`hidden sm:flex border border-gray-200 dark:border-gray-700 rounded-md px-2 transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'settings' ? 'animate-double-blink' : ''}`}
          >
            <Settings className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick('logout')
              handleLogout()
            }}
            className={`hidden sm:flex border border-gray-200 dark:border-gray-700 rounded-md px-2 transition-all duration-200 hover:bg-primary/10 hover:border-primary dark:hover:border-primary ${blinkingButton === 'logout' ? 'animate-double-blink' : ''}`}
          >
            Logout
          </Button>
        </div>

        <UserPreferencesModal
          open={preferencesModalOpen}
          onOpenChange={setPreferencesModalOpen}
          initialData={userPreferences}
          onSaved={(prefs) => setUserPreferences(prefs)}
        />

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
      </div>
    </header>
  )
}