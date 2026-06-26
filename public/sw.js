// Service Worker for Background Alerts and Alarms
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Reload on activation
      return loadDeadlinesFromCache().then(() => {
        scheduleBackgroundChecks();
      });
    })
  );
});

// Cache for active deadlines to track in memory
let activeDeadlines = [];

// Load from Cache storage to persist even after SW restarts
async function loadDeadlinesFromCache() {
  try {
    const cache = await caches.open('guardian-deadlines');
    const response = await cache.match('/deadlines.json');
    if (response) {
      activeDeadlines = await response.json();
    }
  } catch (e) {
    console.error('Failed to load deadlines from cache in service worker:', e);
  }
}

// Save to Cache storage
async function saveDeadlinesToCache(deadlines) {
  try {
    const cache = await caches.open('guardian-deadlines');
    await cache.put(
      new Request('/deadlines.json'),
      new Response(JSON.stringify(deadlines))
    );
  } catch (e) {
    console.error('Failed to save deadlines to cache in service worker:', e);
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_DEADLINES') {
    activeDeadlines = event.data.deadlines || [];
    event.waitUntil(
      saveDeadlinesToCache(activeDeadlines).then(() => {
        scheduleBackgroundChecks();
      })
    );
  }
});

let checkIntervalId = null;

function scheduleBackgroundChecks() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
  }

  // Initial load check on startup
  loadDeadlinesFromCache().then(() => {
    // Set interval to check deadlines every 10 seconds in the service worker
    checkIntervalId = setInterval(() => {
      const now = new Date();
      
      activeDeadlines.forEach((task) => {
        if (task.completed || !task.dueDate) return;

        const [year, month, day] = task.dueDate.split('-').map(Number);
        const [hours, minutes] = (task.dueTime || '23:59').split(':').map(Number);
        const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        const diffMs = targetDate.getTime() - now.getTime();

        // If the deadline is reached or within the last 30 seconds (alarm strike!)
        if (diffMs <= 0 && Math.abs(diffMs) < 60000 && !task.notified) {
          task.notified = true; // prevent double notifications
          
          // Save state back to cache
          saveDeadlinesToCache(activeDeadlines);

          // Push notification
          if (self.registration && self.registration.showNotification) {
            self.registration.showNotification('⚠️ CRITICAL DEADLINE STRIKE!', {
              body: `"${task.title}" consequence level: ${task.urgency.toUpperCase()}. Take immediate action!`,
              icon: '/icon.png',
              tag: task.id,
              requireInteraction: true,
              vibrate: [200, 100, 200, 100, 400],
              data: { taskId: task.id }
            });
          }
        }
      });
    }, 10000);
  });
}

// Ensure the alarm schedules immediately when service worker runs
scheduleBackgroundChecks();

// Notification Click action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open application window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
