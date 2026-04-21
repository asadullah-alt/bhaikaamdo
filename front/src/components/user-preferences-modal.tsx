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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>User Preferences</DialogTitle>
                    <DialogDescription>
                        Set your job preferences to get better matches.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="salary_min">Min Salary</Label>
                            <Input
                                id="salary_min"
                                type="number"
                                placeholder="e.g. 50000"
                                value={formData.salary_min ?? ""}
                                onChange={(e) => handleChange("salary_min", e.target.value ? parseInt(e.target.value) : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="salary_max">Max Salary</Label>
                            <Input
                                id="salary_max"
                                type="number"
                                placeholder="e.g. 150000"
                                value={formData.salary_max ?? ""}
                                onChange={(e) => handleChange("salary_max", e.target.value ? parseInt(e.target.value) : null)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                            id="experience"
                            type="number"
                            step="0.5"
                            placeholder="e.g. 2.5"
                            value={formData.experience ?? ""}
                            onChange={(e) => handleChange("experience", e.target.value ? parseFloat(e.target.value) : null)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="country">Country</Label>
                            <Select
                                value={formData.country ?? ""}
                                onValueChange={(value) => {
                                    handleChange("country", value)
                                    handleChange("city", "")
                                }}
                            >
                                <SelectTrigger id="country">
                                    <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countriesList.map((country) => (
                                        <SelectItem key={country.id} value={country.name}>
                                            {country.emoji} {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Select
                                value={formData.city ?? ""}
                                onValueChange={(value) => handleChange("city", value)}
                                disabled={!formData.country && formData.city !== "Remote"}
                            >
                                <SelectTrigger id="city">
                                    <SelectValue placeholder={citiesLoading ? "Loading..." : "Select City"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {citiesLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <span className="text-sm text-muted-foreground animate-pulse">Loading cities...</span>
                                        </div>
                                    ) : (
                                        availableCities.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="visa_sponsorship"
                            checked={formData.visa_sponsorship ?? false}
                            onCheckedChange={(checked) => handleChange("visa_sponsorship", checked)}
                        />
                        <Label htmlFor="visa_sponsorship" className="cursor-pointer">
                            Visa Sponsorship Required
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remote_friendly"
                            checked={formData.remote_friendly ?? false}
                            onCheckedChange={(checked) => handleChange("remote_friendly", checked)}
                        />
                        <Label htmlFor="remote_friendly" className="cursor-pointer">
                            Remote Friendly Only
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Preferences"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
