import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CANONICAL_ORIGIN,
  SHARE_PREVIEW_PATH,
  SHARE_PREVIEW_URL,
  kakaoShareTemplate,
} from "../src/lib/kakao-share";

test("Kakao feed opens the exact shared report on the canonical domain", () => {
  const reportUrl = `${CANONICAL_ORIGIN}/report/test-report-id?from=kakao`;
  const template = kakaoShareTemplate(reportUrl);

  assert.equal(template.objectType, "feed");
  assert.equal(template.content.link.webUrl, reportUrl);
  assert.equal(template.content.link.mobileWebUrl, reportUrl);
  assert.equal(template.buttons[0]?.title, "보고서 보기");
  assert.equal(template.buttons[0]?.link.webUrl, reportUrl);
  assert.equal(template.buttons[0]?.link.mobileWebUrl, reportUrl);
});

test("Kakao feed uses the committed 538 by 272 Figma preview", async () => {
  const template = kakaoShareTemplate("/report/test-report-id");

  assert.equal(SHARE_PREVIEW_PATH, "/report/share-preview.png");
  assert.equal(
    SHARE_PREVIEW_URL,
    `${CANONICAL_ORIGIN}/report/share-preview.png`,
  );
  assert.equal(template.content.imageUrl, SHARE_PREVIEW_URL);
  assert.equal(template.content.imageWidth, 538);
  assert.equal(template.content.imageHeight, 272);

  const png = await readFile("public/report/share-preview.png");
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(png.readUInt32BE(16), 538);
  assert.equal(png.readUInt32BE(20), 272);
});

test("Kakao feed refuses a report URL on an unregistered domain", () => {
  assert.throws(
    () => kakaoShareTemplate("https://example.com/report/test-report-id"),
    /canonical origin/,
  );
});
