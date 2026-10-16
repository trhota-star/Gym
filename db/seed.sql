-- PulseFit sample data. Safe to run repeatedly: rows are matched by their unique
-- name/title and updated in place, so nothing is ever duplicated.

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, equipment, calories, description) VALUES
  -- Chest
  ('Barbell Bench Press',     'Chest', 4, '6–8',      'Intermediate', 120, 'Barbell',     95, 'Lower the bar to mid-chest with elbows at about 45°, then press up explosively.'),
  ('Incline Dumbbell Press',  'Chest', 3, '8–10',     'Intermediate',  90, 'Dumbbells',   80, 'On a 30° bench, press the dumbbells up and slightly together to hit the upper chest.'),
  ('Tempo Push-Ups',          'Chest', 3, '12–15',    'Beginner',      60, 'Bodyweight',  55, 'Three seconds down, one second up. Keep a straight line from head to heels.'),
  ('Cable Crossover Fly',     'Chest', 3, '12',       'Beginner',      60, 'Cable',       50, 'Soft elbows, sweep the handles together in a wide hug and squeeze for a beat.'),
  ('Weighted Chest Dips',     'Chest', 4, '8',        'Advanced',      90, 'Dip bars',    75, 'Lean forward slightly and lower until shoulders are below elbows.'),
  -- Back
  ('Conventional Deadlift',   'Back',  5, '3–5',      'Advanced',     180, 'Barbell',    130, 'Brace hard, push the floor away and lock out with glutes, not your lower back.'),
  ('Weighted Pull-Ups',       'Back',  4, '5–8',      'Advanced',     120, 'Pull-up bar', 85, 'Start from a dead hang and pull until your chin clears the bar.'),
  ('Chest-Supported Row',     'Back',  3, '10–12',    'Beginner',      75, 'Machine',     70, 'Chest stays on the pad. Drive elbows back and pinch the shoulder blades.'),
  ('Lat Pulldown',            'Back',  3, '10–12',    'Beginner',      75, 'Cable',       65, 'Pull the bar to your upper chest while keeping your torso tall.'),
  ('Single-Arm Dumbbell Row', 'Back',  3, '10 / arm', 'Intermediate',  75, 'Dumbbells',   65, 'Brace on a bench and row the dumbbell to your hip, not your armpit.'),
  -- Legs
  ('Back Squat',              'Legs',  5, '5',        'Advanced',     180, 'Barbell',    140, 'Sit between your heels, keep your chest proud and drive up through mid-foot.'),
  ('Romanian Deadlift',       'Legs',  4, '8',        'Intermediate', 120, 'Barbell',    110, 'Push the hips back with soft knees until you feel a deep hamstring stretch.'),
  ('Bulgarian Split Squat',   'Legs',  3, '10 / leg', 'Intermediate',  90, 'Dumbbells',   95, 'Rear foot on a bench, drop the back knee straight down under control.'),
  ('Leg Press',               'Legs',  3, '12',       'Beginner',      90, 'Machine',     90, 'Feet shoulder-width on the platform. Lower until knees reach 90°.'),
  ('Walking Lunges',          'Legs',  3, '12 / leg', 'Beginner',      60, 'Dumbbells',   85, 'Long steps, upright torso, back knee kisses the floor each rep.'),
  -- Arms
  ('EZ-Bar Curl',             'Arms',  3, '10–12',    'Beginner',      60, 'EZ bar',      40, 'Elbows pinned to your sides. No swinging, just biceps.'),
  ('Hammer Curl',             'Arms',  3, '12',       'Beginner',      60, 'Dumbbells',   38, 'Neutral grip, curl to the shoulder to build the brachialis and forearms.'),
  ('Weighted Bench Dips',     'Arms',  4, '8',        'Advanced',      90, 'Bench',       70, 'Hands on a bench behind you, plate on your lap, elbows track straight back.'),
  ('Skull Crushers',          'Arms',  3, '10',       'Intermediate',  75, 'EZ bar',      45, 'Lower the bar to just behind your forehead and extend without flaring the elbows.'),
  ('Overhead Cable Extension','Arms',  3, '12–15',    'Intermediate',  60, 'Cable',       40, 'Face away from the stack and extend overhead for a big triceps stretch.'),
  -- Core
  ('Plank Hold',              'Core',  3, '60 s',     'Beginner',      45, 'Bodyweight',  30, 'Squeeze glutes and pull elbows toward toes to make every second count.'),
  ('Hanging Leg Raise',       'Core',  3, '12',       'Intermediate',  60, 'Pull-up bar', 45, 'Curl the pelvis up at the top. Avoid swinging between reps.'),
  ('Ab Wheel Rollout',        'Core',  3, '10',       'Advanced',      60, 'Ab wheel',    45, 'Roll out as far as you can without your lower back sagging, then pull back.'),
  ('Pallof Press',            'Core',  3, '12 / side','Beginner',      45, 'Cable',       35, 'Press the handle straight out and resist the cable pulling you sideways.'),
  ('Dead Bug',                'Core',  3, '10 / side','Beginner',      45, 'Bodyweight',  30, 'Lower back glued to the floor while you extend opposite arm and leg.'),
  -- Cardio
  ('Treadmill Intervals',     'Cardio',8, '30 s sprint','Intermediate', 60, 'Treadmill', 220, 'Sprint hard for 30 seconds, then walk or jog easy during the rest.'),
  ('500 m Row Repeats',       'Cardio',5, '500 m',    'Advanced',      90, 'Rower',      240, 'Legs, then hips, then arms. Aim for a steady split on every repeat.'),
  ('Jump Rope Rounds',        'Cardio',6, '60 s',     'Beginner',      30, 'Jump rope',  160, 'Stay light on the balls of your feet with small, quick hops.'),
  ('Assault Bike Tabata',     'Cardio',8, '20 s on',  'Advanced',      10, 'Air bike',   180, 'Twenty seconds all-out, ten seconds rest. Eight rounds of pure effort.'),
  ('Burpee Ladder',           'Cardio',5, '10',       'Intermediate',  45, 'Bodyweight', 150, 'Chest to floor, jump and clap overhead. Keep a pace you can hold.')
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  sets         = EXCLUDED.sets,
  reps         = EXCLUDED.reps,
  difficulty   = EXCLUDED.difficulty,
  rest_seconds = EXCLUDED.rest_seconds,
  equipment    = EXCLUDED.equipment,
  calories     = EXCLUDED.calories,
  description  = EXCLUDED.description;

