import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "order" | "contact" | "demo_download";
  data: {
    order_number?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    total_sar?: number;
    items_count?: number;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    template_name?: string;
    user_email?: string;
  };
}

interface NotificationSettings {
  whatsapp_number: string;
  whatsapp_enabled: boolean;
  callmebot_api_key?: string;
  email: string;
  email_enabled: boolean;
  resend_api_key?: string;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ FIX 1: تم إزالة شرط تسجيل الدخول حتى تعمل الإشعارات للزوار غير المسجلين
    // الـ function تستخدم Service Role Key مباشرة بدون JWT

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { type, data }: NotificationRequest = body;

    // التحقق من نوع الطلب
    if (type !== "order" && type !== "contact" && type !== "demo_download") {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // جلب الإعدادات من قاعدة البيانات
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value_json")
      .eq("key", "notification_settings")
      .maybeSingle();

    const settings: NotificationSettings = (settingsData?.value_json as NotificationSettings) || {
      whatsapp_number: "",
      whatsapp_enabled: false,
      callmebot_api_key: "",
      email: "",
      email_enabled: false,
      resend_api_key: "",
    };

    const resendApiKey = settings.resend_api_key || Deno.env.get("RESEND_API_KEY");
    const results: { email?: boolean; whatsapp?: boolean } = {};

    // ─── إرسال الإيميل ───────────────────────────────────────────
    if (settings.email_enabled && settings.email && resendApiKey) {
      try {
        let subject = "";
        let htmlContent = "";

        if (type === "order") {
          subject = `🛒 طلب جديد #${escapeHtml(data.order_number || "")}`;
          htmlContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">🛒 طلب جديد!</h1>
                <hr style="border: 1px solid #e5e5e5;">
                <p><strong>رقم الطلب:</strong> ${escapeHtml(data.order_number || "")}</p>
                <p><strong>اسم العميل:</strong> ${escapeHtml(data.customer_name || "")}</p>
                <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(data.customer_email || "")}</p>
                <p><strong>رقم الجوال:</strong> ${escapeHtml(data.customer_phone || "غير محدد")}</p>
                <p><strong>المجموع:</strong> ${escapeHtml(String(data.total_sar || 0))} ر.س</p>
                <p><strong>عدد العناصر:</strong> ${escapeHtml(String(data.items_count || 0))}</p>
                <hr style="border: 1px solid #e5e5e5;">
                <p style="text-align: center; color: #666;">Costamine Accounting</p>
              </div>
            </div>
          `;
        } else if (type === "contact") {
          subject = `📩 رسالة جديدة من ${escapeHtml(data.name || "")}`;
          htmlContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">📩 رسالة جديدة!</h1>
                <hr style="border: 1px solid #e5e5e5;">
                <p><strong>الاسم:</strong> ${escapeHtml(data.name || "")}</p>
                <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(data.email || "")}</p>
                <p><strong>رقم الجوال:</strong> ${escapeHtml(data.phone || "غير محدد")}</p>
                <hr style="border: 1px solid #e5e5e5;">
                <p><strong>الرسالة:</strong></p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                  ${escapeHtml(data.message || "")}
                </div>
                <hr style="border: 1px solid #e5e5e5;">
                <p style="text-align: center; color: #666;">Costamine Accounting</p>
              </div>
            </div>
          `;
        } else if (type === "demo_download") {
          subject = `📥 تحميل نسخة تجريبية - ${escapeHtml(data.template_name || "")}`;
          htmlContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">📥 تحميل نسخة تجريبية!</h1>
                <hr style="border: 1px solid #e5e5e5;">
                <p><strong>اسم القالب:</strong> ${escapeHtml(data.template_name || "")}</p>
                <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(data.user_email || "")}</p>
                <hr style="border: 1px solid #e5e5e5;">
                <p style="text-align: center; color: #666;">Costamine Accounting</p>
              </div>
            </div>
          `;
        }

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Costamine <onboarding@resend.dev>",
            to: [settings.email],
            subject,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.text();
          throw new Error(`Resend API error: ${emailResponse.status} - ${emailError}`);
        }

        results.email = true;
        console.log("✅ Email sent successfully");
      } catch (emailError) {
        console.error("❌ Error sending email:", emailError);
        results.email = false;
      }
    } else {
      console.log(
        "⚠️ Email skipped - enabled:",
        settings.email_enabled,
        "| email:",
        settings.email,
        "| apiKey:",
        !!resendApiKey,
      );
    }

    // ─── إرسال واتساب عبر TextMeBot ──────────────────────────────
    const whatsappApiKey = settings.callmebot_api_key || "";

    if (settings.whatsapp_enabled && settings.whatsapp_number && whatsappApiKey) {
      try {
        let message = "";

        if (type === "order") {
          message =
            `🛒 *طلب جديد!*\n\n` +
            `رقم الطلب: ${data.order_number}\n` +
            `اسم العميل: ${data.customer_name}\n` +
            `البريد: ${data.customer_email}\n` +
            `الجوال: ${data.customer_phone || "غير محدد"}\n` +
            `المجموع: ${data.total_sar} ر.س\n` +
            `عدد العناصر: ${data.items_count}`;
        } else if (type === "contact") {
          message =
            `📩 *رسالة جديدة!*\n\n` +
            `الاسم: ${data.name}\n` +
            `البريد: ${data.email}\n` +
            `الجوال: ${data.phone || "غير محدد"}\n\n` +
            `الرسالة:\n${data.message}`;
        } else if (type === "demo_download") {
          message = `📥 *تحميل نسخة تجريبية!*\n\n` + `القالب: ${data.template_name}\n` + `البريد: ${data.user_email}`;
        }

        // ✅ FIX 2: تنظيف الرقم وتحويله للصيغة الدولية
        const cleanNumber = settings.whatsapp_number.replace(/[\s\-\+]/g, "");
        const phoneNumber = cleanNumber.startsWith("966") ? cleanNumber : `966${cleanNumber.replace(/^0/, "")}`;

        const textmebotUrl = `https://api.textmebot.com/send.php?recipient=${phoneNumber}&apikey=${encodeURIComponent(whatsappApiKey)}&text=${encodeURIComponent(message)}`;

        console.log("📱 Sending WhatsApp to:", phoneNumber);

        const whatsappResponse = await fetch(textmebotUrl);

        // ✅ FIX 3: TextMeBot يرجع 200 دائماً — لازم نقرأ الـ body
        const responseText = await whatsappResponse.text();
        console.log("📱 TextMeBot response:", responseText);

        if (!whatsappResponse.ok || responseText.toLowerCase().includes("error")) {
          throw new Error(`TextMeBot error: ${responseText}`);
        }

        results.whatsapp = true;
        console.log("✅ WhatsApp sent successfully");
      } catch (whatsappError) {
        console.error("❌ Error sending WhatsApp:", whatsappError);
        results.whatsapp = false;
      }
    } else {
      console.log(
        "⚠️ WhatsApp skipped - enabled:",
        settings.whatsapp_enabled,
        "| number:",
        settings.whatsapp_number,
        "| apiKey:",
        !!whatsappApiKey,
      );
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Fatal error in send-notification:", message);
    return new Response(JSON.stringify({ error: "Internal server error", details: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
