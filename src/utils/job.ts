/**
 * Shared job-data utilities used across multiple pages and components.
 */
import type { IJob } from '../types';

/**
 * Check if a string value is non-empty and not "N/A".
 */




export const GERMAN_CITY_NAMES = [
    // Major cities (top 80 by population)
    'berlin', 'hamburg', 'munich', 'münchen', 'cologne', 'köln',
    'frankfurt', 'stuttgart', 'düsseldorf', 'dusseldorf', 'leipzig',
    'dortmund', 'essen', 'bremen', 'dresden', 'hannover', 'hanover',
    'nuremberg', 'nürnberg', 'duisburg', 'bochum', 'wuppertal',
    'bielefeld', 'bonn', 'münster', 'munster', 'karlsruhe', 'mannheim',
    'augsburg', 'wiesbaden', 'mönchengladbach', 'gelsenkirchen',
    'braunschweig', 'aachen', 'kiel', 'chemnitz', 'halle',
    'magdeburg', 'freiburg', 'krefeld', 'lübeck', 'lubeck',
    'oberhausen', 'erfurt', 'mainz', 'rostock', 'kassel', 'hagen',
    'potsdam', 'saarbrücken', 'saarbrucken', 'hamm', 'ludwigshafen',
    'leverkusen', 'oldenburg', 'osnabrück', 'osnabruck', 'solingen',
    'heidelberg', 'darmstadt', 'regensburg', 'ingolstadt', 'würzburg',
    'wurzburg', 'wolfsburg', 'göttingen', 'gottingen', 'recklinghausen',
    'heilbronn', 'ulm', 'pforzheim', 'offenbach', 'bottrop', 'trier',
    'jena', 'cottbus', 'siegen', 'hildesheim', 'salzgitter',

    // Mid-size cities (population 30k–100k)
    'gütersloh', 'gutersloh', 'iserlohn', 'schwerin', 'koblenz',
    'zwickau', 'witten', 'gera', 'hanau', 'esslingen', 'ludwigsburg',
    'tübingen', 'tubingen', 'flensburg', 'konstanz', 'worms',
    'marburg', 'lüneburg', 'luneburg', 'bayreuth', 'bamberg',
    'plauen', 'neubrandenburg', 'wilhelmshaven', 'paderborn',
    'reutlingen', 'neuss', 'passau', 'landshut', 'rosenheim',
    'kaiserslautern', 'giessen', 'gießen', 'fulda', 'weimar',
    'dessau', 'celle', 'detmold', 'schwäbisch gmünd', 'ravensburg',
    'friedrichshafen', 'villingen-schwenningen', 'sindelfingen',
    'böblingen', 'leonberg', 'norderstedt', 'delmenhorst',
    'neumünster', 'neustadt', 'herford', 'minden', 'arnsberg',
    'lüdenscheid', 'unna', 'bergisch gladbach', 'troisdorf',
    'euskirchen', 'dormagen', 'grevenbroich', 'meerbusch',
    'ratingen', 'velbert', 'mettmann', 'langenfeld', 'monheim',
    'hürth', 'kerpen', 'brühl', 'erftstadt', 'frechen',
    'pulheim', 'bergheim', 'hennef', 'sankt augustin', 'bad honnef',
    'königswinter', 'bornheim', 'meckenheim', 'rheinbach',

    // Tech/industry hub towns
    'ottobrunn', 'garching', 'walldorf', 'feldkirchen', 'unterschleissheim',
    'unterhaching', 'ismaning', 'pullach', 'grünwald', 'grasbrunn',
    'haar', 'kirchheim', 'penzberg', 'holzkirchen', 'starnberg',
    'germering', 'gilching', 'planegg', 'martinsried', 'neubiberg',
    'oberhaching', 'taufkirchen', 'brunnthal', 'aschheim', 'heimstetten',
    'maisach', 'olching', 'dachau', 'freising', 'erding',
    'weinheim', 'grenzach', 'wyhlen', 'grenzach-wyhlen',
    'biberach', 'wedel', 'isenburg', 'neu-isenburg', 'neu isenburg',
    'eschborn', 'kronberg', 'bad homburg', 'oberursel', 'friedberg',
    'dreieich', 'langen', 'dietzenbach', 'rodgau', 'seligenstadt',
    'bad vilbel', 'karben', 'nidderau',

    // Industrial/pharma/chemical towns
    'leuna', 'bitterfeld', 'schkopau', 'ludwigshafen', 'worms',
    'frankenthal', 'speyer', 'neustadt an der weinstraße',
    'dormagen', 'brunsbüttel', 'brunsbuttel', 'meppen', 'emden',
    'cuxhaven', 'stade', 'buxtehude', 'leer', 'aurich',
    'papenburg', 'nordhorn', 'lingen', 'rheine', 'ibbenbüren',
    'bocholt', 'borken', 'coesfeld', 'ahlen', 'beckum',
    'warendorf', 'hameln', 'holzminden', 'alfeld', 'goslar',
    'clausthal', 'wolfenbüttel', 'peine', 'gifhorn',
    'helmstedt', 'schöningen', 'königslutter',
    'bad harzburg', 'seesen', 'osterode', 'northeim',
    'einbeck', 'uslar', 'duderstadt',

    // Eastern Germany
    'potsdam', 'oranienburg', 'falkensee', 'bernau', 'eberswalde',
    'schwedt', 'fürstenwalde', 'eisenhüttenstadt', 'senftenberg',
    'spremberg', 'forst', 'guben', 'luckenwalde', 'königs wusterhausen',
    'ludwigsfelde', 'teltow', 'stahnsdorf', 'kleinmachnow',
    'wildau', 'schönefeld', 'blankenfelde', 'rangsdorf',
    'stralsund', 'greifswald', 'wismar', 'güstrow', 'waren',
    'neustrelitz', 'parchim', 'ludwigslust', 'hagenow',
    'wittenberg', 'bitterfeld', 'köthen', 'bernburg',
    'aschersleben', 'quedlinburg', 'halberstadt', 'wernigerode',
    'stendal', 'salzwedel', 'gardelegen',
    'nordhausen', 'mühlhausen', 'eisenach', 'gotha', 'arnstadt',
    'ilmenau', 'suhl', 'meiningen', 'sonneberg', 'saalfeld',
    'rudolstadt', 'gera', 'altenburg', 'schmölln',
    'bautzen', 'görlitz', 'zittau', 'löbau', 'kamenz',
    'hoyerswerda', 'riesa', 'meissen', 'pirna', 'freital',
    'radebeul', 'coswig', 'döbeln', 'mittweida', 'freiberg',
    'annaberg', 'aue', 'schwarzenberg', 'marienberg',
    'limbach-oberfrohna', 'crimmitschau', 'werdau', 'reichenbach',

    // Bavaria (beyond Munich)
    'erlangen', 'fürth', 'schwabach', 'ansbach', 'neumarkt',
    'amberg', 'weiden', 'tirschenreuth', 'hof', 'selb',
    'kulmbach', 'lichtenfels', 'coburg', 'kronach',
    'schweinfurt', 'bad kissingen', 'aschaffenburg', 'miltenberg',
    'kitzingen', 'ochsenfurt', 'bad neustadt',
    'deggendorf', 'straubing', 'cham', 'regen', 'freyung',
    'altötting', 'mühldorf', 'traunstein', 'berchtesgaden',
    'bad reichenhall', 'miesbach', 'garmisch-partenkirchen',
    'weilheim', 'schongau', 'landsberg', 'fürstenfeldbruck',
    'kaufbeuren', 'kempten', 'memmingen', 'lindau',
    'neu-ulm', 'günzburg', 'dillingen', 'donauwörth', 'nördlingen',

    // Baden-Württemberg (beyond Stuttgart)
    'böblingen', 'sindelfingen', 'leonberg', 'ludwigsburg',
    'waiblingen', 'fellbach', 'backnang', 'schorndorf',
    'göppingen', 'geislingen', 'nürtingen', 'esslingen',
    'kirchheim unter teck', 'filderstadt', 'leinfelden-echterdingen',
    'herrenberg', 'rottenburg', 'hechingen', 'balingen',
    'albstadt', 'tuttlingen', 'rottweil', 'oberndorf',
    'offenburg', 'lahr', 'kehl', 'achern', 'bühl',
    'baden-baden', 'rastatt', 'gaggenau', 'ettlingen',
    'bruchsal', 'sinsheim', 'mosbach', 'buchen',
    'schwetzingen', 'hockenheim', 'wiesloch', 'walldorf',
    'lörrach', 'weil am rhein', 'rheinfelden', 'schopfheim',
    'waldshut-tiengen', 'bad säckingen', 'stockach',
    'überlingen', 'salem', 'markdorf', 'tettnang',

    // Schleswig-Holstein
    'lübeck', 'neumünster', 'norderstedt', 'elmshorn',
    'pinneberg', 'wedel', 'itzehoe', 'heide', 'husum',
    'schleswig', 'rendsburg', 'eckernförde', 'eutin',
    'bad segeberg', 'bad oldesloe', 'ahrensburg', 'reinbek',
    'geesthacht', 'lauenburg', 'mölln', 'ratzeburg',

    // Hessen (beyond Frankfurt)
    'wiesbaden', 'darmstadt', 'offenbach', 'hanau',
    'bad homburg', 'oberursel', 'kronberg', 'eschborn',
    'rüsselsheim', 'raunheim', 'kelsterbach', 'mörfelden-walldorf',
    'dreieich', 'langen', 'neu-isenburg', 'dietzenbach',
    'marburg', 'giessen', 'gießen', 'wetzlar', 'limburg',
    'bad nauheim', 'friedberg', 'butzbach', 'bad vilbel',
    'fulda', 'bad hersfeld', 'alsfeld', 'lauterbach',

    // Niedersachsen (beyond Hannover)
    'braunschweig', 'wolfsburg', 'salzgitter', 'hildesheim',
    'göttingen', 'celle', 'lüneburg', 'stade', 'buxtehude',
    'cuxhaven', 'emden', 'leer', 'aurich', 'wilhelmshaven',
    'oldenburg', 'delmenhorst', 'cloppenburg', 'vechta',
    'osnabrück', 'lingen', 'meppen', 'nordhorn', 'papenburg',
    'hameln', 'holzminden', 'peine', 'gifhorn',

    // NRW (beyond Düsseldorf/Cologne)
    'bonn', 'aachen', 'mönchengladbach', 'krefeld', 'duisburg',
    'essen', 'dortmund', 'bochum', 'gelsenkirchen', 'herne',
    'bottrop', 'oberhausen', 'mülheim', 'wuppertal', 'solingen',
    'remscheid', 'leverkusen', 'bergisch gladbach', 'troisdorf',
    'siegburg', 'lohmar', 'much', 'hennef', 'sankt augustin',
    'bad godesberg', 'meckenheim', 'rheinbach', 'euskirchen',
    'düren', 'jülich', 'heinsberg', 'erkelenz', 'wegberg',
    'viersen', 'kempen', 'willich', 'tönisvorst', 'kaarst',
    'korschenbroich', 'jüchen', 'grevenbroich', 'dormagen',
    'neuss', 'meerbusch', 'ratingen', 'mettmann', 'velbert',
    'wülfrath', 'haan', 'hilden', 'langenfeld', 'monheim',
    'erkrath', 'hattingen', 'sprockhövel', 'schwelm',
    'ennepetal', 'gevelsberg', 'herdecke', 'wetter', 'witten',
    'hattingen', 'castrop-rauxel', 'lünen', 'selm', 'werne',
    'bergkamen', 'kamen', 'unna', 'holzwickede', 'schwerte',
    'iserlohn', 'hemer', 'menden', 'arnsberg', 'meschede',
    'brilon', 'winterberg', 'olsberg', 'lippstadt', 'soest',
    'warstein', 'werl', 'hamm', 'ahlen', 'beckum',
    'warendorf', 'oelde', 'rheda-wiedenbrück', 'gütersloh',
    'bielefeld', 'herford', 'minden', 'bad oeynhausen',
    'löhne', 'bünde', 'vlotho', 'porta westfalica',
    'paderborn', 'delbrück', 'bad lippspringe', 'altenbeken',
    'höxter', 'detmold', 'lemgo', 'bad salzuflen', 'lage',

    // Rheinland-Pfalz
    'mainz', 'ludwigshafen', 'kaiserslautern', 'trier',
    'koblenz', 'worms', 'speyer', 'frankenthal', 'neustadt',
    'landau', 'pirmasens', 'zweibrücken', 'bad kreuznach',
    'idar-oberstein', 'bingen', 'ingelheim', 'andernach',
    'neuwied', 'bendorf', 'montabaur', 'limburg',

    // Saarland
    'saarbrücken', 'saarlouis', 'neunkirchen', 'homburg',
    'merzig', 'völklingen', 'st. ingbert', 'dillingen',

    // German state names (for "Neu Isenburg, Hessen" style locations)
    'germany', 'deutschland',
    'hessen', 'bayern', 'bavaria', 'sachsen', 'saxony',
    'niedersachsen', 'nordrhein-westfalen', 'nrw',
    'baden-württemberg', 'baden württemberg', 'rheinland-pfalz',
    'schleswig-holstein', 'mecklenburg-vorpommern',
    'thüringen', 'thuringia', 'brandenburg', 'saarland',
    'sachsen-anhalt', 'saxony-anhalt',
];

