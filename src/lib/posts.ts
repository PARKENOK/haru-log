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
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type Post = {
  id: string;
  title: string;
  content: string;
  recordedAt: Date;
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
  };
}

export async function listPosts(): Promise<Post[]> {
  const snap = await getDocs(query(posts, orderBy("recordedAt", "desc"), limit(100)));
  return snap.docs.map(toPost);
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await getDoc(doc(posts, id));
  return snap.exists() ? toPost(snap) : null;
}

export async function createPost(input: PostInput): Promise<string> {
  const ref = await addDoc(posts, {
    title: input.title,
    content: input.content,
    recordedAt: Timestamp.fromDate(input.recordedAt),
    authorEmail: auth.currentUser?.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePost(id: string, input: PostInput): Promise<void> {
  await updateDoc(doc(posts, id), {
    title: input.title,
    content: input.content,
    recordedAt: Timestamp.fromDate(input.recordedAt),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(posts, id));
}
