document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('site-inline-search-input');
  const results = document.getElementById('site-inline-search-results');
  if (!input || !results || !window.hextraSearch) return;

  let request = 0;

  function closeResults() {
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  }

  function showResults(items) {
    results.replaceChildren();
    for (const item of items) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.route;
      link.setAttribute('role', 'option');
      link.textContent = item.title;
      li.appendChild(link);
      results.appendChild(li);
    }
    results.hidden = items.length === 0;
    input.setAttribute('aria-expanded', String(items.length > 0));
  }

  input.addEventListener('input', async () => {
    const query = input.value.trim();
    const currentRequest = ++request;
    if (!query) {
      results.replaceChildren();
      closeResults();
      return;
    }

    try {
      const groups = await window.hextraSearch.search(query);
      if (currentRequest !== request) return;
      showResults(groups.slice(0, 8));
    } catch (error) {
      console.warn('[inline-search]', error);
      if (currentRequest === request) closeResults();
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      results.replaceChildren();
      closeResults();
      input.blur();
    } else if (event.key === 'ArrowDown' && !results.hidden) {
      event.preventDefault();
      results.querySelector('a')?.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-inline-search')) closeResults();
  });
});
