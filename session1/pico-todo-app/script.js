const mode = new URLSearchParams(window.location.search).get('theme') ?? 'light';
const html = document.querySelector('html');
mode === 'light' ? html.setAttribute('data-theme', 'light') : html.setAttribute('data-theme', 'dark');

const store = (function TodoStore() {
  const id = '__todos__';

  function check() {
    let data = localStorage.getItem(id) ?? '[]';

    try {
      JSON.parse(data);
    } catch (err) {
      data = '{}';
    } finally {
      localStorage.setItem(id, data);
    }
  }
  
  check();
  return {
    get data() {
      check();
      return JSON.parse(localStorage.getItem(id)).toSorted((a, b) => a.id - b.id);
    },
    setData(data) {
      localStorage.setItem(id, JSON.stringify(data));
    },
    add(todo) {
      const oldData = this.data;
      const newData = [
        todo,
        ...oldData,
      ];

      this.setData(newData);
    },
    set(id, todo) {
      const oldData = this.data;
      this.setData(oldData.map(e => {
        if (e.id !== id) return e;

        return {
          ...e,
          ...todo,
        };
      }));
    },
    remove(id) {
      const oldData = this.data;
      this.setData(oldData.filter(e => e.id !== id));
    }
  }
})();


function Todo({
  id,
  checked,
  title,
}) {
  const $el = document.createElement('div');
  $el.setAttribute('role', 'group');
  $el.id = `todo__${id ?? Date.now()}`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checked && checkbox.setAttribute('checked', 'true');
  const checkboxWrapper = document.createElement('label');
  checkboxWrapper.appendChild(checkbox);
  $el.appendChild(checkboxWrapper);

  const input = document.createElement('input');
  input.placeholder = "해야할 일을 입력하세요.";
  input.value = title ?? '';
  $el.appendChild(input);

  const delBtn = document.createElement('button');
  const icon = document.createElement('i');
  icon.classList.add('fa-solid', 'fa-xmark');
  delBtn.appendChild(icon);
  $el.appendChild(delBtn);

  return {
    $el,
    _container: null,
    _delBtnHandler() {
      this.remove();
      store.remove(id);
    },
    _checkboxHandler(e) {
      store.set(id, {
        checked: !checked,
      });
    },
    _changeInputHandler(e) {
      store.set(id, {
        title: e.target.value,
      });
    },
    attachTo(container) {
      // container.appendChild($el);
      container.insertAdjacentElement('afterbegin', $el);
      this._container = container;

      input.addEventListener('input', this._changeInputHandler.bind(this));
      checkbox.addEventListener('change', this._checkboxHandler.bind(this));
      delBtn.addEventListener('click', this._delBtnHandler.bind(this));
      return this;
    },
    dettach() {
      const container = this._container;
      if (!container) {
        console.warn('before attach');
        return;
      }

      container.removeChild($el);
      return this;
    },
    remove() {
      this.dettach();
      input.removeEventListener('input', this._changeInputHandler.bind(this));
      checkbox.removeEventListener('change', this._checkboxHandler.bind(this));
      delBtn.removeEventListener('click', this._delBtnHandler.bind(this));
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const a = document.getElementById('theme');

  if (mode === 'light') {
    a.innerHTML = `<i class="fa-regular fa-moon"></i>`;
    a.setAttribute('href', './?theme=dark');
  } else if (mode === 'dark') {
    a.innerHTML = `<i class="fa-regular fa-sun"></i>`;
    a.setAttribute('href', './?theme=light');
  }

  const addBtn = document.getElementById('addBtn');
  const todoList = document.getElementById('todoList');

  store.data.forEach(todo => {
    Todo(todo).attachTo(todoList);
  });

  addBtn.addEventListener('click', () => {
    const newTodo = {
      id: Date.now(),
      checked: false,
      title: '',
    };

    store.add(newTodo);
    Todo(newTodo).attachTo(todoList);
  });
});



