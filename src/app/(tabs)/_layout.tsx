import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { usePendingTasks } from "@/features/applications/usePendingTasks";
import { fonts, colors, fontSizes } from "@/ui/tokens";
import { t } from "@/i18n/pt-BR";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const icon = (name: IconName, focusedName: IconName) =>
  function TabIcon({ color, focused, size }: { color: unknown; focused: boolean; size: number }) {
    return <Ionicons name={focused ? focusedName : name} size={size} color={typeof color === "string" ? color : colors.textMuted} />;
  };

export default function TabsLayout() {
  const { tasks } = usePendingTasks();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.canvasAlt, borderTopColor: colors.border, minHeight: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: fontSizes.xs },
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      <Tabs.Screen name="jobs" options={{ title: t.tabs.jobs, tabBarIcon: icon("briefcase-outline", "briefcase") }} />
      <Tabs.Screen name="applications" options={{ title: t.tabs.applications, tabBarIcon: icon("document-text-outline", "document-text"), tabBarBadge: tasks.length || undefined, tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.text } }} />
      <Tabs.Screen name="assessments" options={{ title: t.tabs.assessments, tabBarIcon: icon("pulse-outline", "pulse") }} />
      <Tabs.Screen name="profile" options={{ title: t.tabs.profile, tabBarIcon: icon("person-outline", "person") }} />
    </Tabs>
  );
}