function isGermanyLocation(loc: string): boolean {
  const lower = loc.toLowerCase();
  if (lower.includes('germany') || lower.includes('deutschland')) return true;
  return GERMAN_CITY_NAMES.some(city => lower.includes(city));
}

function cleanLocationString(loc: string): string {
  // Remove workplace type suffixes: "Munich - Office" → "Munich"
  let cleaned = loc.replace(/\s*[-–—]\s*(Office|Hybrid|Remote|On-?site|Onsite)\s*$/i, '');

  // Split into parts, deduplicate: "Berlin, Berlin, Germany" → "Berlin, Germany"
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some(u => u.toLowerCase() === part.toLowerCase())) {
      unique.push(part);
    }
  }

  return unique.join(', ');
}

function extractCity(loc: string): string | null {
  const cleaned = loc.replace(/\s*[-–—]\s*(Office|Hybrid|Remote|On-?site|Onsite)\s*$/i, '');
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);

  // Return the first part that's not "Germany"/"Deutschland" and is a known German city
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'germany' || lower === 'deutschland') continue;
    if (GERMAN_CITY_NAMES.some(city => lower.includes(city))) {
      return part;
    }
  }
  return null;
}

export function getDisplayLocation(job: IJob): string {
  const allLocations = parseAllLocations(job);

  // Step 1: Find all Germany-related locations
  const germanyLocs = allLocations.filter(isGermanyLocation);

  // Step 2: Try to extract a German city name
  for (const loc of germanyLocs) {
    const city = extractCity(loc);
    if (city) return city;
  }

  // Step 3: Check if remote in Germany
  const hasRemoteGermany = germanyLocs.some(loc => loc.toLowerCase().includes('remote'));
  if (hasRemoteGermany) return 'Remote, Germany';

  // Step 4: Check if IsRemote flag is set
  if (job.IsRemote) return 'Remote, Germany';

  // Step 5: Has Germany but no city
  if (germanyLocs.length > 0) return 'Germany';

  // Step 6: Try the Location field directly
  if (job.Location) {
    const city = extractCity(job.Location);
    if (city) return city;
    const cleaned = cleanLocationString(job.Location);
    if (cleaned) return cleaned;
  }

  return 'Germany';
}


