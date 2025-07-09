import React from "react"
import { View } from "react-native"
import { useAppTheme } from "@/theme/context"
import { useNavigation } from "@react-navigation/native"
import { ProfileBox } from "@/components/profiles/ProfileBox"
import { AppearanceSection } from "@/components/profiles/AppearanceSection"
import { SettingsSection } from "@/components/profiles/SettingsSection"
import { SettingsItem } from "@/components/profiles/SettingsItem"
import googleAuthService  from "@/services/supabase/googleAuthService"

const ProfileScreen = () => {
  const { theme } = useAppTheme()
  const navigation = useNavigation<any>()

const handleSignOut = async () => {
  try {
    await googleAuthService.signOut(); // ✅ Use Google auth service
    
    navigation.reset({
      index: 0,
      routes: [{ name: "Landing" }],
    });
  } catch (error) {
    console.error("Error during sign out:", error);
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 16 }}>
      <ProfileBox />
      <AppearanceSection />
      <SettingsSection header="Settings">
        <SettingsItem icon="notifications-outline" label="Notifications" first />
        <SettingsItem icon="lock-closed-outline" label="Privacy & Security" />
        <SettingsItem icon="help-circle-outline" label="Help & Support" />
        <SettingsItem icon="information-circle-outline" label="About Local Hive" />
        <SettingsItem icon="log-out-outline" label="Sign Out" signOut last onPress={handleSignOut} />
      </SettingsSection>
    </View>
  )
}

export default ProfileScreen 