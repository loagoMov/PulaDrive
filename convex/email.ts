"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// ─── Admin Email Notification Action (internal only) ─────────────────────────
export const sendAdminNotification = internalAction({
    args: {
        type: v.union(v.literal("report"), v.literal("promotion")),
        details: v.any(),
    },
    handler: async (_ctx, args) => {
        const apiKey = process.env.RESEND_API_KEY;
        const adminEmailsRaw = process.env.GLOBAL_ADMIN_EMAILS;

        if (!apiKey) {
            console.warn("[email] RESEND_API_KEY not set — skipping notification.");
            return;
        }
        if (!adminEmailsRaw) {
            console.warn("[email] GLOBAL_ADMIN_EMAILS not set — skipping notification.");
            return;
        }

        const adminEmails = adminEmailsRaw.split(",").map((e: string) => e.trim()).filter(Boolean);
        if (adminEmails.length === 0) return;

        const resend = new Resend(apiKey);
        const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const adminUrl = `${appUrl}/admin`;

        const d = args.details;
        let subject = "";
        let htmlContent = "";

        const baseStyles = `
            <style>
                body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                .header { padding: 32px 40px; }
                .body { padding: 0 40px 32px; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
                .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #f1f5f9; align-items: flex-start; }
                .info-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; width: 130px; flex-shrink: 0; padding-top: 2px; }
                .info-value { font-size: 14px; color: #1e293b; font-weight: 500; }
                .cta-button { display: inline-block; margin-top: 28px; padding: 14px 32px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; letter-spacing: 0.02em; }
                .footer { padding: 20px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
        `;

        if (args.type === "report") {
            const reasonLabels: Record<string, string> = {
                fraudulent_listing: "🚨 Fraudulent Listing",
                price_scam: "💰 Price Scam",
                fake_photos: "📷 Fake Photos",
                wrong_condition: "🚗 Misrepresented Condition",
                already_sold: "👤 Ghost Listing",
                suspicious_dealer: "⚠️ Suspicious Dealer",
                other: "🏳 Other",
            };

            subject = "🚨 CarPlace — New Listing Report Submitted";
            htmlContent = `
                ${baseStyles}
                <div class="container">
                    <div class="header" style="background: linear-gradient(135deg, #fef2f2 0%, #fff 100%); border-bottom: 1px solid #fecaca;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                            <div style="width:36px;height:36px;background:#0f172a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:13px;">CP</div>
                            <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">CarPlace Admin</span>
                        </div>
                        <h1 style="margin:0;font-size:22px;font-weight:900;color:#1e293b;">New Listing Report</h1>
                        <p style="margin:6px 0 0;font-size:14px;color:#64748b;">A report was submitted and needs your review.</p>
                    </div>
                    <div class="body">
                        <div style="margin-top:24px;">
                            <div class="info-row">
                                <span class="info-label">Vehicle</span>
                                <span class="info-value" style="font-weight:700;">${d.vehicleName ?? "Unknown"}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Dealership</span>
                                <span class="info-value">${d.dealerName ?? "Unknown"}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Reason</span>
                                <span class="info-value">${reasonLabels[d.reason] ?? d.reason}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Reported By</span>
                                <span class="info-value">${d.reporterEmail ?? "Anonymous Guest"}</span>
                            </div>
                            ${d.customMessage ? `
                            <div style="margin-top:16px;padding:16px;background:#fef2f2;border-radius:10px;border-left:3px solid #f87171;">
                                <p style="margin:0 0 4px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#f87171;">Reporter's Message</p>
                                <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${d.customMessage}</p>
                            </div>` : ""}
                        </div>
                        <a href="${adminUrl}?tab=reports" class="cta-button">Review in Admin Dashboard →</a>
                    </div>
                    <div class="footer">CarPlace Marketplace — Automated Admin Alert &nbsp;|&nbsp; <a href="${adminUrl}" style="color:#94a3b8;">Go to Dashboard</a></div>
                </div>
            `;
        } else if (args.type === "promotion") {
            const statusColor = d.status === "pending" ? "#f59e0b" : "#f97316";
            const statusBg = d.status === "pending" ? "#fffbeb" : "#fff7ed";

            subject = "✨ CarPlace — New Featured Listing Request";
            htmlContent = `
                ${baseStyles}
                <div class="container">
                    <div class="header" style="background: linear-gradient(135deg, #fffbeb 0%, #fff 100%); border-bottom: 1px solid #fde68a;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                            <div style="width:36px;height:36px;background:#0f172a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:13px;">CP</div>
                            <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">CarPlace Admin</span>
                        </div>
                        <h1 style="margin:0;font-size:22px;font-weight:900;color:#1e293b;">New Promotion Request</h1>
                        <p style="margin:6px 0 0;font-size:14px;color:#64748b;">A dealer wants to feature a listing. Approve or reject it in the dashboard.</p>
                    </div>
                    <div class="body">
                        <div style="margin-top:8px;">
                            <span class="badge" style="background:${statusBg};color:${statusColor};border:1px solid ${statusColor}30;">
                                ${d.status === "pending" ? "⏳ Pending Review" : "📋 Waitlisted"}
                            </span>
                        </div>
                        <div style="margin-top:20px;">
                            <div class="info-row">
                                <span class="info-label">Vehicle</span>
                                <span class="info-value" style="font-weight:700;">${d.vehicleName ?? "Unknown"}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Dealership</span>
                                <span class="info-value">${d.dealerName ?? "Unknown"}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Duration</span>
                                <span class="info-value">${d.durationDays} Days</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Revenue</span>
                                <span class="info-value" style="font-weight:700;color:#16a34a;">P ${d.price}</span>
                            </div>
                        </div>
                        <a href="${adminUrl}?tab=promotions" class="cta-button">Approve or Reject →</a>
                    </div>
                    <div class="footer">CarPlace Marketplace — Automated Admin Alert &nbsp;|&nbsp; <a href="${adminUrl}" style="color:#94a3b8;">Go to Dashboard</a></div>
                </div>
            `;
        }

        if (!subject) return;

        try {
            const { data, error } = await resend.emails.send({
                from: "PulaDrive <support@puladrive.com>",
                to: adminEmails,
                subject,
                html: htmlContent,
            });

            if (error) {
                console.error("[email] Resend API error:", error);
            } else {
                console.log(`[email] ${args.type} notification successfully sent via Resend. ID: ${data?.id}. Recipients: ${adminEmails.join(", ")}`);
            }
        } catch (error) {
            console.error("[email] Failed to send admin notification (exception):", error);
        }
    },
});