export function isMeaningful(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim();
  return Boolean(normalized) && normalized.toLowerCase() !== 'n/a';
}

/**
 * Merge Location field (semicolon-separated) and AllLocations array
 * into a single de-duplicated array of location strings.
 */
export function parseAllLocations(job: IJob): string[] {
  const fromLocationField = String(job.Location || '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean);

  const fromAllLocations = (job.AllLocations || [])
    .map(value => String(value).trim())
    .filter(Boolean);

  return [...new Set([...fromLocationField, ...fromAllLocations])];
}

/**
 * Pick the first available location from a parsed locations array,
 * falling back to the raw Location field or a default.
 */
export function getPrimaryLocation(job: IJob, locations: string[]): string {
  if (locations.length > 0) return locations[0];
  return job.Location || 'N/A';
}

/**
 * Normalize a workplace-type string into one of: Remote, Hybrid, Onsite, Unspecified.
 */
export function normalizeWorkplace(value?: string | null): string {
  if (!value) return 'Unspecified';
  const lower = value.trim().toLowerCase();
  if (lower === 'remote' || lower === 'fully remote' || lower === 'work from home' || lower === 'telecommute') return 'Remote';
  if (lower === 'onsite' || lower === 'on-site' || lower === 'in-office' || lower === 'office') return 'Onsite';
  if (lower === 'hybrid' || lower === 'flex' || lower === 'flexible') return 'Hybrid';
  return 'Unspecified';
}

/**
 * Normalize a salary value that may need scaling.
 * E.g., 125 on a yearly interval becomes 125000.
 */
export function normalizeSalary(value: number | null, interval: string | null): number | null {
  if (value == null || value <= 0) return null;

  const normalizedInterval = String(interval || '').toLowerCase();
  const isAnnual = !normalizedInterval || normalizedInterval === 'per-year-salary' || normalizedInterval === 'yearly';
  if (isAnnual && value > 0 && value < 1000) return value * 1000;

  const isMonthly = normalizedInterval === 'per-month-salary' || normalizedInterval === 'monthly';
  if (isMonthly && value > 0 && value < 100) return value * 1000;

  return value;
}

/**
 * Format a salary range into a compact label like "€50K-80K".
 * Uses normalizeSalary internally when SalaryInterval is available.
 */
export function compactSalary(job: IJob): string | null {
  const min = normalizeSalary(job.SalaryMin ?? null, job.SalaryInterval ?? null);
  const max = normalizeSalary(job.SalaryMax ?? null, job.SalaryInterval ?? null);
  if (min == null && max == null) return null;

  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : '';
  const formattedMin = min != null && min > 0 ? `${Math.round(min / 1000)}K` : null;
  const formattedMax = max != null && max > 0 ? `${Math.round(max / 1000)}K` : null;

  if (formattedMin && formattedMax) return `${symbol}${formattedMin}-${formattedMax}`;
  if (formattedMin) return `${symbol}${formattedMin}+`;
  if (formattedMax) return `${symbol}${formattedMax}`;
  return null;
}

/**
 * Format a salary range into a detailed label like "€50,000 - €80,000 / year".
 * Uses normalizeSalary internally when SalaryInterval is available.
 */
export function detailedSalary(job: IJob): string | null {
  const min = normalizeSalary(job.SalaryMin ?? null, job.SalaryInterval ?? null);
  const max = normalizeSalary(job.SalaryMax ?? null, job.SalaryInterval ?? null);
  if (min == null && max == null) return null;

  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? `${job.SalaryCurrency} ` : '');
  const interval = job.SalaryInterval === 'per-year-salary'
    ? '/ year'
    : job.SalaryInterval === 'per-month-salary'
      ? '/ month'
      : job.SalaryInterval === 'per-hour-wage'
        ? '/ hour'
        : '/ year';

  const formatter = new Intl.NumberFormat('en-US');
  const formattedMin = min != null && min > 0 ? formatter.format(min) : null;
  const formattedMax = max != null && max > 0 ? formatter.format(max) : null;

  if (formattedMin && formattedMax) return `${symbol}${formattedMin} - ${symbol}${formattedMax} ${interval}`;
  if (formattedMin) return `${symbol}${formattedMin}+ ${interval}`;
  if (formattedMax) return `${symbol}${formattedMax} ${interval}`;
  return null;
}
