import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface CommunityPostAttributes {
  id: number;
  author: string;
  role: string;
  avatar: string;
  title: string;
  category: string;
  time: string;
  location: string;
  content: string;
  upvotes: number;
  replies: number;
  upvotedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommunityPostCreationAttributes extends Optional<CommunityPostAttributes, 'id' | 'role' | 'avatar' | 'time' | 'upvotes' | 'replies' | 'upvotedBy'> {}

export class CommunityPost extends Model<CommunityPostAttributes, CommunityPostCreationAttributes> implements CommunityPostAttributes {
  declare public id: number;
  declare public author: string;
  declare public role: string;
  declare public avatar: string;
  declare public title: string;
  declare public category: string;
  declare public time: string;
  declare public location: string;
  declare public content: string;
  declare public upvotes: number;
  declare public replies: number;
  declare public upvotedBy: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

CommunityPost.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'Community Member'
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'Forest Protection'
    },
    time: {
      type: DataTypes.STRING,
      defaultValue: 'Just now'
    },
    location: {
      type: DataTypes.STRING,
      defaultValue: 'Margalla Hills AOI'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    replies: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    upvotedBy: {
      type: DataTypes.TEXT,
      defaultValue: '[]'
    }
  },
  {
    sequelize,
    tableName: 'community_posts',
    timestamps: true
  }
);

export default CommunityPost;
