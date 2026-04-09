import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

const rpName = "EventScout AI Command Center";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email }, include: { credentials: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Determine RP ID based on host
    const url = new URL(req.url);
    const rpID = url.hostname;

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      attestationType: "none",
      excludeCredentials: user.credentials.map(cred => ({
        id: new Uint8Array(cred.credentialID),
        type: "public-key",
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        userVerification: "preferred",
        requireResidentKey: false,
      },
    });

    // Save the challenge 
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    });

    return NextResponse.json(options);
  } catch (error: any) {
    console.error("WebAuthn Gen Req Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
