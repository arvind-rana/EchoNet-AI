import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to comment");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const post = await ctx.db.get(args.postId);

    if (!post || post.status !== "published") {
      throw new Error("Post not found or not published");
    }

    // Validate content
    if (!args.content.trim() || args.content.length > 1000) {
      throw new Error("Comment must be between 1-1000 characters");
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      authorName: user.name,
      authorEmail: user.email,
      content: args.content.trim(),
      status: "approved", // Auto-approve since only authenticated users can comment
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// Get comments for a post
export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), args.postId),
          q.eq(q.field("status"), "approved")
        )
      )
      .order("asc")
      .collect();

    // Add user info for all comments (since all are from authenticated users)
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return commentsWithUsers.filter((comment) => comment.author !== null);
  },
});

// Delete a comment (only by author or post owner)
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Get the post to check if user is the post owner
    const post = await ctx.db.get(comment.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user can delete this comment (comment author or post owner)
    const canDelete =
      comment.authorId === user._id || post.authorId === user._id;

    if (!canDelete) {
      throw new Error("Not authorized to delete this comment");
    }

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
 });

// This feature uses Convex’s document database. Posts, users, and comments are stored as independent JSON documents connected by IDs. There are no SQL joins, so I manually fetch related data.

// When adding a comment, the backend:

// Authenticates the user via Clerk → Convex identity

// Fetches the user document from users using tokenIdentifier

// Fetches the post document using its ID, validates status

// Validates comment text

// Inserts a new document into comments containing:

// postId

// authorId

// content

// timestamps

// status

// Fetching comments:

// queries comments table filtered by postId and approved status

// for each comment, fetches the user with ctx.db.get() (manual join)

// Deleting comments:

// fetch user → fetch comment → fetch post → check permissions → delete.

// This shows clear separation of concerns: authentication, authorization, validation, and database operations


// ctx.db.get() for single document

// ctx.db.query() for filtered lists

// ctx.db.insert() to create

// ctx.db.patch() to update

// ctx.db.delete() to remove
// 1️⃣ How does Convex store data?

// Document store (NoSQL-like), JSON documents.

// 2️⃣ How do you query in Convex?

// Using:

// ctx.db.get() → fetch by ID

// ctx.db.query() → filter, order, collect

// No joins

// 3️⃣ Why do you fetch user using tokenIdentifier?

// To map authentication identity to your internal user record.

// 4️⃣ How does Convex ensure ACID properties?

// Convex internally uses transactional operations for each mutation (atomic per mutation).

// 5️⃣ How does Convex handle relations?

// Manually via IDs (authorId, postId).

// 6️⃣ What is the difference between mutation and query?

// mutation → write (state-changing)

// query → read-only

// 7️⃣ Why use Promise.all() in getPostComments?

// To parallelize multiple DB calls for authors.

// 8️⃣ What happens if user or post doesn’t exist?

// Error thrown → mutation stops → no DB write happens.