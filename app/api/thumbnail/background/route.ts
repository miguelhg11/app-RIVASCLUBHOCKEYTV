import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getMimeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("thumbnail_backgrounds")
      .select("url_path, base64_data")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return new Response("Background not found", { status: 404 });
    }

    // 1. If base64_data is available, return it as binary image
    if (data.base64_data) {
      const base64Clean = data.base64_data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Clean, "base64");
      const mime = data.base64_data.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 2. If url_path is data URL, return it directly
    if (data.url_path?.startsWith("data:image/")) {
      const base64Clean = data.url_path.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Clean, "base64");
      const mime = data.url_path.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 3. If url_path is remote URL, fetch and proxy
    if (data.url_path && (data.url_path.startsWith("http://") || data.url_path.startsWith("https://"))) {
      const remoteRes = await fetch(data.url_path, { cache: "no-store" });
      if (remoteRes.ok) {
        const arrayBuffer = await remoteRes.arrayBuffer();
        return new Response(arrayBuffer, {
          headers: {
            "Content-Type": remoteRes.headers.get("content-type") || "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 4. Read from local disk
    if (data.url_path) {
      let cleanPath = data.url_path;
      if (cleanPath.startsWith("/")) {
        cleanPath = cleanPath.slice(1);
      }
      if (cleanPath.startsWith("public/")) {
        cleanPath = cleanPath.slice("public/".length);
      }
      const fullPath = path.join(process.cwd(), cleanPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const mime = getMimeFromPath(cleanPath);
        return new Response(buffer, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
      
      // Also check public folder
      const publicPath = path.join(process.cwd(), "public", cleanPath);
      if (fs.existsSync(publicPath)) {
        const buffer = fs.readFileSync(publicPath);
        const mime = getMimeFromPath(cleanPath);
        return new Response(buffer, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return new Response("Image file not found on disk", { status: 404 });
  } catch (err) {
    console.error("Error serving background image:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
