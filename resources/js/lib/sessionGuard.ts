/**
 * Session guard.
 *
 * The React dashboards capture the CSRF token once at page load
 * (window.LaravelCsrfToken). Laravel rotates that token whenever the
 * session regenerates (login/logout in another tab, idle expiry, an
 * APP_KEY/config change in dev). After a rotation every later POST from
 * the still-open SPA carries a stale token and Laravel replies 419
 * "Page Expired" — which the SPA otherwise swallows as a silent failure.
 *
 * This wraps the global fetch so any 419 sends the user back to the
 * login page (with a friendly notice) instead of leaving them stuck on
 * a dashboard whose actions no longer work.
 */

const base = ((window as any).AppBase ?? "") as string;
const LOGIN_URL = `${base}/login?expired=1`;

let redirecting = false;

const originalFetch = window.fetch.bind(window);

window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  const res = await originalFetch(...args);

  if (res.status === 419 && !redirecting) {
    redirecting = true;
    window.location.assign(LOGIN_URL);
    // Navigation is in flight — never resolve so callers don't run
    // `.json()` on the 419 HTML body and surface a confusing parse error.
    return new Promise<Response>(() => {});
  }

  return res;
};

export {};
