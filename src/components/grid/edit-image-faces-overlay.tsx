"use client";

import { useMemo } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DisplayRectEditor,
  displayRectIsUsable,
} from "@/components/people/display-rect-editor";
import {
  displayRectToFacePixels,
  faceBoxDisplayRect,
  type ContainedImageRect,
  type DisplayRect,
} from "@/lib/people/face-box-layout";
import type { ImmichAssetFace } from "@/lib/immich/types";

type EditImageFacesOverlayProps = {
  layoutW: number;
  layoutH: number;
  imageWidth: number;
  imageHeight: number;
  faces: ImmichAssetFace[];
  /** Show face pens / geometry UI (preview or edit with crop tool off). */
  faceChromeVisible: boolean;
  /** Allow drag/save (image not dirty). */
  faceToolsInteractive: boolean;
  geometryEditingFaceId: string | null;
  onGeometryEditingFaceIdChange: (id: string | null) => void;
  draftDisplayRect: DisplayRect | null;
  onDraftDisplayRectChange: (rect: DisplayRect | null) => void;
  onGeometryCommitted: (
    faceId: string,
    pixels: ReturnType<typeof displayRectToFacePixels>,
  ) => void;
  geometrySaving: boolean;
  addFaceMode: boolean;
  /** After user confirms box position (step 2); step 3 is person link in parent. */
  addFaceRectConfirmed?: boolean;
  onAddFaceRectConfirm?: () => void;
  onAddFaceCancel?: () => void;
  /** When false, keep pens/editors but hide static face outlines (preview uses FaceNameBox). */
  showFaceOutlines?: boolean;
  /** When false, pens live on FaceNameBox; save/cancel on DisplayRectEditor (preview modal). */
  showRectanglePens?: boolean;
  onGeometrySave?: () => void;
  onGeometryCancel?: () => void;
};

export function EditImageFacesOverlay({
  layoutW,
  layoutH,
  imageWidth,
  imageHeight,
  faces,
  faceChromeVisible,
  faceToolsInteractive,
  geometryEditingFaceId,
  onGeometryEditingFaceIdChange,
  draftDisplayRect,
  onDraftDisplayRectChange,
  onGeometryCommitted,
  geometrySaving,
  addFaceMode,
  addFaceRectConfirmed = false,
  onAddFaceRectConfirm,
  onAddFaceCancel,
  showFaceOutlines = true,
  showRectanglePens = true,
  onGeometrySave,
  onGeometryCancel,
}: EditImageFacesOverlayProps) {
  const layout: ContainedImageRect = useMemo(
    () => ({ x: 0, y: 0, width: layoutW, height: layoutH }),
    [layoutW, layoutH],
  );

  const startGeometryEdit = (face: ImmichAssetFace) => {
    if (!faceToolsInteractive) return;
    const disp = faceBoxDisplayRect(face, imageWidth, imageHeight, layout);
    if (!disp) return;
    onDraftDisplayRectChange(disp);
    onGeometryEditingFaceIdChange(face.id);
  };

  const cancelGeometry = () => {
    onGeometryEditingFaceIdChange(null);
    onDraftDisplayRectChange(null);
  };

  const saveGeometry = () => {
    if (!geometryEditingFaceId || !draftDisplayRect) return;
    const pixels = displayRectToFacePixels(
      draftDisplayRect,
      layout,
      imageWidth,
      imageHeight,
    );
    onGeometryCommitted(geometryEditingFaceId, pixels);
  };

  if (!faceChromeVisible) return null;

  const penLockedTitle = "Finish the current action before adjusting face boxes";

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden={!faceChromeVisible}
    >
      {showRectanglePens || showFaceOutlines
        ? faces.map((face) => {
            if (geometryEditingFaceId === face.id) {
              return null;
            }
            const isLinked = Boolean(face.person?.id);
            const disp = faceBoxDisplayRect(
              face,
              imageWidth,
              imageHeight,
              layout,
            );
            if (!disp) return null;

            return (
              <div
                key={face.id}
                className={cn(
                  "pointer-events-none absolute box-border",
                  showFaceOutlines
                    ? "border border-white/70"
                    : "border border-transparent",
                )}
                style={{
                  left: disp.x,
                  top: disp.y,
                  width: disp.width,
                  height: disp.height,
                }}
              >
                {showRectanglePens &&
                isLinked &&
                !addFaceMode &&
                !geometryEditingFaceId ? (
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    disabled={!faceToolsInteractive}
                    className="pointer-events-auto absolute right-0 top-0 z-50 size-7 translate-x-1/4 -translate-y-1/4 shadow-md"
                    title={
                      faceToolsInteractive
                        ? "Edit face rectangle"
                        : penLockedTitle
                    }
                    aria-label="Edit face rectangle"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      startGeometryEdit(face);
                    }}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                ) : null}

              </div>
            );
          })
        : null}

      {geometryEditingFaceId && draftDisplayRect && faceToolsInteractive ? (
        <DisplayRectEditor
          layoutW={layoutW}
          layoutH={layoutH}
          rect={draftDisplayRect}
          onRectChange={onDraftDisplayRectChange}
          active
          mode="edit"
          onSave={onGeometrySave ?? (() => void saveGeometry())}
          onCancel={onGeometryCancel ?? cancelGeometry}
          saveDisabled={geometrySaving}
        />
      ) : null}

      {addFaceMode &&
      addFaceRectConfirmed &&
      draftDisplayRect &&
      displayRectIsUsable(draftDisplayRect) ? (
        <div
          className="pointer-events-none absolute border-2 border-primary shadow-[0_0_0_1px_rgba(0,0,0,0.75)]"
          style={{
            left: draftDisplayRect.x,
            top: draftDisplayRect.y,
            width: draftDisplayRect.width,
            height: draftDisplayRect.height,
          }}
        />
      ) : null}

      {addFaceMode &&
      !addFaceRectConfirmed &&
      faceToolsInteractive &&
      !geometryEditingFaceId ? (
        <DisplayRectEditor
          layoutW={layoutW}
          layoutH={layoutH}
          rect={
            draftDisplayRect ?? { x: 0, y: 0, width: 0, height: 0 }
          }
          onRectChange={onDraftDisplayRectChange}
          active
          mode={
            draftDisplayRect && displayRectIsUsable(draftDisplayRect)
              ? "edit"
              : "draw"
          }
          onSave={onAddFaceRectConfirm}
          onCancel={onAddFaceCancel}
        />
      ) : null}
    </div>
  );
}
