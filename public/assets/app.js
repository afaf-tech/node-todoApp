const form = document.querySelector('#todo-form');
const input = document.querySelector('#item');
const submitButton = form.querySelector('button[type="submit"]');
const list = document.querySelector('#todo-list');
const template = document.querySelector('#todo-template');
const emptyState = document.querySelector('#empty');
const emptyTitle = document.querySelector('#empty-title');
const emptyCopy = document.querySelector('#empty-copy');
const filters = document.querySelector('.filters');
const filterButtons = [...document.querySelectorAll('.filter')];
const countElements = new Map(
  [...document.querySelectorAll('[data-count]')].map((element) => [
    element.dataset.count,
    element,
  ]),
);
const clearButton = document.querySelector('#clear-completed');
const card = document.querySelector('.card');
const progressFill = document.querySelector('#progress-fill');
const progressTrack = document.querySelector('#progress-track');
const progressLabel = document.querySelector('#progress-label');
const progressPercent = document.querySelector('#progress-percent');
const toast = document.querySelector('#toast');
const todayDate = document.querySelector('#today-date');
const themeToggle = document.querySelector('#theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');

const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

let currentFilter = 'all';
let toastTimer;

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('is-visible');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3200);
}

function updateEmptyState() {
  const hasVisibleItems = [...list.children].some((item) => !item.hidden);

  emptyState.hidden = hasVisibleItems;

  if (hasVisibleItems) {
    return;
  }

  if (currentFilter === 'active') {
    emptyTitle.textContent = 'Nothing left to do';
    emptyCopy.textContent =
      'You are all caught up. Add a new task when you are ready.';
  } else if (currentFilter === 'completed') {
    emptyTitle.textContent = 'No completed tasks yet';
    emptyCopy.textContent = 'Check off a task and it will show up here.';
  } else {
    emptyTitle.textContent = 'Your list is clear';
    emptyCopy.textContent = 'Add your first task above to get started.';
  }
}

function applyFilter() {
  for (const item of list.children) {
    const isDone = item.classList.contains('is-done');
    const matches =
      currentFilter === 'all' ||
      (currentFilter === 'active' && !isDone) ||
      (currentFilter === 'completed' && isDone);

    item.hidden = !matches;
  }

  updateEmptyState();
}

function updateSummary() {
  const items = [...list.children];
  const total = items.length;
  const done = items.filter((item) =>
    item.classList.contains('is-done'),
  ).length;
  const active = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  countElements.get('all').textContent = total;
  countElements.get('active').textContent = active;
  countElements.get('completed').textContent = done;

  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute('aria-valuenow', String(percent));
  progressPercent.textContent = `${percent}%`;

  if (total === 0) {
    progressLabel.textContent = 'No tasks yet';
  } else if (done === total) {
    progressLabel.textContent = 'All done. Nice work!';
  } else {
    progressLabel.textContent = `${done} of ${total} done`;
  }

  card.classList.toggle('all-done', total > 0 && done === total);
  clearButton.hidden = done === 0;

  applyFilter();
}

function setFilter(filter) {
  currentFilter = filter;

  for (const button of filterButtons) {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  }

  updateSummary();
}

function setItemLabels(item, text) {
  item
    .querySelector('.toggle')
    .setAttribute(
      'aria-label',
      `Mark ${text} as ${item.classList.contains('is-done') ? 'not done' : 'done'}`,
    );
  item.querySelector('.edit').setAttribute('aria-label', `Edit ${text}`);
  item.querySelector('.delete').setAttribute('aria-label', `Delete ${text}`);
}

function createTodoElement(todo) {
  const item = template.content.firstElementChild.cloneNode(true);

  item.dataset.id = todo.id;
  item.classList.toggle('is-done', todo.completed);

  const checkbox = item.querySelector('.toggle');
  checkbox.checked = todo.completed;

  item.querySelector('.todo-text').textContent = todo.item;
  setItemLabels(item, todo.item);

  return item;
}

async function toggleTodo(item, completed) {
  const checkbox = item.querySelector('.toggle');

  item.classList.toggle('is-done', completed);
  checkbox.checked = completed;
  setItemLabels(item, item.querySelector('.todo-text').textContent);
  updateSummary();

  try {
    const response = await fetch(`/api/todos/${item.dataset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      throw new Error('Could not update that task.');
    }
  } catch (error) {
    item.classList.toggle('is-done', !completed);
    checkbox.checked = !completed;
    setItemLabels(item, item.querySelector('.todo-text').textContent);
    updateSummary();
    showToast(error.message, 'error');
  }
}

async function deleteTodo(item) {
  const deleteButton = item.querySelector('.delete');
  deleteButton.disabled = true;

  try {
    const response = await fetch(`/api/todos/${item.dataset.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Could not delete that task.');
    }

    item.classList.add('is-removing');
    await new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : 180));
    item.remove();
    updateSummary();
    showToast('Task deleted');
  } catch (error) {
    deleteButton.disabled = false;
    item.classList.remove('is-removing');
    showToast(error.message, 'error');
  }
}

