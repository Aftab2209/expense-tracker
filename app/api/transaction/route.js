// app/api/transaction/route.js
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

function parseCSV(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    // required: type ('income' or 'expense'), amount
    const { type, amount, categoryId, note, date, paymentMethod, mood, tags } = body;
    if (!type || (type !== "income" && type !== "expense")) {
      return NextResponse.json({ error: "type must be 'income' or 'expense'" }, { status: 400 });
    }
    if (amount == null) return NextResponse.json({ error: "amount required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);

    if (type === "expense") {
      if (!categoryId) return NextResponse.json({ error: "categoryId required for expense" }, { status: 400 });
      if (!ObjectId.isValid(categoryId)) return NextResponse.json({ error: "invalid categoryId" }, { status: 400 });

      const expense = {
        userId,
        amount: Number(amount),
        currency: "INR",
        categoryId: new ObjectId(categoryId),
        note: note || "",
        date: date ? new Date(date) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentMethod: paymentMethod || null,
        mood: mood || null,
        tags: Array.isArray(tags) ? tags : [],
        split: { isSplit: false, members: [] }
      };
      const res = await db.collection("expenses").insertOne(expense);
      return NextResponse.json({ success: true, type: "expense", _id: String(res.insertedId) });
    } else {
      // income
      const income = {
        userId,
        amount: Number(amount),
        note: note || "",
        date: date ? new Date(date) : new Date(),
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const res = await db.collection("incomes").insertOne(income);
      return NextResponse.json({ success: true, type: "income", _id: String(res.insertedId) });
    }
  } catch (err) {
    return NextResponse.json({ error: "failed to add transaction", details: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const sp = url.searchParams;
    const year = sp.get("year") ? Number(sp.get("year")) : null;
    const month = sp.get("month") ? Number(sp.get("month")) : null;
    const limit = Math.min(200, Number(sp.get("limit") || 50));
    const skip = Number(sp.get("skip") || 0);

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);

    let dateFilter = {};
    if (year && month) {
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      dateFilter = { date: { $gte: start, $lt: end } };
    } else if (year && !month) {
      const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));
      dateFilter = { date: { $gte: start, $lt: end } };
    }

    const [expenses, incomes] = await Promise.all([
      db.collection("expenses").find({ userId, ...dateFilter }).project({ userId:0 }).toArray(),
      db.collection("incomes").find({ userId, ...dateFilter }).project({ userId:0 }).toArray()
    ]);

    const mappedExpenses = expenses.map(e => ({
      _id: String(e._id),
      type: "expense",
      amount: e.amount,
      categoryId: e.categoryId ? String(e.categoryId) : null,
      note: e.note,
      date: e.date,
      paymentMethod: e.paymentMethod || null,
      mood: e.mood || null,
      tags: e.tags || []
    }));

    const mappedIncomes = incomes.map(i => ({
      _id: String(i._id),
      type: "income",
      amount: i.amount,
      note: i.note,
      date: i.date,
      tags: i.tags || []
    }));

    const merged = [...mappedExpenses, ...mappedIncomes].sort((a,b) => new Date(b.date) - new Date(a.date));
    const total = merged.length;
    const sliced = merged.slice(skip, skip + limit);

    return NextResponse.json({ total, count: sliced.length, transactions: sliced });
  } catch (err) {
    return NextResponse.json({ error: "failed to fetch transactions", details: err.message }, { status: 500 });
  }
}
