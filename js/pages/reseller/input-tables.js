/**
 * js/pages/reseller/input-tables.js
 */
(function() {
'use strict';
const ResellerInputTables = {
  async load() {
    const list = document.getElementById('reseller-input-tables-list');
    if (!list) return;
    try {
      const user = Auth.getUser();
      if (!user) return;
      const res = await fetch('/api/supabase', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'query',table:'input_tables',columns:'*',order:{column:'created_at',ascending:false}}) });
      const {data} = await res.json();
      list.innerHTML = (data||[]).map(t => `<div class="admin-list-item"><div class="admin-list-item-info"><div class="admin-list-item-name">${Utils.escapeHtml(t.name)}</div><div class="admin-list-item-meta">${t.placeholder_text||''}</div></div><div class="admin-list-item-actions"><button class="admin-list-edit-btn">Edit</button><button class="admin-list-delete-btn">Delete</button></div></div>`).join('');
      document.getElementById('btn-reseller-add-input-table')?.addEventListener('click', () => alert('Create input table'));
    } catch(e) { list.innerHTML = '<div style="color:var(--text-muted);padding:1rem;">Failed to load</div>'; }
  }
};
document.addEventListener('DOMContentLoaded', () => ResellerInputTables.load());
window.ResellerInputTables = ResellerInputTables;
})();
