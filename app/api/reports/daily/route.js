// app/api/reports/daily/route.js
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
    const month = sp.get("month") ? Number(sp.get("month")) : (new Date()).getMonth() + 1;

    if (!year || !month) return NextResponse.json({ error: "year and month required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    // fetch transactions in range
    const [expenses, incomes] = await Promise.all([
      db.collection("expenses").find({ userId, date: { $gte: start, $lt: end } }).toArray(),
      db.collection("incomes").find({ userId, date: { $gte: start, $lt: end } }).toArray()
    ]);

    // create a map keyed by day-of-month
    const daysInMonth = new Date(year, month, 0).getDate();
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      map[d] = { day: d, date: new Date(Date.UTC(year, month - 1, d)), totalSpent: 0, totalIncome: 0, transactions: [] };
    }

    for (const e of expenses) {
      const dt = new Date(e.date);
      const day = dt.getUTCDate();
      map[day].totalSpent += e.amount;
      map[day].transactions.push({
        _id: String(e._id),
        type: "expense",
        amount: e.amount,
        categoryId: e.categoryId ? String(e.categoryId) : null,
        note: e.note,
        date: e.date,
        paymentMethod: e.paymentMethod || null,
        mood: e.mood || null,
        tags: e.tags || []
      });
    }

    for (const i of incomes) {
      const dt = new Date(i.date);
      const day = dt.getUTCDate();
      map[day].totalIncome += i.amount;
      map[day].transactions.push({
        _id: String(i._id),
        type: "income",
        amount: i.amount,
        note: i.note,
        date: i.date,
        tags: i.tags || []
      });
    }

    // sort transactions inside each day by date desc
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      map[d].transactions.sort((a,b) => new Date(b.date) - new Date(a.date));
      result.push(map[d]);
    }

    return NextResponse.json({ year, month, days: result });
  } catch (err) {
    return NextResponse.json({ error: "failed to fetch daily report", details: err.message }, { status: 500 });
  }
}
