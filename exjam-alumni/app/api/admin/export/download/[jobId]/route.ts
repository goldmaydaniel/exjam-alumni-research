import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    // In a real implementation, you would:
    // 1. Retrieve the export job from the database
    // 2. Check if the file exists and is ready for download
    // 3. Stream the file content to the user

    // For now, return mock CSV data based on job ID
    let csvContent = "";
    let fileName = "report.csv";

    switch (jobId) {
      case "job-1":
        // Mock events CSV
        csvContent = `id,title,date,location,status,registrations,checkins,revenue
1,Annual Alumni Gathering,2024-06-15,Toronto,PUBLISHED,45,38,4500.00
2,Tech Networking Event,2024-07-20,Vancouver,PUBLISHED,25,22,2500.00
3,Golf Tournament,2024-08-10,Calgary,COMPLETED,60,55,6000.00`;
        fileName = "events-report-2024.csv";
        break;

      default:
        // Generic mock data
        csvContent = `id,name,email,date
1,John Doe,john@example.com,2024-01-01
2,Jane Smith,jane@example.com,2024-01-02`;
        fileName = "export.csv";
    }

    const headers = new Headers({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
