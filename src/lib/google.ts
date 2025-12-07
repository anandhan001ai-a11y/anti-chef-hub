export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
];

export const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest',
    'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
];

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

class GoogleService {
    private tokenClient: any;
    private accessToken: string | null = null;
    private isInitialized = false;

    // Load the scripts dynamically
    async loadScripts() {
        if (window.gapi) return;

        await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => resolve();
            document.body.appendChild(script);
        });

        await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }

    // Initialize the API Client
    async init(clientId: string, apiKey: string) {
        if (this.isInitialized) return;

        await this.loadScripts();

        return new Promise<void>((resolve, reject) => {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: apiKey,
                        discoveryDocs: DISCOVERY_DOCS,
                    });

                    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: clientId,
                        scope: GOOGLE_SCOPES.join(' '),
                        callback: (tokenResponse: any) => {
                            this.accessToken = tokenResponse.access_token;
                        },
                    });

                    this.isInitialized = true;
                    console.log('Google Service Initialized Securely');
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // Secure Login Flow
    async login() {
        if (!this.tokenClient) throw new Error('Google Service not initialized');

        return new Promise((resolve) => {
            this.tokenClient.callback = (resp: any) => {
                if (resp.error) throw resp;
                this.accessToken = resp.access_token;
                resolve(this.accessToken);
            };
            // Prompt the user (Privacy: User must click allow)
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    // --- FEATURE: SYNC TASKS ---
    async fetchTasks() {
        if (!this.accessToken) await this.login();

        const response = await window.gapi.client.tasks.tasklists.list();
        const taskLists = response.result.items;

        // Fetch tasks from the first list for demo
        if (taskLists && taskLists.length > 0) {
            const tasksResponse = await window.gapi.client.tasks.tasks.list({
                tasklist: taskLists[0].id
            });
            return tasksResponse.result.items;
        }
        return [];
    }

    // --- FEATURE: INVENTORY SYNC ---
    async fetchInventory(spreadsheetId: string, range: string) {
        if (!this.accessToken) await this.login();

        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.result.values;
    }

    // --- FEATURE: CALENDAR EVENTS ---
    async fetchCalendarEvents(timeMin: string, timeMax: string) {
        if (!this.accessToken) await this.login();

        const response = await window.gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': timeMin,
            'timeMax': timeMax,
            'showDeleted': false,
            'singleEvents': true,
            'orderBy': 'startTime'
        });
        return response.result.items;
    }
}

export const googleService = new GoogleService();
