import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { parseGoogleForm } from "@/lib/googleFormsParser";

export async function POST(request: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const schema = await parseGoogleForm(body);
    return NextResponse.json(schema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cannot parse form";
    return NextResponse.json({ message }, { status: 400 });
  }
}
