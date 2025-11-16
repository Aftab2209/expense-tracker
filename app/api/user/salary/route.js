// app/api/user/salary/route.js
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const { monthlySalary, payday } = body;
    if (monthlySalary == null) return NextResponse.json({ error: "monthlySalary required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);

    const update = { monthlySalary: Number(monthlySalary), updatedAt: new Date() };
    if (payday != null) update.payday = Number(payday);

    await db.collection("users").updateOne({ _id: userId }, { $set: update });

    const user = await db.collection("users").findOne({ _id: userId }, { projection: { password: 0 } });

    return NextResponse.json({ success: true, user: { _id: String(user._id), email: user.email, monthlySalary: user.monthlySalary, payday: user.payday } });
  } catch (err) {
    return NextResponse.json({ error: "failed to update salary", details: err.message }, { status: 500 });
  }
}
