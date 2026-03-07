/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as checklists from "../checklists.js";
import type * as comments from "../comments.js";
import type * as days from "../days.js";
import type * as expenses from "../expenses.js";
import type * as files from "../files.js";
import type * as ideas from "../ideas.js";
import type * as notifications from "../notifications.js";
import type * as reservations from "../reservations.js";
import type * as tripMembers from "../tripMembers.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  checklists: typeof checklists;
  comments: typeof comments;
  days: typeof days;
  expenses: typeof expenses;
  files: typeof files;
  ideas: typeof ideas;
  notifications: typeof notifications;
  reservations: typeof reservations;
  tripMembers: typeof tripMembers;
  trips: typeof trips;
  users: typeof users;
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
