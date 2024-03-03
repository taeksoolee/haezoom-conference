import express from 'express';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';

import { writeFileSync, readFileSync } from 'fs';

const app = express();

/**
 * 
 * @returns {Record<string, {
 *  title: string,
 *  description: string,
 *  state: 'P' | 'C' | 'D',
 *  createdAt?: string,
 *  modifiedAt?: string,
 * }>}
 */
const todos = () => {
  const save = (d) => {
    const str = JSON.stringify(d);
    writeFileSync('./data/todos.json', str);
    return str;
  };

  const read = () => {
    const str = readFileSync('./data/todos.json', 'utf8') || (() => save({}))();
    return str;
  }

  const newTodos = read();

  return new Proxy(JSON.parse(newTodos), {
    get(target, p) {
      return target[p];
    },
    set(target, p, newValue) {
      if (newValue === null) {
        delete target[p];
      } else {
        target[p] = newValue;
      }
      save(target);
      return true;
    },
  });
}

const todoApp = {
  _todos: todos(),
  _withState(item, state) {
    return {
      ...item,
      state,
    };
  },
  _withCreatedAt(item) {
    return {
      ...item,
      createdAt: new Date().toString(),
    };
  },
  _withModifiedAt(item) {
    return {
      ...item,
      modifiedAt: new Date().toString(),
    };
  },
  get(id) {
    return {
      id,
      ...this._todos[id],
    };
  },
  add(item) {
    this._todos[uuidv4()] = this._withState(this._withModifiedAt(this._withCreatedAt(item)), 'P');
  },
  set(id, item) {
    const oldItem = this._todos[id];

    if (!oldItem) return false;
    this._todos[id] = this._withState(this._withModifiedAt({
      ...oldItem,
      ...item
    }));

    return true;
  },
  remove(id) {
    const oldItem = this._todos[id];
    if (!oldItem) return false;

    this._todos[id] = null;
    return true;
  },
  processTodo(id) {
    const oldValue = this._todos[id];
    if (!oldValue) return false;

    this._todos[id] = this._withState(this._withModifiedAt(this._todos[id]), 'P');
    return true;
  },
  doneTodo(id) {
    const oldValue = this._todos[id];
    if (!oldValue) return false;

    this._todos[id] = this._withState(this._withModifiedAt(this._todos[id]), 'D');
    return true;
  },
  cancelTodo(id) {
    const oldValue = this._todos[id];
    if (!oldValue) return false;

    this._todos[id] = this._withState(this._withModifiedAt(this._todos[id]), 'C');
    return true;
  },
  clear() {
    this._todos = todos();
  },
  list() {
    return Object.entries(this._todos).map(e => ({
      id: e[0],
      ...e[1],
    }));
  }
}

app.set('view engine', 'html');
nunjucks.configure('./templates', {
  autoescape: true,
  express: app,
  watch: true
});

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get('/', (req, res) => {
  const page = req.query['page'] || '/todo-list';
  res.render('index', { page });
});
app.get('/todo-list', (req, res) => {
  res.render('todo-list', {
    todos: todoApp.list(),
  });
});

app.get('/add-todo', (req, res) => {
  res.render('add-todo');
});

app.post('/add-todo', (req, res) => {
  todoApp.add({
    ...req.body
  });

  res.render('todo-list', {
    todos: todoApp.list(),
  });
});

app.get('/modify-todo/:id', (req, res) => {
  const id = req.params['id'];
  const todo = todoApp.get(id);

  if (!todo) {
    res.render('404');
    return;
  }

  res.render('modify-todo', { todo });
});

app.put('/modify-todo/:id', (req, res) => {
  const id = req.params['id'];
  const result = todoApp.set(id, req.body);

  if (!result) {
    res.render('404');
    return;
  }

  res.render('todo-list', {
    todos: todoApp.list(),
  });
});

app.delete('/delete-todo/:id', (req, res) => {
  const id = req.params['id'];
  const result = todoApp.remove(id);

  if (!result) {
    res.render('404');
    return;
  }

  res.render('todo-list', {
    todos: todoApp.list(),
  });
});

app.patch('/todo-state/:id/:state', (req, res) => {
  const id = req.params['id'];
  const state = req.params['state'];

  if (!id && !state) {
    res.render('404');
    return;
  }

  const changeState = (() => ({
    'P': todoApp.processTodo.bind(todoApp),
    'D': todoApp.doneTodo.bind(todoApp),
    'C': todoApp.cancelTodo.bind(todoApp),
  })[state])();

  if (typeof changeState !== 'function') {
    res.render('404');
    return;
  }

  const result = changeState(id)
  if (!result) {
    res.render('404');
    return;
  }

  res.render('todo-list', {
    todos: todoApp.list(),
  });
})

/**
 * 
 */
app.get('/snipet/todo-form', (req, res) => {
  const {
    title, description,
  } = req.query;

  res.render('snipet/todo-form', {
    title, description,
  });
});

app.get('/snipet/todo-item/:id', (req, res) => {
  const id = req.params['id'];
  const todo = todoApp.get(id);

  if (!todo) {
    res.render('404');
    return;
  }

  res.render('snipet/todo-item', {
    todo,
  });
});

app.get('/snipet/todo-state/:id', (req, res) => {
  const id = req.params['id'];
  const todo = todoApp.get(id);

  if (!todo) {
    res.render('404');
    return;
  }

  res.render('snipet/todo-state', {
    todo,
    processChecked: todo.state === 'P' ? 'checked' : '',
    doneChecked: todo.state === 'D' ? 'checked' : '',
    cancelChecked: todo.state === 'C' ? 'checked' : '',
  });
});

/**
 * 
 */
app.get('/*', (req, res) => {
  res.redirect(`/?${Object.entries(req.query).map(e => `${e[0]}=${e[1]}`).join('&')}`);
});

app.listen(4000);