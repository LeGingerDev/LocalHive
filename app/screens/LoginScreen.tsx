import { useState } from "react"
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Feather from "react-native-vector-icons/Feather"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import Ionicons from "react-native-vector-icons/Ionicons"

import { CustomGradient } from "../components/CustomGradient"
import { Screen } from "../components/Screen"
import { TextField } from "../components/TextField"
import { Switch } from "../components/Toggle/Switch"
import { Text } from "@/components/Text"
import { AuthService } from "../services/supabase/authService"
import googleAuthService from "@/services/supabase/googleAuthService"

const GoogleIcon = () => (
  <View style={styles.iconContainer}>
    <FontAwesome name="google" size={20} color="#4285F4" />
  </View>
)

const AppleIcon = () => (
  <View style={styles.iconContainer}>
    <FontAwesome name="apple" size={22} color="white" />
  </View>
)

export const LoginScreen = () => {
  const navigation = useNavigation<any>()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)

  const handleSignUp = () => navigation.navigate("SignUp")
  const handleBack = () => navigation.navigate("Landing")

  const handleLogin = async () => {
    setError("")
    const { user, error } = await AuthService.signInWithEmail(email, password, rememberMe)
    if (user) {
      navigation.navigate("Home")
    } else {
      setError(error?.message || "Login failed. Please try again.")
    }
  }

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) return // Prevent multiple sign-in attempts

    setIsGoogleSigningIn(true)
    try {
      const result = await googleAuthService.signInWithGoogle()

      if (result.success) {
        // Navigate to home screen on successful authentication
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        })
      } else {
        // Handle different error cases
        if (result.error === "CANCELLED") {
          // User cancelled the sign-in, no need to show error
          return
        } else if (result.error === "PLAY_SERVICES_NOT_AVAILABLE") {
          Alert.alert(
            "Google Play Services Required",
            "Please update Google Play Services to use Google Sign-In.",
            [{ text: "OK" }],
          )
        } else {
          Alert.alert(
            "Sign-In Failed",
            result.message || "An error occurred during sign-in. Please try again.",
            [{ text: "OK" }],
          )
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      Alert.alert("Sign-In Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ])
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={styles.container} safeAreaEdges={[]}>
      <CustomGradient
        preset="primary"
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.contentContainer}>
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to GroupHub</Text>

          {/* Form */}
          <View style={styles.form}>
            <TextField
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email address"
              containerStyle={styles.textField}
              style={styles.textInput}
              inputWrapperStyle={styles.textInputWrapper}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <TextField
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!isPasswordVisible}
              placeholder="Password"
              containerStyle={styles.textField}
              style={styles.textInput}
              inputWrapperStyle={styles.textInputWrapper}
              placeholderTextColor="rgba(255,255,255,0.6)"
              RightAccessory={() => (
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={isPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              )}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.rememberMeRow}>
              <Switch value={rememberMe} onValueChange={setRememberMe} />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>
            <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, isGoogleSigningIn && styles.socialButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleSigningIn}
            >
              {isGoogleSigningIn ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>...</Text>
                </View>
              ) : (
                <GoogleIcon />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <AppleIcon />
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomGradient>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    left: 20,
    position: "absolute",
    top: 50,
    width: 40,
    zIndex: 10,
  },
  background: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  divider: { backgroundColor: "rgba(255,255,255,0.3)", flex: 1, height: 1 },
  dividerRow: { alignItems: "center", flexDirection: "row", marginBottom: 16, width: "100%" },
  dividerText: { color: "white", fontSize: 14, paddingHorizontal: 10 },
  errorText: {
    color: "red",
    marginBottom: 8,
    textAlign: "center",
  },
  eyeIcon: { padding: 10 },
  form: { alignItems: "center", marginBottom: 24, width: "100%" },
  iconContainer: { alignItems: "center", justifyContent: "center" },
  loadingContainer: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  loadingText: {
    color: "white",
    fontSize: 20,
  },
  logo: { height: 40, width: 40 },
  logoBox: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 3,
    height: 80,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 80,
  },
  logoContainer: { alignItems: "center", marginBottom: 16 },
  rememberMeRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    marginBottom: 16,
  },
  rememberMeText: { color: "white", fontSize: 14, marginLeft: 8 },
  signInButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    marginBottom: 16,
    width: "100%",
  },
  signInButtonText: { color: "#7727c3", fontSize: 16, fontWeight: "bold" },
  signUpLink: { color: "white", fontSize: 14, fontWeight: "bold" },
  signUpRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  signUpText: { color: "white", fontSize: 14 },
  socialButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginHorizontal: 8,
    width: 48,
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  socialRow: { flexDirection: "row", justifyContent: "center", marginBottom: 32, width: "100%" },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
    textAlign: "center",
  },
  textField: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 0,
    height: 50,
    marginBottom: 16,
    paddingHorizontal: 0,
    width: "100%",
  },
  textInput: {
    color: "white",
    fontSize: 16,
    height: 50,
    paddingHorizontal: 16,
  },
  textInputWrapper: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    height: 50,
  },
  title: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
})
