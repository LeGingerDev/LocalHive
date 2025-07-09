import React from "react"
import { useAppTheme } from "@/theme/context"
import { SettingsSection } from "./SettingsSection"
import { SettingsItem } from "./SettingsItem"

export interface AppearanceSectionProps {}

export const AppearanceSection: React.FC<AppearanceSectionProps> = () => {
  const { themeContext, setThemeContextOverride } = useAppTheme()

  const handleDarkModeToggle = (value: boolean) => {
    setThemeContextOverride(value ? "dark" : "light")
  }

  return (
    <SettingsSection header="Appearance">
      <SettingsItem
        icon="moon-outline"
        label="Dark Mode"
        toggle
        toggleValue={themeContext === "dark"}
        onToggleChange={handleDarkModeToggle}
        first
        last
      />
    </SettingsSection>
  )
}
