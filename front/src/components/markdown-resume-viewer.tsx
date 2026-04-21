"use client"

import React from "react"

interface ParsedSubsection {
    heading: string
    subheading?: string
    bullets: string[]
    paragraphs: string[]
}

interface ParsedSection {
    title: string
    subsections: ParsedSubsection[]
    bullets: string[]
    paragraphs: string[]
}

interface ParsedResume {
    name: string
    contactLine: string
    sections: ParsedSection[]
}

function parseMarkdown(markdown: string): ParsedResume {
    const lines = markdown.split("\n")
    let name = ""
    let contactLine = ""
    const sections: ParsedSection[] = []
    let currentSection: ParsedSection | null = null
    let currentSub: ParsedSubsection | null = null
    let foundName = false
    let foundContact = false

    const flush = () => {
        if (currentSub && currentSection) {
            currentSection.subsections.push(currentSub)
            currentSub = null
        }
    }

    for (const raw of lines) {
        const line = raw.trimEnd()

        if (line.startsWith("# ")) {
            name = line.slice(2).trim()
            foundName = true
            continue
        }

        if (line.startsWith("## ")) {
            flush()
            currentSection = { title: line.slice(3).trim(), subsections: [], bullets: [], paragraphs: [] }
            sections.push(currentSection)
            continue
        }

        if (line.startsWith("### ")) {
            flush()
            // Heading may contain | separators: "Job Title | Company | Dates"
            const parts = line.slice(4).trim().split("|").map(p => p.trim())
            currentSub = { heading: parts[0], subheading: parts.slice(1).join(" · "), bullets: [], paragraphs: [] }
            continue
        }

        const isBullet = /^[-*]\s/.test(line.trim())
        if (isBullet) {
            const content = line.trim().replace(/^[-*]\s/, "")
            if (currentSub) currentSub.bullets.push(content)
            else if (currentSection) currentSection.bullets.push(content)
            continue
        }

        if (!line.trim()) continue

        // Contact line: right after name, before first ## section
        if (foundName && !foundContact && !currentSection) {
            contactLine = line.trim()
            foundContact = true
            continue
        }

        if (currentSub) {
            currentSub.paragraphs.push(line.trim())
        } else if (currentSection) {
            currentSection.paragraphs.push(line.trim())
        }
    }

    flush()
    return { name, contactLine, sections }
}

// Strip markdown formatting for plain rendering
function stripMd(text: string) {
    return text
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
}

// Split contact line into segments separated by | · , ;
function parseContact(contact: string) {
    return contact.split(/[|·,;]/).map(s => s.trim()).filter(Boolean)
}

const DIVIDER_SECTIONS = new Set(["experience", "work experience", "professional experience", "employment"])

interface Props {
    markdown: string
}

export function MarkdownResumeViewer({ markdown }: Props) {
    if (!markdown?.trim()) return null

    const { name, contactLine, sections } = parseMarkdown(markdown)
    const contacts = parseContact(contactLine)

    return (
        <div
            className="bg-white text-[#1a1a1a] font-sans text-sm leading-relaxed"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
            {/* ── Header ─────────────────────────────────────────── */}
            {name && (
                <div className="text-center mb-3 pb-3 border-b-2 border-[#1a1a1a]">
                    <h1 className="text-2xl font-bold tracking-wide uppercase" style={{ fontFamily: "inherit" }}>
                        {stripMd(name)}
                    </h1>
                    {contacts.length > 0 && (
                        <p className="text-xs mt-1 text-[#444] tracking-wide">
                            {contacts.join("  ·  ")}
                        </p>
                    )}
                </div>
            )}

            {/* ── Sections ────────────────────────────────────────── */}
            {sections.map((section, si) => {
                const isExp = DIVIDER_SECTIONS.has(section.title.toLowerCase())
                return (
                    <div key={si} className="mb-4">
                        {/* Section heading */}
                        <h2
                            className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a] border-b border-[#1a1a1a] pb-0.5 mb-2"
                            style={{ fontFamily: "inherit" }}
                        >
                            {section.title}
                        </h2>

                        {/* Top-level paragraphs (e.g. Summary text) */}
                        {section.paragraphs.map((p, pi) => (
                            <p key={pi} className="text-[13px] mb-1 text-[#333]">{stripMd(p)}</p>
                        ))}

                        {/* Top-level bullets (e.g. Skills list) */}
                        {section.bullets.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                {section.bullets.map((b, bi) => (
                                    <span key={bi} className="text-[13px] text-[#333]">
                                        <span className="mr-1 text-[#888]">•</span>{stripMd(b)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Subsections */}
                        {section.subsections.map((sub, subi) => (
                            <div key={subi} className={`mb-2.5 ${isExp && subi > 0 ? "mt-2.5" : ""}`}>
                                <div className="flex justify-between items-baseline gap-2">
                                    <span className="font-bold text-[13px] text-[#1a1a1a]">{stripMd(sub.heading)}</span>
                                    {sub.subheading && (
                                        <span className="text-[11px] text-[#666] shrink-0 italic">{stripMd(sub.subheading)}</span>
                                    )}
                                </div>

                                {sub.paragraphs.map((p, pi) => (
                                    <p key={pi} className="text-[12px] text-[#555] italic mt-0.5">{stripMd(p)}</p>
                                ))}

                                {sub.bullets.length > 0 && (
                                    <ul className="mt-1 space-y-0.5 ml-3">
                                        {sub.bullets.map((b, bi) => (
                                            <li key={bi} className="text-[12.5px] text-[#333] flex gap-1.5">
                                                <span className="mt-[5px] w-1 h-1 rounded-full bg-[#555] shrink-0" />
                                                {stripMd(b)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )
            })}
        </div>
    )
}