async function clearCompleted() {
  clearButton.disabled = true;

  try {
    const response = await fetch('/api/todos/completed', { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? 'Could not clear completed tasks.');
    }

    const completedItems = [...list.children].filter((item) =>
      item.classList.contains('is-done'),
    );
    completedItems.forEach((item) => item.remove());
    updateSummary();

    const count = data.deleted ?? completedItems.length;
    showToast(
      count === 1
        ? '1 completed task cleared'
        : `${count} completed tasks cleared`,
    );
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    clearButton.disabled = false;
  }
}

function startEditing(item) {
  if (item.querySelector('.edit-input')) {
    return;
  }

  const text = item.querySelector('.todo-text');
  const original = text.textContent;
  const editor = document.createElement('input');

  editor.type = 'text';
  editor.className = 'edit-input';
  editor.value = original;
  editor.maxLength = 200;
  editor.setAttribute('aria-label', 'Edit task');

  text.replaceWith(editor);
  editor.focus();
  editor.select();

  let done = false;
  let saving = false;

  function finish(value) {
    if (done) {
      return;
    }

    done = true;

    if (value !== undefined) {
      text.textContent = value;
      setItemLabels(item, value);
    }

    editor.replaceWith(text);
  }

  async function save() {
    if (done || saving) {
      return;
    }

    const value = editor.value.trim();

    if (!value || value === original) {
      finish();
      return;
    }

    saving = true;
    editor.disabled = true;

    try {
      const response = await fetch(`/api/todos/${item.dataset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: value }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not save changes.');
      }

      finish(value);
      showToast('Task updated');
    } catch (error) {
      done = true;
      editor.replaceWith(text);
      showToast(error.message, 'error');
    } finally {
      saving = false;
    }
  }

  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      finish();
    }
  });

  editor.addEventListener('blur', () => {
    if (!done) {
      save();
    }
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const value = input.value.trim();

  if (!value) {
    input.focus();
    return;
  }

  submitButton.disabled = true;

  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: value }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? 'Could not add that task.');
    }

    const item = createTodoElement(data.todo);
    item.classList.add('is-new');
    item.addEventListener(
      'animationend',
      () => item.classList.remove('is-new'),
      { once: true },
    );

    list.prepend(item);
    form.reset();

    if (currentFilter === 'completed') {
      setFilter('all');
    } else {
      updateSummary();
    }

    input.focus();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

list.addEventListener('change', (event) => {
  const checkbox = event.target.closest('.toggle');

  if (checkbox) {
    toggleTodo(checkbox.closest('.todo'), checkbox.checked);
  }
});

list.addEventListener('click', (event) => {
  const editButton = event.target.closest('.edit');

  if (editButton) {
    startEditing(editButton.closest('.todo'));
    return;
  }

  const deleteButton = event.target.closest('.delete');

  if (deleteButton) {
    deleteTodo(deleteButton.closest('.todo'));
  }
});

list.addEventListener('dblclick', (event) => {
  const text = event.target.closest('.todo-text');

  if (text) {
    startEditing(text.closest('.todo'));
  }
});

filters.addEventListener('click', (event) => {
  const button = event.target.closest('.filter');

  if (button) {
    setFilter(button.dataset.filter);
  }
});

clearButton.addEventListener('click', clearCompleted);

themeToggle.addEventListener('click', () => {
  const next =
    document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';

  document.documentElement.dataset.theme = next;

  try {
    localStorage.setItem('todo-theme', next);
  } catch {
    // Ignore private-mode/storage failures.
  }

  syncThemeButton();
});

function syncThemeButton() {
  const theme =
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const next = theme === 'dark' ? 'light' : 'dark';

  themeToggle.setAttribute('aria-label', `Switch to ${next} theme`);
  themeToggle.title = `Switch to ${next} theme`;

  if (themeColor) {
    themeColor.content = theme === 'light' ? '#f3f5fb' : '#0b0f17';
  }
}

document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement;
  const isTyping =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement;

  if (event.key === '/' && !isTyping) {
    event.preventDefault();
    input.focus();
    input.select();
  }

  if (event.key === 'Escape' && activeElement === input) {
    input.value = '';
    input.blur();
  }
});

todayDate.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date());

syncThemeButton();
updateSummary();
