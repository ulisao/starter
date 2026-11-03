/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

<%#if isConvexAuth%>
import type * as auth from "../auth.js";
<%#endif%>
import type * as contactMessages from "../contactMessages.js";
<%#if isConvexAuth%>
import type * as http from "../http.js";
import type * as users from "../users.js";
<%#endif%>

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
<%#if isConvexAuth%>
  auth: typeof auth;
<%#endif%>
  contactMessages: typeof contactMessages;
<%#if isConvexAuth%>
  http: typeof http;
  users: typeof users;
<%#endif%>
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
