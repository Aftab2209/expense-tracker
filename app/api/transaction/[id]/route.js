// app/api/transaction/route.js
import clientPromise from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

function parseCSV(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

function safeDate(val) {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
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


async function tryUpdate(collectionName, db, filter, updateData) {
  const res = await db.collection(collectionName).updateOne(filter, { $set: updateData });
  return res.matchedCount > 0;
}

async function tryDelete(collectionName, db, filter) {
  const res = await db.collection(collectionName).deleteOne(filter);
  return res.deletedCount > 0;
}

export async function PUT(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "invalid or missing id" }, { status: 400 });
    }

    const body = await req.json();
    const providedType = body.type;
    if (providedType && providedType !== "expense" && providedType !== "income") {
      return NextResponse.json({ error: "type must be 'income' or 'expense'" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);
    const _id = new ObjectId(id);

    const baseUpdate = { updatedAt: new Date() };
    const fields = ["amount", "note", "date", "tags", "paymentMethod", "mood", "categoryId"];
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === "categoryId") {
          if (!ObjectId.isValid(body[f])) {
            return NextResponse.json({ error: "invalid categoryId" }, { status: 400 });
          }
          baseUpdate[f] = new ObjectId(body[f]);
        } else if (f === "date") {
          const d = safeDate(body[f]);
          if (!d) return NextResponse.json({ error: "invalid date" }, { status: 400 });
          baseUpdate[f] = d;
        } else if (f === "amount") {
          baseUpdate[f] = Number(body[f]);
        } else if (f === "tags") {
          baseUpdate[f] = Array.isArray(body[f]) ? body[f] : [];
        } else {
          baseUpdate[f] = body[f];
        }
      }
    }

    // If type provided, update only that collection
    if (providedType) {
      const collection = providedType === "expense" ? "expenses" : "incomes";
      // if updating incomes, remove categoryId/paymentMethod/mood if present and not relevant
      if (collection === "incomes" && baseUpdate.categoryId) delete baseUpdate.categoryId;
      const matched = await tryUpdate(collection, db, { _id, userId }, baseUpdate);
      if (!matched) return NextResponse.json({ error: "transaction not found" }, { status: 404 });
      return NextResponse.json({ success: true, updated: true, type: providedType });
    }

    // Auto-detect: try expenses first, then incomes
    const triedExpense = { ...baseUpdate };
    const expenseMatched = await tryUpdate("expenses", db, { _id, userId }, triedExpense);
    if (expenseMatched) return NextResponse.json({ success: true, updated: true, type: "expense" });

    // For incomes, remove categoryId/paymentMethod/mood which are expense-specific
    const incomeUpdate = { ...baseUpdate };
    delete incomeUpdate.categoryId;
    delete incomeUpdate.paymentMethod;
    delete incomeUpdate.mood;

    const incomeMatched = await tryUpdate("incomes", db, { _id, userId }, incomeUpdate);
    if (incomeMatched) return NextResponse.json({ success: true, updated: true, type: "income" });

    return NextResponse.json({ error: "transaction not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "failed to update transaction", details: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "invalid or missing id" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("expense_tracker");
    const userId = new ObjectId(decoded.userId);
    const _id = new ObjectId(id);

    // Try expenses first
    const deletedInExpenses = await tryDelete("expenses", db, { _id, userId });
    if (deletedInExpenses) {
      return NextResponse.json({ success: true, deleted: true, type: "expense" });
    }

    // Then try incomes
    const deletedInIncomes = await tryDelete("incomes", db, { _id, userId });
    if (deletedInIncomes) {
      return NextResponse.json({ success: true, deleted: true, type: "income" });
    }

    return NextResponse.json({ error: "transaction not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "failed to delete transaction", details: err.message }, { status: 500 });
  }
}