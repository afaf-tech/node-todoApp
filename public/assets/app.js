const form = document.querySelector('#todo-form');
const input = document.querySelector('#item');
const submitButton = form.querySelector('button[type="submit"]');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty');
const statusMessage = document.querySelector('#status');
const count = document.querySelector('#count');

let statusTimer;

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', isError);

  clearTimeout(statusTimer);

  if (message) {
    statusTimer = setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.classList.remove('is-error');
    }, 4000);
  }
}

function updateSummary() {
  const total = list.children.length;
  count.textContent = total === 1 ? '1 item' : `${total} items`;
  emptyState.hidden = total > 0;
}

function createTodoElement(todo) {
  const item = document.createElement('li');
  item.className = todo.completed ? 'todo is-done' : 'todo';
  item.dataset.id = todo.id;

  const label = document.createElement('label');
  label.className = 'todo-label';

  const checkbox = document.createElement('input');
  checkbox.className = 'toggle';
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.item;

  label.append(checkbox, text);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', `Delete ${todo.item}`);
  deleteButton.textContent = '\u00d7';

  item.append(label, deleteButton);
  return item;
}

async function toggleTodo(item, completed) {
  item.classList.toggle('is-done', completed);

  try {
    const response = await fetch(`/api/todos/${item.dataset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      throw new Error('Could not update that item.');
    }
  } catch (error) {
    item.classList.toggle('is-done', !completed);
    item.querySelector('.toggle').checked = !completed;
    setStatus(error.message, true);
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
      throw new Error('Could not delete that item.');
    }

    item.remove();
    updateSummary();
  } catch (error) {
    deleteButton.disabled = false;
    setStatus(error.message, true);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  submitButton.disabled = true;

  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: text }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? 'Could not add that item.');
    }

    list.prepend(createTodoElement(data.todo));
    form.reset();
    updateSummary();
    setStatus('');
    input.focus();
  } catch (error) {
    setStatus(error.message, true);
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
  const deleteButton = event.target.closest('.delete');

  if (deleteButton) {
    deleteTodo(deleteButton.closest('.todo'));
  }
});

updateSummary();