-- Classes are scheduled relative to the start of the current week (Monday), using the
-- session time zone that `npm run db:setup` sets from your computer. Running the seed
-- again moves the same 10 classes into the new week instead of adding more.
INSERT INTO classes (title, coach_name, start_time, duration_minutes, capacity, intensity) VALUES
  ('Sunrise HIIT Shred',       'Jordan Blake', date_trunc('week', now()) + interval '0 days 06:30', 45, 20, 'High'),
  ('Flow & Restore Yoga',      'Priya Nair',   date_trunc('week', now()) + interval '0 days 18:00', 60, 18, 'Low'),
  ('Rhythm Ride Spin',         'Leo Martins',  date_trunc('week', now()) + interval '1 days 07:00', 45, 24, 'Medium'),
  ('Boxing Fundamentals',      'Ana Ruiz',     date_trunc('week', now()) + interval '1 days 19:00', 50, 16, 'High'),
  ('Strength Foundations',     'Sam Okafor',   date_trunc('week', now()) + interval '2 days 12:15', 50, 14, 'Medium'),
  ('Climb Night Spin',         'Leo Martins',  date_trunc('week', now()) + interval '3 days 18:30', 45, 24, 'High'),
  ('Yin & Breath Yoga',        'Mei Chen',     date_trunc('week', now()) + interval '4 days 18:00', 60, 18, 'Low'),
  ('Heavy Bag Boxing',         'Ana Ruiz',     date_trunc('week', now()) + interval '4 days 19:30', 50, 16, 'High'),
  ('Weekend Warrior HIIT',     'Jordan Blake', date_trunc('week', now()) + interval '5 days 09:00', 50, 22, 'High'),
  ('Sunday Power Strength',    'Sam Okafor',   date_trunc('week', now()) + interval '6 days 10:00', 60, 14, 'Medium')
ON CONFLICT (title) DO UPDATE SET
  coach_name       = EXCLUDED.coach_name,
  start_time       = EXCLUDED.start_time,
  duration_minutes = EXCLUDED.duration_minutes,
  capacity         = EXCLUDED.capacity,
  intensity        = EXCLUDED.intensity;
