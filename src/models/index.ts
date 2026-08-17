import User from './User.js';
import PendingUser from './PendingUser.js';
import AnalysisReport from './AnalysisReport.js';
import CommunityPost from './CommunityPost.js';
import NewsArticle from './NewsArticle.js';

// Define Associations
User.hasMany(AnalysisReport, { foreignKey: 'userId', as: 'reports' });
AnalysisReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  User,
  PendingUser,
  AnalysisReport,
  CommunityPost,
  NewsArticle
};

export default {
  User,
  PendingUser,
  AnalysisReport,
  CommunityPost,
  NewsArticle
};
