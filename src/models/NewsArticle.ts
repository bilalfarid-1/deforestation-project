import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface NewsArticleAttributes {
  id: number;
  articleId: string;
  title: string;
  category: string;
  date: string;
  isoDate: string;
  pubDate: string;
  source: string;
  author: string;
  readTime: string;
  img: string;
  summary: string;
  content: string;
  url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewsArticleCreationAttributes extends Optional<NewsArticleAttributes, 'id' | 'url'> {}

export class NewsArticle extends Model<NewsArticleAttributes, NewsArticleCreationAttributes> implements NewsArticleAttributes {
  declare public id: number;
  declare public articleId: string;
  declare public title: string;
  declare public category: string;
  declare public date: string;
  declare public isoDate: string;
  declare public pubDate: string;
  declare public source: string;
  declare public author: string;
  declare public readTime: string;
  declare public img: string;
  declare public summary: string;
  declare public content: string;
  declare public url: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

NewsArticle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    articleId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isoDate: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pubDate: {
      type: DataTypes.STRING,
      allowNull: false
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false
    },
    readTime: {
      type: DataTypes.STRING,
      defaultValue: '4 min read'
    },
    img: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'news_articles',
    timestamps: true
  }
);

export default NewsArticle;
