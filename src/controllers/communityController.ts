import { Request, Response } from 'express';
import { CommunityPost } from '../models/index.js';

const INITIAL_SEEDED_DISCUSSIONS = [
  {
    author: 'Dr. Tariq Mahmood',
    role: 'Conservation Biologist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    title: 'Urgent Patrol Need: Sector MGH-422 Illegal Tree Felling',
    category: 'Forest Protection',
    time: '2 hours ago',
    location: 'Margalla Hills Sector MGH-422',
    content: 'Recent Sentinel-2 satellite data indicates 22% canopy degradation near the northern trail. Local ranger teams require community support for field ground-truthing and documentation.',
    upvotes: 48,
    replies: 14
  },
  {
    author: 'Ayesha Khan',
    role: 'GIS Analyst',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    title: 'How Remote Sensing LiDAR Detects Pine Wilt Disease Early',
    category: 'Satellite Tech',
    time: '5 hours ago',
    location: 'Islamabad GIS Lab',
    content: 'By analyzing multi-spectral NIR spectral variance, we can isolate stress signals in Himalayan Pine needles before visual yellowing occurs. Check out our open dataset!',
    upvotes: 62,
    replies: 19
  },
  {
    author: 'Margalla Wildlife Trust',
    role: 'Verified NGO',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    title: 'Monsoon Reforestation Drive 2024: 5,000 Saplings Target',
    category: 'Reforestation',
    time: '1 day ago',
    location: 'Margalla National Park Boundary',
    content: 'Join our volunteer team this Sunday! We are planting indigenous Chir Pine and Wild Olive saplings along degraded buffer zones.',
    upvotes: 112,
    replies: 34
  }
];

export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { category } = req.query as Record<string, string>;
    
    let count = await CommunityPost.count();
    if (count === 0) {
      // Seed default discussions
      await CommunityPost.bulkCreate(INITIAL_SEEDED_DISCUSSIONS);
    }

    const whereClause: any = {};
    if (category && category !== 'All') {
      whereClause.category = category;
    }

    const posts = await CommunityPost.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error: any) {
    console.error('[Community API] Get Posts Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching community posts.' });
  }
};

export const createPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { author, role, title, category, location, content, avatar } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const newPost = await CommunityPost.create({
      author: author || 'Forest Watcher',
      role: role || 'Community Member',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      title: title.trim(),
      category: category || 'Forest Protection',
      location: location || 'Margalla Hills AOI',
      content: content.trim(),
      time: 'Just now',
      upvotes: 0,
      replies: 0
    });

    return res.status(201).json({
      success: true,
      message: 'Discussion created successfully.',
      post: newPost
    });
  } catch (error: any) {
    console.error('[Community API] Create Post Error:', error);
    return res.status(500).json({ error: 'Internal server error creating discussion.' });
  }
};

export const upvotePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const post = await CommunityPost.findByPk(Number(id));

    if (!post) {
      return res.status(404).json({ error: 'Discussion not found.' });
    }

    post.upvotes += 1;
    await post.save();

    return res.status(200).json({
      success: true,
      upvotes: post.upvotes,
      post
    });
  } catch (error: any) {
    console.error('[Community API] Upvote Post Error:', error);
    return res.status(500).json({ error: 'Internal server error upvoting discussion.' });
  }
};
