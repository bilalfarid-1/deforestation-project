import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface PendingUserAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  organization?: string;
  otp: string;
  otpExpires: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PendingUserCreationAttributes extends Optional<PendingUserAttributes, 'id' | 'organization'> {}

export class PendingUser extends Model<PendingUserAttributes, PendingUserCreationAttributes> implements PendingUserAttributes {
  declare public id: number;
  declare public name: string;
  declare public email: string;
  declare public password_hash: string;
  declare public organization: string;
  declare public otp: string;
  declare public otpExpires: Date;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

PendingUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'pending_users',
    timestamps: true
  }
);

export default PendingUser;
