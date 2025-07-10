import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, User } from '@/types';
import { eventsApi } from '@/services/api';
import { fetchGoogleCalendarEvents, analyzeEvent } from '@/utils/calendar';

export function useCalendar(user: User | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      console.log('No user available for fetchEvents');
      return;
    }
    
    try {
      console.log('Fetching events for user:', user.id);
      setLoading(true);
      setError(null);
      const data = await eventsApi.getByUserId(user.id);
      console.log('Fetched events from API:', data.length);
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const syncCalendar = useCallback(async (accessToken: string) => {
    if (!user) {
      console.log('No user available for syncCalendar');
      return;
    }
    
    try {
      setSyncing(true);
      setError(null);
      
      console.log('Starting calendar sync for user:', user.id);
      console.log('Access token available:', !!accessToken);
      console.log('Access token length:', accessToken?.length);
      
      // Fetch events from Google Calendar
      const rawEvents = await fetchGoogleCalendarEvents(accessToken);
      console.log('Fetched events from Google Calendar:', rawEvents.length);
      
      if (rawEvents.length === 0) {
        console.log('No events returned from Google Calendar API');
        setSyncing(false);
        return;
      }
      
      // Process and analyze events with spending prediction
      const analyzed = rawEvents.map((event: any) => {
        const analysis = analyzeEvent(event);
        return {
          id: event.id,
          title: event.summary || "Untitled Event",
          description: event.description || "",
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          category: analysis.category,
          spendingProbability: analysis.spendingProbability,
          expectedSpendingRange: analysis.expectedSpendingRange,
          spendingCategories: analysis.spendingCategories,
          confidence: analysis.confidence,
          keywords: analysis.keywords,
          raw: event,
        };
      });

      console.log('Analyzed events:', analyzed.length);
      console.log('Sample analyzed event:', analyzed[0]);

      // Sync with backend
      console.log('Syncing events to backend...');
      const syncResult = await eventsApi.sync(user, analyzed);
      console.log('Sync result:', syncResult);
      
      // Fetch updated events
      console.log('Fetching updated events...');
      await fetchEvents();
      console.log('Calendar sync completed successfully');
    } catch (err) {
      console.error('Calendar sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  }, [user, fetchEvents]);

  useEffect(() => {
    console.log('useCalendar useEffect triggered, user:', user?.id);
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    syncing,
    fetchEvents,
    syncCalendar,
  };
} 