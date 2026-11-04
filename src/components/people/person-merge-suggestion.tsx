"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { personThumbnailPath } from "@/lib/immich/person-thumbnail-path";
import { Button } from "@/components/ui/button";
import type { ImmichPerson } from "@/lib/immich/types";
import type { PersonMergeSuggestionRequest } from "@/lib/people/person-name-merge-check";

export type { PersonMergeSuggestionRequest };

type PersonMergeSuggestionPanelProps = {
  request: PersonMergeSuggestionRequest;
  loading?: boolean;
  onDismiss: () => void;
  onKeepSeparate: () => void;
  onMergeSamePerson: (targetPersonId: string) => void;
  className?: string;
};

function PersonFaceChip({
  person,
  label,
  selected,
  onSelect,
  imageUrl,
}: {
  person: ImmichPerson;
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  imageUrl?: string;
}) {
  const Tag = onSelect ? "button" : "div";
  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md p-2 text-center",
        onSelect && "cursor-pointer hover:bg-muted",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className="size-14 overflow-hidden rounded-full bg-muted sm:size-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl ?? personThumbnailPath(person.id)}
          alt=""
          className="size-full object-cover"
        />
      </div>
      <span className="max-w-[6rem] truncate text-xs font-medium">{label}</span>
    </Tag>
  );
}

export function PersonMergeSuggestionPanel({
  request,
  loading = false,
  onDismiss,
  onKeepSeparate,
  onMergeSamePerson,
  className,
}: PersonMergeSuggestionPanelProps) {
  const [targetId, setTargetId] = useState(request.primaryMatch.id);
  const target =
    [request.primaryMatch, ...request.alternates].find((p) => p.id === targetId) ??
    request.primaryMatch;

  return (
    <div
      className={cn(
        "rounded-md border border-primary/40 bg-background p-3 shadow-sm",
        className,
      )}
      role="region"
      aria-label="Same person merge suggestion"
    >
      <p className="text-sm font-medium">Same person?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        &ldquo;{request.newName}&rdquo; matches someone else. Merge this face
        into them, or keep separate people with the same name.
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <PersonFaceChip
          person={request.editingPerson}
          label={request.newName || "This face"}
          imageUrl={request.editingImageUrl}
        />
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <PersonFaceChip
          person={target}
          label={target.name || request.newName}
          selected
        />
      </div>

      {request.alternates.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] text-muted-foreground">
            Other matches — click to merge into someone else:
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            <PersonFaceChip
              person={request.primaryMatch}
              label={request.primaryMatch.name || request.newName}
              selected={targetId === request.primaryMatch.id}
              onSelect={() => setTargetId(request.primaryMatch.id)}
            />
            {request.alternates.map((p) => (
              <PersonFaceChip
                key={p.id}
                person={p}
                label={p.name || request.newName}
                selected={targetId === p.id}
                onSelect={() => setTargetId(p.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => onMergeSamePerson(target.id)}
        >
          Yes, same person
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={onKeepSeparate}
        >
          No, different people
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={onDismiss}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
