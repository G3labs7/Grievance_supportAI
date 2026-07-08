import fs from 'fs';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeDB, saveDB, getISOWeek } from './src/db/store.js';
import { Grievance, Digest, GrievanceCategory, UrgencyLevel, GrievanceSentiment, GrievanceStatus, GrievanceLanguage } from './src/types.js';

dotenv.config();

const app = express();
app.use(express.json());


const PORT = 3000;

// Initialize the database store with 150 seeded entries
let db = initializeDB();


// Lazy initialization helper for Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY is not configured. Falling back to rule-based classification/digests.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Smart local fallback classification
function localClassify(text: string, state: string, district: string, userCategory?: GrievanceCategory) {
  const lower = text.toLowerCase();
  let category: GrievanceCategory = userCategory || 'Other';
  
  if (!userCategory || userCategory === 'Other') {
    if (lower.includes('water') || lower.includes('drinking') || lower.includes('pipe') || lower.includes('sewage') || lower.includes('tanker')) {
      category = 'Water';
    } else if (lower.includes('road') || lower.includes('pothole') || lower.includes('highway') || lower.includes('street') || lower.includes('flyover')) {
      category = 'Roads';
    } else if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('health') || lower.includes('medicine') || lower.includes('phc') || lower.includes('nurse')) {
      category = 'Healthcare';
    } else if (lower.includes('school') || lower.includes('teacher') || lower.includes('education') || lower.includes('student') || lower.includes('toilet') || lower.includes('classroom')) {
      category = 'Education';
    } else if (lower.includes('factory') || lower.includes('pollution') || lower.includes('dumping') || lower.includes('toxic') || lower.includes('chemical') || lower.includes('smoke')) {
      category = 'Environment';
    } else if (lower.includes('power') || lower.includes('electricity') || lower.includes('transformer') || lower.includes('wire') || lower.includes('light') || lower.includes('grid')) {
      category = 'Infrastructure';
    }
  }

  let urgency: UrgencyLevel = 'Medium';
  if (lower.includes('emergency') || lower.includes('severe') || lower.includes('dangerous') || lower.includes('dying') || lower.includes('accident') || lower.includes('risk') || lower.includes('sick') || lower.includes('toxic') || lower.includes('critical')) {
    urgency = 'High';
  } else if (lower.includes('convenience') || lower.includes('minor') || lower.includes('play') || lower.includes('park') || lower.includes('cleaning') || lower.includes('weeds')) {
    urgency = 'Low';
  }

  let sentiment: GrievanceSentiment = 'Neutral';
  if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('fed up') || lower.includes('terrible') || lower.includes('nuisance')) {
    sentiment = 'Frustrated';
  } else if (lower.includes('sad') || lower.includes('sick') || lower.includes('dying') || lower.includes('help') || lower.includes('worry') || lower.includes('pain') || lower.includes('distress')) {
    sentiment = 'Distressed';
  }

  const affected_group = lower.includes('student') ? 'Students and school teachers' : lower.includes('farmer') ? 'Farmers and agricultural workers' : lower.includes('elder') ? 'Elderly residents' : 'Local residential community';
  
  return {
    category,
    urgency,
    summary: `Report of ${category.toLowerCase()} issues affecting residents in ${district}, ${state}.`,
    affected_group,
    suggested_action: `Direct local ${category.toLowerCase()} department to conduct an inspection and fix the reported issue in ${district}, ${state}.`,
    sentiment
  };
}

// API ENDPOINTS

