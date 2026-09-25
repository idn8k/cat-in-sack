// Real delivery (Resend) is a deliberate later Phase 1 milestone — see docs/BUILD_PLAN.md.
// Until then every environment logs the code to the console instead of emailing it.
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  console.log(`[OTP] ${email}: ${code}`);
}
