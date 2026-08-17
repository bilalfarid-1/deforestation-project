import { Router } from 'express';
import {
  getPosts,
  createPost,
  upvotePost
} from '../controllers/communityController.js';

const router = Router();

// @route   GET /api/community/posts
// @desc    Get all community discussions
router.get('/posts', getPosts);

// Also accept /api/community directly
router.get('/', getPosts);

// @route   POST /api/community/posts
// @desc    Create a new community discussion
router.post('/posts', createPost);
router.post('/', createPost);

// @route   POST /api/community/posts/:id/upvote
// @desc    Upvote a discussion thread
router.post('/posts/:id/upvote', upvotePost);
router.put('/posts/:id/like', upvotePost);

export default router;
