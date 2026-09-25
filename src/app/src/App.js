import { useEffect, useState } from 'react';
import './App.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_URL = API_BASE_URL.endsWith('/todos') ? `${API_BASE_URL}/` : `${API_BASE_URL}/todos/`;

export function App() {
  const [todos, setTodos] = useState([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editDescription, setEditDescription] = useState('');

  const loadTodos = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Unable to load todos');
      }
      const data = await response.json();
      setTodos(Array.isArray(data) ? data : data.todos || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const updateTodo = async (todo, changes) => {
    if (!todo.id) {
      setError('This todo cannot be updated until it has been saved again');
      return;
    }

    try {
      const response = await fetch(`${API_URL}${todo.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update todo');
      }
      setTodos((currentTodos) => currentTodos.map((currentTodo) => (
        currentTodo.id === todo.id ? payload : currentTodo
      )));
      setError('');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const startEditing = (todo) => {
    setEditingTodoId(todo.id);
    setEditDescription(todo.description);
    setError('');
  };

  const saveEdit = async (event, todo) => {
    event.preventDefault();
    const trimmedDescription = editDescription.trim();
    if (!trimmedDescription) {
      setError('Please enter a todo description');
      return;
    }

    if (await updateTodo(todo, { description: trimmedDescription })) {
      setEditingTodoId(null);
      setEditDescription('');
    }
  };

  const deleteTodo = async (todo) => {
    if (!todo.id) {
      setError('This todo cannot be deleted until it has been saved again');
      return;
    }

    try {
      const response = await fetch(`${API_URL}${todo.id}/`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to delete todo');
      }
      setTodos((currentTodos) => currentTodos.filter((currentTodo) => currentTodo.id !== todo.id));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError('Please enter a todo description');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: trimmedDescription }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to create todo');
      }

      setDescription('');
      setError('');
      await loadTodos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <aside className="sidebar">
        <div className="brand-mark">✓</div>
        <p className="brand-name">Daylist</p>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#tasks"><span>□</span> My tasks</a>
          <a className="nav-item" href="#today"><span>◷</span> Today</a>
          <a className="nav-item" href="#completed"><span>✓</span> Completed</a>
        </nav>
        <div className="sidebar-note"><span className="sun">✦</span><p>Small steps.<br />Clear mind.</p></div>
        <p className="sidebar-footer">Made for getting things done</p>
      </aside>

      <main className="content" id="tasks">
        <header className="topbar">
          <div><p className="eyebrow">Tuesday, September 24</p><h1>Good morning, <em>Gordon.</em></h1></div>
          <div className="avatar" aria-label="Gordon">G</div>
        </header>

        <section className="overview" aria-label="Task overview">
          <div><p className="section-label">Your focus</p><h2>Make today count.</h2><p className="muted">You have {todos.length} {todos.length === 1 ? 'task' : 'tasks'} on your list.</p></div>
          <div className="progress-block"><div className="progress-label"><span>Daily progress</span><strong>{todos.length ? Math.round((todos.filter((todo) => todo.completed).length / todos.length) * 100) : 0}%</strong></div><div className="progress-track"><span style={{ width: `${todos.length ? (todos.filter((todo) => todo.completed).length / todos.length) * 100 : 0}%` }} /></div></div>
        </section>

        <section className="task-section">
          <div className="section-heading"><h2>My tasks</h2><span className="task-count">{todos.length} total</span></div>
          {todos.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">✦</span><h3>Your list is clear.</h3><p>Add a task below and give your day a little direction.</p></div>
          ) : (
            <ul className="task-list">
              {todos.map((todo, index) => {
                const todoKey = todo.id || `${todo.description}-${index}`;
                return <li className={`task-item${todo.completed ? ' completed' : ''}`} key={todoKey}>
                  <button className="check-button" type="button" aria-label={`Mark ${todo.description} as complete`} onClick={() => updateTodo(todo, { completed: !todo.completed })}>{todo.completed ? '✓' : ''}</button>
                  {editingTodoId === todo.id ? (
                    <form className="edit-form" onSubmit={(event) => saveEdit(event, todo)}>
                      <input aria-label={`Edit ${todo.description}`} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} autoFocus />
                      <button className="save-button" type="submit">Save</button>
                      <button className="cancel-button" type="button" onClick={() => setEditingTodoId(null)}>Cancel</button>
                    </form>
                  ) : <span className="task-description">{todo.description}</span>}
                  <span className="task-actions">
                    <button className="edit-button" type="button" aria-label={`Edit ${todo.description}`} onClick={() => startEditing(todo)}>✎</button>
                    <button className="delete-button" type="button" aria-label={`Delete ${todo.description}`} onClick={() => deleteTodo(todo)}>×</button>
                    <span className="task-dot" aria-hidden="true" />
                  </span>
                </li>;
              })}
            </ul>
          )}
        </section>

        <section className="add-section">
          <div className="section-heading"><h2>Add a task</h2><span className="plus-badge">+</span></div>
          <form className="add-form" onSubmit={handleSubmit}><label htmlFor="todo">What needs your attention?</label><div className="input-row"><input id="todo" type="text" placeholder="e.g. Plan tomorrow's priorities" value={description} onChange={(event) => setDescription(event.target.value)} /><button type="submit">Add task <span>↗</span></button></div>{error && <p className="error">{error}</p>}</form>
        </section>
      </main>
    </div>
  );
}

export default App;
