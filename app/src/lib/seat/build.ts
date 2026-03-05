import type { OrgchartDocument, OrgchartEdge } from '@/lib/types';
import { getDefaultOrgchart } from '@/lib/config/orgchart';
import type { SeatMapping, SeatSnapshot } from '@/lib/seat/storage';

const shouldLogSeatBuildDebug = process.env.SEAT_BUILD_DEBUG === '1';

function logSeatBuildDebug(message: string, context: Record<string, unknown>): void {
  if (!shouldLogSeatBuildDebug) {
    return;
  }

  console.info(message, context);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildOrgchartFromSeat(snapshot: SeatSnapshot, mapping: SeatMapping): OrgchartDocument {
  const chart = getDefaultOrgchart();
  const corpId = chart.nodes.corporations[0].id;
  const directorateId = 'dir-seat';
  const unmappedTeamId = 'team_unmapped_seat_roles';

  chart.nodes.corporations = [{ id: corpId, name: process.env.ORG_ROOT_TITLE ?? "Eve Who's Who" }];

  chart.nodes.directorates = [{ id: directorateId, name: 'SeAT Roles', corporationId: corpId }];
  chart.nodes.teams = [];
  chart.nodes.roles = [];

  const includeRoleSet = new Set(mapping.includeRoles.map((item) => Number(item)));
  const teams = new Set<string>();
  const teamNames = new Map<string, string>();
  let mappedRoles = 0;

  logSeatBuildDebug('[seat/build] counts', {
    rolesFetched: snapshot.roles.length,
    usersFetched: snapshot.users.length,
    includedRoles: includeRoleSet.size,
    mappedRoles: mapping.includeRoles.filter((roleId) => Boolean(mapping.roleMappings[String(Number(roleId))])).length,
  });

  for (const role of snapshot.roles) {
    if (includeRoleSet.size > 0 && !includeRoleSet.has(role.id)) {
      continue;
    }

    const roleKey = String(role.id);
    const mappedNodeId = mapping.roleMappings[roleKey];
    const teamId = mappedNodeId ? `team_${slugify(mappedNodeId)}` : unmappedTeamId;
    const roleId = `seat_role_${role.id}`;
    const normalizedRoleId = Number(role.id);
    const userCount = snapshot.users.filter((user) => {
      const groupIds = (user.role_ids ?? []).map((groupId) => Number(groupId));
      return groupIds.includes(normalizedRoleId);
    }).length;

    if (mappedNodeId) {
      mappedRoles += 1;
    }

    teams.add(teamId);
    teamNames.set(teamId, mappedNodeId ? mappedNodeId.replace(/_/g, ' ') : 'Unmapped SeAT Roles');
    chart.nodes.roles.push({
      id: roleId,
      name: `${role.title} (${userCount})`,
      teamId,
    });

    logSeatBuildDebug('[seat/build] role members', {
      roleId: role.id,
      roleTitle: role.title,
      members: userCount,
    });
  }

  logSeatBuildDebug('[seat/build] included mapping summary', {
    includedRoles: includeRoleSet.size,
    mappedIncludedRoles: mappedRoles,
  });

  chart.nodes.teams = [...teams].map((teamId) => ({
    id: teamId,
    name: teamNames.get(teamId) ?? teamId.replace(/^team_/, '').replace(/_/g, ' '),
    directorateId,
  }));

  const edges: OrgchartEdge[] = [
    { id: `edge-${corpId}-${directorateId}`, sourceId: corpId, targetId: directorateId },
  ];

  chart.nodes.teams.forEach((team) => {
    edges.push({ id: `edge-${directorateId}-${team.id}`, sourceId: directorateId, targetId: team.id });
  });

  chart.nodes.roles.forEach((role) => {
    edges.push({ id: `edge-${role.teamId}-${role.id}`, sourceId: role.teamId, targetId: role.id });
  });

  chart.edges = edges;
  chart.meta.updatedAt = new Date().toISOString();
  chart.meta.title = "Eve Who's Who";

  return chart;
}
