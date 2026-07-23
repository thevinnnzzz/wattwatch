import { Tabs } from 'expo-router';
import { usePalette } from '@/constants/usePalette';
import TabBarIcon from './layout/TabBarIcon';

export default function AppTabs() {
  const p = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.gold,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: {
          backgroundColor: p.bg,
          borderTopColor: p.divider,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appliances"
        options={{
          title: 'Appliances',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="flash" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="person" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-appliance"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="appliance-details"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="admin"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="about"
        options={{ href: null }}
      />
    </Tabs>
  );
}
