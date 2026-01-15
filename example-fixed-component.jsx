// ✅ 修复后的 React 组件 - 遵循所有 Vercel 最佳实践
// Fixed React component following all Vercel best practices

import React, { useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// ✅ 修复 1: 直接导入，避免 barrel import
import Button from 'ui-library/Button';

// ✅ 修复 2: 动态导入重型组件
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
});

// ✅ 修复 3: 组件定义移到外部 + 使用 memo
const PostCard = memo(({ post }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="post-card">
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <button onClick={() => setLiked(!liked)}>
        {liked ? '❤️' : '🤍'}
      </button>
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default function UserProfilePage({ userId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // ✅ 修复 4: 并行获取数据，避免 waterfall
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // ✅ 使用 Promise.all 并行请求
        const [userRes, postsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/users/${userId}/posts`)
        ]);

        // ✅ 并行解析 JSON
        const [userData, postsData] = await Promise.all([
          userRes.json(),
          postsRes.json()
        ]);

        setUser(userData);
        setPosts(postsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  // ✅ 修复 5: 使用 useCallback 缓存函数，避免不必要的 re-render
  const handleEdit = useCallback(() => {
    router.push(`/users/${userId}/edit`);
  }, [router, userId]);

  const handleDelete = useCallback(() => {
    router.push(`/users/${userId}/delete`);
  }, [router, userId]);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  const toggleModal = useCallback(() => {
    setShowModal(prev => !prev);
  }, []);

  // ✅ 修复 6: 使用 useMemo 缓存排序结果
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [posts]);

  // ✅ 修复 7: 使用 useMemo 缓存过滤结果
  const filteredPosts = useMemo(() => {
    return sortedPosts.filter(post => {
      if (filter === 'all') return true;
      if (filter === 'published') return post.published;
      if (filter === 'draft') return !post.published;
      return true;
    });
  }, [sortedPosts, filter]);

  return (
    <div className="user-profile">
      <header>
        <h1>{user?.name || 'User Profile'}</h1>
        {/* ✅ 使用缓存的回调函数 */}
        <Button onClick={handleEdit}>Edit Profile</Button>
        <Button onClick={handleDelete}>Delete</Button>
      </header>

      <div className="filters">
        <button onClick={() => handleFilterChange('all')}>All</button>
        <button onClick={() => handleFilterChange('published')}>Published</button>
        <button onClick={() => handleFilterChange('draft')}>Drafts</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <div className="posts">
        {/* ✅ 修复 8: 使用三元运算符，避免 && 的陷阱 */}
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <p>No posts found</p>
        )}
      </div>

      {/* ✅ 修复 9: 使用 Suspense + 条件渲染重型组件 */}
      {posts.length > 0 && (
        <Suspense fallback={<p>Loading chart...</p>}>
          <HeavyChart data={posts} />
        </Suspense>
      )}

      {/* ✅ 修复 10: Modal 只在需要时才渲染 */}
      {showModal && (
        <Modal onClose={toggleModal}>
          <p>Modal content</p>
        </Modal>
      )}
    </div>
  );
}

// ✅ 额外优化：如果是 Next.js 13+，使用服务器组件

// UserProfilePage.server.jsx - 服务器组件
// async function UserProfilePage({ userId }) {
//   const [user, posts] = await Promise.all([
//     fetchUser(userId),
//     fetchUserPosts(userId)
//   ]);
//
//   return (
//     <div>
//       <UserProfileHeader user={user} />
//       <Suspense fallback={<PostsSkeleton />}>
//         <UserPosts userId={userId} initialPosts={posts} />
//       </Suspense>
//     </div>
//   );
// }
