# CareerForge Project Guide (Luminous Glass Edition)

## Project Vision
A premium, elegant career platform built with a high-fidelity "Luminous Glass" aesthetic (inspired by modern appleOS/visionOS). The goal is to make career management feel light, sophisticated, and effortless.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix basis)
- **State**: Zustand (with Persist middleware)
- **Animations**: Framer Motion (Smooth, Spring-based)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React & Tabler Icons

## Design System (Luminous Glass)
- **Aesthetic**: Minimalist, Translucent, and Airy.
- **Backgrounds**: Dynamic, colorful mesh gradients (pinks, purples, sky blues).
- **Surface**: High-translucency glass panels using `backdrop-blur-2xl` and semi-transparent white/gray backgrounds.
- **Borders**: 1px subtle white strokes (`border-white/20`) for a "etched glass" look.
- **Corners**: Extra large radii (`rounded-3xl`) for a soft, friendly hardware feel.
- **Typography**: Geist Sans for everything, using "Tracking-Tight" for headers and "Regular" for body text.

## Frontpage Specification (Luminous Glass)
### 1. Hero: The "Matching Hub"
- **Visuals**: A large, central "Frosted Glass" drop-zone for resumes.
- **Algorithm Focus**: Replace all mentions of "Resume Builder" with "Dual-Vector Matching."
- **Interactive Element**: When a resume is dropped, show a "Scanning" state where vibrant light-beams (Neural pulses) sweep across the document.
- **Headline**: "Precision Career Matching. Forged by Dual-Vector Intelligence."

### 2. The Matching Visualization (Dual-Vector)
- **Concept**: Use two glowing, glass-morphic spheres or nodes (one for "Your Profile", one for "The Market").
- **Animation**: As the algorithm runs, the nodes drift together in a 3D coordinate space until they overlap.
- **Detail**: Display "Semantic Alignment" vs "Dimensional Variance" metrics in small, technical mono text next to the nodes.

### 3. Job Feed: "The Dock"
- **Layout**: A horizontal scrolling "Dock" of jobs or a clean Bento grid.
- **Design**: Each card is a `backdrop-blur-lg` panel. Hovering over a job card triggers a "Reflection" effect that follows the cursor.
- **Matching Indicator**: Instead of a percentage, use a "Luminous Meter"—a soft glowing arc that fills up as the match score increases.

### 4. Navigation: Floating Glass Bar
- **Position**: Floating at the top center.
- **Style**: Highly translucent with a `1px border-white/30`. 
- **Action**: A single "Sync Resume" button that glows with a subtle pulse.

## Coding Standards
### React & Next.js
- Use `use client` strictly only when state or effects are needed.
- Prefer Server Components for data fetching.
- Use `@/components/ui` for base primitive components.
- Centralize all validation in `src/lib/schemas/`.

### UI/UX Implementation
- **Glassmorphism**: Every card must use `bg-white/40 backdrop-blur-xl border border-white/20`.
- **Soft Shadows**: Use multi-layered ambient shadows (`shadow-2xl` with custom spreads) to create real depth.
- **Micro-animations**: Use `framer-motion` for all transitions. Spring-based physics are mandatory for the "Apple" feel (stiffness: 120, damping: 20).
- **Vibrant Matching**: Matching scores should glow with a soft, diffused blue or purple aura.

### State Management (Zustand)
- Global state resides in `src/store/`.
- Use selectors for performance.
- Ensure `persist` middleware is used for resume editing to prevent data loss.

## Core Workflows
- **Resume Matching**: Real-time scoring using the matching API.
- **Document Generation**: Using `@react-pdf/renderer` for professional PDF downloads.
- **Job Analysis**: Automated extraction of keywords from job descriptions.
