import { db } from '../lib/db.js';
import { HttpError, route } from '../lib/http.js';

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio'];

// The exercise catalogue. Optional ?muscle_group=Chest narrows it to one group.
export default route({
  async GET(req) {
    const group = req.query?.muscle_group;
    if (group && !GROUPS.includes(group)) throw new HttpError(400, `Unknown muscle group "${group}".`);

    const sql = db();
    const rows = group
      ? await sql`SELECT * FROM exercises WHERE muscle_group = ${group} ORDER BY id`
      : await sql`SELECT * FROM exercises ORDER BY array_position(${GROUPS}::text[], muscle_group), id`;

    return {
      muscleGroups: GROUPS,
      exercises: rows.map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscle_group,
        sets: e.sets,
        reps: e.reps,
        difficulty: e.difficulty,
        restSeconds: e.rest_seconds,
        description: e.description,
        equipment: e.equipment,
        calories: e.calories,
      })),
    };
  },
});
