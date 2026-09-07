// Multi-tier Demo Requests Persistence & Management
// 1. Attempts direct Supabase demo_requests table
// 2. Falls back to clinics (slug: demo-klinik) working_days.demo_requests JSONB
// 3. Falls back to localStorage

export async function fetchAllDemoRequests(supabase) {
  let list = [];

  // 1. Try Supabase demo_requests table
  try {
    const { data, error } = await supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  // 2. Try clinics JSONB fallback
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, working_days')
      .eq('slug', 'demo-klinik')
      .maybeSingle();

    if (clinic?.working_days?.demo_requests && Array.isArray(clinic.working_days.demo_requests)) {
      list = [...clinic.working_days.demo_requests];
    }
  } catch (err) {
    console.warn('Clinic fallback error:', err);
  }

  // 3. LocalStorage merge
  try {
    const local = JSON.parse(localStorage.getItem('fizyo_demo_requests') || '[]');
    if (Array.isArray(local)) {
      local.forEach(item => {
        if (!list.some(x => x.id === item.id || (x.phone === item.phone && x.created_at === item.created_at))) {
          list.push(item);
        }
      });
    }
  } catch {}

  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function saveNewDemoRequest(supabase, reqData) {
  const item = {
    id: reqData.id || `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    full_name: reqData.full_name,
    clinic_name: reqData.clinic_name,
    phone: reqData.phone,
    email: reqData.email || '',
    city: reqData.city || '',
    plan: reqData.plan || '14-gun-deneme',
    notes: reqData.notes || '',
    status: 'bekliyor',
    admin_notes: '',
    created_at: new Date().toISOString()
  };

  // 1. Try Supabase demo_requests table
  try {
    const { data, error } = await supabase
      .from('demo_requests')
      .insert([item])
      .select();

    if (!error && data) {
      return item;
    }
  } catch {}

  // 2. Fallback to clinic JSONB
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, working_days')
      .eq('slug', 'demo-klinik')
      .maybeSingle();

    if (clinic) {
      const workingDays = clinic.working_days || {};
      const demoReqs = Array.isArray(workingDays.demo_requests) ? [...workingDays.demo_requests] : [];
      demoReqs.unshift(item);
      workingDays.demo_requests = demoReqs;

      await supabase
        .from('clinics')
        .update({ working_days: workingDays })
        .eq('id', clinic.id);
    }
  } catch (err) {
    console.warn('Fallback save error:', err);
  }

  // 3. LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('fizyo_demo_requests') || '[]');
    local.unshift(item);
    localStorage.setItem('fizyo_demo_requests', JSON.stringify(local.slice(0, 100)));
  } catch {}

  return item;
}

export async function updateDemoReqStatus(supabase, requestId, newStatus, adminNotes = null) {
  // 1. Try Table
  try {
    const updateObj = { status: newStatus };
    if (adminNotes !== null) updateObj.admin_notes = adminNotes;

    const { error } = await supabase
      .from('demo_requests')
      .update(updateObj)
      .eq('id', requestId);

    if (!error) return true;
  } catch {}

  // 2. Fallback to clinic JSONB
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, working_days')
      .eq('slug', 'demo-klinik')
      .maybeSingle();

    if (clinic?.working_days?.demo_requests) {
      const workingDays = { ...clinic.working_days };
      workingDays.demo_requests = workingDays.demo_requests.map(item => {
        if (item.id === requestId) {
          return {
            ...item,
            status: newStatus,
            admin_notes: adminNotes !== null ? adminNotes : item.admin_notes
          };
        }
        return item;
      });

      await supabase
        .from('clinics')
        .update({ working_days: workingDays })
        .eq('id', clinic.id);
    }
  } catch (err) {
    console.warn('Fallback update error:', err);
  }

  // 3. LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('fizyo_demo_requests') || '[]');
    const updated = local.map(item => {
      if (item.id === requestId) {
        return {
          ...item,
          status: newStatus,
          admin_notes: adminNotes !== null ? adminNotes : item.admin_notes
        };
      }
      return item;
    });
    localStorage.setItem('fizyo_demo_requests', JSON.stringify(updated));
  } catch {}

  return true;
}

export async function removeDemoReq(supabase, requestId) {
  // 1. Try Table
  try {
    const { error } = await supabase
      .from('demo_requests')
      .delete()
      .eq('id', requestId);

    if (!error) return true;
  } catch {}

  // 2. Fallback to clinic JSONB
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, working_days')
      .eq('slug', 'demo-klinik')
      .maybeSingle();

    if (clinic?.working_days?.demo_requests) {
      const workingDays = { ...clinic.working_days };
      workingDays.demo_requests = workingDays.demo_requests.filter(item => item.id !== requestId);

      await supabase
        .from('clinics')
        .update({ working_days: workingDays })
        .eq('id', clinic.id);
    }
  } catch (err) {
    console.warn('Fallback delete error:', err);
  }

  // 3. LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('fizyo_demo_requests') || '[]');
    const filtered = local.filter(item => item.id !== requestId);
    localStorage.setItem('fizyo_demo_requests', JSON.stringify(filtered));
  } catch {}

  return true;
}
