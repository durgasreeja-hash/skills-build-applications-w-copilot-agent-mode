import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const userId = typeof body.userId === 'string' ? body.userId : undefined;
  const teamId = typeof body.teamId === 'string' ? body.teamId : undefined;
  const type = typeof body.type === 'string' ? body.type : undefined;
  const minutesValue = Number(body.minutes);

  if (!userId || !teamId || !type || body.minutes === undefined || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw Object.assign(new Error('Valid userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('userId and teamId must be valid ObjectIds'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('userId and teamId must reference existing records'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: minutesValue,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : undefined;
  const rawMembers = Array.isArray(body.members) ? body.members : [];

  if (!name || !mascot) {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }

  const members = rawMembers
    .filter((member): member is string | mongoose.Types.ObjectId => typeof member === 'string' || member instanceof mongoose.Types.ObjectId)
    .map((member) => (typeof member === 'string' ? member : member.toString()))
    .filter((member) => mongoose.isValidObjectId(member));

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const grouped = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const result = await Promise.all(grouped.map(async ({ _id, totalPoints }, index) => {
    const team = await Team.findById(_id).lean();
    return {
      teamName: team?.name ?? 'Unknown',
      totalPoints: Number(totalPoints ?? 0),
      rank: index + 1,
    };
  }));

  return result;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('No user found for that email'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focusByType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'endurance',
    swim: 'endurance',
    strength: 'strength',
    mobility: 'mobility',
    yoga: 'mobility',
  };

  const primaryActivity = recentActivities.reduce<Record<string, number>>((totals, activity) => {
    const focus = focusByType[activity.type as keyof typeof focusByType] ?? 'endurance';
    totals[focus] = (totals[focus] ?? 0) + (typeof activity.minutes === 'number' ? activity.minutes : 0);
    return totals;
  }, {});

  const preferredFocus = Object.entries(primaryActivity).sort(([, a], [, b]) => b - a)[0]?.[0] ?? user.fitnessGoal ?? 'endurance';

  const workouts = await Workout.find({ focus: preferredFocus }).lean();
  if (workouts.length === 0) {
    const fallback = await Workout.find().lean();
    return fallback.map((workout) => ({
      ...workout,
      reason: `Matches your ${user.fitnessGoal ?? 'fitness'} goal and recent activity pattern.`,
    }));
  }

  const activityType = recentActivities[0]?.type ?? preferredFocus;
  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches your recent ${activityType} activity and ${preferredFocus} focus.`,
  }));
}

export { User };
