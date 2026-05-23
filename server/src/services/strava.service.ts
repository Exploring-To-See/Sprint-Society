import axios from 'axios';
import db from '../database/db';
import { config } from '../config';

const STRAVA_API = 'https://www.strava.com/api/v3';
const STRAVA_AUTH = 'https://www.strava.com/oauth';

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.strava.clientId,
    redirect_uri: config.strava.redirectUri,
    response_type: 'code',
    scope: 'read,activity:read_all',
    state,
  });
  return `${STRAVA_AUTH}/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number; firstname: string; lastname: string };
}> {
  const { data } = await axios.post(`${STRAVA_AUTH}/token`, {
    client_id: config.strava.clientId,
    client_secret: config.strava.clientSecret,
    code,
    grant_type: 'authorization_code',
  });
  return data;
}

export async function refreshToken(userId: number): Promise<string> {
  const token = db.prepare('SELECT * FROM strava_tokens WHERE user_id = ?').get(userId) as any;
  if (!token) throw new Error('No Strava token found');

  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at > now + 300) {
    return token.access_token;
  }

  const { data } = await axios.post(`${STRAVA_AUTH}/token`, {
    client_id: config.strava.clientId,
    client_secret: config.strava.clientSecret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });

  db.prepare(`
    UPDATE strava_tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(data.access_token, data.refresh_token, data.expires_at, userId);

  return data.access_token;
}

export async function fetchActivities(userId: number, after?: number): Promise<any[]> {
  const accessToken = await refreshToken(userId);
  const params: any = { per_page: 50 };
  if (after) params.after = after;

  const { data } = await axios.get(`${STRAVA_API}/athlete/activities`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });

  const CROSS_TRAINING_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike', 'Ride', 'VirtualRide', 'Swim', 'Workout', 'CrossFit', 'Elliptical', 'StairStepper'];
  return data.filter((a: any) => CROSS_TRAINING_TYPES.includes(a.type));
}

export async function fetchActivity(userId: number, activityId: number): Promise<any> {
  const accessToken = await refreshToken(userId);
  const { data } = await axios.get(`${STRAVA_API}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export function storeActivity(userId: number, activity: any) {
  const pacePerKm = activity.distance > 0
    ? (activity.moving_time / (activity.distance / 1000))
    : 0;

  db.prepare(`
    INSERT OR REPLACE INTO activities
    (user_id, strava_activity_id, distance_meters, moving_time_seconds, elapsed_time_seconds,
     average_speed, max_speed, average_pace_per_km, elevation_gain, start_date,
     start_latlng, end_latlng, map_polyline, splits, average_heartrate, max_heartrate, calories, activity_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    activity.id,
    activity.distance,
    activity.moving_time,
    activity.elapsed_time,
    activity.average_speed,
    activity.max_speed,
    pacePerKm,
    activity.total_elevation_gain || 0,
    activity.start_date,
    JSON.stringify(activity.start_latlng),
    JSON.stringify(activity.end_latlng),
    activity.map?.summary_polyline || null,
    JSON.stringify(activity.splits_metric || []),
    activity.average_heartrate || null,
    activity.max_heartrate || null,
    activity.calories || null,
    activity.type || 'Run'
  );
}

export async function syncRecentActivities(userId: number): Promise<number> {
  const lastActivity = db.prepare(
    'SELECT start_date FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 1'
  ).get(userId) as any;

  const after = lastActivity
    ? Math.floor(new Date(lastActivity.start_date).getTime() / 1000)
    : Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

  const activities = await fetchActivities(userId, after);
  let synced = 0;

  for (const activity of activities) {
    try {
      const detailed = await fetchActivity(userId, activity.id);
      storeActivity(userId, detailed);
      synced++;
    } catch (e) {
      console.error(`Failed to sync activity ${activity.id}:`, e);
    }
  }

  return synced;
}
