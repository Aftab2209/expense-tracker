// /app/api/categories/route.js
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    // require auth
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized - missing token" }, { status: 401 });

    const token = auth.replace("Bearer ", "").trim();
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");

    // userId may be string — keep as ObjectId
    let userId;
    try {
      userId = new ObjectId(decoded.userId);
    } catch (e) {
      return NextResponse.json({ error: "Invalid user id in token" }, { status: 401 });
    }

    // find non-deleted categories: global (userId:null) + user-specific
    const categories = await db.collection("categories")
      .find({ $and: [
        { $or: [{ userId: null }, { userId }] },
        { deletedAt: { $exists: false } }
      ]})
      .sort({ name: 1 })
      .toArray();

    // normalize ObjectId -> string for frontend
    const normalized = categories.map(c => ({
      _id: String(c._id),
      userId: c.userId ? String(c.userId) : null,
      name: c.name,
      icon: c.icon || null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    // server-side log for debugging
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ error: "Failed to fetch categories", details: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized - missing token" }, { status: 401 });

    const token = auth.replace("Bearer ", "").trim();
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });

    const body = await req.json();
    const { name, icon } = body;
    if (!name || typeof name !== "string") return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");

    const userId = new ObjectId(decoded.userId);

    // prevent duplicate user category
    const exists = await db.collection("categories").findOne({
      userId,
      name,
      deletedAt: { $exists: false }
    });
    if (exists) return NextResponse.json({ error: "Category exists" }, { status: 409 });

    const doc = { userId, name, icon: icon || null, createdAt: new Date(), updatedAt: new Date() };
    const res = await db.collection("categories").insertOne(doc);
    return NextResponse.json({ success: true, _id: String(res.insertedId) });
  } catch (err) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json({ error: "Failed to create category", details: err.message }, { status: 500 });
  }
}
