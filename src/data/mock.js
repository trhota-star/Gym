// Realistic mock data for PulseFit. Swap for API calls when a backend exists.

export const user = {
  name: 'Maya Torres',
  firstName: 'Maya',
  handle: '@mayalifts',
  initials: 'MT',
  memberSince: 'March 2024',
  membership: 'Pro Elite',
  level: 18,
  xp: 7420,
  xpToNext: 9000,
  homeGym: 'PulseFit Downtown',
  streak: 12,
  bestStreak: 21,
  weeklyGoal: 5,
};

export const platformStats = [
  { label: 'Active members', value: 48210, suffix: '+' },
  { label: 'Workouts completed', value: 1284390, suffix: '' },
  { label: 'Classes this week', value: 326, suffix: '' },
];

export const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'Strength doesn’t come from what you can do. It comes from overcoming what you once thought you couldn’t.', author: 'Rikki Rogers' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln (attributed)' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
  { text: 'You don’t have to be extreme, just consistent.', author: 'Unknown' },
  { text: 'Sweat is just fat crying.', author: 'Gym wisdom' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
];

export const quoteOfTheDay = () => {
  const day = Math.floor(Date.now() / 86_400_000);
  return quotes[day % quotes.length];
};

export const weeklyGoals = {
  workouts: { done: 4, target: 5 },
  minutes: { done: 212, target: 300 },
  goals: { done: 7, target: 10 },
};

export const weeklyActivity = [
  { day: 'Mon', minutes: 48, calories: 410 },
  { day: 'Tue', minutes: 62, calories: 540 },
  { day: 'Wed', minutes: 0, calories: 0 },
  { day: 'Thu', minutes: 55, calories: 470 },
  { day: 'Fri', minutes: 47, calories: 395 },
  { day: 'Sat', minutes: 0, calories: 0 },
  { day: 'Sun', minutes: 0, calories: 0 },
];

export const muscleGroups = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio'];

