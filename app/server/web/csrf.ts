/** Set only by our HTTP adapter, after discarding any client-supplied copy. */
export const BROWSER_ORIGIN_HEADER = "x-headplane-browser-origin";

/** Validate the browser's origin before the internal React Router scheme alignment. */
export function isSameOriginPost(request: Request, publicBaseUrl: string) {
  const origin = request.headers.get(BROWSER_ORIGIN_HEADER) ?? request.headers.get("Origin");
  return request.method === "POST" && origin === new URL(publicBaseUrl).origin;
}
