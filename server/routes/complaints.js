import express from 'express';
import { detectRecurringIssues } from '../lib/similarity.js';
import { firestore, isConfigured } from '../lib/firestore.js';

const router = express.Router();

// In-memory store for demo mode
export const demoStore = {
  complaints: [],
  nextId: 1,
};

function generateDemoId() {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// GET /api/complaints — list all complaints with filters
router.get('/', async (req, res) => {
  try {
    const { status, category, urgency, search, limit = 100, offset = 0 } = req.query;

    if (!isConfigured || !firestore) {
      // Demo mode — return from memory
      let results = [...demoStore.complaints].reverse();

      if (status) results = results.filter(c => c.status === status);
      if (category) results = results.filter(c => c.category === category);
      if (urgency) results = results.filter(c => c.urgency === urgency);
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(c =>
          (c.description || '').toLowerCase().includes(s) ||
          (c.location || '').toLowerCase().includes(s) ||
          (c.ai_title || '').toLowerCase().includes(s)
        );
      }

      return res.json({
        data: results.slice(Number(offset), Number(offset) + Number(limit)),
        total: results.length,
        mode: 'demo',
      });
    }

    const snapshot = await firestore.collection('complaints').orderBy('created_at', 'desc').get();
    let results = snapshot.docs.map((doc) => doc.data());

    if (status) results = results.filter((complaint) => complaint.status === status);
    if (category) results = results.filter((complaint) => complaint.category === category);
    if (urgency) results = results.filter((complaint) => complaint.urgency === urgency);
    if (search) {
      const term = String(search).toLowerCase();
      results = results.filter((complaint) =>
        [complaint.description, complaint.location, complaint.ai_title]
          .some((value) => (value || '').toLowerCase().includes(term))
      );
    }

    res.json({
      data: results.slice(Number(offset), Number(offset) + Number(limit)),
      total: results.length,
      mode: 'live',
    });
  } catch (err) {
    console.error('[GET /complaints]', err.message);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /api/complaints/stats — dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    if (!isConfigured || !firestore) {
      const all = demoStore.complaints;
      return res.json({
        total: all.length,
        open: all.filter(c => c.status === 'Open').length,
        inProgress: all.filter(c => c.status === 'In Progress').length,
        resolved: all.filter(c => c.status === 'Resolved').length,
        highPriority: all.filter(c => ['High', 'Critical'].includes(c.urgency)).length,
        recurring: all.filter(c => c.recurring_match_ids && c.recurring_match_ids.length > 0).length,
        mode: 'demo',
      });
    }

    const snapshot = await firestore.collection('complaints').get();
    const all = snapshot.docs.map((doc) => doc.data());
    res.json({
      total: all.length,
      open: all.filter(c => c.status === 'Open').length,
      inProgress: all.filter(c => c.status === 'In Progress').length,
      resolved: all.filter(c => c.status === 'Resolved').length,
      highPriority: all.filter(c => ['High', 'Critical'].includes(c.urgency)).length,
      recurring: all.filter(c => c.recurring_match_ids && c.recurring_match_ids.length > 0).length,
      mode: 'live',
    });
  } catch (err) {
    console.error('[GET /complaints/stats]', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/complaints/:id — single complaint
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isConfigured || !firestore) {
      const complaint = demoStore.complaints.find(c => c.id === id);
      if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
      return res.json({ data: complaint, mode: 'demo' });
    }

    const snapshot = await firestore.collection('complaints').doc(id).get();
    if (!snapshot.exists) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ data: snapshot.data(), mode: 'live' });
  } catch (err) {
    console.error('[GET /complaints/:id]', err.message);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// POST /api/complaints — submit new complaint
router.post('/', async (req, res) => {
  try {
    const {
      description,
      building,
      floor,
      location,
      category,
      urgency,
      department,
      ai_title,
      normalized_description,
      next_action,
      recurring_match_ids,
      recurring_reason,
      raw_ai_response,
      is_demo,
    } = req.body;

    // Validation
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }
    if (!building && !location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const effectiveLocation = location || [building, floor].filter(Boolean).join(', ');

    const complaint = {
      description: description.trim(),
      normalized_description: normalized_description || description.trim(),
      category: category || 'Other',
      location: effectiveLocation,
      building: building || null,
      floor: floor || null,
      urgency: urgency || 'Medium',
      department: department || 'General Maintenance',
      status: 'Open',
      ai_title: ai_title || null,
      next_action: next_action || null,
      raw_ai_response: raw_ai_response || null,
      is_demo: is_demo || false,
      recurring_match_ids: recurring_match_ids || [],
      recurring_reason: recurring_reason || null,
    };

    if (!isConfigured || !firestore) {
      // Demo mode
      const newComplaint = {
        ...complaint,
        id: generateDemoId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
      };
      demoStore.complaints.push(newComplaint);

      return res.status(201).json({
        data: newComplaint,
        mode: 'demo',
        message: 'Complaint saved in demo mode (not persisted to database)',
      });
    }

    const document = firestore.collection('complaints').doc();
    const data = { ...complaint, id: document.id };
    await document.set(data);

    res.status(201).json({
      data,
      mode: 'live',
      message: 'Complaint saved successfully',
    });
  } catch (err) {
    console.error('[POST /complaints]', err.message);
    res.status(500).json({ error: 'Failed to save complaint: ' + err.message });
  }
});

// PATCH /api/complaints/:id — update status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, urgency, department, recurring_match_ids, recurring_reason } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updates = {
      ...(status && { status }),
      ...(urgency && { urgency }),
      ...(department && { department }),
      ...(recurring_match_ids !== undefined && { recurring_match_ids }),
      ...(recurring_reason !== undefined && { recurring_reason }),
      updated_at: new Date().toISOString(),
      ...(status === 'Resolved' && { resolved_at: new Date().toISOString() }),
    };

    if (!isConfigured || !firestore) {
      const idx = demoStore.complaints.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Complaint not found' });
      demoStore.complaints[idx] = { ...demoStore.complaints[idx], ...updates };
      return res.json({ data: demoStore.complaints[idx], mode: 'demo' });
    }

    const document = firestore.collection('complaints').doc(id);
    const snapshot = await document.get();
    if (!snapshot.exists) return res.status(404).json({ error: 'Complaint not found' });
    await document.update(updates);
    res.json({ data: { ...snapshot.data(), ...updates }, mode: 'live' });
  } catch (err) {
    console.error('[PATCH /complaints/:id]', err.message);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// POST /api/complaints/:id/detect-recurring — run recurring detection for a specific complaint
router.post('/:id/detect-recurring', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the complaint
    let complaint;
    if (!isConfigured || !firestore) {
      complaint = demoStore.complaints.find(c => c.id === id);
    } else {
      const snapshot = await firestore.collection('complaints').doc(id).get();
      complaint = snapshot.exists ? snapshot.data() : null;
    }

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Get historical complaints (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let historical = [];

    if (!isConfigured || !firestore) {
      historical = demoStore.complaints.filter(c =>
        c.id !== id && c.created_at >= ninetyDaysAgo
      );
    } else {
      const snapshot = await firestore.collection('complaints')
        .where('created_at', '>=', ninetyDaysAgo)
        .orderBy('created_at', 'desc')
        .limit(200)
        .get();
      historical = snapshot.docs
        .map((doc) => doc.data())
        .filter((item) => item.id !== id);
    }

    const matches = detectRecurringIssues(complaint, historical);

    res.json({ matches, count: matches.length });
  } catch (err) {
    console.error('[POST /detect-recurring]', err.message);
    res.status(500).json({ error: 'Failed to detect recurring issues' });
  }
});