export const exercises = [
  { id: 'bench', name: 'Barbell Bench Press', group: 'Chest', sets: 4, reps: '6–8', difficulty: 'Intermediate', equipment: 'Barbell', rest: 120, kcal: 95 },
  { id: 'incline-db', name: 'Incline Dumbbell Press', group: 'Chest', sets: 3, reps: '8–10', difficulty: 'Intermediate', equipment: 'Dumbbells', rest: 90, kcal: 80 },
  { id: 'pushup', name: 'Tempo Push-Ups', group: 'Chest', sets: 3, reps: '12–15', difficulty: 'Beginner', equipment: 'Bodyweight', rest: 60, kcal: 55 },
  { id: 'cable-fly', name: 'Cable Crossover Fly', group: 'Chest', sets: 3, reps: '12', difficulty: 'Beginner', equipment: 'Cable', rest: 60, kcal: 50 },
  { id: 'deadlift', name: 'Conventional Deadlift', group: 'Back', sets: 5, reps: '3–5', difficulty: 'Advanced', equipment: 'Barbell', rest: 180, kcal: 130 },
  { id: 'pullup', name: 'Weighted Pull-Ups', group: 'Back', sets: 4, reps: '5–8', difficulty: 'Advanced', equipment: 'Pull-up bar', rest: 120, kcal: 85 },
  { id: 'row', name: 'Chest-Supported Row', group: 'Back', sets: 3, reps: '10–12', difficulty: 'Beginner', equipment: 'Machine', rest: 75, kcal: 70 },
  { id: 'lat-pull', name: 'Lat Pulldown', group: 'Back', sets: 3, reps: '10–12', difficulty: 'Beginner', equipment: 'Cable', rest: 75, kcal: 65 },
  { id: 'squat', name: 'Back Squat', group: 'Legs', sets: 5, reps: '5', difficulty: 'Advanced', equipment: 'Barbell', rest: 180, kcal: 140 },
  { id: 'rdl', name: 'Romanian Deadlift', group: 'Legs', sets: 4, reps: '8', difficulty: 'Intermediate', equipment: 'Barbell', rest: 120, kcal: 110 },
  { id: 'split-squat', name: 'Bulgarian Split Squat', group: 'Legs', sets: 3, reps: '10 / leg', difficulty: 'Intermediate', equipment: 'Dumbbells', rest: 90, kcal: 95 },
  { id: 'leg-press', name: 'Leg Press', group: 'Legs', sets: 3, reps: '12', difficulty: 'Beginner', equipment: 'Machine', rest: 90, kcal: 90 },
  { id: 'curl', name: 'EZ-Bar Curl', group: 'Arms', sets: 3, reps: '10–12', difficulty: 'Beginner', equipment: 'EZ bar', rest: 60, kcal: 40 },
  { id: 'hammer', name: 'Hammer Curl', group: 'Arms', sets: 3, reps: '12', difficulty: 'Beginner', equipment: 'Dumbbells', rest: 60, kcal: 38 },
  { id: 'dips', name: 'Weighted Dips', group: 'Arms', sets: 4, reps: '8', difficulty: 'Advanced', equipment: 'Dip bars', rest: 90, kcal: 70 },
  { id: 'skull', name: 'Skull Crushers', group: 'Arms', sets: 3, reps: '10', difficulty: 'Intermediate', equipment: 'EZ bar', rest: 75, kcal: 45 },
  { id: 'plank', name: 'Plank Hold', group: 'Core', sets: 3, reps: '60 s', difficulty: 'Beginner', equipment: 'Bodyweight', rest: 45, kcal: 30 },
  { id: 'hanging-raise', name: 'Hanging Leg Raise', group: 'Core', sets: 3, reps: '12', difficulty: 'Intermediate', equipment: 'Pull-up bar', rest: 60, kcal: 45 },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', group: 'Core', sets: 3, reps: '10', difficulty: 'Advanced', equipment: 'Ab wheel', rest: 60, kcal: 45 },
  { id: 'pallof', name: 'Pallof Press', group: 'Core', sets: 3, reps: '12 / side', difficulty: 'Beginner', equipment: 'Cable', rest: 45, kcal: 35 },
  { id: 'intervals', name: 'Treadmill Intervals', group: 'Cardio', sets: 8, reps: '30 s sprint', difficulty: 'Intermediate', equipment: 'Treadmill', rest: 60, kcal: 220 },
  { id: 'rower', name: '500 m Row Repeats', group: 'Cardio', sets: 5, reps: '500 m', difficulty: 'Advanced', equipment: 'Rower', rest: 90, kcal: 240 },
  { id: 'jump-rope', name: 'Jump Rope Rounds', group: 'Cardio', sets: 6, reps: '60 s', difficulty: 'Beginner', equipment: 'Jump rope', rest: 30, kcal: 160 },
  { id: 'assault-bike', name: 'Assault Bike Tabata', group: 'Cardio', sets: 8, reps: '20 s on', difficulty: 'Advanced', equipment: 'Air bike', rest: 10, kcal: 180 },
];

export const todaysWorkout = {
  id: 'push-power',
  title: 'Push Power',
  subtitle: 'Chest · Shoulders · Triceps',
  duration: 52,
  kcal: 430,
  focus: 'Strength',
  coachNote: 'Last week you hit 82.5 kg × 6 on bench. Try 85 kg today. You’ve got this.',
  exercises: [
    { id: 'bench', name: 'Barbell Bench Press', sets: 4, reps: '6–8', weight: '85 kg', rest: 90 },
    { id: 'incline-db', name: 'Incline Dumbbell Press', sets: 3, reps: '10', weight: '28 kg', rest: 75 },
    { id: 'dips', name: 'Weighted Dips', sets: 3, reps: '8', weight: '+10 kg', rest: 60 },
    { id: 'cable-fly', name: 'Cable Crossover Fly', sets: 3, reps: '12', weight: '15 kg', rest: 45 },
  ],
};

