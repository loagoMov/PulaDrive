import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "clear expired featured listings",
    { hours: 24 },
    internal.featured.clearExpired
);

crons.interval(
    "sweep invoices for overdue status and freezing",
    { hours: 24 },
    internal.billing_crons.sweepInvoices
);

crons.interval(
    "cleanup rate limits",
    { hours: 24 },
    internal.rateLimit.cleanupExpiredRateLimits
);

crons.interval(
    "monitor subscription cycles and extra slots timeline",
    { hours: 24 },
    internal.subscription_crons.monitorSubscriptionCycles
);

export default crons;
