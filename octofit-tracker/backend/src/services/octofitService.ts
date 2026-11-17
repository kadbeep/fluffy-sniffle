import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

function computePoints(type: string, minutes: number): number {
  return minutes;
}

export async function createActivity(input: unknown): Promise<unknown> {
  const data = input as Record<string, unknown>;

  if (!data.userId || !data.teamId || !data.type || typeof data.minutes !== 'number') {
    const error = new Error('Missing or invalid required fields: userId, teamId, type, minutes');
    throw Object.assign(error, { status: 400 });
  }

  if (typeof data.userId !== 'string' || typeof data.teamId !== 'string' || typeof data.type !== 'string') {
    const error = new Error('Invalid field types');
    throw Object.assign(error, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(data.userId) || !mongoose.Types.ObjectId.isValid(data.teamId)) {
    const error = new Error('userId and teamId must be valid MongoDB ObjectIds');
    throw Object.assign(error, { status: 400 });
  }

  const user = await User.findById(data.userId);
  if (!user) {
    const error = new Error('User not found');
    throw Object.assign(error, { status: 400 });
  }

  const team = await Team.findById(data.teamId);
  if (!team) {
    const error = new Error('Team not found');
    throw Object.assign(error, { status: 400 });
  }

  const activity = await Activity.create({
    user: data.userId,
    team: data.teamId,
    type: data.type,
    minutes: data.minutes,
    points: computePoints(data.type, data.minutes),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  const teams = await Team.find().populate('members').lean();
  return teams.map(team => ({
    ...team,
    members: team.members.map((member: any) => member._id?.toString() || member.toString()),
  }));
}

export async function createTeam(input: unknown): Promise<unknown> {
  const data = input as Record<string, unknown>;

  if (!data.name) {
    const error = new Error('Missing required field: name');
    throw Object.assign(error, { status: 400 });
  }

  if (typeof data.name !== 'string') {
    const error = new Error('Field name must be a string');
    throw Object.assign(error, { status: 400 });
  }

  const team = await Team.create({
    name: data.name,
    mascot: data.mascot ?? undefined,
    members: (Array.isArray(data.members) ? data.members : []) as string[],
  });

  const populated = await team.populate('members');
  return populated.toObject();
}

export async function getLeaderboard() {
  const teamStats = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  const teams = await Team.find({ _id: { $in: teamStats.map(stat => stat._id) } }).lean();
  const teamMap = new Map(teams.map(team => [team._id.toString(), team.name]));

  const leaderboard = teamStats.map((stat, index) => ({
    teamName: teamMap.get(stat._id.toString()),
    totalPoints: stat.totalPoints,
    rank: index + 1,
  }));

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    const error = new Error('User not found');
    throw Object.assign(error, { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();

  const workouts = await Workout.find().lean();
  if (workouts.length === 0) {
    return [];
  }

  const activityTypes = recentActivities.map(a => a.type);
  const focusMapping: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'flexibility',
    strength: 'strength',
    yoga: 'flexibility',
  };

  const userGoal = user.fitnessGoal;

  const matchingWorkout = workouts.find(
    w =>
      w.focus === userGoal ||
      activityTypes.some(type => focusMapping[type] === w.focus)
  );

  if (!matchingWorkout) {
    return workouts.slice(0, 1).map(w => ({
      ...w,
      reason: 'Based on available workouts',
    }));
  }

  const activityType = activityTypes[0] || 'your recent activity';
  const reason =
    matchingWorkout.focus === userGoal
      ? `Matches your fitness goal: ${userGoal}`
      : `Complements your ${activityType} activity with a focus on ${matchingWorkout.focus}`;

  return [
    {
      ...matchingWorkout,
      reason,
    },
  ];
}

export { User };