// Estimated 1RM (kg) over the last 12 weeks
export const strengthHistory = [
  { week: 'W1', squat: 110, bench: 77.5, deadlift: 140 },
  { week: 'W2', squat: 112.5, bench: 77.5, deadlift: 142.5 },
  { week: 'W3', squat: 115, bench: 80, deadlift: 145 },
  { week: 'W4', squat: 115, bench: 80, deadlift: 150 },
  { week: 'W5', squat: 117.5, bench: 82.5, deadlift: 152.5 },
  { week: 'W6', squat: 120, bench: 82.5, deadlift: 155 },
  { week: 'W7', squat: 120, bench: 85, deadlift: 157.5 },
  { week: 'W8', squat: 122.5, bench: 85, deadlift: 160 },
  { week: 'W9', squat: 125, bench: 87.5, deadlift: 162.5 },
  { week: 'W10', squat: 127.5, bench: 87.5, deadlift: 165 },
  { week: 'W11', squat: 130, bench: 90, deadlift: 167.5 },
  { week: 'W12', squat: 132.5, bench: 92.5, deadlift: 172.5 },
];

export const personalRecords = [
  { lift: 'Deadlift', value: '172.5 kg', date: 'Oct 12', delta: '+7.5 kg', tier: 'gold' },
  { lift: 'Back Squat', value: '132.5 kg', date: 'Oct 10', delta: '+5 kg', tier: 'gold' },
  { lift: 'Bench Press', value: '92.5 kg', date: 'Oct 8', delta: '+2.5 kg', tier: 'silver' },
  { lift: 'Pull-Ups', value: '18 reps', date: 'Sep 29', delta: '+3 reps', tier: 'silver' },
  { lift: '5K Run', value: '22:41', date: 'Sep 21', delta: '−0:48', tier: 'bronze' },
  { lift: 'Plank', value: '4:05', date: 'Sep 14', delta: '+0:35', tier: 'bronze' },
];

export const classTypes = ['Yoga', 'HIIT', 'Spin', 'Boxing'];

export const weekDays = [
  { key: 'mon', short: 'Mon', date: 13 },
  { key: 'tue', short: 'Tue', date: 14 },
  { key: 'wed', short: 'Wed', date: 15 },
  { key: 'thu', short: 'Thu', date: 16 },
  { key: 'fri', short: 'Fri', date: 17 },
  { key: 'sat', short: 'Sat', date: 18 },
  { key: 'sun', short: 'Sun', date: 19 },
];

