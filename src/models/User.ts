import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  organization?: string;
  resetOTP?: string | null;
  resetOTPExpires?: Date | null;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'organization' | 'resetOTP' | 'resetOTPExpires' | 'isVerified'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: number;
  declare public name: string;
  declare public email: string;
  declare public password: string;
  declare public role: string;
  declare public organization: string;
  declare public resetOTP: string | null;
  declare public resetOTPExpires: Date | null;
  declare public isVerified: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

User.init(
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
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'analyst'
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetOTP: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetOTPExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true
  }
);

export default User;
