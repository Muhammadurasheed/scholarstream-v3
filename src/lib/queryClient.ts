import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,        // Data fresh for 5 minutes
            gcTime: 30 * 60 * 1000,          // Keep in cache for 30 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,     // Don't refetch on tab switch
            refetchOnMount: false,           // Don't refetch if data exists
            retry: 1,                        // Only retry once

            // Use cached data while fetching fresh
            // placeholderData: (previousData: any) => previousData, // This is now handled per-query or via keepPreviousData
        },
    },
});
