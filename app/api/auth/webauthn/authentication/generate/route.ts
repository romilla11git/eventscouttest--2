import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email }, include: { credentials: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.credentials.length === 0) return NextResponse.json({ error: "No passkeys registered for this user" }, { status: 400 });

    const url = new URL(req.url);
    const rpID = url.hostname;

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.credentials.map(cred => ({
        id: new Uint8Array(cred.credentialID),
        type: "public-key",
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: "preferred",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    });

    return NextResponse.json(options);
  } catch (error: any) {
    console.error("WebAuthn Auth Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
