/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billing from "../billing.js";
import type * as billing_crons from "../billing_crons.js";
import type * as crons from "../crons.js";
import type * as dealerships from "../dealerships.js";
import type * as email from "../email.js";
import type * as featured from "../featured.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reports from "../reports.js";
import type * as searchHistory from "../searchHistory.js";
import type * as subscription_crons from "../subscription_crons.js";
import type * as subscriptions from "../subscriptions.js";
import type * as sync from "../sync.js";
import type * as telemetry from "../telemetry.js";
import type * as utils from "../utils.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  billing: typeof billing;
  billing_crons: typeof billing_crons;
  crons: typeof crons;
  dealerships: typeof dealerships;
  email: typeof email;
  featured: typeof featured;
  http: typeof http;
  notifications: typeof notifications;
  rateLimit: typeof rateLimit;
  reports: typeof reports;
  searchHistory: typeof searchHistory;
  subscription_crons: typeof subscription_crons;
  subscriptions: typeof subscriptions;
  sync: typeof sync;
  telemetry: typeof telemetry;
  utils: typeof utils;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
