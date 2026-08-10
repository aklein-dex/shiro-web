// Castles Visited Web Application Script
let castlesData = [];
let currentSort = { column: 'name', asc: true };

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadCastlesData();
  setupEventListeners();
  render();
});

// Load castles data from CASTLES_DATA (defined in castles-data.js)
function loadCastlesData() {
  if (typeof CASTLES_DATA !== 'undefined' && Array.isArray(CASTLES_DATA)) {
    castlesData = CASTLES_DATA;
  } else {
    console.error("CASTLES_DATA is not defined in castles-data.js!");
    castlesData = [];
  }
}

// Setup Event Listeners for Filters & Sorting
function setupEventListeners() {
  // Search input
  document.getElementById('search-input')?.addEventListener('input', () => render());

  // Filter selects
  document.getElementById('status-filter')?.addEventListener('change', () => render());
  document.getElementById('visited-filter')?.addEventListener('change', () => render());

  // Sort select dropdown
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'name-asc') currentSort = { column: 'name', asc: true };
    else if (val === 'name-desc') currentSort = { column: 'name', asc: false };
    else if (val === 'city-asc') currentSort = { column: 'city', asc: true };
    else if (val === 'status') currentSort = { column: 'status', asc: true };
    else if (val === 'visited') currentSort = { column: 'visited', asc: false };
    render();
  });

  // Table header click sorting
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (currentSort.column === col) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.column = col;
        currentSort.asc = true;
      }

      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        if (col === 'name') sortSelect.value = currentSort.asc ? 'name-asc' : 'name-desc';
        else if (col === 'city') sortSelect.value = 'city-asc';
        else if (col === 'status') sortSelect.value = 'status';
        else if (col === 'visited') sortSelect.value = 'visited';
      }
      render();
    });
  });
}

// Main Render Function
function render() {
  updateStats();
  renderTable();
}

// Update Summary Statistics
function updateStats() {
  const total = castlesData.length;
  let visitedCount = 0;
  let originalTotal = 0;
  let originalVisited = 0;

  castlesData.forEach(c => {
    const isVisited = Boolean(c.visited && c.visited.trim() !== '');
    if (isVisited) visitedCount++;
    if (c.status === 'Original') {
      originalTotal++;
      if (isVisited) originalVisited++;
    }
  });

  const percentage = total > 0 ? Math.round((visitedCount / total) * 100) : 0;

  const totalEl = document.getElementById('total-castles');
  if (totalEl) totalEl.textContent = total;

  const visitedEl = document.getElementById('visited-count');
  if (visitedEl) visitedEl.textContent = visitedCount;

  const percentageEl = document.getElementById('visited-percentage');
  if (percentageEl) percentageEl.textContent = `${percentage}%`;

  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = `${percentage}%`;

  const originalEl = document.getElementById('original-count');
  if (originalEl) originalEl.textContent = `${originalVisited} / ${originalTotal}`;
}

// Filter and Sort Castles Data
function getFilteredAndSortedCastles() {
  const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('status-filter')?.value || 'all';
  const visitedFilter = document.getElementById('visited-filter')?.value || 'all';

  let filtered = castlesData.filter(c => {
    // Search filter
    const matchSearch = !searchTerm || 
      c.name.toLowerCase().includes(searchTerm) || 
      c.city.toLowerCase().includes(searchTerm) ||
      (c.comment && c.comment.toLowerCase().includes(searchTerm));

    // Status filter
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;

    // Visited status filter
    const isVisited = Boolean(c.visited && c.visited.trim() !== '');
    const matchVisited = visitedFilter === 'all' || 
      (visitedFilter === 'visited' && isVisited) || 
      (visitedFilter === 'unvisited' && !isVisited);

    return matchSearch && matchStatus && matchVisited;
  });

  // Sorting logic
  filtered.sort((a, b) => {
    let valA, valB;
    if (currentSort.column === 'name') {
      valA = a.name;
      valB = b.name;
    } else if (currentSort.column === 'city') {
      valA = a.city;
      valB = b.city;
    } else if (currentSort.column === 'status') {
      valA = a.status;
      valB = b.status;
    } else if (currentSort.column === 'visited') {
      valA = a.visited || '';
      valB = b.visited || '';
    }

    if (valA < valB) return currentSort.asc ? -1 : 1;
    if (valA > valB) return currentSort.asc ? 1 : -1;
    return 0;
  });

  return filtered;
}

// Render Table Rows
function renderTable() {
  const tbody = document.getElementById('castles-tbody');
  const emptyState = document.getElementById('empty-state');
  if (!tbody) return;

  const castles = getFilteredAndSortedCastles();

  // Update header sort indicators
  document.querySelectorAll('th.sortable').forEach(th => {
    const col = th.dataset.sort;
    const sortIcon = th.querySelector('.sort-icon');
    if (col === currentSort.column) {
      th.classList.add('sorted');
      if (sortIcon) sortIcon.textContent = currentSort.asc ? '▲' : '▼';
    } else {
      th.classList.remove('sorted');
      if (sortIcon) sortIcon.textContent = '↕';
    }
  });

  if (castles.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = castles.map(c => {
    const isVisited = Boolean(c.visited && c.visited.trim() !== '');
    const statusClass = getStatusBadgeClass(c.status);

    const visitedDisplay = isVisited 
      ? `<span class="visited-date-badge">📅 ${escapeHtml(c.visited)}</span>`
      : `<span class="not-visited-text">—</span>`;

    const commentDisplay = c.comment && c.comment.trim() !== ''
      ? `<span class="comment-text">${escapeHtml(c.comment)}</span>`
      : `<span class="comment-empty">—</span>`;

    return `
      <tr class="${isVisited ? 'is-visited' : ''}">
        <td class="col-name">
          <div class="castle-icon-wrap">
            <span class="castle-symbol">${c.status === 'Original' ? '🏯' : '🏰'}</span>
            <span>${escapeHtml(c.name)}</span>
          </div>
        </td>
        <td class="col-city">
          <div class="city-wrap">
            <span>📍 ${escapeHtml(c.city)}</span>
          </div>
        </td>
        <td class="col-status">
          <span class="status-badge ${statusClass}">
            ${escapeHtml(c.status)}
          </span>
        </td>
        <td class="col-visited">
          ${visitedDisplay}
        </td>
        <td class="col-comment">
          ${commentDisplay}
        </td>
      </tr>
    `;
  }).join('');
}

// Badge CSS Helper
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Original': return 'badge-original';
    case 'With buildings': return 'badge-buildings';
    case 'Reconstructed': return 'badge-reconstructed';
    case 'Ruins': return 'badge-ruins';
    default: return '';
  }
}

// Helper HTML Escaper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
