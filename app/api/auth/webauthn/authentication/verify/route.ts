import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, authenticationResponse } = await req.json();
    if (!email || !authenticationResponse) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { credentials: true } });
    if (!user || !user.currentChallenge) {
      return NextResponse.json({ error: "User or challenge not found" }, { status: 400 });
    }

    const credential = user.credentials.find(c => 
      Buffer.from(c.credentialID).toString('base64url') === authenticationResponse.id
    );

    if (!credential) {
      return NextResponse.json({ error: "Invalid credential" }, { status: 400 });
    }

    const url = new URL(req.url);
    const expectedOrigin = url.origin;
    const expectedRPID = url.hostname;

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: new Uint8Array(credential.credentialID),
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as AuthenticatorTransportFuture[],
      }
    });

    if (verification.verified) {
      await prisma.credential.update({
        where: { id: credential.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() }
      });
      await prisma.user.update({ where: { id: user.id }, data: { currentChallenge: null } });
      
      return NextResponse.json({ verified: true, user: {
        id: user.id, email: user.email, name: user.name, role: user.role, interests: user.interests, savedEventIds: user.savedEventIds
      }});
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  } catch (error: any) {
    console.error("WebAuthn Auth Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
