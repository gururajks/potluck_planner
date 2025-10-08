const sections = ['appetizers', 'entree', 'dessert', 'beverages'];

async function fetchItems() {
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

async function createItem(item) {
  const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  if (!res.ok) throw new Error('Failed to create');
  return res.json();
}

async function updateItem(id, item) {
  const res = await fetch(`/api/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

async function deleteItem(id) {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
}

function bySection(items) {
  const m = Object.fromEntries(sections.map(s => [s, []]));
  for (const it of items) {
    if (m[it.section]) m[it.section].push(it);
  }
  return m;
}

function renderList(section, items) {
  const ul = document.getElementById(`list-${section}`);
  ul.innerHTML = '';
  for (const it of items) {
    const li = document.createElement('li');
    li.className = 'item';
    li.dataset.id = it.id;

    const left = document.createElement('div');
  const title = document.createElement('div');
  title.innerHTML = `<span class="name">${escapeHtml(it.name)}</span> is bringing <strong>${escapeHtml(it.dish)}</strong>`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = '';
    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(li, it));
    const delBtn = document.createElement('button');
    delBtn.className = 'danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this item?')) return;
      await deleteItem(it.id);
      await load();
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    ul.appendChild(li);
  }
}

function startEdit(li, it) {
  const form = document.createElement('div');
  form.className = 'inline-form';
  form.innerHTML = `
    <input id="edit-name" type="text" value="${escapeAttr(it.name)}" />
    <input id="edit-dish" type="text" value="${escapeAttr(it.dish)}" />
    <select id="edit-section">
      ${sections.map(s => `<option value="${s}" ${s===it.section?'selected':''}>${capitalize(s)}</option>`).join('')}
    </select>
    <div class="actions">
      <button id="save" class="secondary">Save</button>
    </div>
  `;
  li.innerHTML = '';
  li.appendChild(form);
  form.querySelector('#save').addEventListener('click', async () => {
    const name = form.querySelector('#edit-name').value.trim();
    const dish = form.querySelector('#edit-dish').value.trim();
    const section = form.querySelector('#edit-section').value;
    if (!name || !dish) return alert('Please fill name and dish');
    await updateItem(it.id, { name, dish, section });
    await load();
  });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function escapeHtml(str) {
  return str.replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

async function load() {
  const items = await fetchItems();
  const grouped = bySection(items);
  for (const s of sections) renderList(s, grouped[s]);
  renderSummary(grouped);
}

function renderSummary(grouped) {
  for (const s of sections) {
    const ul = document.getElementById(`summary-${s}`);
    if (!ul) continue;
    ul.innerHTML = '';
    const list = (grouped[s] || []).map(it => it.dish.trim()).filter(Boolean);
    for (const dish of list) {
      const li = document.createElement('li');
      li.textContent = dish;
      ul.appendChild(li);
    }
  }
}

document.getElementById('item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const name = form.name.value.trim();
  const dish = form.dish.value.trim();
  const section = form.section.value;
  if (!name || !dish) return alert('Please fill name and dish');
  await createItem({ name, dish, section });
  form.reset();
  await load();
});

load();



