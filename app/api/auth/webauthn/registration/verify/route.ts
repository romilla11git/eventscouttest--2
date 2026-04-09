import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, registrationResponse } = await req.json();
    if (!email || !registrationResponse) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.currentChallenge) {
      return NextResponse.json({ error: "User or challenge not found" }, { status: 400 });
    }

    const url = new URL(req.url);
    const expectedOrigin = url.origin;
    const expectedRPID = url.hostname;

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      await prisma.credential.create({
        data: {
          user: { connect: { id: user.id } },
          credentialID: Buffer.from(credentialID),
          publicKey: Buffer.from(credentialPublicKey),
          counter: BigInt(counter),
          transports: registrationResponse.response.transports || [],
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          name: "Registered Device"
        }
      });

      // Clear challenge
      await prisma.user.update({ where: { id: user.id }, data: { currentChallenge: null } });
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  } catch (error: any) {
    console.error("WebAuthn Verify Req Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
