import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';
import { DetectionLog } from '../types/index.js';

export interface AnalysisReportAttributes {
  id: number;
  reportId?: string;
  userId?: number | null;
  name: string;
  date: string;
  regionId: string;
  status: string;
  changeType: string;
  areaMonitored: string;
  total_area_km2: number;
  deforested_area_km2: number;
  forestPercentage: number;
  deforestedPercentage: number;
  summary: string;
  logs: DetectionLog[];
  before_image?: string | null;
  after_image?: string | null;
  overlay_image?: string | null;
  deforestation_geojson?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnalysisReportCreationAttributes extends Optional<AnalysisReportAttributes, 'id' | 'reportId' | 'userId' | 'before_image' | 'after_image' | 'overlay_image' | 'deforestation_geojson'> {}

export class AnalysisReport extends Model<AnalysisReportAttributes, AnalysisReportCreationAttributes> implements AnalysisReportAttributes {
  declare public id: number;
  declare public reportId: string;
  declare public userId: number | null;
  declare public name: string;
  declare public date: string;
  declare public regionId: string;
  declare public status: string;
  declare public changeType: string;
  declare public areaMonitored: string;
  declare public total_area_km2: number;
  declare public deforested_area_km2: number;
  declare public forestPercentage: number;
  declare public deforestedPercentage: number;
  declare public summary: string;
  declare public logs: DetectionLog[];
  declare public before_image: string | null;
  declare public after_image: string | null;
  declare public overlay_image: string | null;
  declare public deforestation_geojson: object | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

AnalysisReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    reportId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Margalla Hills Canopy Delta Report'
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    regionId: {
      type: DataTypes.STRING,
      defaultValue: 'MGH-AOI'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Warning'
    },
    changeType: {
      type: DataTypes.STRING,
      defaultValue: 'Canopy Variance & Pixel Delta Analysis'
    },
    areaMonitored: {
      type: DataTypes.STRING,
      defaultValue: '520.8 km²'
    },
    total_area_km2: {
      type: DataTypes.FLOAT,
      defaultValue: 520.8
    },
    deforested_area_km2: {
      type: DataTypes.FLOAT,
      defaultValue: 31.25
    },
    forestPercentage: {
      type: DataTypes.FLOAT,
      defaultValue: 94
    },
    deforestedPercentage: {
      type: DataTypes.FLOAT,
      defaultValue: 6
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    logs: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    before_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    after_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    overlay_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deforestation_geojson: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'analysis_reports',
    timestamps: true
  }
);

export default AnalysisReport;