export const classes = [
  { id: 'c1', day: 'mon', time: '06:30', type: 'HIIT', title: 'Sunrise Shred', coach: 'Jordan Blake', duration: 45, room: 'Studio A', spots: 4, capacity: 20, intensity: 3 },
  { id: 'c2', day: 'mon', time: '18:00', type: 'Yoga', title: 'Flow & Restore', coach: 'Priya Nair', duration: 60, room: 'Zen Room', spots: 9, capacity: 18, intensity: 1 },
  { id: 'c3', day: 'tue', time: '07:00', type: 'Spin', title: 'Rhythm Ride', coach: 'Leo Martins', duration: 45, room: 'Cycle Lab', spots: 0, capacity: 24, intensity: 2 },
  { id: 'c4', day: 'tue', time: '19:00', type: 'Boxing', title: 'Fight Club Fundamentals', coach: 'Ana Ruiz', duration: 50, room: 'Ring', spots: 6, capacity: 16, intensity: 3 },
  { id: 'c5', day: 'wed', time: '06:30', type: 'Yoga', title: 'Power Vinyasa', coach: 'Priya Nair', duration: 50, room: 'Zen Room', spots: 3, capacity: 18, intensity: 2 },
  { id: 'c6', day: 'wed', time: '12:15', type: 'HIIT', title: 'Lunch Break Burn', coach: 'Jordan Blake', duration: 30, room: 'Studio A', spots: 11, capacity: 20, intensity: 3 },
  { id: 'c7', day: 'wed', time: '18:30', type: 'Spin', title: 'Climb Night', coach: 'Leo Martins', duration: 45, room: 'Cycle Lab', spots: 2, capacity: 24, intensity: 3 },
  { id: 'c8', day: 'wed', time: '20:00', type: 'Boxing', title: 'Pads & Combos', coach: 'Ana Ruiz', duration: 45, room: 'Ring', spots: 7, capacity: 16, intensity: 2 },
  { id: 'c9', day: 'thu', time: '07:00', type: 'HIIT', title: 'Tabata Torch', coach: 'Sam Okafor', duration: 40, room: 'Studio A', spots: 0, capacity: 20, intensity: 3 },
  { id: 'c10', day: 'thu', time: '18:00', type: 'Yoga', title: 'Yin & Breath', coach: 'Mei Chen', duration: 60, room: 'Zen Room', spots: 12, capacity: 18, intensity: 1 },
  { id: 'c11', day: 'fri', time: '06:30', type: 'Spin', title: 'Friday Sprint Ride', coach: 'Leo Martins', duration: 45, room: 'Cycle Lab', spots: 8, capacity: 24, intensity: 3 },
  { id: 'c12', day: 'fri', time: '17:30', type: 'Boxing', title: 'Heavy Bag Hustle', coach: 'Ana Ruiz', duration: 50, room: 'Ring', spots: 1, capacity: 16, intensity: 3 },
  { id: 'c13', day: 'sat', time: '09:00', type: 'HIIT', title: 'Weekend Warrior', coach: 'Sam Okafor', duration: 50, room: 'Studio A', spots: 5, capacity: 22, intensity: 3 },
  { id: 'c14', day: 'sat', time: '10:30', type: 'Yoga', title: 'Slow Flow Saturday', coach: 'Mei Chen', duration: 75, room: 'Zen Room', spots: 14, capacity: 18, intensity: 1 },
  { id: 'c15', day: 'sun', time: '10:00', type: 'Spin', title: 'Sunday Endurance', coach: 'Leo Martins', duration: 60, room: 'Cycle Lab', spots: 10, capacity: 24, intensity: 2 },
];

export const achievements = [
  { id: 'a1', title: 'First Rep', desc: 'Complete your first workout', icon: 'Zap', unlocked: true },
  { id: 'a2', title: 'On Fire', desc: '7-day workout streak', icon: 'Flame', unlocked: true },
  { id: 'a3', title: 'Iron Club', desc: 'Lift 10,000 kg total volume', icon: 'Dumbbell', unlocked: true },
  { id: 'a4', title: 'Early Bird', desc: '10 workouts before 7 AM', icon: 'Sunrise', unlocked: true },
  { id: 'a5', title: 'Class Act', desc: 'Attend 25 group classes', icon: 'Users', unlocked: true },
  { id: 'a6', title: 'PR Machine', desc: 'Set 10 personal records', icon: 'Trophy', unlocked: true },
  { id: 'a7', title: 'Unstoppable', desc: '30-day workout streak', icon: 'Rocket', unlocked: false, progress: 12, target: 30 },
  { id: 'a8', title: 'Century', desc: 'Complete 100 workouts', icon: 'Medal', unlocked: false, progress: 86, target: 100 },
  { id: 'a9', title: 'Marathoner', desc: 'Log 42 km of cardio in a month', icon: 'Timer', unlocked: false, progress: 27, target: 42 },
];

export const lifetimeStats = [
  { label: 'Workouts', value: 86 },
  { label: 'Hours trained', value: 71 },
  { label: 'Classes', value: 29 },
  { label: 'PRs set', value: 14 },
];
