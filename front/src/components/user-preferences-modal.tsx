"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/buttonTable"
import { Input } from "@/components/ui/inputInteractive"
import { Label } from "@/components/ui/labelInteractive"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { userApi, getAuthToken } from "@/lib/api"
import { toast } from "sonner"
import { UserPreferences } from "@/lib/api/user"
import {
    GetCountries,
    GetState,
    GetCity,
} from "react-country-state-city"

interface Country {
    id: number;
    name: string;
    emoji: string;
}

interface State {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
}

interface UserPreferencesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved?: (prefs: UserPreferences) => void
    initialData?: UserPreferences | null
}

export default function UserPreferencesModal({
    open,
    onOpenChange,
    onSaved,
    initialData,
}: UserPreferencesModalProps) {
    const [loading, setLoading] = useState(false)
    const [countriesList, setCountriesList] = useState<Country[]>([])
    const [citiesList, setCitiesList] = useState<City[]>([])
    const [citiesLoading, setCitiesLoading] = useState(false)
    const [citiesCache, setCitiesCache] = useState<Record<string, City[]>>({})
    const [formData, setFormData] = useState<UserPreferences>({
        salary_min: null,
        salary_max: null,
        visa_sponsorship: false,
        remote_friendly: false,
        country: "",
        city: "",
        experience: null,
    })

    useEffect(() => {
        GetCountries().then((result: Country[]) => {
            setCountriesList(result)
        })
    }, [])

    useEffect(() => {
        if (open && initialData) {
            setFormData({
                salary_min: initialData.salary_min ?? null,
                salary_max: initialData.salary_max ?? null,
                visa_sponsorship: initialData.visa_sponsorship ?? false,
                remote_friendly: initialData.remote_friendly ?? false,
                country: initialData.country ?? "",
                city: initialData.city ?? "",
                experience: initialData.experience ?? null,
            })
        } else if (open && !initialData) {
            setFormData({
                salary_min: null,
                salary_max: null,
                visa_sponsorship: false,
                remote_friendly: false,
                country: "",
                city: "",
                experience: null,
            })
        }
    }, [open, initialData])

    useEffect(() => {
        const countryName = formData.country
        if (countryName) {
            // Check cache first
            if (citiesCache[countryName]) {
                setCitiesList(citiesCache[countryName])
                setCitiesLoading(false)
                return
            }

            const countryObj = countriesList.find(c => c.name === countryName)
            if (countryObj) {
                setCitiesLoading(true)
                GetState(countryObj.id).then((states: State[]) => {
                    if (states.length > 0) {
                        Promise.all(
                            states.map(state => GetCity(countryObj.id, state.id))
                        ).then((results: City[][]) => {
                            const allCities = results.flat().sort((a, b) => a.name.localeCompare(b.name))
                            setCitiesCache(prev => ({ ...prev, [countryName as string]: allCities }))
                            setCitiesList(allCities)
                            setCitiesLoading(false)
                        }).catch(() => setCitiesLoading(false))
                    } else {
                        setCitiesList([])
                        setCitiesLoading(false)
                    }
                }).catch(() => setCitiesLoading(false))
            }
        } else {
            setCitiesList([])
            setCitiesLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.country, countriesList])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = getAuthToken()
        if (!token) {
            toast.error("Authentication required")
            return
        }

        try {
            setLoading(true)
            const updatedPrefs = await userApi.updateUserPreferences({
                ...formData,
                token: token,
            })
            toast.success("Preferences updated successfully")
            onSaved?.(updatedPrefs)
            window.dispatchEvent(new CustomEvent('preferences-updated', { detail: updatedPrefs }))
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to update preferences:", error)
            toast.error("Failed to update preferences")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (
        field: keyof UserPreferences,
        value: string | number | boolean | null
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const availableCities = ["Remote", ...citiesList.map(c => c.name)]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] w-[95vw] p-0 overflow-hidden glass-panel border-white/20 shadow-2xl backdrop-blur-3xl max-h-[95vh] flex flex-col">
                <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-white/10 shrink-0 bg-white/5">
                    <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight italic">
                        Preference <span className="text-primary italic">Matrix</span>
                    </DialogTitle>
                    <DialogDescription className="text-[10px] sm:text-sm text-muted-foreground font-medium">
                        Calibrate your neural filters for higher precision job matching.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 bg-white/5 custom-scrollbar">
                    {/* Salary Range Section */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            Compensation Vector
                        </Label>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salary_min" className="text-xs font-bold text-muted-foreground">Min Registry</Label>
                                <Input
                                    id="salary_min"
                                    type="number"
                                    placeholder="50k"
                                    className="bg-white/5 border-white/10 rounded-xl"
                                    value={formData.salary_min ?? ""}
                                    onChange={(e) => handleChange("salary_min", e.target.value ? parseInt(e.target.value) : null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salary_max" className="text-xs font-bold text-muted-foreground">Max Registry</Label>
                                <Input
                                    id="salary_max"
                                    type="number"
                                    placeholder="150k"
                                    className="bg-white/5 border-white/10 rounded-xl"
                                    value={formData.salary_max ?? ""}
                                    onChange={(e) => handleChange("salary_max", e.target.value ? parseInt(e.target.value) : null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Geolocation Section */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">
                            Geolocation Node
                        </Label>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-xs font-bold text-muted-foreground">Global Cluster</Label>
                                <Select
                                    value={formData.country ?? ""}
                                    onValueChange={(value) => {
                                        handleChange("country", value)
                                        handleChange("city", "")
                                    }}
                                >
                                    <SelectTrigger id="country" className="bg-white/5 border-white/10 rounded-xl">
                                        <SelectValue placeholder="Select Cluster" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/20">
                                        {countriesList.slice(0, 100).map((country) => (
                                            <SelectItem key={country.id} value={country.name} className="focus:bg-primary/20">
                                                {country.emoji} {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-xs font-bold text-muted-foreground">Local Registry</Label>
                                <Select
                                    value={formData.city ?? ""}
                                    onValueChange={(value) => handleChange("city", value)}
                                    disabled={!formData.country && formData.city !== "Remote"}
                                >
                                    <SelectTrigger id="city" className="bg-white/5 border-white/10 rounded-xl">
                                        <SelectValue placeholder={citiesLoading ? "Syncing..." : "Select City"} />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/20">
                                        {citiesLoading ? (
                                            <div className="flex items-center justify-center p-4">
                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground animate-pulse">Scanning…</span>
                                            </div>
                                        ) : (
                                            availableCities.map((city) => (
                                                <SelectItem key={city} value={city} className="focus:bg-primary/20">
                                                    {city}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Logic Gates (Checkboxes) */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                            Constraint Gates
                        </Label>
                        <div className="grid grid-cols-1 gap-4">
                            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors group">
                                <Checkbox
                                    id="visa_sponsorship"
                                    checked={formData.visa_sponsorship ?? false}
                                    onCheckedChange={(checked) => handleChange("visa_sponsorship", checked)}
                                    className="border-white/20 data-[state=checked]:bg-primary rounded-md"
                                />
                                <div className="space-y-0.5">
                                    <span className="text-sm font-bold group-hover:text-primary transition-colors">Relocation Protocol</span>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Filter for Visa-sponsored nodes only</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors group">
                                <Checkbox
                                    id="remote_friendly"
                                    checked={formData.remote_friendly ?? false}
                                    onCheckedChange={(checked) => handleChange("remote_friendly", checked)}
                                    className="border-white/20 data-[state=checked]:bg-secondary rounded-md"
                                />
                                <div className="space-y-0.5">
                                    <span className="text-sm font-bold group-hover:text-secondary transition-colors">Distributed Sync</span>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Prioritize remote-friendly clusters</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-white/10">
                        <Button 
                            variant="default" 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 text-lg font-black uppercase tracking-tight rounded-2xl shadow-xl shadow-primary/20"
                        >
                            {loading ? "Synchronizing…" : "Deploy Preferences"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
