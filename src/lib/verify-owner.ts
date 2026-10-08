import { createRemoteJWKSet, jwtVerify } from "jose";
import { OWNER_EMAIL } from "./owner";

// Firebase ID 토큰은 Google 공개키로 서명돼 있어요.
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/** Authorization: Bearer <Firebase ID 토큰>이 블로그 주인의 것인지 확인해요. */
export async function isOwnerRequest(request: Request): Promise<boolean> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !PROJECT_ID) return false;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });
    return payload.sub !== undefined && payload.email === OWNER_EMAIL && payload.email_verified === true;
  } catch {
    return false;
  }
}
