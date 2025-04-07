import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get page views and route usage from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get page views by aggregating user activity logs
    const pageViews = await prisma.userActivityLog.groupBy({
      by: ["page"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        page: true,
      },
    });

    // Get route usage by aggregating API requests
    const routeUsage = await prisma.apiRequestLog.groupBy({
      by: ["route"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        route: true,
      },
    });

    // Transform the data into the required format
    const pageViewsData = pageViews.reduce((acc, curr) => {
      acc[curr.page] = curr._count.page;
      return acc;
    }, {} as Record<string, number>);

    const routeUsageData = routeUsage.reduce((acc, curr) => {
      acc[curr.route] = curr._count.route;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      pageViews: pageViewsData,
      routeUsage: routeUsageData,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
