import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { queryClient, queryPersister, QUERY_PERSIST_BUSTER } from '../../lib/queryClient';
import { shouldPersistQueryKey } from '../../lib/idbPersister';
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext';
import { ExperienceModeProvider } from '../../contexts/ExperienceModeContext';
import { TooltipProvider } from '../ui/tooltip';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: queryPersister,
      buster: QUERY_PERSIST_BUSTER,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          shouldPersistQueryKey(query.queryKey) && defaultShouldDehydrateQuery(query),
      },
    }}
  >
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NuqsAdapter>
        <UserPreferencesProvider>
          <ExperienceModeProvider>
            <TooltipProvider delayDuration={200}>
              {children}
            </TooltipProvider>
          </ExperienceModeProvider>
        </UserPreferencesProvider>
      </NuqsAdapter>
    </BrowserRouter>
  </PersistQueryClientProvider>
);
