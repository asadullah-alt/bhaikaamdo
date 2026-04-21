"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/buttonTable"
import { Separator } from "@/components/ui/separatorInteractive"
import { SidebarTrigger } from "@/components/ui/sidebar"
import FileUpload from "@/components/file-upload"
import { usePathname, useRouter } from "next/navigation"
import { resumesApi } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { UploadCloud, ChevronDown, BookOpenCheck, Download, Briefcase, Settings, LogOut } from "lucide-react"
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
} from "@/components/ui/dropdown-menu"
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
  const title = pathname.startsWith("/lifecycle") ? "Lifecycle" : "Dashboard"

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
  const [resumes, setResumes] = useState<Array<{ id: string; resume_name?: string }>>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
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

  const handleButtonClick = () => {
    // Animation logic removed as it was incomplete
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
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="glass h-14 rounded-full flex items-center px-3 sm:px-4 gap-1 sm:gap-2 shadow-2xl border-white/20 max-w-full">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1 text-foreground/80 hover:bg-white/20 rounded-full" />
          <Separator
            orientation="vertical"
            className="mx-1 sm:mx-2 h-4 bg-white/20"
          />
          <h1
            className={`text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap ${title === 'Dashboard' ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
            role={title === 'Dashboard' ? 'button' : undefined}
            tabIndex={title === 'Dashboard' ? 0 : undefined}
            onClick={() => {
              if (title === 'Dashboard') router.push('/dashboard')
            }}
          >
            {title}
          </h1>
        </div>

        <div className="mx-1 h-4 w-px bg-white/10 hidden xs:block sm:block" />

        <div className="hidden sm:flex items-center gap-1.5 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick()
              router.push('/matches')
            }}
            className={`h-9 rounded-full px-3 text-xs font-medium transition-all hover:bg-white/20 hover:text-foreground ${pathname === '/matches' ? 'bg-white/30 text-primary shadow-sm' : 'text-foreground/70'}`}
          >
            <Briefcase className="size-4 mr-1.5" />
            <span className="hidden lg:inline">Matches</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick()
              setSheetOpen(true)
            }}
            className="h-9 rounded-full px-3 text-xs font-medium text-foreground/70 transition-all hover:bg-white/20 hover:text-foreground"
          >
            <UploadCloud className="size-4 mr-1.5" />
            <span className="hidden lg:inline">Upload</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick()
              router.push('/dashboard/resumes')
            }}
            className={`h-9 rounded-full px-3 text-xs font-medium transition-all hover:bg-white/20 hover:text-foreground ${pathname.startsWith('/dashboard/resumes') ? 'bg-white/30 text-primary shadow-sm' : 'text-foreground/70'}`}
          >
            <BookOpenCheck className="size-4 mr-1.5" />
            <span className="hidden lg:inline">Builder</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleButtonClick()
              window.open('https://chromewebstore.google.com/detail/bhaikaamdo-streamline-you/cfhjopkjaegoadmcfmepdbnmkikkpjjk', '_blank')
            }}
            className="h-9 rounded-full px-3 text-xs font-medium text-foreground/70 transition-all hover:bg-white/20 hover:text-foreground"
          >
            <Download className="size-4 mr-1.5" />
            <span className="hidden lg:inline">Extension</span>
          </Button>
        </div>

        <div className="mx-1 h-4 w-px bg-white/10" />

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Resume Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-2 sm:px-3 text-[10px] sm:text-xs font-medium border border-white/10 bg-white/10 hover:bg-white/20 gap-1 sm:gap-2 min-w-[60px] sm:min-w-[100px]"
                disabled={loadingResumes || resumes.length === 0}
              >
                <span className="truncate max-w-[50px] sm:max-w-[80px]">
                  {loadingResumes ? '...' : selectedResumeId ? getResumeDisplayName(resumes.find(r => r.id === selectedResumeId) || { id: selectedResumeId }) : 'Resume'}
                </span>
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass w-56 rounded-2xl p-2 border-white/20 shadow-2xl mt-2 backdrop-blur-3xl">
              <DropdownMenuLabel className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-2">Active Resume</DropdownMenuLabel>
              {resumes.map((resume) => (
                <DropdownMenuItem
                  key={resume.id}
                  onClick={() => handleSetDefaultResume(resume.id)}
                  className={`rounded-lg mb-1 py-2 px-3 text-sm focus:bg-white/20 transition-colors ${selectedResumeId === resume.id ? 'bg-primary/20 text-primary font-semibold' : ''}`}
                >
                  <span className="truncate">{getResumeDisplayName(resume)}</span>
                  {selectedResumeId === resume.id && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggle} 
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-white/20 transition-all"
          >
            {theme === 'dark' ? <Sun className="size-3.5 sm:size-4" /> : <Moon className="size-3.5 sm:size-4" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-white/20 transition-all"
              >
                <Settings className="size-3.5 sm:size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass w-48 rounded-2xl p-2 border-white/20 mt-2">
               <DropdownMenuItem onClick={() => setPreferencesModalOpen(true)} className="rounded-lg py-2">
                <Settings className="size-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg py-2 text-red-500 focus:text-red-500 focus:bg-red-500/10">
                <LogOut className="size-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <UserPreferencesModal
          open={preferencesModalOpen}
          onOpenChange={setPreferencesModalOpen}
          initialData={userPreferences}
          onSaved={(prefs) => setUserPreferences(prefs)}
        />

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="glass border-l-white/20 shadow-[-20px_0_50px_rgba(0,0,0,0.2)]">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-2xl font-bold">Upload Resume</SheetTitle>
              <SheetDescription className="text-muted-foreground/80">Our Dual-Vector algorithm will instantly map your profile to current opportunities.</SheetDescription>
            </SheetHeader>

            <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
              <FileUpload onUploadComplete={handleUploadSuccess} />
            </div>

            <SheetFooter className="mt-8 pt-8 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Privacy Shield Enabled</div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}