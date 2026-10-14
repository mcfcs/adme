import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import PostCard from "./PostCard";
import Spinner from "./Spinner";

export function usePostFeed(query) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    setPosts([]);

    api(`/api/posts?${query}`)
      .then((data) => {
        if (ignore) {
          return;
        }
        setPosts(data.posts);
        setCursor(data.next_cursor);
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  async function loadMore() {
    if (!cursor || busy.current) {
      return;
    }
    busy.current = true;
    setLoadingMore(true);
    try {
      const data = await api(`/api/posts?${query}&before=${encodeURIComponent(cursor)}`);
      setPosts((current) => [...current, ...data.posts]);
      setCursor(data.next_cursor);
    } catch (err) {
      setError(err.message);
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }

  function addPost(post) {
    setPosts((current) => [post, ...current]);
  }

  function replacePost(updated) {
    setPosts((current) => current.map((post) => {
      if (post.id === updated.id) {
        return updated;
      }
      return post;
    }));
  }

  function removePost(id) {
    setPosts((current) => current.filter((post) => post.id !== id));
  }

  return { posts, cursor, loading, loadingMore, error, loadMore, addPost, replacePost, removePost };
}

export default function PostFeed({ feed, emptyTitle, emptyText }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom || !feed.cursor) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        feed.loadMore();
      }
    }, { rootMargin: "300px" });
    observer.observe(bottom);
    return () => observer.disconnect();
  }, [feed]);

  if (feed.loading) {
    return <Spinner label="Loading posts" />;
  }

  if (feed.error && feed.posts.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {feed.error}
      </div>
    );
  }

  if (feed.posts.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-mist bg-white/60 px-6 py-12 text-center">
        <p className="text-lg font-black text-zblue">{emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {feed.posts.map((post) => (
        <PostCard key={post.id} post={post} onChange={feed.replacePost} onDelete={feed.removePost} />
      ))}

      <div ref={bottomRef} />
      {feed.loadingMore && <Spinner label="Loading more posts" />}
      {!feed.cursor && (
        <p className="py-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          You're all caught up
        </p>
      )}
    </div>
  );
}