// POST /api/complaints/seed-demo — seed demo data
router.post('/seed-demo', async (req, res) => {
  try {
    const demoComplaints = generateDemoData();

    if (!isConfigured || !firestore) {
      demoStore.complaints = demoComplaints;
      return res.json({ message: `Seeded ${demoComplaints.length} demo complaints`, mode: 'demo' });
    }

    const collection = firestore.collection('complaints');
    const batch = firestore.batch();
    demoComplaints.forEach((complaint) => {
      const document = collection.doc();
      batch.set(document, { ...complaint, id: document.id, is_demo: true });
    });
    await batch.commit();

    res.json({ message: `Seeded ${demoComplaints.length} demo complaints`, mode: 'live' });
  } catch (err) {
    console.error('[POST /seed-demo]', err.message);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

function generateDemoData() {
  const now = Date.now();
  const day = 86400000;

  return [
    {
      id: generateDemoId(),
      description: 'The water pipe in the men\'s restroom on Block C Ground Floor has been leaking for two days. Water is pooling on the floor creating a slip hazard.',
      normalized_description: 'Leaking water pipe in men\'s restroom causing floor pooling and slip hazard.',
      category: 'Water',
      location: 'Block C, Ground Floor, Men\'s Restroom',
      building: 'Block C',
      floor: 'Ground Floor',
      urgency: 'High',
      department: 'Plumbing & Utilities',
      status: 'Resolved',
      ai_title: 'Leaking Pipe - Block C Restroom',
      next_action: 'Dispatch plumbing team to replace pipe joint',
      is_demo: true,
      recurring_match_ids: [],
      created_at: new Date(now - 45 * day).toISOString(),
      updated_at: new Date(now - 40 * day).toISOString(),
      resolved_at: new Date(now - 40 * day).toISOString(),
    },
    {
      id: generateDemoId(),
      description: 'WiFi is extremely slow in the library reading room. Cannot stream lecture videos or access research databases. This affects all students.',
      normalized_description: 'Slow WiFi in library reading room affecting student access to online resources.',
      category: 'Wi-Fi',
      location: 'Library, Reading Room',
      building: 'Library',
      floor: '2nd Floor',
      urgency: 'Medium',
      department: 'IT & Networking',
      status: 'Resolved',
      ai_title: 'Slow WiFi - Library Reading Room',
      next_action: 'IT team to check router configuration and bandwidth allocation',
      is_demo: true,
      recurring_match_ids: [],
      created_at: new Date(now - 30 * day).toISOString(),
      updated_at: new Date(now - 25 * day).toISOString(),
      resolved_at: new Date(now - 25 * day).toISOString(),
    },
    {
      id: generateDemoId(),
      description: 'Classroom projector in Room 204, Block A is not working. The bulb appears to be blown. Classes are being disrupted.',
      normalized_description: 'Projector malfunction in Room 204 Block A due to blown bulb.',
      category: 'Classroom',
      location: 'Block A, Room 204',
      building: 'Block A',
      floor: '2nd Floor',
      urgency: 'Medium',
      department: 'Facilities & Infrastructure',
      status: 'Open',
      ai_title: 'Projector Failure - Block A Room 204',
      next_action: 'Replace projector bulb and test before next class',
      is_demo: true,
      recurring_match_ids: [],
      created_at: new Date(now - 10 * day).toISOString(),
      updated_at: new Date(now - 10 * day).toISOString(),
      resolved_at: null,
    },
    {
      id: generateDemoId(),
      description: 'Garbage bins near the canteen are overflowing and the area smells very bad. Waste has been there for more than 3 days.',
      normalized_description: 'Overflowing garbage bins near canteen causing foul odor.',
      category: 'Sanitation',
      location: 'Canteen Area',
      building: 'Canteen',
      floor: 'Ground Floor',
      urgency: 'High',
      department: 'Housekeeping & Sanitation',
      status: 'In Progress',
      ai_title: 'Overflowing Bins - Canteen Area',
      next_action: 'Emergency waste collection and cleaning scheduled',
      is_demo: true,
      recurring_match_ids: [],
      created_at: new Date(now - 3 * day).toISOString(),
      updated_at: new Date(now - 1 * day).toISOString(),
      resolved_at: null,
    },
    {
      id: generateDemoId(),
      description: 'The street lights along the main pathway from Gate 1 to Block D are not working. Students feel unsafe walking at night.',
      normalized_description: 'Street lights not working on pathway from Gate 1 to Block D causing safety concerns.',
      category: 'Electricity',
      location: 'Main Pathway, Gate 1 to Block D',
      building: 'Campus Grounds',
      floor: 'Ground',
      urgency: 'High',
      department: 'Electrical & Power',
      status: 'Open',
      ai_title: 'Street Lights Out - Gate 1 to Block D',
      next_action: 'Electrician to inspect and replace faulty bulbs/wiring',
      is_demo: true,
      recurring_match_ids: [],
      created_at: new Date(now - 7 * day).toISOString(),
      updated_at: new Date(now - 7 * day).toISOString(),
      resolved_at: null,
    },
  ];
}

export default router;
