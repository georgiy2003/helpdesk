
import './style.css';

const API_URL = 'http://localhost:7070/?method=';

const ticketsElement = document.querySelector('#tickets');
const addTicketButton = document.querySelector('#add-ticket');
const modal = document.querySelector('#modal');
const modalTitle = document.querySelector('#modal-title');
const ticketForm = document.querySelector('#ticket-form');
const cancelModalButton = document.querySelector('#cancel-modal');
const nameInput = document.querySelector('#ticket-name');
const descriptionInput = document.querySelector('#ticket-description');

let tickets = [];
let editingTicketId = null;

async function request(method, options = {}) {
  const response = await fetch(`${API_URL}${method}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadTickets() {
  ticketsElement.innerHTML = '<p class="loading">Загрузка заявок...</p>';

  try {
    tickets = await request('allTickets');
    renderTickets();
  } catch (error) {
    console.error(error);
    ticketsElement.innerHTML =
      '<p class="empty">Не удалось загрузить заявки. Проверьте работу сервера.</p>';
  }
}

function renderTickets() {
  ticketsElement.innerHTML = '';

  if (tickets.length === 0) {
    ticketsElement.innerHTML = '<p class="empty">Заявок пока нет</p>';
    return;
  }

  tickets.forEach((ticket) => {
    const ticketElement = document.createElement('article');
    ticketElement.className = `ticket ${ticket.status ? 'completed' : ''}`;

    const info = document.createElement('div');
    info.className = 'ticket-info';

    const name = document.createElement('h3');
    name.className = 'ticket-name';
    name.textContent = ticket.name;

    const date = document.createElement('span');
    date.className = 'ticket-date';
    date.textContent = new Date(ticket.created).toLocaleString('ru-RU');

    info.append(name, date);

    const actions = document.createElement('div');
    actions.className = 'ticket-actions';

    const statusButton = document.createElement('button');
    statusButton.textContent = ticket.status ? '✓' : '○';
    statusButton.title = 'Изменить статус';

    statusButton.addEventListener('click', async () => {
      await updateTicket(ticket.id, {
        ...ticket,
        status: !ticket.status,
      });
    });

    const editButton = document.createElement('button');
    editButton.textContent = '✎';
    editButton.title = 'Редактировать';

    editButton.addEventListener('click', () => openEditModal(ticket));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '×';
    deleteButton.title = 'Удалить';

    deleteButton.addEventListener('click', () => deleteTicket(ticket.id));

    info.addEventListener('click', () => showDetails(ticket.id));

    actions.append(statusButton, editButton, deleteButton);
    ticketElement.append(info, actions);
    ticketsElement.append(ticketElement);
  });
}

function openCreateModal() {
  editingTicketId = null;
  modalTitle.textContent = 'Добавить тикет';
  ticketForm.reset();
  modal.classList.remove('hidden');
  nameInput.focus();
}

function openEditModal(ticket) {
  editingTicketId = ticket.id;
  modalTitle.textContent = 'Изменить тикет';
  nameInput.value = ticket.name;
  descriptionInput.value = ticket.description || '';
  modal.classList.remove('hidden');
  nameInput.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  ticketForm.reset();
  editingTicketId = null;
}

addTicketButton.addEventListener('click', openCreateModal);
cancelModalButton.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

ticketForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = {
    id: editingTicketId,
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: editingTicketId
      ? Boolean(tickets.find((ticket) => ticket.id === editingTicketId)?.status)
      : false,
  };

  if (!data.name) return;

  try {
    if (editingTicketId) {
      await request(`updateById&id=${editingTicketId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } else {
      await request('createTicket', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    closeModal();
    await loadTickets();
  } catch (error) {
    console.error(error);
    alert('Не удалось сохранить заявку.');
  }
});

async function updateTicket(id, data) {
  try {
    const details = await request(`ticketById&id=${id}`);

    await request(`updateById&id=${id}`, {
      method: 'POST',
      body: JSON.stringify({
        ...details,
        ...data,
        id,
      }),
    });

    await loadTickets();
  } catch (error) {
    console.error(error);
    alert('Не удалось обновить заявку.');
  }
}

async function deleteTicket(id) {
  if (!confirm('Вы действительно хотите удалить эту заявку?')) return;

  try {
    await request(`deleteById&id=${id}`);
    await loadTickets();
  } catch (error) {
    console.error(error);
    alert('Не удалось удалить заявку.');
  }
}

async function showDetails(id) {
  try {
    const ticket = await request(`ticketById&id=${id}`);

    alert(
      `${ticket.name}\n\n${ticket.description || 'Описание отсутствует'}`
    );
  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить описание заявки.');
  }
}

loadTickets();
