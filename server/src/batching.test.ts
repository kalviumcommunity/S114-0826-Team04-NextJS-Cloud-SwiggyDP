import test from "node:test";
import assert from "node:assert/strict";

import { findNearestAvailablePartner, getDistanceKm } from "./batching.js";
import { shouldProcessAssignmentTimeout } from "./assignmentTimeout.js";

test("getDistanceKm calculates approximate distance between coordinates", () => {
  const distance = getDistanceKm({ lat: 12.9716, lng: 77.5946 }, { lat: 12.9816, lng: 77.6056 });

  assert.ok(distance > 0);
  assert.ok(distance < 3);
});

test("findNearestAvailablePartner prefers the closest available partner", () => {
  const partners = [
    {
      id: "partner-1",
      status: "available",
      location: { coordinates: [77.5946, 12.9716] as [number, number] },
    },
    {
      id: "partner-2",
      status: "available",
      location: { coordinates: [77.6186, 12.9985] as [number, number] },
    },
    {
      id: "partner-3",
      status: "busy",
      location: { coordinates: [77.6012, 12.9758] as [number, number] },
    },
  ];

  const nearest = findNearestAvailablePartner(partners, { lat: 12.9807, lng: 77.6033 });

  assert.ok(nearest);
  assert.equal(nearest.id, "partner-1");
});

test("shouldProcessAssignmentTimeout triggers when an order surpasses its assignment deadline", () => {
  const now = Date.now();

  assert.equal(
    shouldProcessAssignmentTimeout(
      {
        status: "assigned",
        assignmentTimeoutAt: new Date(now - 1000),
        retryCount: 1,
      },
      now,
    ),
    true,
  );
});

test("shouldProcessAssignmentTimeout ignores active assignments before timeout", () => {
  const now = Date.now();

  assert.equal(
    shouldProcessAssignmentTimeout(
      {
        status: "assigned",
        assignmentTimeoutAt: new Date(now + 60_000),
        retryCount: 0,
      },
      now,
    ),
    false,
  );
});
