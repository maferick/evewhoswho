import type { OrgchartDocument, OrgchartEdge } from '@/lib/types';
import { getDefaultOrgchart } from '@/lib/config/orgchart';
import type { SeatMapping, SeatSnapshot } from '@/lib/seat/storage';

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

  chart.nodes.directorates = [{ id: directorateId, name: 'SeAT Roles', corporationId: corpId }];
  chart.nodes.teams = [];
  chart.nodes.roles = [];

  const includeRoleSet = new Set(mapping.includeRoles.map((item) => Number(item)));

  const bucketByRole = new Map<number, string>();
  Object.entries(mapping.roleBuckets).forEach(([bucketId, roleIds]) => {
    roleIds.forEach((roleId) => bucketByRole.set(Number(roleId), bucketId));
  });

  const teams = new Set<string>();

  for (const role of snapshot.roles) {
    if (includeRoleSet.size > 0 && !includeRoleSet.has(role.id)) {
      continue;
    }

    const mappedNodeId = mapping.roleMappings[String(role.id)] ?? `seat_role_${role.id}`;
    const bucketId = bucketByRole.get(role.id) ?? 'seat_general';
    const teamId = `team_${slugify(bucketId)}`;
    const userCount = snapshot.users.filter((user) => user.role_ids.includes(role.id)).length;

    teams.add(teamId);
    chart.nodes.roles.push({
      id: mappedNodeId,
      name: `${role.title} (${userCount})`,
      teamId,
    });
  }

  chart.nodes.teams = [...teams].map((teamId) => ({
    id: teamId,
    name: teamId.replace(/^team_/, '').replace(/_/g, ' '),
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
