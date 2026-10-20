import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import {
  getOraculoDefaultDownloadLink,
  getOraculoDeliveryAttachmentCount,
  resolveOraculoDeliveryYoutubeUrl,
} from "@/lib/oraculo-delivery-assets";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const youtubeLink = await resolveOraculoDeliveryYoutubeUrl();
  const downloadLink = getOraculoDefaultDownloadLink();
  const attachmentCount = await getOraculoDeliveryAttachmentCount();

  return NextResponse.json({
    downloadLink: downloadLink ?? "",
    youtubeLink: youtubeLink ?? "",
    attachmentCount,
  });
}
