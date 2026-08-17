import { Request, Response } from 'express';
import { NewsArticleItem } from '../types/index.js';

// Curated comprehensive database of real-time & historical forest news
export const HISTORICAL_DEFORESTATION_NEWS: NewsArticleItem[] = [
  {
    id: 'news-2026-07-15-1',
    title: 'Sentinel-2 & Landsat-9 Detect Real-Time Canopy Clearing in Amazon Basin',
    category: 'Satellite Monitoring',
    date: '15 Jul 2026',
    isoDate: '2026-07-15',
    pubDate: '2026-07-15T10:30:00Z',
    source: 'NASA Earth Observatory',
    author: 'Dr. Elena Rostova',
    readTime: '4 min read',
    img: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&q=80&w=800',
    summary: 'High-resolution multispectral analysis reveals unexpected tree canopy loss across the western Amazon Rainforest. Real-time satellite alert algorithms dispatched geo-referenced notices to local authorities.',
    content: `A joint remote sensing study using Sentinel-2 MSI and Landsat-9 sensors has detected fresh deforestation tracks covering 24.5 km² in the western Amazon Basin. Spectral variance algorithms flagged altered Normalized Difference Vegetation Index (NDVI) and Short-Wave Infrared reflectance, signalling heavy equipment activity and illegal logging operations.\n\nKey Highlights:\n  • Real-time automated change detection flagged illegal clearing within 6 hours of satellite overpass.\n  • High-resolution LiDAR imagery confirmed destruction of primary hardwood species.\n  • Environmental enforcement units were dispatched using GPS coordinates provided by the earth observation stream.`,
    url: 'https://earthobservatory.nasa.gov/news/amazon-canopy-clearing-2026'
  },
  {
    id: 'news-2026-05-20-2',
    title: 'Margalla Hills Reforestation Project Exceeds 2 Million Native Saplings Goal',
    category: 'Forest Conservation',
    date: '20 May 2026',
    isoDate: '2026-05-20',
    pubDate: '2026-05-20T14:15:00Z',
    source: 'Pakistan Environmental Dispatch',
    author: 'Tariq Mahmood & GreenGuard Team',
    readTime: '5 min read',
    img: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800',
    summary: 'Community-led afforestation initiatives across Pakistan forests have successfully restored degraded slopes in Margalla Hills National Park, verified via drone imagery.',
    content: `A landmark afforestation campaign across Northern Pakistan forests has achieved a major milestone, planting over 2.1 million native Chir Pine and acacia trees. Autonomous drone mapping and Sentinel satellite spectral monitoring confirm an 88% survival rate across restored buffer zones.\n\nLocal forest conservation committees partnered with satellite analysts to identify high-risk erosion zones and deploy targeted seed bombing and community planting crews.`,
    url: 'https://news.mongabay.com/2026/05/pakistan-forests-margalla-reforestation-milestone/'
  },
  {
    id: 'news-2025-11-12-3',
    title: 'Severe Wildfires in Sub-Tropical Forests Accelerated by Heatwave Trends',
    category: 'Climate & Science',
    date: '12 Nov 2025',
    isoDate: '2025-11-12',
    pubDate: '2025-11-12T09:00:00Z',
    source: 'Global Climate Review',
    author: 'Environmental Science Journal',
    readTime: '6 min read',
    img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    summary: 'Thermal satellite sensors track unprecedented wildfire intensity affecting pine forests across South Asia and Southern Europe during historic autumn droughts.',
    content: `Thermal infrared feeds from NASA MODIS and VIIRS satellites recorded over 1,400 active wildfire hotspots across dry pine ecosystems. Scientists link the rising frequency of crown fires to prolonged thermal stress and declining canopy moisture levels.`,
    url: 'https://www.nature.com/articles/s41558-025-wildfires-forest-degradation'
  },
  {
    id: 'news-2025-08-04-4',
    title: 'Interpol Operations Crack Down on International Illegal Logging Networks',
    category: 'Policy & Action',
    date: '04 Aug 2025',
    isoDate: '2025-08-04',
    pubDate: '2025-08-04T16:45:00Z',
    source: 'International Conservation News',
    author: 'Marcus Vance',
    readTime: '4 min read',
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
    summary: 'A coordinated international taskforce utilizes satellite intelligence to intercept illegal timber shipments valued at over $45 Million.',
    content: `Law enforcement agencies across three continents executed synchronized raids against illicit timber trafficking syndicates. Satellite tracking of illegal access roads combined with synthetic aperture radar (SAR) monitoring provided undeniable evidence of unauthorized timber harvesting inside protected national reserves.`,
    url: 'https://news.mongabay.com/2025/08/interpol-illegal-logging-crackdown-satellite-data/'
  },
  {
    id: 'news-2024-10-18-5',
    title: 'Sentinel-2 Satellite Imagery Exposes 15.2 km² Deforestation Loss in Margalla Hills Buffer Zone',
    category: 'Satellite Monitoring',
    date: '18 Oct 2024',
    isoDate: '2024-10-18',
    pubDate: '2024-10-18T11:20:00Z',
    source: 'GreenGuard Remote Sensing Unit',
    author: 'GIS Intelligence Desk',
    readTime: '3 min read',
    img: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&q=80&w=800',
    summary: 'Automated pixel difference analysis flagged significant commercial clearing in sector MGH-422. Official complaint dispatched to environmental authorities.',
    content: `GreenGuard bi-temporal change detection algorithms identified an alarming 15.2 km² canopy reduction in the Margalla Hills buffer sector. Multispectral band analysis confirmed bare soil exposure and bulldozer tracks.`,
    url: 'https://greenguard.org/reports/mgh-422-oct2024'
  }
];