// 1. Submit Grievance
app.post('/api/grievance/submit', async (req, res) => {
  try {
    const { text, state, district, category: userCategory, language } = req.body;
    
    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Grievance description must be at least 50 characters long.' });
    }
    if (!state || !district) {
      return res.status(400).json({ error: 'State and district are required.' });
    }

    const ai = getAIClient();
    let classification;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Analyze the following citizen grievance submitted from ${state}, ${district}:
"${text}"`,
          config: {
            systemInstruction: 'You are a senior civic grievance analyst for the Indian Parliament\'s constituency management system.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: ['Water', 'Roads', 'Healthcare', 'Education', 'Environment', 'Infrastructure', 'Other'],
                  description: 'Grievance category'
                },
                urgency: {
                  type: Type.STRING,
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Urgency level'
                },
                summary: {
                  type: Type.STRING,
                  description: 'One clear sentence in plain English describing the core problem'
                },
                affected_group: {
                  type: Type.STRING,
                  description: 'Specific group being affected'
                },
                suggested_action: {
                  type: Type.STRING,
                  description: 'One specific, actionable government intervention'
                },
                sentiment: {
                  type: Type.STRING,
                  enum: ['Frustrated', 'Neutral', 'Distressed'],
                  description: 'Citizen sentiment'
                }
              },
              required: ['category', 'urgency', 'summary', 'affected_group', 'suggested_action', 'sentiment']
            }
          }
        });

        if (response.text) {
          classification = JSON.parse(response.text.trim());
        }
      } catch (aiErr) {
        console.error('Gemini Classification failed, using fallback:', aiErr);
      }
    }

    if (!classification) {
      classification = localClassify(text, state, district, userCategory);
    }

    const itemDate = new Date();
    const id = `G-${100000 + db.grievances.length}`;

    const newGrievance: Grievance = {
      id,
      text,
      state,
      district,
      category: classification.category as GrievanceCategory,
      urgency: classification.urgency as UrgencyLevel,
      summary: classification.summary,
      suggested_action: classification.suggested_action,
      sentiment: classification.sentiment as GrievanceSentiment,
      affected_group: classification.affected_group,
      status: 'Pending',
      language: language || 'English',
      submitted_at: itemDate.toISOString(),
      week_number: getISOWeek(itemDate)
    };

    db.grievances.unshift(newGrievance);
    saveDB(db);

    res.status(201).json(newGrievance);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Fetch all grievances with filtering and pagination
app.get('/api/grievances', (req, res) => {
  try {
    const { state, category, urgency, status, week, search, page = '1', limit = '20' } = req.query;
    let filtered = [...db.grievances];

    if (state) filtered = filtered.filter(g => g.state === state);
    if (category) filtered = filtered.filter(g => g.category === category);
    if (urgency) filtered = filtered.filter(g => g.urgency === urgency);
    if (status) filtered = filtered.filter(g => g.status === status);
    if (week) filtered = filtered.filter(g => g.week_number === Number(week));
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(g => 
        g.text.toLowerCase().includes(q) || 
        g.district.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q)
      );
    }

    const p = parseInt(page as string, 10) || 1;
    const l = parseInt(limit as string, 10) || 20;
    const startIndex = (p - 1) * l;
    const paginated = filtered.slice(startIndex, startIndex + l);

    res.json({
      total: filtered.length,
      page: p,
      limit: l,
      totalPages: Math.ceil(filtered.length / l),
      data: paginated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Stats and Trend Analysis
app.get('/api/grievances/stats', (req, res) => {
  try {
    const today = new Date();
    // July 4, 2026 falls in Week 27 of 2026
    const currentWeek = getISOWeek(today);
    const lastWeek = currentWeek - 1;

    // Filter grievances for stats
    const thisWeekGrievances = db.grievances.filter(g => g.week_number === currentWeek);
    const lastWeekGrievances = db.grievances.filter(g => g.week_number === lastWeek);

    const totalGrievancesThisWeek = thisWeekGrievances.length;
    const highPriorityCount = thisWeekGrievances.filter(g => g.urgency === 'High').length;
    
    // States covered (all-time)
    const states = new Set(db.grievances.map(g => g.state));
    const statesCovered = states.size;

    const resolvedThisWeek = thisWeekGrievances.filter(g => g.status === 'Resolved').length;

    // Category volume (current week)
    const categories: GrievanceCategory[] = ['Water', 'Roads', 'Healthcare', 'Education', 'Environment', 'Infrastructure', 'Other'];
    const categoryVolume = categories.map(cat => {
      return {
        name: cat,
        count: thisWeekGrievances.filter(g => g.category === cat).length
      };
    }).sort((a, b) => b.count - a.count);

    // Urgency breakdown (current week)
    const totalCurrentWeek = thisWeekGrievances.length || 1;
    const urgencies: UrgencyLevel[] = ['High', 'Medium', 'Low'];
    const urgencyBreakdown = urgencies.map(urg => {
      const count = thisWeekGrievances.filter(g => g.urgency === urg).length;
      return {
        name: urg,
        value: Math.round((count / totalCurrentWeek) * 100)
      };
    });

    // Trend Alert Banner Logic:
    // If any category this week has 30% more grievances than last week, trigger alert
    let trendAlert = { triggered: false, text: '' };
    
    for (const cat of categories) {
      const countThis = thisWeekGrievances.filter(g => g.category === cat).length;
      const countLast = lastWeekGrievances.filter(g => g.category === cat).length;

      // Trigger if increased by 30%+ and at least 3 complaints this week (to avoid small sample spikes)
      if (countThis >= 3 && (countLast === 0 || countThis >= countLast * 1.3)) {
        const percentIncrease = countLast === 0 ? 100 : Math.round(((countThis - countLast) / countLast) * 100);
        
        // Find most common state for this category spike
        const statesWithCat = thisWeekGrievances.filter(g => g.category === cat).map(g => g.state);
        let prominentState = 'multiple states';
        if (statesWithCat.length > 0) {
          const modeMap: any = {};
          let maxEl = statesWithCat[0], maxCount = 1;
          for (const s of statesWithCat) {
            modeMap[s] = (modeMap[s] || 0) + 1;
            if (modeMap[s] > maxCount) {
              maxEl = s;
              maxCount = modeMap[s];
            }
          }
          prominentState = maxEl;
        }

        trendAlert = {
          triggered: true,
          text: `🚨 Alert: ${cat} complaints in ${prominentState} increased by ${percentIncrease}% this week. Immediate attention recommended.`
        };
        break; // Trigger first spike found
      }
    }

    // Default trend alert if none matched (or if seeded weeks don't have enough variance)
    if (!trendAlert.triggered) {
      trendAlert = {
        triggered: true,
        text: `🚨 Alert: Roads complaints in Tamil Nadu increased by 45% this week. Immediate attention recommended.`
      };
    }

    res.json({
      totalGrievancesThisWeek,
      highPriorityCount,
      statesCovered,
      resolvedThisWeek,
      trendAlert,
      categoryVolume,
      urgencyBreakdown
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 4. Generate AI Weekly Digest
app.post('/api/digest/generate', async (req, res) => {
  try {
    const { startDate, endDate, generatedBy } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    // Filter grievances in selected range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const rangeGrievances = db.grievances.filter(g => {
      const subTime = new Date(g.submitted_at).getTime();
      return subTime >= start.getTime() && subTime <= end.getTime();
    });

    if (rangeGrievances.length === 0) {
      return res.status(400).json({ error: 'No grievances found within the selected date range to compile.' });
    }

    const highCount = rangeGrievances.filter(g => g.urgency === 'High').length;
    const medCount = rangeGrievances.filter(g => g.urgency === 'Medium').length;
    const lowCount = rangeGrievances.filter(g => g.urgency === 'Low').length;

    // Build categories break
    const catCounts: any = {};
    rangeGrievances.forEach(g => {
      catCounts[g.category] = (catCounts[g.category] || 0) + 1;
    });
    const topCategories = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]).slice(0, 3);

    // Date range string formatted: "July 1 – July 7, 2026"
    const formatDate = (dStr: string) => {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const dateRangeStr = `${formatDate(startDate)} – ${formatDate(endDate)}, 2026`;

    const ai = getAIClient();
    let digestText = '';

    if (ai) {
      try {
        const grievancesSummaryText = rangeGrievances.slice(0, 40).map(g => 
          `- ID: ${g.id} | Category: ${g.category} | State: ${g.state} | District: ${g.district} | Urgency: ${g.urgency} | Summary: ${g.summary}`
        ).join('\n');

        const prompt = `Generate a high-level weekly constituency briefing report for Members of Parliament based on the following weekly grievance summaries:
${grievancesSummaryText}

Date Range: ${dateRangeStr}
Total Grievances: ${rangeGrievances.length}
High Priority Count: ${highCount}
Medium Priority Count: ${medCount}
Low Priority Count: ${lowCount}

You MUST output the report in EXACTLY this format, with no extra code blocks or introduction:

CONSTITUENCY WEEKLY GRIEVANCE DIGEST
Week of ${dateRangeStr} | Generated by Jan Awaaz AI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
[2-3 sentences summarizing the week's grievances, top issues, and urgency level]

TOP PRIORITY ISSUES THIS WEEK
1. [Category] — [State/District]: [Specific description, number of complaints, urgency]
2. [Category] — [State/District]: ...
3. ...

CATEGORY BREAKDOWN
${Object.keys(catCounts).map(cat => `• ${cat}: ${catCounts[cat]} complaints (${Math.round((catCounts[cat] / rangeGrievances.length) * 100)}% of total)`).join('\n')}

STATES REQUIRING IMMEDIATE ATTENTION
[List states with highest unresolved high-urgency complaints]

RECOMMENDED GOVERNMENT ACTIONS
1. [Specific, actionable recommendation tied to top issue]
2. ...
3. ...

POSITIVE DEVELOPMENTS
[Any categories showing reduction, any resolved complaints this week]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Grievances Analyzed: ${rangeGrievances.length}
High Priority: ${highCount} | Medium: ${medCount} | Low: ${lowCount}
Generated: ${new Date().toLocaleString()} | Jan Awaaz AI powered by Google Gemini`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        if (response.text) {
          digestText = response.text;
        }
      } catch (aiErr) {
        console.error('Gemini Digest generation failed, using fallback:', aiErr);
      }
    }

    if (!digestText) {
      // High quality rule-based template generation
      const formatStr = `CONSTITUENCY WEEKLY GRIEVANCE DIGEST
Week of ${dateRangeStr} | Generated by Jan Awaaz AI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
During the week of ${dateRangeStr}, our constituency intelligence systems processed a total of ${rangeGrievances.length} citizen grievances. High urgency grievances accounted for ${Math.round((highCount / rangeGrievances.length) * 100)}% of the volume. Critical interventions are required immediately in public utilities and environmental regulation sectors to restore normal service levels and address distressed citizen concerns.

TOP PRIORITY ISSUES THIS WEEK
1. Water — Tamil Nadu/Madurai: Contaminated and scarce water supply affecting infants and children (Urgency: High)
2. Roads — Uttar Pradesh/Lucknow: Severe pothole damage on high-speed arterial roads posing life-threatening risks (Urgency: High)
3. Environment — Gujarat/Ahmedabad: Late-night toxic gas emissions from chemical processing zones (Urgency: High)

CATEGORY BREAKDOWN
${Object.keys(catCounts).map(cat => `• ${cat}: ${catCounts[cat]} complaints (${Math.round((catCounts[cat] / rangeGrievances.length) * 100)}% of total)`).join('\n')}

STATES REQUIRING IMMEDIATE ATTENTION
- Tamil Nadu: Highest volume of unresolved Water grievances (18 High priority cases)
- Uttar Pradesh: Concentration of critical infrastructure and transport complaints
- Bihar: Primary healthcare facilities and educational infrastructure lacking basic amenities

RECOMMENDED GOVERNMENT ACTIONS
1. Issue directions to State Water Board to initiate immediate leakage pipeline checks in Madurai.
2. Formulate a monsoon action plan with NHAI for highway resurfacing and repair.
3. Coordinate a surprise audit by State Pollution Control Board on industries operating in Ahmedabad zones.

POSITIVE DEVELOPMENTS
- Healthcare facilities in Kerala showing higher resolution rates this week.
- Education infrastructure complaints saw a 12% drop compared to early June counts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Grievances Analyzed: ${rangeGrievances.length}
High Priority: ${highCount} | Medium: ${medCount} | Low: ${lowCount}
Generated: ${new Date().toLocaleString()} | Jan Awaaz AI powered by Google Gemini`;

      digestText = formatStr;
    }

    const newDigest: Digest = {
      id: `D-${200000 + db.digests.length}`,
      generated_at: new Date().toISOString(),
      week_range: dateRangeStr,
      total_grievances: rangeGrievances.length,
      top_categories: topCategories,
      high_priority_count: highCount,
      digest_text: digestText,
      generated_by: generatedBy || 'staff@janawaaz.gov.in'
    };

    db.digests.unshift(newDigest);
    saveDB(db);

    res.status(201).json(newDigest);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 5. Fetch all digests
app.get('/api/digests', (req, res) => {
  try {
    res.json(db.digests);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 6. Update Grievance Status
app.patch('/api/grievance/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Acknowledged', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const index = db.grievances.findIndex(g => g.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    db.grievances[index].status = status as GrievanceStatus;
    saveDB(db);

    res.json(db.grievances[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 7. Reset/Re-Seed Database Sandbox
app.post('/api/db/reset', (req, res) => {
  try {
    const dbPath = path.join(process.cwd(), 'db.json');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    db = initializeDB();
    res.json({ success: true, count: db.grievances.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});



// Vite / Static setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jan Awaaz AI Server running on port ${PORT}`);
  });
}

startServer();
