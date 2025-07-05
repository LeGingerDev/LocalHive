import { Redirect } from "expo-router";

// The root route redirects to the splash screen
export default function Index() {
  return <Redirect href="/splash" />;
}
