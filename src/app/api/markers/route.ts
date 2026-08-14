import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entities, deployments, locations, sources, claims, type sourceStrengthEnum } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { GeoJSONFeature, LocationGeoJSON } from '@/lib/types';

type SourceStrength = (typeof sourceStrengthEnum.enumValues)[number];

const SOURCE_STRENGTH_RANK: Record<string, number> = {
  primary: 3,
  secondary: 2,
  lead_only: 1,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const entityType = searchParams.get('entityType');
  const vendor = searchParams.get('vendor');
  const status = searchParams.get('status');
  const sourceStrength = searchParams.get('sourceStrength');


  const conditions = [];
  if (state) conditions.push(eq(entities.state, state.toUpperCase()));
  if (entityType) conditions.push(eq(entities.entityType, entityType as never));
  if (vendor) conditions.push(eq(entities.vendor, vendor));
  if (status) conditions.push(eq(deployments.status, status as never));



  if (sourceStrength && SOURCE_STRENGTH_RANK[sourceStrength]) {
    const rank = SOURCE_STRENGTH_RANK[sourceStrength];
    const allowedStrengths: SourceStrength[] = (Object.entries(
      SOURCE_STRENGTH_RANK,
    ) as [SourceStrength, number][])
      .filter(([, r]) => r >= rank)
      .map(([s]) => s);
    const strongSourceIds = await db
      .select({ id: sources.id })
      .from(sources)
      .where(inArray(sources.sourceStrength, allowedStrengths));
    const strongIds = new Set(strongSourceIds.map((r) => r.id));
    const claimRows = await db
      .select({ subjectId: claims.subjectId })
      .from(claims)
      .where(inArray(claims.sourceId, [...strongIds]));
    const depIds = new Set(claimRows.map((r) => r.subjectId));
    if (depIds.size === 0) {
      return NextResponse.json({ type: 'FeatureCollection', features: [] } satisfies LocationGeoJSON);
    }
    conditions.push(inArray(deployments.id, [...depIds]));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      locationId: locations.id,
      deploymentId: deployments.id,
      entityName: entities.name,
      entityType: entities.entityType,
      state: entities.state,
      status: deployments.status,
      vendor: entities.vendor,
      precisionLevel: locations.precisionLevel,
      facingDirection: locations.facingDirection,
      locationStatus: locations.locationStatus,
      description: locations.description,
      lastVerifiedAt: deployments.lastVerifiedAt,
      cameraCount: deployments.cameraCount,
      retentionPeriod: deployments.retentionPeriod,
      contractValue: deployments.contractValue,
      latitude: locations.latitude,
      longitude: locations.longitude,
    })
    .from(locations)
    .innerJoin(deployments, eq(locations.deploymentId, deployments.id))
    .innerJoin(entities, eq(deployments.entityId, entities.id))
    .where(whereClause)
    .limit(5000);


  const deploymentIds = rows.map((r) => r.deploymentId);
  const claimRows = deploymentIds.length
    ? await db
        .select({
          deploymentId: claims.subjectId,
          sourceId: claims.sourceId,
          confidence: claims.confidence,
        })
        .from(claims)
        .where(inArray(claims.subjectId, deploymentIds))
    : [];

  const claimsByDeployment = new Map<string, typeof claimRows>();
  for (const c of claimRows) {
    const list = claimsByDeployment.get(c.deploymentId) ?? [];
    if (list.length < 5) list.push(c);
    claimsByDeployment.set(c.deploymentId, list);
  }

  const allSourceIds = [...new Set(claimRows.map((c) => c.sourceId))];
  const sourceRows = allSourceIds.length
    ? await db
        .select({
          id: sources.id,
          url: sources.url,
          sourceType: sources.sourceType,
          publisher: sources.publisher,
          title: sources.title,
        })
        .from(sources)
        .where(inArray(sources.id, allSourceIds))
    : [];
  const sourcesById = new Map(sourceRows.map((s) => [s.id, s]));

  const features: GeoJSONFeature[] = rows.map((row) => {
    const claimsFor = claimsByDeployment.get(row.deploymentId) ?? [];
    const confidence = claimsFor.some((c) => c.confidence === 'high')
      ? 'high'
      : claimsFor.some((c) => c.confidence === 'medium')
        ? 'medium'
        : 'low';

    const sources = claimsFor
      .map((c) => sourcesById.get(c.sourceId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({
        title: s.title,
        sourceType: s.sourceType,
        url: s.url,
        publisher: s.publisher,
      }));

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          Math.round(row.longitude * 1e5) / 1e5,
          Math.round(row.latitude * 1e5) / 1e5,
        ],
      },
      properties: {
        id: row.locationId,
        deploymentId: row.deploymentId,
        entityName: row.entityName,
        entityType: row.entityType,
        state: row.state,
        status: row.status,
        vendor: row.vendor || 'unknown',
        precisionLevel: row.precisionLevel,
        facingDirection: row.facingDirection,
        locationStatus: row.locationStatus,
        description: row.description,
        lastVerifiedAt: row.lastVerifiedAt,
        cameraCount: row.cameraCount,
        retentionPeriod: row.retentionPeriod,
        contractValue: row.contractValue,
        confidence,
        sources,
        isExactLocation:
          row.locationStatus === 'officially_disclosed' ||
          row.locationStatus === 'verified_submission',
      },
    };
  });

  const geojson: LocationGeoJSON = {
    type: 'FeatureCollection',
    features,
  };

  return NextResponse.json(geojson, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
