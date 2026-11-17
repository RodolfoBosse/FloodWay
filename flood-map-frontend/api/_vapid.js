/**
 * CONFIGURAÇÃO CENTRALIZADA DAS CHAVES VAPID (WEB PUSH W3C)
 * A chave pública é utilizada pelo navegador (client-side) para se inscrever.
 * A chave privada é mantida no ambiente de execução serverless para assinar o envio.
 */

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BJtwAaoG6WMYRQpF5u4B6OfHw6-fgjagQmlaPJiBYTD5WCpYI7EKHo4ZJk1sZ-7Xw-FQKOxR2KoBvnEKNqAJJKA";
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "qv-WCVQMOKyQQXmnFHwZhFSStVpXG9FQODQi4oiev90";
export const VAPID_SUBJECT = "mailto:contato@floodway.app.br";
