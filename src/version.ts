/**
 * Single source of truth for the User-Agent version string sent with
 * outbound requests to the Causabi API. Keep in sync with package.json —
 * there is no build-time JSON import here because the project's
 * moduleResolution ("bundler") + type:"module" setup doesn't reliably
 * support resolveJsonModule across ts-jest/tsc; a plain constant is the
 * simplest thing that works for both.
 */
export const PACKAGE_VERSION = "0.5.0";
export const USER_AGENT = `geo-optimizer-mcp/${PACKAGE_VERSION}`;
