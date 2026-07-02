import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { isGlobalAdmin, requireGlobalAdmin } from "./utils";

// Create a new notification (internal or public depending on use case)
export const pushNotification = mutation({
    args: {
        recipientId: v.union(v.id("dealerships"), v.literal("admin")),
        type: v.union(v.literal("billing"), v.literal("account"), v.literal("system")),
        title: v.string(),
        message: v.string(),
        actionUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        return await ctx.db.insert("notifications", {
            ...args,
            isRead: false,
            createdAt: Date.now(),
        });
    }
});

// Helper to verify notification ownership
async function requireNotificationOwner(ctx: any, recipientId: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
    
    const isAdmin = await isGlobalAdmin(ctx);
    if (isAdmin) return;

    if (recipientId === "admin") {
        throw new ConvexError("Forbidden: Admin notifications are restricted.");
    }

    const dealer = await ctx.db.get(recipientId);
    if (!dealer) throw new ConvexError("Dealership not found");

    const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
    if (dealer.clerkOrgId !== callerOrgId) {
        throw new ConvexError("Forbidden: Access denied.");
    }
}

// Mark a single notification as read
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const notif = await ctx.db.get(args.notificationId);
        if (!notif) throw new ConvexError("Notification not found");
        await requireNotificationOwner(ctx, notif.recipientId);
        await ctx.db.patch(args.notificationId, { isRead: true });
    }
});

// Mark all unread notifications as read for a specific recipient
export const markAllAsRead = mutation({
    args: { recipientId: v.union(v.id("dealerships"), v.literal("admin")) },
    handler: async (ctx, args) => {
        await requireNotificationOwner(ctx, args.recipientId);
        
        let processed = 0;
        while (processed < 500) {
            const unread = await ctx.db.query("notifications")
                .withIndex("by_recipient_and_status", (q) => 
                    q.eq("recipientId", args.recipientId).eq("isRead", false)
                )
                .take(100);
            
            if (unread.length === 0) break;
            for (const notif of unread) {
                await ctx.db.patch(notif._id, { isRead: true });
            }
            processed += unread.length;
        }
    }
});

// List notifications for a recipient
export const getNotifications = query({
    args: { 
        recipientId: v.union(v.id("dealerships"), v.literal("admin")),
        limit: v.optional(v.number()) 
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
        
        const isAdmin = await isGlobalAdmin(ctx);
        if (!isAdmin) {
            if (args.recipientId === "admin") {
                throw new ConvexError("Forbidden: Access denied.");
            }
            const dealer = await ctx.db.get(args.recipientId);
            if (!dealer) {
                // Return empty array instead of throwing an error to prevent UI crashes
                // when switching or creating dealerships.
                return [];
            }
            const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
            if (dealer.clerkOrgId !== callerOrgId) {
                throw new ConvexError("Forbidden: Access denied.");
            }
        }

        const notifs = await ctx.db.query("notifications")
            .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
            .order("desc")
            .take(args.limit || 50);
            
        return notifs;
    }
});

// Get unread count
export const getUnreadCount = query({
    args: { recipientId: v.union(v.id("dealerships"), v.literal("admin")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
        
        const isAdmin = await isGlobalAdmin(ctx);
        if (!isAdmin) {
            if (args.recipientId === "admin") return 0;
            const dealer = await ctx.db.get(args.recipientId);
            if (!dealer) return 0;
            const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
            if (dealer.clerkOrgId !== callerOrgId) return 0;
        }

        const unread = await ctx.db.query("notifications")
            .withIndex("by_recipient_and_status", (q) => 
                q.eq("recipientId", args.recipientId).eq("isRead", false)
            )
            .take(100);
        return unread.length;
    }
});

// Permanently delete a single notification
export const deleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const notif = await ctx.db.get(args.notificationId);
        if (!notif) throw new ConvexError("Notification not found");
        await requireNotificationOwner(ctx, notif.recipientId);
        await ctx.db.delete(args.notificationId);
    }
});

// Permanently delete ALL notifications for a recipient (clear all)
export const deleteAllNotifications = mutation({
    args: { recipientId: v.union(v.id("dealerships"), v.literal("admin")) },
    handler: async (ctx, args) => {
        await requireNotificationOwner(ctx, args.recipientId);
        
        let processed = 0;
        while (processed < 500) {
            const all = await ctx.db.query("notifications")
                .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
                .take(100);
            if (all.length === 0) break;
            for (const notif of all) {
                await ctx.db.delete(notif._id);
            }
            processed += all.length;
        }
    }
});
