import fs from 'fs';
import path from 'path';
import { Grievance, Digest, GrievanceCategory, UrgencyLevel, GrievanceSentiment, GrievanceStatus, GrievanceLanguage } from '../types.js';

const DB_PATH = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  grievances: Grievance[];
  digests: Digest[];
}

// ISO Week helper
export function getISOWeek(date: Date): number {
  const tempDate = new Date(date.valueOf());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate.valueOf() - week1.valueOf()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Generate realistic Indian states and districts
const INDIAN_LOCATIONS = [
  { state: 'Tamil Nadu', districts: ['Madurai', 'Chennai', 'Coimbatore', 'Salem', 'Trichy'] },
  { state: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'] },
  { state: 'Karnataka', districts: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'] },
  { state: 'Uttar Pradesh', districts: ['Lucknow', 'Varanasi', 'Kanpur', 'Agra', 'Prayagraj'] },
  { state: 'Kerala', districts: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Wayanad', 'Thrissur'] },
  { state: 'Delhi', districts: ['New Delhi', 'South Delhi', 'West Delhi', 'North Delhi'] },
  { state: 'West Bengal', districts: ['Kolkata', 'Darjeeling', 'Howrah', 'Asansol', 'Siliguri'] },
  { state: 'Telangana', districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'] },
  { state: 'Andhra Pradesh', districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'] },
  { state: 'Bihar', districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'] },
  { state: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'] },
  { state: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'] },
  { state: 'Punjab', districts: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda'] },
  { state: 'Madhya Pradesh', districts: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'] },
  { state: 'Odisha', districts: ['Bhubaneswar', 'Cuttack', 'Puri', 'Rourkela', 'Sambalpur'] }
];

const COMPLAINT_TEMPLATES: {
  category: GrievanceCategory;
  urgency: UrgencyLevel;
  sentiment: GrievanceSentiment;
  language: GrievanceLanguage;
  text: string;
  summary: string;
  action: string;
  affected: string;
}[] = [
  // WATER
  {
    category: 'Water',
    urgency: 'High',
    sentiment: 'Distressed',
    language: 'English',
    text: 'Severe shortage of drinking water in our area. The municipal corporation water supply is highly irregular and when it comes once in 4 days, the water is muddy and contaminated with sewage. Several children and elderly people in our building have fallen sick with stomach infections and gastroenteritis.',
    summary: 'Contaminated municipal water supply causing stomach infections and severe water shortage.',
    action: 'Immediately flush and repair municipal pipelines, check for sewage leakage, and deploy water tankers to affected buildings.',
    affected: 'Children, elderly, and local residents'
  },
  {
    category: 'Water',
    urgency: 'High',
    sentiment: 'Frustrated',
    language: 'Hindi',
    text: 'हमारे इलाके में पानी की भारी किल्लत है। पानी की पाइपलाइन टूटी हुई है और पिछले दस दिनों से बिल्कुल पानी नहीं आया है। हमें प्राइवेट टैंकरों से बहुत महंगे दामों में पानी खरीदना पड़ रहा है। गरीब लोग तो पानी भी नहीं खरीद पा रहे हैं। कृपया जल बोर्ड इस पर तुरंत ध्यान दे।',
    summary: 'Broken water pipeline causing no water supply for ten days and high reliance on expensive tankers.',
    action: 'Deploy emergency water tankers for the poor and repair the broken main water pipeline.',
    affected: 'Low-income families and local residential community'
  },
  {
    category: 'Water',
    urgency: 'Medium',
    sentiment: 'Neutral',
    language: 'Other',
    text: 'Madurai city drinking water supply pressure is very low in ward 45. We are unable to pump water to the first floor. Please increase the municipal supply duration by at least one hour or increase pressure.',
    summary: 'Low water supply pressure in ward 45 making it difficult to store water on higher floors.',
    action: 'Adjust water pump pressure at the local distribution station and extend supply timing.',
    affected: 'Multi-story household residents'
  },
  // ROADS
  {
    category: 'Roads',
    urgency: 'High',
    sentiment: 'Frustrated',
    language: 'English',
    text: 'The main highway connecting our district is filled with huge, dangerous potholes after the pre-monsoon showers. Yesterday, a school bus narrowly escaped a major accident, and several two-wheelers slip daily. It is a absolute death trap, and local authorities are ignoring our pleas to resurface it.',
    summary: 'Dangerous pothole-ridden highway causing multiple minor accidents and risking a major school bus crash.',
    action: 'Initiate emergency road filling using high-durability cold-mix asphalt on the entire highway stretch.',
    affected: 'Commuters, school children, and daily drivers'
  },
  {
    category: 'Roads',
    urgency: 'High',
    sentiment: 'Distressed',
    language: 'Hindi',
    text: 'सड़क पर गहरे गड्ढे होने की वजह से कल रात एक बाइक दुर्घटना में दो युवा गंभीर रूप से घायल हो गए। इस सड़क पर कोई स्ट्रीट लाइट भी नहीं चलती है। यह रास्ता अस्पताल जाने का मुख्य मार्ग है लेकिन हालत बदतर है। क्या प्रशासन किसी बड़ी दुर्घटना का इंतजार कर रहा है?',
    summary: 'Major potholes and lack of streetlights on the main hospital road leading to severe bike accidents.',
    action: 'Urgent patch repairs on the hospital road and immediate restoration of defunct streetlights.',
    affected: 'Emergency patients, healthcare workers, and night riders'
  },
  {
    category: 'Roads',
    urgency: 'Medium',
    sentiment: 'Neutral',
    language: 'English',
    text: 'The inner colony roads in our sector were dug up for laying gas pipelines three months ago. However, the contractor left without restoring or tarring the road. Dust is flying everywhere, causing breathing issues, and the loose mud becomes extremely slippery during rains.',
    summary: 'Unrestored colony roads dug up for gas pipelines causing high dust pollution and slippery mud.',
    action: 'Enforce the contractor utility restoration clause to backfill and repave the inner colony road.',
    affected: 'Residential community, asthmatic patients, and pedestrians'
  },
  // HEALTHCARE
  {
    category: 'Healthcare',
    urgency: 'High',
    sentiment: 'Distressed',
    language: 'English',
    text: 'Our local Primary Health Centre (PHC) is completely understaffed. The doctor is rarely present, and the staff nurse refuses to treat patients without a bribe. Medicines like anti-venom for snake bites and basic insulin are out of stock. Patients are being referred to private hospitals far away.',
    summary: 'Local Primary Health Centre is understaffed, corrupt, and lacks critical life-saving medicines.',
    action: 'Conduct a surprise audit of the PHC, replenish critical drug stocks, and take disciplinary action against corrupt staff.',
    affected: 'Poor rural patients, snake bite victims, and diabetic patients'
  },
  {
    category: 'Healthcare',
    urgency: 'High',
    sentiment: 'Distressed',
    language: 'Hindi',
    text: 'जिला अस्पताल में डॉक्टरों की भारी कमी है। इमरजेंसी वार्ड में मरीजों को फर्श पर लेटना पड़ रहा है। मेरी गर्भवती बहन को भर्ती करने से मना कर दिया गया क्योंकि बेड खाली नहीं थे। सरकारी स्वास्थ्य सेवाएं पूरी तरह ठप हो चुकी हैं।',
    summary: 'Severe doctor and bed shortage at district hospital, forcing emergency patients to lie on the floor.',
    action: 'Sanction additional beds, establish temporary medical camps, and deploy emergency medical officers to the district hospital.',
    affected: 'Pregnant women and emergency low-income patients'
  },
  {
    category: 'Healthcare',
    urgency: 'Medium',
    sentiment: 'Neutral',
    language: 'English',
    text: 'The ultrasound scan machine at the government general hospital has been broken for over two months. Pregnant women from poor backgrounds are forced to pay Rs 1500 to private labs. Please get the machine repaired or replaced urgently.',
    summary: 'Defunct hospital ultrasound scanner forcing low-income pregnant women to pay high private lab fees.',
    action: 'Allocate emergency maintenance funds to repair or procure a new ultrasound scanning machine.',
    affected: 'Impoverished pregnant women'
  },
  // EDUCATION
  {
    category: 'Education',
    urgency: 'High',
    sentiment: 'Distressed',
    language: 'English',
    text: 'The government girls high school in our village does not have functional toilets. The existing toilets have no water connection and are extremely dirty, forcing girls to miss classes during their menstrual cycle or drop out entirely. This is a violation of Swachh Bharat principles.',
    summary: 'Government girls school lacks functional toilets and water, leading to student dropouts.',
    action: 'Construct new bio-toilets, restore running water supply, and hire regular cleaning staff at the girls school.',
    affected: 'Female school students and teaching staff'
  },
  {
    category: 'Education',
    urgency: 'Medium',
    sentiment: 'Frustrated',
    language: 'Hindi',
    text: 'सरकारी मिडिल स्कूल में शिक्षकों के आधे से ज्यादा पद खाली पड़े हैं। एक ही शिक्षक पूरे स्कूल की पाँच कक्षाओं को पढ़ाता है। बच्चों का भविष्य पूरी तरह से अंधकार में है। सरकार कब तक खाली पदों को नहीं भरेगी?',
    summary: 'Severe teacher vacancy in middle school, with a single teacher managing five classes.',
    action: 'Deploy ad-hoc teachers from adjacent schools and fast-track the recruitment of regular teaching staff.',
    affected: 'Middle school students'
  },
  {
    category: 'Education',
    urgency: 'Low',
    sentiment: 'Neutral',
    language: 'English',
    text: 'The playground of the municipal primary school is overrun with weeds and thorny bushes, making it dangerous for children to play. Please have it cleaned and leveled so students can use it.',
    summary: 'School playground overrun with weeds, posing safety risks to primary students.',
    action: 'Direct the municipal sanitation team to clear the weeds, level the ground, and restore the playground.',
    affected: 'Primary school pupils'
  },
  // ENVIRONMENT
  {
    category: 'Environment',
    urgency: 'High',
    sentiment: 'Frustrated',
    language: 'English',
    text: 'A local chemical factory is releasing highly pungent and toxic chemical gas every night after midnight. The entire neighborhood wakes up suffocating, coughing, and with burning eyes. We have complained to the pollution board, but no action has been taken.',
    summary: 'Local factory releasing toxic chemical gases at night, causing respiratory choking in nearby colonies.',
    action: 'Issue an immediate show-cause notice to the factory and install continuous ambient air quality monitors.',
    affected: 'Residential neighborhood, infants, and asthmatic elders'
  },
  {
    category: 'Environment',
    urgency: 'High',
    sentiment: 'Distressed',
    language: 'Hindi',
    text: 'हमारे यहाँ तालाब में पास की फैक्ट्री का जहरीला केमिकल कचरा फेंका जा रहा है। तालाब का सारा पानी काला पड़ गया है और सैकड़ों मछलियाँ मरकर तैर रही हैं। पालतू जानवर इस पानी को पीकर बीमार पड़ रहे हैं।',
    summary: 'Toxic industrial dumping in local pond leading to massive fish deaths and animal illnesses.',
    action: 'Seal the factory outflow, dredge the chemical-polluted pond, and penalize the violating enterprise.',
    affected: 'Dairy farmers, livestock, and local ecology'
  },
  {
    category: 'Environment',
    urgency: 'Medium',
    sentiment: 'Neutral',
    language: 'English',
    text: 'Indiscriminate garbage dumping and plastic burning is happening on the banks of our local river. The burning of plastics releases carcinogenic fumes, and the waste is clogging the river flow. Please initiate clean-up and put CCTV cameras.',
    summary: 'Open plastic burning and garbage dumping on riverbanks clogging the river and releasing toxic smoke.',
    action: 'Organize a riverbank clean-up drive, install warning boards, and deploy municipal CCTV cameras.',
    affected: 'Eco-conscious citizens, local fauna, and riverside residents'
  },
  // INFRASTRUCTURE
  {
    category: 'Infrastructure',
    urgency: 'High',
    sentiment: 'Frustrated',
    language: 'English',
    text: 'An old high-voltage transformer in our street is throwing sparks almost daily. The wires are hanging extremely low, touching tree branches. It is at a height where any pedestrian could get electrocuted, especially during monsoon floods. Multiple complaints to the electricity board went unanswered.',
    summary: 'Hanging high-voltage wires and sparking transformer posing severe electrocution risk to pedestrians.',
    action: 'Replace the old transformer, lift and secure low-hanging power cables, and trim touching tree branches.',
    affected: 'Pedestrians, street vendors, and local residents'
  },
  {
    category: 'Infrastructure',
    urgency: 'Medium',
    sentiment: 'Frustrated',
    language: 'Hindi',
    text: 'हमारे गाँव में पिछले दो साल से नया बिजली का सब-स्टेशन अधूरा पड़ा है। बिजली मुश्किल से 4 घंटे आती है। किसान सिंचाई नहीं कर पा रहे हैं और फसलें सूख रही हैं। ग्रिड का काम जल्द से जल्द पूरा किया जाए।',
    summary: 'Unfinished power sub-station project causing major power deficits and hurting agricultural irrigation.',
    action: 'Allocate bridge funding to finish the pending electricity sub-station and ensure stable farm power supply.',
    affected: 'Rural farmers and local agricultural community'
  },
  {
    category: 'Infrastructure',
    urgency: 'Low',
    sentiment: 'Neutral',
    language: 'English',
    text: 'The footover bridge near the central railway station has broken tiles and rusted railings. It is very slippery during rains. It needs immediate maintenance before any passenger falls down.',
    summary: 'Rusted railings and broken tiles on railway footover bridge creating slip hazards for passengers.',
    action: 'Direct railway division to repaint railings and replace broken anti-skid tiles on the bridge.',
    affected: 'Train passengers and daily commuters'
  },
  // OTHER
  {
    category: 'Other',
    urgency: 'Medium',
    sentiment: 'Frustrated',
    language: 'English',
    text: 'The local fair price ration shop is charging extra for grains. If we protest, the shopkeeper threatens to cancel our ration card. He also claims that the stock has finished, even when we can see sacks inside. Kindly investigate this corruption.',
    summary: 'Ration shop corruption involving overcharging and false scarcity of essential grains.',
    action: 'Conduct a food and civil supplies investigation, suspend the corrupt license, and audit ration card distribution.',
    affected: 'BPL families and low-income cardholders'
  },
  {
    category: 'Other',
    urgency: 'Low',
    sentiment: 'Neutral',
    language: 'Hindi',
    text: 'हमारे वार्ड में आवारा कुत्तों की संख्या बहुत बढ़ गई है। शाम के समय बच्चों का घर से बाहर निकलना मुश्किल हो गया है। नगर निगम से अनुरोध है कि इनका नसबंदी और टीकाकरण अभियान चलाए।',
    summary: 'Stray dog population spike in Ward causing safety concerns for children and seniors.',
    action: 'Coordinate with local animal welfare NGOs to launch a systematic sterilization and vaccination drive.',
    affected: 'Playing children, elderly walkers, and residents'
  }
];

// Seed databases if empty or not present
export function initializeDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data) as DatabaseSchema;
    }
  } catch (error) {
    console.error('Error reading DB, re-initializing...', error);
  }

  // Generate 150 realistic grievances if file does not exist
  const grievances: Grievance[] = [];
  const totalItems = 150;

  // Let's seed dates between June 1, 2026 and July 7, 2026.
  const startDate = new Date('2026-06-01T00:00:00Z');
  const endDate = new Date('2026-07-07T23:59:59Z');
  const durationMs = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < totalItems; i++) {
    // Pick location
    const loc = INDIAN_LOCATIONS[i % INDIAN_LOCATIONS.length];
    const dist = loc.districts[Math.floor(Math.random() * loc.districts.length)];
    
    // Pick template
    const template = COMPLAINT_TEMPLATES[i % COMPLAINT_TEMPLATES.length];
    
    // Pick status
    let status: GrievanceStatus = 'Pending';
    if (i % 3 === 1) status = 'Acknowledged';
    if (i % 3 === 2) status = 'Resolved';

    // Spread date
    // We want some clustering so that week spikes can occur!
    // Let's cluster Environment or Water complaints in early July or mid-June
    let dateMs = startDate.getTime() + (i / totalItems) * durationMs;
    
    // Introduce category spike logic for Water in Maharashtra or Water in general in early July (week 27)
    // Week 27 corresponds to June 29 - July 5, 2026.
    // Let's put a bunch of Water complaints in the last 10 records (July 1 - July 5) to trigger the Trend Alert!
    if (i > 130 && Math.random() > 0.4) {
      dateMs = new Date('2026-07-02T10:00:00Z').getTime() + (Math.random() * 2 * 86400000); // July 2-4
    }

    const itemDate = new Date(dateMs);
    const id = `G-${100000 + i}`;

    const textMod = `${template.text} This is affecting our entire block near Gandhi Nagar area in ${dist}, ${loc.state}. Immediate government action is requested.`;

    const grievance: Grievance = {
      id,
      text: textMod,
      state: loc.state,
      district: dist,
      category: template.category,
      urgency: template.urgency,
      summary: template.summary,
      suggested_action: template.action,
      sentiment: template.sentiment,
      affected_group: template.affected,
      status,
      language: template.language,
      submitted_at: itemDate.toISOString(),
      week_number: getISOWeek(itemDate)
    };

    grievances.push(grievance);
  }

  // Sort by date descending
  grievances.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  const initialSchema: DatabaseSchema = {
    grievances,
    digests: []
  };

  saveDB(initialSchema);
  return initialSchema;
}

export function saveDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}
