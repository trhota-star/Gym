import { CalendarDays, Dumbbell, LayoutDashboard, LineChart, Timer, UserRound } from 'lucide-react';

export const navItems = [
  { key: 'dashboard', label: 'Dashboard', short: 'Home', Icon: LayoutDashboard },
  { key: 'library', label: 'Workout Library', short: 'Library', Icon: Dumbbell },
  { key: 'workout', label: 'Live Workout', short: 'Train', Icon: Timer, featured: true },
  { key: 'progress', label: 'Progress', short: 'Progress', Icon: LineChart },
  { key: 'classes', label: 'Class Booking', short: 'Classes', Icon: CalendarDays },
  { key: 'profile', label: 'Profile', short: 'Profile', Icon: UserRound },
];
