import { useState } from 'react';
import { useTodos } from '../hooks/useApi';

function TodoItem({ todo, onToggle, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(todo.id);
  };

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${
        todo.completed
          ? 'bg-slate-800/50 border-slate-700/50'
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onToggle(todo.id, todo.completed)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
          todo.completed
            ? 'bg-green-600 border-green-600'
            : 'border-slate-500 hover:border-green-500'
        }`}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`truncate ${todo.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
          {todo.title}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Added by {todo.created_by}
        </p>
      </div>

      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
        aria-label="Delete todo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function AddTodoForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAdding(true);
    const success = await onAdd(title.trim());
    if (success) {
      setTitle('');
    }
    setIsAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo..."
        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        disabled={isAdding}
      />
      <button
        type="submit"
        disabled={!title.trim() || isAdding}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {isAdding ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          'Add'
        )}
      </button>
    </form>
  );
}

export default function TodoList() {
  const { todos, loading, error, createTodo, toggleComplete, deleteTodo } = useTodos();
  const [showCompleted, setShowCompleted] = useState(false);

  const pendingTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Todo List</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Todo List</h2>
        </div>
        <div className="text-red-400 text-center py-8">
          Failed to load todos. Is the backend running?
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Todo List</h2>
        <span className="text-sm text-slate-400">
          {pendingTodos.length} pending
        </span>
      </div>

      <AddTodoForm onAdd={createTodo} />

      <div className="flex-1 overflow-y-auto mt-4 pr-2 -mr-2">
        {pendingTodos.length === 0 && completedTodos.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No todos yet</p>
            <p className="text-sm mt-1">Add one above or via Telegram!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {pendingTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleComplete}
                  onDelete={deleteTodo}
                />
              ))}
            </div>

            {completedTodos.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {completedTodos.length} completed
                </button>

                {showCompleted && (
                  <div className="space-y-2 mt-3">
                    {completedTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleComplete}
                        onDelete={deleteTodo}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
