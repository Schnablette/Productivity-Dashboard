import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

/**
 * Custom hook for fetching data with auto-refresh
 */
export function useApiData(endpoint, refreshInterval = 60000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();

    // Set up auto-refresh
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for todos with CRUD operations
 */
export function useTodos() {
  const { data: todos, loading, error, refetch } = useApiData('/todos');

  const createTodo = async (title) => {
    try {
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, created_by: 'web' }),
      });
      if (!response.ok) throw new Error('Failed to create todo');
      refetch();
      return true;
    } catch (err) {
      console.error('Error creating todo:', err);
      return false;
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update todo');
      refetch();
      return true;
    } catch (err) {
      console.error('Error updating todo:', err);
      return false;
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      refetch();
      return true;
    } catch (err) {
      console.error('Error deleting todo:', err);
      return false;
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    return updateTodo(id, { completed: !currentStatus });
  };

  return {
    todos: todos || [],
    loading,
    error,
    refetch,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
  };
}

/**
 * Hook for calendar events
 */
export function useCalendarEvents() {
  const { data, loading, error, refetch } = useApiData('/calendar/events');

  return {
    events: data?.events || [],
    calendarConnected: data?.calendar_connected ?? false,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for today's calendar events
 */
export function useTodayEvents() {
  const { data, loading, error, refetch } = useApiData('/calendar/today');

  return {
    events: data?.events || [],
    calendarConnected: data?.calendar_connected ?? false,
    loading,
    error,
    refetch,
  };
}
