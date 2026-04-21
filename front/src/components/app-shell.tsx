"use client"
import React, { useState, useEffect } from "react"
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
// import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from '@/components/ui/sonner'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const [shouldHideShell, setShouldHideShell] = useState<boolean | null>(null)

  useEffect(() => {
    const hidePaths = ['/', '/signup', '/features', '/about', '/pricing', '/verify', '/forgot-password', '/privacy-policy', '/signin', '/waiting-list', '/job', '/reset-password']
    const isMainHost = window.location.hostname === 'bhaikaamdo.com'
    const isHidePath = hidePaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
    setShouldHideShell(isMainHost && isHidePath)
  }, [pathname])

  // While checking, show nothing (or a blank screen)
  if (shouldHideShell === null) {
    return <div className="min-h-screen bg-background" />
  }

  if (shouldHideShell) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* <AppSidebar variant="inset" /> */}
      <SidebarInset>
        <SiteHeader />
        <Toaster />
        <div className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.24 }}
              className="flex-1"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}