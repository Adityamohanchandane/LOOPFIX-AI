/**
 * Text similarity and recurring issue detection utilities.
 * Uses lightweight string matching — no external dependencies required.
 */

// Rule-based fallback classification when AI is unavailable
const CATEGORY_KEYWORDS = {
  Water: ['leak', 'pipe', 'water', 'flood', 'plumbing', 'drain', 'tap', 'faucet', 'sewage', 'toilet', 'sink', 'wet', 'damp', 'moisture', 'overflow'],
  Electricity: ['light', 'power', 'electric', 'socket', 'outlet', 'switch', 'breaker', 'fuse', 'wiring', 'circuit', 'blackout', 'outage', 'dark', 'lamp', 'bulb', 'fan', 'ac', 'air condition'],
  'Wi-Fi': ['wifi', 'wi-fi', 'internet', 'network', 'router', 'signal', 'connection', 'bandwidth', 'slow internet', 'hotspot'],
  Sanitation: ['garbage', 'trash', 'waste', 'smell', 'odor', 'dirty', 'clean', 'hygiene', 'pest', 'cockroach', 'rat', 'mold', 'fungus', 'bathroom'],
  Safety: ['broken', 'hazard', 'danger', 'unsafe', 'fire', 'emergency', 'crack', 'collapse', 'fall', 'injury', 'lock', 'door', 'security', 'window', 'glass', 'railing', 'stairs'],
  Classroom: ['projector', 'board', 'whiteboard', 'chair', 'desk', 'table', 'furniture', 'door', 'ceiling', 'wall', 'paint', 'classroom', 'lecture', 'hall', 'lab', 'equipment'],
};

export function ruleBasedClassify(description, location = '') {
  const text = (description + ' ' + location).toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter(kw => text.includes(kw)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  // Urgency heuristics
  let urgency = 'Medium';
  const urgentWords = ['emergency', 'fire', 'collapse', 'flood', 'injury', 'danger', 'critical', 'urgent', 'severe', 'broken glass', 'electrical shock'];
  const lowWords = ['minor', 'small', 'little', 'slight', 'cosmetic'];

  if (urgentWords.some(w => text.includes(w))) urgency = 'High';
  else if (lowWords.some(w => text.includes(w))) urgency = 'Low';

  const DEPARTMENTS = {
    Water: 'Plumbing & Utilities',
    Electricity: 'Electrical & Power',
    'Wi-Fi': 'IT & Networking',
    Sanitation: 'Housekeeping & Sanitation',
    Safety: 'Safety & Security',
    Classroom: 'Facilities & Infrastructure',
    Other: 'General Maintenance',
  };

  const category = best[1] > 0 ? best[0] : 'Other';

  return {
    title: generateTitle(description, category),
    normalized_description: description.trim().slice(0, 500),
    category,
    location: location || 'Unknown',
    urgency,
    department: DEPARTMENTS[category],
    next_action: generateNextAction(category),
    confidence: best[1] > 2 ? 'medium' : 'low',
    usedFallback: true,
  };
}

function generateTitle(description, category) {
  const words = description.trim().split(/\s+/).slice(0, 8).join(' ');
  return `${category} Issue: ${words}${description.split(' ').length > 8 ? '...' : ''}`;
}

function generateNextAction(category) {
  const actions = {
    Water: 'Dispatch plumbing team for inspection and repair',
    Electricity: 'Assign electrician for safety inspection',
    'Wi-Fi': 'IT team to check router and connectivity in the area',
    Sanitation: 'Schedule immediate cleaning and inspection',
    Safety: 'Conduct safety assessment and secure the area',
    Classroom: 'Facilities team to assess and schedule repair',
    Other: 'Assign to general maintenance team for evaluation',
  };
  return actions[category] || actions.Other;
}

/**
 * Calculate similarity between two text strings.
 * Returns a score between 0 (no match) and 1 (identical).
 */
export function textSimilarity(a, b) {
  if (!a || !b) return 0;
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));

  // Remove very common words
  const stopWords = new Set(['the', 'a', 'an', 'is', 'in', 'at', 'to', 'of', 'and', 'or', 'it', 'its', 'this', 'that', 'there', 'has', 'have', 'was', 'are', 'been', 'be', 'with', 'for', 'on']);
  for (const w of stopWords) { wordsA.delete(w); wordsB.delete(w); }

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return intersection / union; // Jaccard similarity
}

