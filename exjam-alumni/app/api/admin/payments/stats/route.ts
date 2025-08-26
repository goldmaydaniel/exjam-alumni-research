import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment statistics
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      bankTransferPendingPayments,
      revenueData,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "COMPLETED" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "BANK_TRANSFER_PENDING" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const stats = {
      total: totalPayments,
      completed: completedPayments,
      pending: pendingPayments,
      bankTransferPending: bankTransferPendingPayments,
      totalRevenue: revenueData._sum.amount || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Payment stats error:", error);
    return NextResponse.json({ error: "Failed to fetch payment statistics" }, { status: 500 });
  }
}
