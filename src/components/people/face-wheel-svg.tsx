"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelSingleClick,
  scheduleSingleClick,
} from "@/lib/people/face-click-timing";
import { personThumbnailPath } from "@/lib/immich/person-thumbnail-path";
import {
  CENTER,
  TOP_ANGLE,
  TOP_GAP_RAD,
  VIEW_SIZE,
  computeWheelMetrics,
  describeArc,
  focusedSpokeIndex,
  snapRotationForSpoke,
  spokeStroke,
} from "@/lib/people/face-wheel-layout";
import type { ImmichPerson } from "@/lib/immich/types";

type FaceWheelSvgProps = {
  context: ImmichPerson;
  spokes: ImmichPerson[];
  onFocusPerson: (person: ImmichPerson) => void;
  onWheelEngage: () => void;
  onSwitchContextPerson: (personId: string) => void;
};

function personLabel(p: ImmichPerson): string {
  return p.name?.trim() || "Unnamed";
}

export function FaceWheelSvg({
  context,
  spokes,
  onFocusPerson,
  onWheelEngage,
  onSwitchContextPerson,
}: FaceWheelSvgProps) {
  const [rotationRad, setRotationRad] = useState(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metrics = useMemo(
    () => computeWheelMetrics(spokes.length, rotationRad),
    [spokes.length, rotationRad],
  );
  const focusIdx = focusedSpokeIndex(spokes.length, rotationRad);

  useEffect(() => {
    const p = focusIdx >= 0 ? spokes[focusIdx] : undefined;
    if (p) onFocusPerson(p);
  }, [focusIdx, onFocusPerson, spokes]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onWheelEngage();
      setRotationRad((r) => r + e.deltaY * 0.004);
    },
    [onWheelEngage],
  );

  const snapToSpoke = useCallback(
    (index: number) => {
      onWheelEngage();
      setRotationRad(snapRotationForSpoke(index, spokes.length));
    },
    [onWheelEngage, spokes.length],
  );

  const hubR = metrics.hubRadius;

  return (
    <div
      className="w-full max-w-[min(100%,360px)] mx-auto"
      onWheel={onWheel}
      role="presentation"
    >
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        width="100%"
        className="select-none touch-none"
        aria-label="Face wheel: scroll to rotate, click a face to focus"
      >
        <defs>
          {spokes.map((s) => (
            <clipPath key={`clip-${s.id}`} id={`face-wheel-clip-${s.id}`}>
              <circle cx={0} cy={0} r={metrics.spokeRadius} />
            </clipPath>
          ))}
          <clipPath id="face-wheel-hub-clip">
            <circle cx={CENTER} cy={CENTER} r={hubR - 4} />
          </clipPath>
        </defs>

        {/* Top focus slot indicator */}
        <path
          d={describeArc(
            CENTER,
            CENTER,
            metrics.orbitRadius + metrics.spokeRadius + 6,
            TOP_ANGLE - TOP_GAP_RAD / 2,
            TOP_ANGLE + TOP_GAP_RAD / 2,
          )}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Hub segmented ring */}
        {spokes.map((_, i) => {
          const seg = metrics.spokes[i];
          if (!seg) return null;
          const mid = (seg.segmentStart + seg.segmentEnd) / 2;
          const span = (2 * Math.PI - TOP_GAP_RAD) / spokes.length;
          return (
            <path
              key={`seg-${i}`}
              d={describeArc(CENTER, CENTER, hubR + 6, mid - span / 2, mid + span / 2)}
              fill="none"
              stroke={spokeStroke(i)}
              strokeWidth={8}
              strokeLinecap="round"
            />
          );
        })}

        {/* Connectors + spokes */}
        {metrics.spokes.map((spoke, i) => {
          const person = spokes[i];
          if (!person) return null;
          const focused = i === focusIdx;
          return (
            <g key={person.id}>
              <path
                d={spoke.connectorPath}
                fill="none"
                stroke={spokeStroke(i)}
                strokeWidth={focused ? 5 : 4}
                strokeLinecap="round"
                opacity={focused ? 1 : 0.85}
              />
              <g
                transform={`translate(${spoke.x} ${spoke.y})`}
                className="cursor-pointer"
                onClick={() => {
                  scheduleSingleClick(clickTimerRef, () => snapToSpoke(i));
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelSingleClick(clickTimerRef);
                  onSwitchContextPerson(person.id);
                }}
              >
                <circle
                  r={spoke.radius + (focused ? 3 : 0)}
                  fill="var(--card)"
                  stroke={spokeStroke(i)}
                  strokeWidth={focused ? 3 : 2}
                />
                <g clipPath={`url(#face-wheel-clip-${person.id})`}>
                  <image
                    href={personThumbnailPath(person.id)}
                    x={-spoke.radius}
                    y={-spoke.radius}
                    width={spoke.radius * 2}
                    height={spoke.radius * 2}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
                <title>{personLabel(person)}</title>
              </g>
            </g>
          );
        })}

        {/* Center hub */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={hubR}
          fill="var(--card)"
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={2}
        />
        <g clipPath="url(#face-wheel-hub-clip)">
          <image
            href={personThumbnailPath(context.id)}
            x={CENTER - hubR + 4}
            y={CENTER - hubR + 4}
            width={(hubR - 4) * 2}
            height={(hubR - 4) * 2}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
        <text
          x={CENTER}
          y={CENTER + hubR + 16}
          textAnchor="middle"
          className="fill-foreground text-[11px] font-medium"
          style={{ fontSize: 11 }}
        >
          {personLabel(context)}
        </text>
      </svg>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Scroll to rotate · click face to focus · double-click to select in
        catalogue
      </p>
    </div>
  );
}