/**
 * Normalize a location string for comparison.
 */
export function normalizeLocation(loc) {
  return (loc || '').toLowerCase()
    .replace(/\b(block|building|blk|bldg|floor|flr|room|rm|lab|laboratory)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Detect potential recurring issues from historical complaints.
 *
 * @param {Object} newComplaint - The newly submitted complaint
 * @param {Array}  historical   - Array of historical complaint records (last 90 days)
 * @returns {Array} matches - Sorted list of potential recurring/duplicate matches
 */
export function detectRecurringIssues(newComplaint, historical) {
  if (!historical || historical.length === 0) return [];

  const matches = [];
  const newLoc = normalizeLocation(newComplaint.location || newComplaint.building || '');
  const newDesc = (newComplaint.normalized_description || newComplaint.description || '').toLowerCase();
  const newCat = (newComplaint.category || '').toLowerCase();

  for (const hist of historical) {
    // Skip self
    if (hist.id === newComplaint.id) continue;

    const histLoc = normalizeLocation(hist.location || hist.building || '');
    const histDesc = (hist.normalized_description || hist.description || '').toLowerCase();
    const histCat = (hist.category || '').toLowerCase();

    // Score components
    const categoryMatch = histCat === newCat && histCat !== 'other';
    const locationScore = locationSimilarity(newLoc, histLoc);
    const descriptionScore = textSimilarity(newDesc, histDesc);

    // Weighted similarity
    const totalScore = (
      (categoryMatch ? 0.35 : 0) +
      (locationScore * 0.35) +
      (descriptionScore * 0.30)
    );

    if (totalScore < 0.25) continue; // Below threshold

    // Determine match type
    let matchType = 'similar';
    let reason = '';

    const isResolved = hist.status === 'Resolved';
    const isOpen = ['Open', 'In Progress'].includes(hist.status);

    if (isOpen && totalScore >= 0.4) {
      matchType = 'duplicate';
      reason = buildReason('Possible duplicate of an open complaint', categoryMatch, locationScore, descriptionScore, hist);
    } else if (isResolved && totalScore >= 0.3) {
      matchType = 'recurring';
      reason = buildReason('Possible recurring issue (previously resolved)', categoryMatch, locationScore, descriptionScore, hist);
    } else {
      reason = buildReason('Similar past complaint', categoryMatch, locationScore, descriptionScore, hist);
    }

    const daysSince = hist.created_at
      ? Math.floor((Date.now() - new Date(hist.created_at)) / 86400000)
      : null;

    matches.push({
      id: hist.id,
      matchType,
      score: totalScore,
      reason,
      daysSince,
      complaint: {
        id: hist.id,
        title: hist.ai_title || hist.description?.slice(0, 80) || 'Previous complaint',
        description: hist.description,
        category: hist.category,
        location: hist.location,
        status: hist.status,
        urgency: hist.urgency,
        created_at: hist.created_at,
        resolved_at: hist.resolved_at,
      }
    });
  }

  // Sort by score descending, cap at 5 matches
  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

function locationSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) return 0.8;

  // Token overlap
  const tokA = new Set(a.split(/\s+/).filter(t => t.length > 1));
  const tokB = new Set(b.split(/\s+/).filter(t => t.length > 1));

  if (tokA.size === 0 || tokB.size === 0) return 0;

  const shared = [...tokA].filter(t => tokB.has(t)).length;
  return shared / Math.max(tokA.size, tokB.size);
}

function buildReason(prefix, categoryMatch, locationScore, descriptionScore, hist) {
  const parts = [prefix + '.'];

  if (categoryMatch) parts.push(`Same category (${hist.category}).`);
  if (locationScore >= 0.6) parts.push('Same or nearby location.');
  else if (locationScore >= 0.3) parts.push('Similar location.');
  if (descriptionScore >= 0.4) parts.push('Highly similar description.');
  else if (descriptionScore >= 0.2) parts.push('Related description.');

  return parts.join(' ');
}
