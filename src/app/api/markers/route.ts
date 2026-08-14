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


  const features: GeoJSONFeature[] = await Promise.all(
    rows.map(async (row) => {
      const claimRows = await db
        .select({
          sourceId: claims.sourceId,
          confidence: claims.confidence,
        })
        .from(claims)
        .where(eq(claims.subjectId, row.deploymentId))
        .limit(5);

      const sourceRows = claimRows.length
        ? await db
            .select({
              id: sources.id,
              url: sources.url,
              sourceType: sources.sourceType,
              publisher: sources.publisher,
              title: sources.title,
              sourceStrength: sources.sourceStrength,
              publishedDate: sources.publishedDate,
            })
            .from(sources)
            .where(
              inArray(
                sources.id,
                claimRows.map((c) => c.sourceId),
              ),
            )
            .limit(5)
        : [];

      const confidence = claimRows.some((c) => c.confidence === 'high')
        ? 'high'
        : claimRows.some((c) => c.confidence === 'medium')
          ? 'medium'
          : 'low';

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [row.longitude, row.latitude],
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
          sources: sourceRows,
          isExactLocation:
            row.locationStatus === 'officially_disclosed' ||
            row.locationStatus === 'verified_submission',
        },
      };
    }),
  );

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
