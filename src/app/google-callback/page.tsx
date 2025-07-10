"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const idToken = params.get("id_token");
      
      console.log('Google callback - access token available:', !!accessToken);
      console.log('Google callback - id token available:', !!idToken);
      
      if (accessToken && idToken) {
        localStorage.setItem("google_access_token", accessToken);
        localStorage.setItem("google_id_token", idToken);
        console.log('Tokens stored in localStorage');
        
        // Trigger calendar sync immediately
        const syncCalendar = async () => {
          try {
            console.log('Starting immediate calendar sync...');
            
            // Fetch events from Google Calendar
            const timeMin = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString();
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=2500&singleEvents=true&orderBy=startTime&timeMin=${timeMin}`;
            
            const res = await fetch(url, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            
            console.log('Google API response status:', res.status);
            
            if (res.ok) {
              const data = await res.json();
              console.log('Google Calendar events fetched:', data.items?.length || 0);
              
              // Parse user info from ID token
              const payload = JSON.parse(atob(idToken.split(".")[1]));
              const user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                sub: payload.sub,
              };
              
              console.log('User info parsed:', user);
              
              // Sync events to backend
              const syncResponse = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  user, 
                  events: data.items || [] 
                }),
              });
              
              if (syncResponse.ok) {
                const syncResult = await syncResponse.json();
                console.log('Events synced to backend:', syncResult);
              } else {
                console.error('Failed to sync events to backend');
              }
            } else {
              console.error('Failed to fetch Google Calendar events');
            }
          } catch (error) {
            console.error('Calendar sync error:', error);
          }
        };
        
        // Run sync and then redirect
        syncCalendar().finally(() => {
          router.replace("/");
        });
      } else {
        console.error('Missing tokens in callback');
        router.replace("/");
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Connecting to Google...</h1>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
} 