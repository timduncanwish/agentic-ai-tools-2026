// ❌ 包含常见初学者错误的 React 组件示例
// 这个组件有多个性能和最佳实践问题

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from 'ui-library'; // Barrel import
import HeavyChart from '@/components/HeavyChart';
import Modal from '@/components/Modal';

export default function UserProfilePage({ userId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // ❌ 问题 1: Waterfall - 串行获取数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 先获取用户信息
        const userRes = await fetch(`/api/users/${userId}`);
        const userData = await userRes.json();
        setUser(userData);

        // 然后用用户ID获取帖子（必须等用户数据先返回）
        const postsRes = await fetch(`/api/users/${userId}/posts`);
        const postsData = await postsRes.json();
        setPosts(postsData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  // ❌ 问题 2: 每次 render 都创建新函数
  function handleEdit() {
    router.push(`/users/${userId}/edit`);
  }

  function handleDelete() {
    router.push(`/users/${userId}/delete`);
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
  }

  // ❌ 问题 3: 没有优化计算的派生状态
  const sortedPosts = posts.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // ❌ 问题 4: 过滤也是每次都重新计算
  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'published') return post.published;
    if (filter === 'draft') return !post.published;
    return true;
  });

  // ❌ 问题 5: 没有 memo 会导致不必要的 re-render
  const PostCard = ({ post }) => {
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
  };

  // ❌ 问题 6: Modal 组件总是被渲染，即使用户看不到
  return (
    <div className="user-profile">
      <header>
        <h1>{user?.name || 'User Profile'}</h1>
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
        {filteredPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* HeavyChart 总是被加载和渲染 */}
      <HeavyChart data={posts} />

      {/* Modal 总是在 DOM 中 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <p>Modal content</p>
      </Modal>
    </div>
  );
}