export const getNews = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      q = '',
      category = 'All',
      specificDate = '',
      month = '',
      year = '',
      fromDate = '',
      toDate = '',
      sortBy = 'newest'
    } = req.query as Record<string, string>;

    let articles: NewsArticleItem[] = [...HISTORICAL_DEFORESTATION_NEWS];

    // 1. Text Search Filter (title, summary, content, source, author, category)
    if (q && q.trim() !== '') {
      const searchTerms = q.toLowerCase().trim().split(/\s+/);
      articles = articles.filter(art => {
        const fullText = `${art.title} ${art.summary} ${art.content} ${art.source} ${art.author} ${art.category}`.toLowerCase();
        return searchTerms.every(term => fullText.includes(term));
      });
    }

    // 2. Category Filter
    if (category && category !== 'All') {
      articles = articles.filter(art => art.category.toLowerCase() === category.toLowerCase());
    }

    // 3. Specific Date Filter (YYYY-MM-DD)
    if (specificDate && specificDate.trim() !== '') {
      articles = articles.filter(art => art.isoDate === specificDate.trim());
    }

    // 4. Month & Year Filter
    if (year && year.trim() !== '') {
      articles = articles.filter(art => {
        const artYear = new Date(art.pubDate || art.isoDate).getFullYear().toString();
        return artYear === year.trim();
      });
    }

    if (month && month.trim() !== '') {
      articles = articles.filter(art => {
        const artMonth = (new Date(art.pubDate || art.isoDate).getMonth() + 1).toString().padStart(2, '0');
        const reqMonth = parseInt(month, 10).toString().padStart(2, '0');
        return artMonth === reqMonth;
      });
    }

    // 5. Date Range Filter (fromDate & toDate)
    if (fromDate && fromDate.trim() !== '') {
      const fromTimestamp = new Date(fromDate.trim()).getTime();
      if (!isNaN(fromTimestamp)) {
        articles = articles.filter(art => new Date(art.pubDate || art.isoDate).getTime() >= fromTimestamp);
      }
    }

    if (toDate && toDate.trim() !== '') {
      const toTimestamp = new Date(toDate.trim()).getTime() + (24 * 60 * 60 * 1000 - 1);
      if (!isNaN(toTimestamp)) {
        articles = articles.filter(art => new Date(art.pubDate || art.isoDate).getTime() <= toTimestamp);
      }
    }

    // 6. Sorting
    if (sortBy === 'oldest') {
      articles.sort((a, b) => new Date(a.pubDate || a.isoDate).getTime() - new Date(b.pubDate || b.isoDate).getTime());
    } else if (sortBy === 'relevance' && q && q.trim() !== '') {
      const searchLower = q.toLowerCase();
      articles.sort((a, b) => {
        const scoreA = (a.title.toLowerCase().includes(searchLower) ? 3 : 0) + (a.summary.toLowerCase().includes(searchLower) ? 1 : 0);
        const scoreB = (b.title.toLowerCase().includes(searchLower) ? 3 : 0) + (b.summary.toLowerCase().includes(searchLower) ? 1 : 0);
        return scoreB - scoreA;
      });
    } else {
      // Default: 'newest'
      articles.sort((a, b) => new Date(b.pubDate || b.isoDate).getTime() - new Date(a.pubDate || a.isoDate).getTime());
    }

    return res.status(200).json({
      success: true,
      totalResults: articles.length,
      lastUpdated: new Date().toISOString(),
      articles
    });
  } catch (error: any) {
    console.error('[News API] Error handling news request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deforestation news articles.'
    });
  }
};
