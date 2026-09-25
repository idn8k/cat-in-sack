import * as SplashScreen from "expo-splash-screen";
import { useSession } from "./auth-context";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
