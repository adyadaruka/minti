"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCalendar } from '@/hooks/useCalendar';

export default function DebugPage() {
  const { user, getAccessToken } = useAuth();
  const { events, syncing, error, syncCalendar } = useCalendar(user);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name
      } : null,
      accessToken: getAccessToken() ? 'Available' : 'Not available',
      accessTokenLength: getAccessToken()?.length || 0,
      eventsCount: events.length,
      syncing,
      error,
      localStorage: {
        google_id_token: typeof window !== 'undefined' ? !!localStorage.getItem('google_id_token') : false,
        google_access_token: typeof window !== 'undefined' ? !!localStorage.getItem('google_access_token') : false,
      }
    };
    setDebugInfo(info);
  }, [user, events, syncing, error, getAccessToken]);

  const handleTestSync = async () => {
    const accessToken = getAccessToken();
    if (accessToken) {
      console.log('Testing calendar sync...');
      try {
        await syncCalendar(accessToken);
        console.log('Test sync completed');
      } catch (error) {
        console.error('Test sync failed:', error);
      }
    } else {
      console.error('No access token available');
    }
  };

  const handleTestGoogleAPI = async () => {
    const accessToken = getAccessToken();
    if (accessToken) {
      console.log('Testing Google Calendar API directly...');
      try {
        const response = await fetch(`/api/test-calendar?access_token=${accessToken}`);
        const result = await response.json();
        console.log('Google API test result:', result);
        alert(`Google API Test Result: ${JSON.stringify(result, null, 2)}`);
      } catch (error) {
        console.error('Google API test failed:', error);
        alert(`Google API Test Failed: ${error}`);
      }
    } else {
      console.error('No access token available');
      alert('No access token available');
    }
  };

  const handleTestEnv = async () => {
    console.log('Testing environment variables...');
    try {
      const response = await fetch('/api/env-test');
      const result = await response.json();
      console.log('Environment test result:', result);
      alert(`Environment Test Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('Environment test failed:', error);
      alert(`Environment Test Failed: ${error}`);
    }
  };

  const handleClearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_id_token');
      localStorage.removeItem('google_access_token');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Calendar Sync Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <button
                onClick={handleTestSync}
                disabled={syncing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Test Calendar Sync'}
              </button>
              
              <button
                onClick={handleTestGoogleAPI}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Google API
              </button>
              
              <button
                onClick={handleTestEnv}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Test Environment
              </button>
              
              <button
                onClick={handleClearTokens}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Tokens & Reload
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Events ({events.length})</h2>
            {events.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="bg-gray-700 p-3 rounded">
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(event.start).toLocaleDateString()} - {event.category}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No events found</p>
            )}
          </div>

          {error && (
            <div className="bg-red-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Error</h2>
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 