"use client";

import { useState } from "react";
import Link from "next/link";

const NEIGHBORHOODS = ["All", "Nairobi CBD", "Westlands", "Karen", "Eastleigh", "Mombasa", "Kisumu"];

interface Post {
  id: string;
  title: string;
  body: string;
  category: string | null;
  neighborhood: string | null;
  createdAt: string;
  author: { name: string | null };
  replies?: { id: string }[];
}

const DEMO_POSTS: Post[] = [
  {
    id: "1",
    title: "How I fixed a jammed Epson printer in 10 minutes",
    body: "Always check the paper path first. Half of ‘dead’ printers are just a crumpled sheet near the roller.",
    category: "tip",
    neighborhood: "Westlands",
    createdAt: new Date().toISOString(),
    author: { name: "James Otieno" },
    replies: [{ id: "a" }, { id: "b" }],
  },
  {
    id: "2",
    title: "Looking for CCTV install recommendation in Eastleigh",
    body: "Need 4 cameras for a small shop. Budget around KES 25,000. Any verified techs you trust?",
    category: "question",
    neighborhood: "Eastleigh",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    author: { name: "Amina Hassan" },
    replies: [{ id: "c" }],
  },
  {
    id: "3",
    title: "Safety tip: never pay technicians outside SkillLink",
    body: "Escrow protects both sides. If someone asks you to pay M-Pesa directly before the job is done, report them.",
    category: "tip",
    neighborhood: "Nairobi CBD",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    author: { name: "SkillLink Safety" },
    replies: [],
  },
];

export default function CommunityPage() {
  const [neighborhood, setNeighborhood] = useState("All");
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("tip");
  const [posting, setPosting] = useState(false);

  const filtered =
    neighborhood === "All" ? posts : posts.filter((p) => p.neighborhood === neighborhood);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          category,
          neighborhood: neighborhood === "All" ? "Nairobi CBD" : neighborhood,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [data, ...prev]);
      } else {
        setPosts((prev) => [
          {
            id: String(Date.now()),
            title,
            body,
            category,
            neighborhood: neighborhood === "All" ? "Nairobi CBD" : neighborhood,
            createdAt: new Date().toISOString(),
            author: { name: "You" },
            replies: [],
          },
          ...prev,
        ]);
      }
      setTitle("");
      setBody("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Tips, questions, and local help across Kenya & East Africa
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {NEIGHBORHOODS.map((n) => (
          <button
            key={n}
            onClick={() => setNeighborhood(n)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
              neighborhood === n ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <form onSubmit={handlePost} className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 mb-6 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Share with the community</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" required />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your tip, question, or update…" rows={3} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" required />
        <div className="flex flex-wrap items-center gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2 text-sm">
            <option value="tip">Tip</option>
            <option value="question">Question</option>
            <option value="general">General</option>
          </select>
          <button type="submit" disabled={posting} className="ml-auto px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {filtered.map((post) => (
          <article key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
              {post.category && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">{post.category}</span>
              )}
              {post.neighborhood && <span>{post.neighborhood}</span>}
              <span>·</span>
              <span>{post.author.name || "Member"}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{post.title}</h3>
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{post.body}</p>
            <p className="text-xs text-gray-400 mt-3">{post.replies?.length || 0} replies</p>
          </article>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-10">
        Need a technician? <Link href="/search" className="text-blue-600 font-medium hover:underline">Search nearby</Link>
      </p>
    </div>
  );
}
