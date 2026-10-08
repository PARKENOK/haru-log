import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Weather } from "./meta";

export type Post = {
  id: string;
  title: string;
  content: string;
  recordedAt: Date;
  mood: string;
  weather: Weather | "";
  place: string;
  tags: string[];
};

export type PostInput = Omit<Post, "id">;

const posts = collection(db, "posts");

function toPost(snap: DocumentSnapshot): Post {
  const data = snap.data()!;
  return {
    id: snap.id,
    title: data.title,
    content: data.content,
    recordedAt: (data.recordedAt as Timestamp).toDate(),
    // 2단계에서 쓴 기록에는 아래 항목이 없어서 기본값을 둬요.
    mood: data.mood ?? "",
    weather: data.weather ?? "",
    place: data.place ?? "",
    tags: data.tags ?? [],
  };
}

function toFields(input: PostInput) {
  return {
    title: input.title,
    content: input.content,
    recordedAt: Timestamp.fromDate(input.recordedAt),
    mood: input.mood,
    weather: input.weather,
    place: input.place,
    tags: input.tags,
  };
}

export async function listPosts(): Promise<Post[]> {
  const snap = await getDocs(query(posts, orderBy("recordedAt", "desc"), limit(100)));
  return snap.docs.map(toPost);
}

/** start 이상 end 미만에 기록된 글 (오래된 순) */
export async function listPostsBetween(start: Date, end: Date): Promise<Post[]> {
  const snap = await getDocs(
    query(
      posts,
      where("recordedAt", ">=", Timestamp.fromDate(start)),
      where("recordedAt", "<", Timestamp.fromDate(end)),
      orderBy("recordedAt"),
    ),
  );
  return snap.docs.map(toPost);
}

export async function listPostsByTag(tag: string): Promise<Post[]> {
  // array-contains와 정렬을 함께 쓰면 복합 색인이 필요해서, 정렬은 여기서 해요.
  const snap = await getDocs(query(posts, where("tags", "array-contains", tag)));
  return snap.docs.map(toPost).sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await getDoc(doc(posts, id));
  return snap.exists() ? toPost(snap) : null;
}

export async function createPost(input: PostInput): Promise<string> {
  const ref = await addDoc(posts, {
    ...toFields(input),
    authorEmail: auth.currentUser?.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePost(id: string, input: PostInput): Promise<void> {
  await updateDoc(doc(posts, id), {
    ...toFields(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(posts, id));
}
