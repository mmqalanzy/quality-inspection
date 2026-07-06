import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { updateInspectionItem } from "@/server/inspections/update-inspection-item";

type Props = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false, message: "يجب تسجيل الدخول." }, { status: 401 });
  }

  const { itemId } = await params;
  const result = await updateInspectionItem(user, itemId, await request.json().catch(() => null));

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
