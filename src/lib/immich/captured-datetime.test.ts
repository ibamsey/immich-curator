import { describe, expect, it } from "vitest";
import {
  datetimeLocalToImmichDateTimeOriginal,
  immichLocalDateTimeToDatetimeLocal,
  sameImmichCaptureWallClock,
} from "./captured-datetime";

describe("captured-datetime", () => {
  it("maps localDateTime wall clock without browser TZ", () => {
    expect(
      immichLocalDateTimeToDatetimeLocal("2020-08-15T14:30:00.000Z"),
    ).toBe("2020-08-15T14:30");
    expect(
      immichLocalDateTimeToDatetimeLocal("2020-08-15T14:30:00+00:00"),
    ).toBe("2020-08-15T14:30");
  });

  it("encodes datetime-local for Immich dateTimeOriginal", () => {
    expect(datetimeLocalToImmichDateTimeOriginal("2020-08-15T14:30")).toBe(
      "2020-08-15T14:30:00.000Z",
    );
  });

  it("compares wall clocks across string formats", () => {
    expect(
      sameImmichCaptureWallClock(
        "2020-08-15T14:30:00.000Z",
        "2020-08-15T14:30:00+00:00",
      ),
    ).toBe(true);
  });
});
