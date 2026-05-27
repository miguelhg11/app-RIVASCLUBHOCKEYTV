import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "auto").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://rivasyoutubelivehandoff.vercel.app";
const GMAIL_USER = process.env.GMAIL_USER ?? "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ?? "";
const SMTP_TLS_REJECT_UNAUTHORIZED = (process.env.SMTP_TLS_REJECT_UNAUTHORIZED ?? "true").toLowerCase() !== "false";

async function logEmailLocally(to: string, subject: string, html: string) {
  const logDir = path.join(process.cwd(), "scratch");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, "emails.log");
  const logEntry = `[${new Date().toISOString()}] TO: ${to} | SUBJECT: ${subject}\nBODY:\n${html}\n${"-".repeat(80)}\n`;
  fs.appendFileSync(logFile, logEntry, "utf8");
  console.log(`[EMAIL LOGGED] Sent to: ${to} | Subject: ${subject} (check scratch/emails.log)`);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const canUseResend = Boolean(RESEND_API_KEY);
  const canUseGmail = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

  const useResend = EMAIL_PROVIDER === "resend" || (EMAIL_PROVIDER === "auto" && canUseResend);
  const useGmail = EMAIL_PROVIDER === "gmail" || (EMAIL_PROVIDER === "auto" && !canUseResend && canUseGmail);

  if (useResend && !canUseResend) {
    console.error("EMAIL_PROVIDER=resend pero falta RESEND_API_KEY");
    if (NODE_ENV === "production") return false;
    await logEmailLocally(to, subject, html);
    return false;
  }

  if (useGmail && !canUseGmail) {
    console.error("EMAIL_PROVIDER=gmail pero faltan GMAIL_USER o GMAIL_APP_PASSWORD");
    if (NODE_ENV === "production") return false;
    await logEmailLocally(to, subject, html);
    return false;
  }

  if (useGmail) {
    try {
      const gmailFrom = EMAIL_FROM || GMAIL_USER;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED,
        },
      });

      const info = await transporter.sendMail({
        from: gmailFrom,
        to: to,
        subject: subject,
        html: html,
      });

      console.log(`[EMAIL SENT VIA GMAIL] Message ID: ${info.messageId} to ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to send email via Gmail:", error);
      await logEmailLocally(to, subject, `[GMAIL SEND FAILED: ${error instanceof Error ? error.message : String(error)}]\n\n` + html);
      return false;
    }
  }

  if (!RESEND_API_KEY) {
    await logEmailLocally(to, subject, html);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend API error: ${errText}`);
      // Fallback log on error
      await logEmailLocally(to, subject, `[RESEND SEND FAILED: ${errText}]\n\n` + html);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    await logEmailLocally(to, subject, `[FETCH FAILED: ${error instanceof Error ? error.message : String(error)}]\n\n` + html);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, password_plain: string, name: string): Promise<boolean> {
  const subject = "¡Bienvenido al equipo de emisiones de RIVAS HOCKEY TV!";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #0c0d12; color: #f0f0f5;">
      <h2 style="color: #ff1a1a; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; border-bottom: 2px solid #ff1a1a; padding-bottom: 10px;">¡Bienvenido al equipo, ${name}!</h2>
      <p style="font-size: 14px; line-height: 1.5;">Te damos la bienvenida al <strong>equipo de emisiones</strong> del canal <strong>RIVAS HOCKEY TV</strong>.</p>
      
      <p style="font-size: 14px; line-height: 1.5;">Se ha creado una cuenta para ti en nuestra plataforma de gestión de emisiones en directo.</p>
      
      <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>Enlace de acceso:</strong> <a href="${APP_BASE_URL}" style="color: #00e5ff; text-decoration: none;">${APP_BASE_URL}</a></p>
        <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Usuario/Email:</strong> ${email}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; background: #222; padding: 2px 6px; border-radius: 4px; color: #ff1a1a;">${password_plain}</span></p>
      </div>

      <div style="background-color: rgba(0, 229, 255, 0.05); border-left: 4px solid #00e5ff; padding: 12px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #00e5ff; font-weight: bold;">📱 ¡APLICACIÓN INSTALABLE (PWA)!</p>
        <p style="margin: 5px 0 0 0; font-size: 13px; line-height: 1.4;">Esta web es una aplicación web progresiva (PWA). Esto significa que <strong>puedes instalarla en tu móvil o tablet</strong> directamente desde el navegador (opción "Añadir a pantalla de inicio" o "Instalar") para tener un acceso rápido como una app nativa.</p>
      </div>

      <p style="font-size: 13px; color: #8a8b99; line-height: 1.5; margin-top: 25px;">* Por razones de seguridad, te recomendamos cambiar esta contraseña por una de tu elección accediendo a tu <strong>Perfil</strong> dentro de la aplicación.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
      <p style="font-size: 11px; color: #8a8b99; text-align: center; margin: 0;">CP Rivas Las Lagunas · Rivas Hockey TV</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

export async function sendAdminPasswordResetEmail(email: string, password_plain: string): Promise<boolean> {
  const subject = "Contraseña restablecida por administrador - Rivas Hockey TV";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #0c0d12; color: #f0f0f5;">
      <h2 style="color: #ff1a1a; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; border-bottom: 2px solid #ff1a1a; padding-bottom: 10px;">Contraseña restablecida</h2>
      <p style="font-size: 14px; line-height: 1.5;">Hola,</p>
      <p style="font-size: 14px; line-height: 1.5;">Un administrador ha restablecido tu contraseña para acceder a la aplicación de <strong>Rivas Hockey TV</strong>.</p>
      
      <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>Enlace de acceso:</strong> <a href="${APP_BASE_URL}" style="color: #00e5ff; text-decoration: none;">${APP_BASE_URL}</a></p>
        <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Usuario/Email:</strong> ${email}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Nueva contraseña temporal:</strong> <span style="font-family: monospace; background: #222; padding: 2px 6px; border-radius: 4px; color: #ff1a1a;">${password_plain}</span></p>
      </div>

      <p style="font-size: 13px; color: #8a8b99; line-height: 1.5; margin-top: 25px;">Te recomendamos cambiar esta contraseña por una propia en el apartado de tu <strong>Perfil</strong> una vez que hayas iniciado sesión.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
      <p style="font-size: 11px; color: #8a8b99; text-align: center; margin: 0;">CP Rivas Las Lagunas · Rivas Hockey TV</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

export async function sendSelfResetPasswordEmail(email: string, token: string): Promise<boolean> {
  const subject = "Restablece tu contraseña - Rivas Hockey TV";
  const resetLink = `${APP_BASE_URL}/forgot-password/reset?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #0c0d12; color: #f0f0f5;">
      <h2 style="color: #00e5ff; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; border-bottom: 2px solid #00e5ff; padding-bottom: 10px;">Solicitud de Restablecimiento de Contraseña</h2>
      <p style="font-size: 14px; line-height: 1.5;">Hola,</p>
      <p style="font-size: 14px; line-height: 1.5;">Has solicitado restablecer tu contraseña para acceder a la aplicación de <strong>Rivas Hockey TV</strong>.</p>
      
      <p style="font-size: 14px; line-height: 1.5;">Haz clic en el siguiente botón para establecer una nueva contraseña:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ff1a1a 0%, #cc0000 100%); color: white; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; box-shadow: 0 4px 12px rgba(255,26,26,0.3);">
          Restablecer Contraseña
        </a>
      </div>

      <p style="font-size: 13px; line-height: 1.5;">O copia y pega este enlace en tu navegador:</p>
      <p style="font-size: 12px; word-break: break-all; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; font-family: monospace;">
        <a href="${resetLink}" style="color: #00e5ff; text-decoration: none;">${resetLink}</a>
      </p>

      <p style="font-size: 13px; color: #8a8b99; line-height: 1.5; margin-top: 25px;">* Este enlace es de un solo uso y expirará en <strong>1 hora</strong> por motivos de seguridad.</p>
      <p style="font-size: 13px; color: #8a8b99; line-height: 1.5;">Si no has solicitado este cambio, puedes ignorar este correo de forma segura.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
      <p style="font-size: 11px; color: #8a8b99; text-align: center; margin: 0;">CP Rivas Las Lagunas · Rivas Hockey TV</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}
