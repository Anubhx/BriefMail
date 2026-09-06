import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/inbox(.*)",
  "/all-mail(.*)",
  "/starred(.*)",
  "/snoozed(.*)",
  "/finance(.*)",
  "/career(.*)",
  "/meetings(.*)",
  "/system(.*)",
  "/settings(.*)",
  "/dashboard(.*)",
  "/api/(.*)",
]);


const isPublicRoute = createRouteMatcher([
  // Google Webhooks & Cron
  "/api/webhooks/gmail",
  "/api/cron(.*)",

  // n8n & Worker endpoints (authenticated via x-n8n-secret header)
  "/api/gmail/accounts/active",
  "/api/gmail/refresh",
  "/api/gmail/sync",
  "/api/gmail/action-complete",
  "/api/classify/single",
  "/api/classify/batch",
  "/api/queue/pending",
  "/api/queue/drain",
  "/api/batch/active-jobs",
  "/api/batch/process-chunk",
  "/api/batch/update-progress",

  // Public status endpoint
  "/api/settings/n8n-status",

  // Auth pages
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|png|jpg|jpeg|gif|svg|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk proxy matcher
    "/__clerk/:path*",
  ],
};
