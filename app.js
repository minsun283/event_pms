const TODOS_PATH = "todos";

const addForm = document.getElementById("addForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const emptyMsg = document.getElementById("emptyMsg");
const errorMsg = document.getElementById("errorMsg");

const todosRef = db.ref(TODOS_PATH);

let todos = [];
let editingId = null;

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}

function render() {
  todoList.innerHTML = "";
  emptyMsg.classList.toggle("hidden", todos.length > 0);

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "check-btn" + (todo.done ? " checked" : "");
    checkBtn.setAttribute("aria-label", todo.done ? "완료 취소" : "완료");
    checkBtn.addEventListener("click", () => toggleDone(todo.id));

    const content = document.createElement("div");
    content.className = "todo-content";

    if (editingId === todo.id) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "todo-edit-input";
      editInput.value = todo.text;
      editInput.maxLength = 120;

      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finishEdit(todo.id, editInput.value);
        if (e.key === "Escape") cancelEdit();
      });
      editInput.addEventListener("blur", () => finishEdit(todo.id, editInput.value));

      content.appendChild(editInput);
      li.appendChild(checkBtn);
      li.appendChild(content);
      todoList.appendChild(li);
      editInput.focus();
      editInput.select();
      return;
    }

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text" + (todo.done ? " done" : "");
    textSpan.textContent = todo.text;
    textSpan.title = "더블클릭하여 수정";
    textSpan.addEventListener("dblclick", () => startEdit(todo.id));

    content.appendChild(textSpan);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.textContent = "✎";
    editBtn.setAttribute("aria-label", "수정");
    editBtn.addEventListener("click", () => startEdit(todo.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "삭제");
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkBtn);
    li.appendChild(content);
    li.appendChild(actions);
    todoList.appendChild(li);
  });
}

function isDuplicate(text) {
  const trimmed = text.trim();
  return todos.some((todo) => todo.text.trim() === trimmed);
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve();

  if (isDuplicate(trimmed)) {
    showError("이미 추가된 내용입니다");
    return Promise.reject(new Error("DUPLICATE"));
  }

  return todosRef.push({
    text: trimmed,
    done: false,
    createdAt: Date.now(),
  });
}

function startEdit(id) {
  editingId = id;
  render();
}

function cancelEdit() {
  editingId = null;
  render();
}

function finishEdit(id, newText) {
  const trimmed = newText.trim();
  editingId = null;

  if (!trimmed) {
    return todosRef.child(id).remove().catch((error) => showError(getErrorMessage(error)));
  }

  return todosRef.child(id).update({ text: trimmed }).catch((error) => showError(getErrorMessage(error)));
}

function toggleDone(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  todosRef.child(id).update({ done: !todo.done }).catch((error) => showError(getErrorMessage(error)));
}

function deleteTodo(id) {
  const li = todoList.querySelector(`[data-id="${id}"]`);
  const removeFromDb = () => todosRef.child(id).remove().catch((error) => showError(getErrorMessage(error)));

  if (li) {
    li.classList.add("removing");
    li.addEventListener("animationend", removeFromDb, { once: true });
  } else {
    removeFromDb();
  }
}

function getErrorMessage(error) {
  if (error.code === "PERMISSION_DENIED") {
    return "Firebase 권한이 없습니다. Realtime Database 규칙을 확인해주세요.";
  }
  return "저장에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hideError();

  addTodo(todoInput.value)
    .then(() => {
      todoInput.value = "";
      todoInput.focus();
    })
    .catch((error) => {
      if (error.message === "DUPLICATE") return;
      console.error("할 일 추가 오류:", error);
      showError(getErrorMessage(error));
    });
});

todosRef.on(
  "value",
  (snapshot) => {
    hideError();
    const data = snapshot.val();

    if (!data) {
      todos = [];
    } else {
      todos = Object.entries(data)
        .map(([id, todo]) => ({
          id,
          text: todo.text ?? "",
          done: Boolean(todo.done),
          createdAt: todo.createdAt ?? 0,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    render();
  },
  (error) => {
    console.error("Realtime Database 연결 오류:", error);
    showError(getErrorMessage(error));
    emptyMsg.textContent = "데이터를 불러오지 못했습니다.";
    emptyMsg.classList.remove("hidden");
  }
);
