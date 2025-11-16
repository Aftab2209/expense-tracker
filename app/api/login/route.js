// app/api/login/route.js
import clientPromise from "@/lib/mongodb";
import { comparePassword, signToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const user = await db.collection("users").findOne({ email });

    if (!user) return NextResponse.json({ error: "invalid credentials" }, { status: 401 });

    const ok = await comparePassword(password, user.password);
    if (!ok) return NextResponse.json({ error: "invalid credentials" }, { status: 401 });

    const token = signToken(user);
    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        _id: String(user._id),
        email: user.email,
        name: user.name,
        monthlySalary: user.monthlySalary
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "login failed", details: err.message }, { status: 500 });
  }
}
