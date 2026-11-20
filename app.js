// Адрес для загрузки пользователей (GET)
const USERS_URL = "https://jsonplaceholder.typicode.com/users";

// Адрес для загрузки публикаций (GET)
const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

// Элементы страницы
const loadBtn    = document.getElementById("loadBtn");    // кнопка загрузки
const statusEl   = document.getElementById("status");     // сообщения о загрузке/ошибках
const searchInput = document.getElementById("search");    // поле поиска по имени
const usersList  = document.getElementById("usersList");  // список пользователей

const postsArea   = document.getElementById("postsArea");   // блок публикаций
const postsTitle  = document.getElementById("postsTitle");  // заголовок блока
const postsStatus = document.getElementById("postsStatus"); // сообщения в блоке публикаций
const postsList   = document.getElementById("postsList");   // список публикаций

// Массив со всеми загруженными пользователями, храним его, чтобы фильтровать по имени без нового HTTP-запроса
let allUsers = [];

// Вспомогательные функции

// Функция показает сообщение в области состояния
// isError = true — красное (ошибка), иначе зеленое (успех)
function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "red" : "green";
}

// Функция отображает массив пользователей в списке
// Если массив пуст — показать сообщение "Пользователи не найдены"
function renderUsers(users) {
  usersList.textContent = "";                        // очищаем список

  if (users.length === 0) {
    // Отдельный <li> с сообщением
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Пользователи не найдены";
    usersList.appendChild(li);
    return;
  }

  // Для каждого пользователя создаём карточку
  users.forEach(function (user) {
    const li = document.createElement("li");

    // Имя пользователя
    const h3 = document.createElement("h3");
    h3.textContent = user.name;

    // Email
    const pEmail = document.createElement("p");
    pEmail.textContent = "Email: " + user.email;

    // Город (лежит во вложенном объекте address)
    const pCity = document.createElement("p");
    pCity.textContent = "Город: " + user.address.city;

    // Кнопка "Показать публикации"
    const btn = document.createElement("button");
    btn.textContent = "Показать публикации";
    // Обработчик клика: запомнит id и имя этого пользователя
    btn.addEventListener("click", function () {
      loadPosts(user.id, user.name);
    });

    // Собираем карточку
    li.appendChild(h3);
    li.appendChild(pEmail);
    li.appendChild(pCity);
    li.appendChild(btn);

    usersList.appendChild(li);
  });
}

// Загрузка пользователей (GET /users)
async function loadUsers() {
  showStatus("Загрузка...");
  loadBtn.disabled = true;          // блокируем кнопку на время запроса
  searchInput.disabled = true;      // поиск до загрузки недоступен
  usersList.textContent = "";       // очищаем старый список

  try {
    // Ждем ответ сервера
    const response = await fetch(USERS_URL);

    // fetch не считает 404/500 ошибкой — проверяем сами
    if (!response.ok) {
      throw new Error("Ошибка сервера: " + response.status);
    }

    // Читаем тело ответа как JSON
    allUsers = await response.json();

    if (allUsers.length === 0) {
      showStatus("Пользователей нет");
      return;
    }

    // Выводим пользователей на страницу
    renderUsers(allUsers);

    // Разрешаем поиск
    searchInput.disabled = false;

    showStatus("Загружено пользователей: " + allUsers.length);
  } catch (error) {
    // Сюда попадают и сетевые ошибки, и наша ошибка из response.ok
    showStatus("Не удалось загрузить пользователей: " + error.message, true);
  } finally {
    // Всегда снова включаем кнопку для повторной попытки
    loadBtn.disabled = false;
  }
}

// Запуск загрузки по клику
loadBtn.addEventListener("click", loadUsers);


// Поиск по имени (без нового запроса)
searchInput.addEventListener("input", function () {
  const query = searchInput.value.trim().toLowerCase();  // trim + нижний регистр

  // Пустой запрос — показать всех загруженных пользователей
  if (query === "") {
    renderUsers(allUsers);
    showStatus("Загружено пользователей: " + allUsers.length);
    return;
  }

  // Фильтруем уже загруженный массив, без fetch
  const filtered = allUsers.filter(function (user) {
    return user.name.toLowerCase().includes(query);
  });

  renderUsers(filtered);   // если пусто — покажет "Пользователи не найдены"

  if (filtered.length === 0) {
    showStatus("Пользователи не найдены", true);
  } else {
    showStatus("Найдено: " + filtered.length);
  }
});

// Публикации выбранного пользователя (GET /posts?userId=ID)
async function loadPosts(userId, userName) {
  // Показываем, чьи это публикации
  postsTitle.textContent = "Публикации пользователя: " + userName;

  // Сброс состояния блока
  postsStatus.textContent = "Загрузка...";
  postsStatus.style.color = "green";
  postsList.textContent = "";       // очищаем прошлые публикации

  try {
    // Формируем адрес: /posts?userId=ID
    const url = POSTS_URL + "?userId=" + userId;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Ошибка сервера: " + response.status);
    }

    const posts = await response.json();

    if (posts.length === 0) {
      postsStatus.textContent = "Публикаций нет";
      return;
    }

    // Берем первые три публикации
    const firstThree = posts.slice(0, 3);

    firstThree.forEach(function (post) {
      const li = document.createElement("li");

      const h4 = document.createElement("h4");
      h4.textContent = post.title;      // заголовок публикации

      const p = document.createElement("p");
      p.textContent = post.body;        // текст публикации

      li.appendChild(h4);
      li.appendChild(p);
      postsList.appendChild(li);
    });

    postsStatus.textContent = "Показано публикаций: " + firstThree.length;
  } catch (error) {
    postsStatus.textContent = "Не удалось загрузить публикации: " + error.message;
    postsStatus.style.color = "red";
  }
}