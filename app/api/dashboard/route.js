// app/api/dashboard/route.js
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = auth.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);

    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    // find budget override for this month
    const budgetDoc = await db.collection("budgets").findOne({ userId, year, month });

    // appliedBase is either budget override or user's salary snapshot (or user's monthlySalary fallback)
    // const appliedBase = budgetDoc?.totalBudgetLimit ?? budgetDoc?.totalSalaryForMonth ?? user.monthlySalary;

    const appliedBase =  user.monthlySalary;


    // month range in UTC
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    // aggregate totalSpent
    const expAgg = await db.collection("expenses").aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
    ]).toArray();
    const totalSpent = expAgg[0]?.totalSpent || 0;

    // aggregate totalIncome
    const incAgg = await db.collection("incomes").aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
    ]).toArray();
    const totalIncome = incAgg[0]?.totalIncome || 0;

    const totalAvailable = (appliedBase || 0) + totalIncome;
    const remaining = totalAvailable - totalSpent;
    const percentRemaining = totalAvailable > 0 ? Number(((remaining / totalAvailable) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      year,
      month,
      baseSalary: user.monthlySalary,
      totalIncome,
      appliedBudget: appliedBase,
      totalAvailable,
      totalSpent,
      remaining,
      percentRemaining,
      monthlyBudgetApplied: budgetDoc ? "custom" : "salary",
      settings: user.settings || {}
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch dashboard", details: err.message }, { status: 500 });
  }
}
