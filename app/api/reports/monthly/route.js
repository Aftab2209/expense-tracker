// app/api/reports/monthly/route.js
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const sp = url.searchParams;
    const year = sp.get("year") ? Number(sp.get("year")) : (new Date()).getFullYear();

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);

    const startYear = new Date(Date.UTC(year, 0, 1));
    const endYear = new Date(Date.UTC(year + 1, 0, 1));

    // aggregate expenses by month
    const expensesAgg = await db.collection("expenses").aggregate([
      { $match: { userId, date: { $gte: startYear, $lt: endYear } } },
      {
        $group: {
          _id: { month: { $month: "$date" } },
          totalSpent: { $sum: "$amount" }
        }
      }
    ]).toArray();

    // aggregate incomes by month
    const incomesAgg = await db.collection("incomes").aggregate([
      { $match: { userId, date: { $gte: startYear, $lt: endYear } } },
      {
        $group: {
          _id: { month: { $month: "$date" } },
          totalIncome: { $sum: "$amount" }
        }
      }
    ]).toArray();

    // map results
    const spentMap = {};
    expensesAgg.forEach(r => { spentMap[r._id.month] = r.totalSpent; });
    const incMap = {};
    incomesAgg.forEach(r => { incMap[r._id.month] = r.totalIncome; });

    // fetch budgets for the year months (optional)
    const budgets = await db.collection("budgets").find({ userId, year }).toArray();
    const budgetsMap = {};
    budgets.forEach(b => { budgetsMap[b.month] = b.totalBudgetLimit ?? b.totalSalaryForMonth ?? null; });

    // user base salary
    const user = await db.collection("users").findOne({ _id: userId });

    const result = [];
    for (let m = 1; m <= 12; m++) {
      const totalSpent = spentMap[m] || 0;
      const totalIncome = incMap[m] || 0;
      const applied = budgetsMap[m] ?? user.monthlySalary;
      const net = totalIncome - totalSpent;
      result.push({
        year,
        month: m,
        totalSpent,
        totalIncome,
        net,
        appliedBase: applied
      });
    }

    return NextResponse.json({ year, months: result });
  } catch (err) {
    return NextResponse.json({ error: "failed to build monthly report", details: err.message }, { status: 500 });
  }
}
