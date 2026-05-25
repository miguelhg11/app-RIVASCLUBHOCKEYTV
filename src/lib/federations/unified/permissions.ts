import { UnifiedFederationMatch } from "../shared/federation-match";

/**
 * Checks if a user has access to a specific Rivas team key (e.g., 'infantil-A').
 * This is a placeholder for actual Supabase DB checks if we implement DB-backed permissions.
 */
export async function userHasAccessToRivasTeam(userEmail: string, isAdmin: boolean, teamKey: string): Promise<boolean> {
  if (isAdmin) return true;

  // TODO: Query Supabase user_teams table or user metadata.
  // For now, if not admin, we might return true to allow testing, or false to test restriction.
  // Since we haven't defined the exact DB schema for `user_teams` in this task, 
  // we will mock it to return true for now, or you can replace it with actual DB query.
  
  return true; 
}

export async function filterMatchesByPermissions(
  matches: UnifiedFederationMatch[], 
  userEmail: string, 
  isAdmin: boolean
): Promise<UnifiedFederationMatch[]> {
  if (isAdmin) return matches;

  const allowedMatches: UnifiedFederationMatch[] = [];

  for (const match of matches) {
    const hasAccess = await userHasAccessToRivasTeam(userEmail, isAdmin, match.rivasTeamKey);
    if (hasAccess) {
      allowedMatches.push(match);
    }
  }

  return allowedMatches;
}
