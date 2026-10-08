import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { OWNER_EMAIL } from "./owner";

// ID 토큰 검증에는 프로젝트 ID만 있으면 돼요 (서비스 계정 키 불필요).
const app =
  getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });

/** Authorization: Bearer <Firebase ID 토큰>이 블로그 주인의 것인지 확인해요. */
export async function isOwnerRequest(request: Request): Promise<boolean> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return false;
  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    return decoded.email === OWNER_EMAIL && decoded.email_verified === true;
  } catch {
    return false;
  }
}
