import React, { Suspense, useCallback } from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { DATABASE_NAME, WordSource, getRandomWords } from './words';

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export function WordSourceProvider({ children, fallback }: Props) {
  return (
    <Suspense fallback={fallback}>
      {/* The 25 MB word database is copied out of the bundle on first launch. */}
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        assetSource={{ assetId: require('../../assets/db/wordsearch.db') }}
        useSuspense
      >
        {children}
      </SQLiteProvider>
    </Suspense>
  );
}

export function useWordSource(): WordSource {
  const db = useSQLiteContext();
  return useCallback((language, count, min, max) => getRandomWords(db, language, count, min, max), [db]);
}
