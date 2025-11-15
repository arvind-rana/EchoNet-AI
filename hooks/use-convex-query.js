import { useQuery, useMutation } from "convex/react";
//useConvexQuery – wraps useQuery from Convex to manage loading, error, and data states more explicitly.
//useConvexMutation – wraps useMutation from Convex for mutations, handling loading, errors, and toast notifications.


import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query, ...args) => {
  const result = useQuery(query, ...args);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use effect to handle the state changes based on the query result
  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
  };
};

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
};
// React Hooks / useEffect

// Why do we need useEffect here?
// Answer: To update local state (data, isLoading, error) whenever useQuery result changes.

// Convex API

// What are useQuery and useMutation?
// Answer: useQuery fetches live data from Convex backend, useMutation performs server-side updates.

// Error handling

// How are errors handled in queries/mutations?
// Answer: Caught in try/catch, stored in error state, and displayed using toast.error().

// State Management

// Why maintain local data, isLoading, error instead of using result directly?
// Answer: Provides a unified API and allows more control over loading/error states, especially if you need side effects.

// Async / await

// How does mutate ensure isLoading and error are correctly updated during async operation?
// Answer: We set isLoading = true at start, reset error, then finally set isLoading = false in finally.

// Custom Hook Design

// Why create a custom wrapper instead of using Convex hooks directly?
// Answer: For consistency, error handling, toast notifications, and easier reusability across components.