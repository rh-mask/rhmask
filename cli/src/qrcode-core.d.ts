/**
 * The `qrcode` package ships types only for its top-level entry, which pulls in
 * a CJS server module that requires Node built-ins at runtime. We use the core
 * matrix generator directly instead, so the shape we rely on is declared here.
 */
declare module "qrcode/lib/core/qrcode.js" {
  export type QrCode = {
    modules: { size: number; data: Uint8Array };
  };
  const core: {
    create(text: string, options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H"; version?: number }): QrCode;
  };
  export default core;
}
