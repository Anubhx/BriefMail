import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Redis from "ioredis";

// Initialize Redis client safely
const getRedisClient = () => {
  if (process.env.REDIS_URL) {
    try {
      return new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });
    } catch {
      return null;
    }
  }
  return null;
};

export async function GET() {
  try {
    const { userId } = await auth();
    const effectiveUserId = userId || "demo_user";
    const cacheKey = `finance_summary:${effectiveUserId}`;

    // 1. Attempt Redis Cache Lookup
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.connect().catch(() => {});
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json(JSON.parse(cached), {
            headers: { "X-Cache": "HIT" },
          });
        }
      } catch (err) {
        console.warn("Redis cache bypass:", err);
      } finally {
        try { redis.disconnect(); } catch {}
      }
    }

    // 2. Mock / Aggregate Financial Data Response
    const responseData = {
      user_id: effectiveUserId,
      timestamp: new Date().toISOString(),
      overview: {
        total_debits_this_month: 42850,
        total_credits_this_month: 125000,
        next_emi: {
          lender: "HDFC Bank Home Loan",
          amount: 24500,
          due_date: "2026-09-12",
          days_left: 6,
        },
        active_sips_total: 15000,
      },
      emi_tracker: {
        total_outstanding: 1845000,
        items: [
          {
            id: "emi-1",
            lender: "HDFC Bank",
            loan_type: "Home Loan",
            total_amount: 2500000,
            remaining_amount: 1620000,
            monthly_emi: 24500,
            tenure_months: 240,
            months_paid: 72,
            next_due: "2026-09-12",
            interest_rate: 8.5,
            amortization: [
              { month: "Sep 2026", principal: 13000, interest: 11500, balance: 1607000 },
              { month: "Oct 2026", principal: 13100, interest: 11400, balance: 1593900 },
              { month: "Nov 2026", principal: 13200, interest: 11300, balance: 1580700 },
            ],
          },
          {
            id: "emi-2",
            lender: "ICICI Bank",
            loan_type: "Car Loan",
            total_amount: 600000,
            remaining_amount: 225000,
            monthly_emi: 12500,
            tenure_months: 60,
            months_paid: 30,
            next_due: "2026-09-18",
            interest_rate: 9.1,
            amortization: [
              { month: "Sep 2026", principal: 10800, interest: 1700, balance: 214200 },
              { month: "Oct 2026", principal: 10900, interest: 1600, balance: 203300 },
            ],
          },
        ],
      },
      investments: {
        total_portfolio_value: 485000,
        total_invested: 390000,
        overall_returns_pct: 24.36,
        sips: [
          {
            id: "sip-1",
            fund_name: "Mirae Asset Large Cap Fund",
            category: "Equity",
            monthly_amount: 5000,
            total_invested: 150000,
            current_value: 192500,
            returns_pct: 28.33,
          },
          {
            id: "sip-2",
            fund_name: "Parag Parikh Flexi Cap Fund",
            category: "Flexi Cap",
            monthly_amount: 5000,
            total_invested: 140000,
            current_value: 178000,
            returns_pct: 27.14,
          },
          {
            id: "sip-3",
            fund_name: "UTI Nifty 50 Index Fund",
            category: "Index",
            monthly_amount: 3000,
            total_invested: 60000,
            current_value: 71500,
            returns_pct: 19.16,
          },
          {
            id: "sip-4",
            fund_name: "Axis Small Cap Fund",
            category: "Small Cap",
            monthly_amount: 2000,
            total_invested: 40000,
            current_value: 43000,
            returns_pct: 7.5,
          },
        ],
      },
      transactions: [
        {
          id: "tx-1",
          date: "2026-09-06",
          description: "Swiggy Food Delivery",
          merchant: "Swiggy",
          category: "Food",
          amount: 485,
          type: "debit",
          payment_mode: "UPI",
        },
        {
          id: "tx-2",
          date: "2026-09-06",
          description: "Salary Credit - Acme Corp",
          merchant: "Acme Corp",
          category: "Income",
          amount: 125000,
          type: "credit",
          payment_mode: "NetBanking",
        },
        {
          id: "tx-3",
          date: "2026-09-05",
          description: "Amazon India Shopping",
          merchant: "Amazon",
          category: "Shopping",
          amount: 2499,
          type: "debit",
          payment_mode: "Card",
        },
        {
          id: "tx-4",
          date: "2026-09-04",
          description: "Uber Trip to Airport",
          merchant: "Uber",
          category: "Travel",
          amount: 650,
          type: "debit",
          payment_mode: "UPI",
        },
        {
          id: "tx-5",
          date: "2026-09-02",
          description: "Netflix Premium Subscription",
          merchant: "Netflix",
          category: "Entertainment",
          amount: 649,
          type: "debit",
          payment_mode: "Card",
        },
      ],
      subscriptions: [
        {
          id: "sub-1",
          service: "Netflix Premium",
          category: "Entertainment",
          cost: 649,
          billing_cycle: "Monthly",
          next_billing: "2026-10-02",
          status: "active",
        },
        {
          id: "sub-2",
          service: "AWS Cloud Infrastructure",
          category: "Developer Tools",
          cost: 2450,
          billing_cycle: "Monthly",
          next_billing: "2026-10-01",
          status: "active",
        },
        {
          id: "sub-3",
          service: "Spotify Duo",
          category: "Music",
          cost: 149,
          billing_cycle: "Monthly",
          next_billing: "2026-09-25",
          status: "active",
        },
        {
          id: "sub-4",
          service: "Cult.fit Gym Membership",
          category: "Fitness",
          cost: 1500,
          billing_cycle: "Monthly",
          next_billing: "2026-09-15",
          status: "active",
        },
      ],
    };

    // 3. Cache Result in Redis (5-minute TTL)
    if (redis) {
      try {
        await redis.connect().catch(() => {});
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 300);
      } catch (err) {
        console.warn("Redis set cache error:", err);
      } finally {
        try { redis.disconnect(); } catch {}
      }
    }

    return NextResponse.json(responseData, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Finance summary API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance summary data" },
      { status: 500 }
    );
  }
}
