/**
 * CONFIGURAÇÃO CENTRALIZADA DAS CHAVES VAPID (WEB PUSH W3C)
 * A chave pública é utilizada pelo navegador (client-side) para se inscrever.
 * A chave privada é mantida no ambiente seguro serverless (process.env) para assinar o envio.
 * NUNCA exponha a chave privada em texto claro no repositório.
 */

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@floodway.app.br";

export function getVapidDetails() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[VAPID] Variáveis de ambiente VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY não configuradas.");
    return null;
  }
  return {
    subject: VAPID_SUBJECT,
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY
  };
}
