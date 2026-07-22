/* ==========================================================================
   1. GLOBAL DATA REGISTRY & INITIALIZATION (CONSOLIDATED SDC)
   ========================================================================== */
const branches = [
    "SDC", "Pawnshop Bonifacio", "Pawnshop Kayang",
    "Pawnshop La Trinidad", "Pawnshop Leonard", "Pawnshop Main", "Gemline Main",
    "Gemline SM", "Bloomfield Hotel", "Patch Cafe", "217 Bonifacio Residences",
    "Lemon and Olives", "BHF Lending", "Human Resource Department", "BHF Admin"
];

const BRANCH_LOCATIONS = {
    "SDC": { lat: 16.4133578, lng: 120.5959151, address: "Lower GEBM Building, Session Rd, Baguio, Benguet", icon: "🏢" },
    "Pawnshop Bonifacio": { lat: 16.4176497, lng: 120.5962788, address: "A. Bonifacio Road, Baguio, Benguet", icon: "🏪" },
    "Pawnshop Kayang": { lat: 16.4153450, lng: 120.5943140, address: "Kayang St, Baguio, Benguet", icon: "🏪" },
    "Pawnshop La Trinidad": { lat: 16.4434003, lng: 120.5922771, address: "La Trinidad Road, Little Flower, La Trinidad, Benguet", icon: "🏪" },
    "Pawnshop Leonard": { lat: 16.4091565, lng: 120.6009964, address: "Leonard Wood Road, Baguio, Benguet", icon: "🏪" },
    "Pawnshop Main": { lat: 16.4169000, lng: 120.5970000, address: "A. Bonifacio Road, Baguio, Benguet", icon: "🏪" },
    "Gemline Main": { lat: 16.4090401, lng: 120.5994000, address: "Gemline Main Office, Baguio, Benguet", icon: "💎" },
    "Gemline SM": { lat: 16.4089850, lng: 120.5990352, address: "SM City Baguio, Session Rd, Baguio, Benguet", icon: "💎" },
    "Bloomfield Hotel": { lat: 16.4104197, lng: 120.6001217, address: "Bloomfield Hotel, Baguio, Benguet", icon: "🏨" },
    "Patch Cafe": { lat: 16.4104067, lng: 120.6000604, address: "Patch Cafe, Baguio, Benguet", icon: "☕" },
    "217 Bonifacio Residences": { lat: 16.4166267, lng: 120.5992578, address: "217 Bonifacio St, Baguio, Benguet", icon: "🏬" },
    "Lemon and Olives": { lat: 16.4108649, lng: 120.6231565, address: "Outlook Drive, Baguio, Benguet", icon: "🍽️" },
    "BHF Lending": { lat: 16.4109000, lng: 120.6001000, address: "BHF Lending, Baguio, Benguet", icon: "🏦" },
    "Human Resource Department": { lat: 16.4132500, lng: 120.5959500, address: "HR Department, Baguio, Benguet", icon: "👥" },
    "BHF Admin": { lat: 16.4131000, lng: 120.5961000, address: "Administrative Center, Baguio, Benguet", icon: "🏢" }
};

let bhfMap = null;
let branchMarkers = {};
let staffMarkers = {};
let staffControl = null;
let visibleBranchNames = [];
let homeEditModeActive = false;
let homeEditContentState = null;
let homeEditRemoteApplying = false;
const HOME_EDIT_STORAGE_KEY = 'bhfHomeEditContent';
const DEFAULT_HOME_EDIT_CONTENT = {
    headerTitle: 'BHF GROUP',
    headerSubtitle: 'IT Infrastructure Performance Portal',
    headerLogo: '/images/BHFlogo.jpg',
    footerTitle: 'BHF Infrastructure Hub',
    footerText: 'Reliable support, branch visibility, and rapid operational oversight in one place.',
    footerLogo: '/images/BHFlogo.jpg',
    footerSupportHeading: 'Support',
    footerSupportItems: ['Ticket Portal', 'IT Tracker', 'Branch Monitoring'],
    footerContactHeading: 'Contact',
    footerContactItems: ['support@bhfgroup.com', '+63 2 8888 1111', 'Bonifacio Global City']
};

function getStoredHomeEditContent() {
    try {
        const raw = localStorage.getItem(HOME_EDIT_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_HOME_EDIT_CONTENT };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_HOME_EDIT_CONTENT, ...parsed };
    } catch (e) {
        return { ...DEFAULT_HOME_EDIT_CONTENT };
    }
}

function persistHomeEditContent(content) {
    try {
        localStorage.setItem(HOME_EDIT_STORAGE_KEY, JSON.stringify(content));
        // If Firestore is initialized, push the home edit content to the sharedState/homeEditContent
        try {
            if (!homeEditRemoteApplying && firestoreDb && typeof firestoreDb.collection === 'function') {
                const docRef = firestoreDb.collection('sharedState').doc('homeEditContent');
                docRef.set({ homeEdit: content, homeEditUpdatedAt: Date.now() }, { merge: true }).catch(err => {
                    console.warn('Failed to push home edit content to Firestore', err);
                });
            }
        } catch (e) { /* ignore */ }
    } catch (e) {
        console.warn('Could not save home edit content', e);
    }
}

function applyHomeEditContent(content) {
    const resolved = { ...DEFAULT_HOME_EDIT_CONTENT, ...content };
    homeEditContentState = resolved;

    const headerTitle = document.getElementById('headerTitleText');
    const headerSubtitle = document.getElementById('headerSubtitleText');
    const headerLogo = document.getElementById('headerLogoImage');
    const footerTitle = document.getElementById('footerTitleText');
    const footerDescription = document.getElementById('footerDescriptionText');
    const footerLogo = document.getElementById('footerLogoImage');
    const footerSupportHeading = document.getElementById('footerSupportHeading');
    const footerSupportItems = [
        document.getElementById('footerSupportItem1'),
        document.getElementById('footerSupportItem2'),
        document.getElementById('footerSupportItem3')
    ];
    const footerContactHeading = document.getElementById('footerContactHeading');
    const footerContactItems = [
        document.getElementById('footerContactItem1'),
        document.getElementById('footerContactItem2'),
        document.getElementById('footerContactItem3')
    ];

    if (headerTitle) headerTitle.textContent = resolved.headerTitle;
    if (headerSubtitle) headerSubtitle.textContent = resolved.headerSubtitle;
    if (headerLogo) {
        headerLogo.src = resolved.headerLogo || DEFAULT_HOME_EDIT_CONTENT.headerLogo;
        headerLogo.alt = `${resolved.headerTitle} Logo`;
    }
    if (footerTitle) footerTitle.textContent = resolved.footerTitle;
    if (footerDescription) footerDescription.textContent = resolved.footerText;
    if (footerLogo) {
        footerLogo.src = resolved.footerLogo || DEFAULT_HOME_EDIT_CONTENT.footerLogo;
        footerLogo.alt = `${resolved.footerTitle} Logo`;
    }
    if (footerSupportHeading) footerSupportHeading.textContent = resolved.footerSupportHeading;
    footerSupportItems.forEach((itemEl, index) => {
        if (itemEl) {
            const value = Array.isArray(resolved.footerSupportItems) ? resolved.footerSupportItems[index] : '';
            itemEl.textContent = value || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems[index] || '';
        }
    });
    if (footerContactHeading) footerContactHeading.textContent = resolved.footerContactHeading;
    footerContactItems.forEach((itemEl, index) => {
        if (itemEl) {
            const value = Array.isArray(resolved.footerContactItems) ? resolved.footerContactItems[index] : '';
            itemEl.innerHTML = value ? `<i class="fas ${index === 0 ? 'fa-envelope' : index === 1 ? 'fa-phone-alt' : 'fa-map-marker-alt'}" contenteditable="false"></i> ${value}` : '';
        }
    });

    persistHomeEditContent(resolved);
}

function setHomeEditableElementsEnabled(enabled) {
    document.body.classList.toggle('home-edit-mode', enabled);
    document.querySelectorAll('.home-editable').forEach(element => {
        if (!element) return;
        element.setAttribute('contenteditable', enabled ? 'true' : 'false');
        element.classList.toggle('editing', enabled);
        element.setAttribute('spellcheck', 'false');
    });
    document.querySelectorAll('a[data-prevent-link="true"]').forEach(anchor => {
        if (enabled) {
            anchor.addEventListener('click', preventEditLinkNavigation);
        } else {
            anchor.removeEventListener('click', preventEditLinkNavigation);
        }
    });
}

function preventEditLinkNavigation(event) {
    if (homeEditModeActive) {
        event.preventDefault();
    }
}

function updateHomeEditValue(field, value) {
    const nextContent = { ...(homeEditContentState || getStoredHomeEditContent()) };
    const cleanValue = String(value || '').replace(/\u00A0/g, ' ');

    switch (field) {
        case 'headerTitle':
            nextContent.headerTitle = cleanValue || DEFAULT_HOME_EDIT_CONTENT.headerTitle;
            break;
        case 'headerSubtitle':
            nextContent.headerSubtitle = cleanValue || DEFAULT_HOME_EDIT_CONTENT.headerSubtitle;
            break;
        case 'footerTitle':
            nextContent.footerTitle = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerTitle;
            break;
        case 'footerText':
            nextContent.footerText = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerText;
            break;
        case 'footerSupportHeading':
            nextContent.footerSupportHeading = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerSupportHeading;
            break;
        case 'footerSupportItems.0':
            nextContent.footerSupportItems = [...(nextContent.footerSupportItems || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems)];
            nextContent.footerSupportItems[0] = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems[0];
            break;
        case 'footerSupportItems.1':
            nextContent.footerSupportItems = [...(nextContent.footerSupportItems || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems)];
            nextContent.footerSupportItems[1] = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems[1];
            break;
        case 'footerSupportItems.2':
            nextContent.footerSupportItems = [...(nextContent.footerSupportItems || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems)];
            nextContent.footerSupportItems[2] = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerSupportItems[2];
            break;
        case 'footerContactHeading':
            nextContent.footerContactHeading = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerContactHeading;
            break;
        case 'footerContactItems.0':
            nextContent.footerContactItems = [...(nextContent.footerContactItems || DEFAULT_HOME_EDIT_CONTENT.footerContactItems)];
            nextContent.footerContactItems[0] = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerContactItems[0];
            break;
        case 'footerContactItems.1':
            nextContent.footerContactItems = [...(nextContent.footerContactItems || DEFAULT_HOME_EDIT_CONTENT.footerContactItems)];
            nextContent.footerContactItems[1] = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerContactItems[1];
            break;
        case 'footerContactItems.2':
            nextContent.footerContactItems = [...(nextContent.footerContactItems || DEFAULT_HOME_EDIT_CONTENT.footerContactItems)];
            nextContent.footerContactItems[2] = cleanValue || DEFAULT_HOME_EDIT_CONTENT.footerContactItems[2];
            break;
    }

    homeEditContentState = nextContent;
}

function bindHomeInlineEditing() {
    document.querySelectorAll('.home-editable').forEach(element => {
        element.removeEventListener('input', handleHomeEditableInput);
        element.removeEventListener('blur', handleHomeEditableBlur);
    });

    document.querySelectorAll('.home-editable').forEach(element => {
        element.addEventListener('input', handleHomeEditableInput);
        element.addEventListener('blur', handleHomeEditableBlur);
    });
}

function handleHomeEditableInput(event) {
    const target = event.currentTarget;
    if (target && target.dataset.homeEditField) {
        updateHomeEditValue(target.dataset.homeEditField, target.textContent);
    }
}

function handleHomeEditableBlur(event) {
    const target = event.currentTarget;
    if (target && target.dataset.homeEditField) {
        updateHomeEditValue(target.dataset.homeEditField, target.textContent);
        if (homeEditContentState) {
            persistHomeEditContent(homeEditContentState);
        }
    }
}

function saveHomeEditContent() {
    if (homeEditContentState) {
        persistHomeEditContent(homeEditContentState);
    }
}

function resetHomeEditContent() {
    const resetContent = { ...DEFAULT_HOME_EDIT_CONTENT };
    applyHomeEditContent(resetContent);
}

function handleLogoFileChange(event, field) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const content = getStoredHomeEditContent();
        const nextContent = { ...content, [field]: reader.result };
        applyHomeEditContent(nextContent);
    };
    reader.readAsDataURL(file);
}

function enterHomeEditMode() {
    homeEditModeActive = true;
    closeSideMenu();
    hideAllPages();
    const target = document.getElementById('homePage');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    const panel = document.getElementById('homeEditPanel');
    if (panel) panel.classList.remove('hidden');
    const content = getStoredHomeEditContent();
    applyHomeEditContent(content);
    setHomeEditableElementsEnabled(true);
    bindHomeInlineEditing();
    renderBranchGridDashboard();
    loadHomeRemarks();
    try { displayAnnouncementsOnHome(); } catch (e) {}
    updateITProfilesDisplay();
    if (!bhfMap) {
        initializeBHFMap();
    } else {
        updateBHFMapStaffMarkers();
        setTimeout(() => { if (bhfMap) bhfMap.invalidateSize(); }, 200);
    }
    populateHomeBranchSelect();
    renderHomeBranchList();
    filterHomeBranches(document.getElementById('branchSearchInput')?.value || '');
    try { updateNavVisibility(); updateHamburgerVisibility(); } catch (e) { console.error(e); }
}

function exitHomeEditMode() {
    homeEditModeActive = false;
    saveHomeEditContent();
    setHomeEditableElementsEnabled(false);
    const panel = document.getElementById('homeEditPanel');
    if (panel) panel.classList.add('hidden');
    goHome();
}

window.addEventListener('resize', () => {
    if (typeof renderITStaffProfileGrid === 'function') {
        renderITStaffProfileGrid();
    }
});

window.addEventListener('orientationchange', () => {
    if (typeof renderITStaffProfileGrid === 'function') {
        renderITStaffProfileGrid();
    }
});

const FIREBASE_REMOTE_DOC = {
    collection: 'sharedState',
    doc: 'itStaffProfiles'
};
const FIREBASE_ANNOUNCEMENTS_DOC = {
    collection: 'sharedState',
    doc: 'adminAnnouncements'
};
// NEW: Global database collection documents for multi-client terminal tracking
const FIREBASE_PCDATA_DOC = {
    collection: 'sharedState',
    doc: 'pcDatabase'
};
const FIREBASE_HISTORY_DOC = {
    collection: 'sharedState',
    doc: 'auditHistory'
};
const FIREBASE_ROLE_DOC = {
    collection: 'sharedState',
    doc: 'itRoleDefinitions'
};
const FIREBASE_SHIFT_DOC = {
    collection: 'sharedState',
    doc: 'itShiftHistory'
};
const FIREBASE_ANALYSIS_DOC = {
    collection: 'sharedState',
    doc: 'analysisDeleteState'
};
const FIREBASE_FEEDBACK_DOC = {
    collection: 'sharedState',
    doc: 'staffFeedbacks'
};
let firebaseApp = null;
let firestoreDb = null;
let remoteSyncApplying = false;
let remoteAnnouncementsApplying = false;
let analysisRemoteApplying = false;
let staffFeedbackRemoteApplying = false;
let profileStorageSyncSuppressed = false;
let profileSyncRevision = Number(localStorage.getItem('itStaffProfilesRevision') || '0');
let profileSyncLastUpdatedBy = null;

function isFirebaseConfigured() {
    return Boolean(window.firebaseConfig && window.firebaseConfig.projectId && window.firebaseConfig.apiKey);
}

function isRemoteSyncActive() {
    return Boolean(firestoreDb);
}

// Hook localStorage.setItem so local changes automatically push to Firestore.
// Uses a guard to avoid recursion when push functions write back to localStorage.
(function installLocalStorageSyncHook() {
    try {
        const _origSetItem = Storage.prototype.setItem;
        let _hookGuard = false;
        Storage.prototype.setItem = function(key, value) {
            _origSetItem.apply(this, [key, value]);
            if (_hookGuard || profileStorageSyncSuppressed) return;
            try {
                if (key === 'pcData') {
                    _hookGuard = true;
                    try { pcData = JSON.parse(value); } catch (e) {}
                    if (isRemoteSyncActive() && !remoteSyncApplying) {
                        try { pushPcDataToCloud(); } catch (e) { console.warn('pushPcDataToCloud failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'modificationHistory') {
                    _hookGuard = true;
                    try { modificationHistory = JSON.parse(value || '[]'); } catch (e) {}
                    if (isRemoteSyncActive() && !remoteSyncApplying) {
                        try { pushHistoryToCloud(); } catch (e) { console.warn('pushHistoryToCloud failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'itStaffProfiles') {
                    _hookGuard = true;
                    try { /* keep local pcData in sync */ } catch (e) {}
                    if (isRemoteSyncActive() && !remoteSyncApplying) {
                        try { syncProfilesToRemote(JSON.parse(value || '{}')); } catch (e) { console.warn('syncProfilesToRemote failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'adminAnnouncements') {
                    _hookGuard = true;
                    try { /* no-op */ } catch (e) {}
                    if (isRemoteSyncActive() && !remoteAnnouncementsApplying) {
                        try { syncAnnouncementsToRemote(JSON.parse(value || '[]')); } catch (e) { console.warn('syncAnnouncementsToRemote failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'itStaffRoleDefinitions') {
                    _hookGuard = true;
                    try { /* no-op */ } catch (e) {}
                    if (isRemoteSyncActive() && !remoteSyncApplying) {
                        try { syncRoleDefinitionsToRemote(JSON.parse(value || '{}')); } catch (e) { console.warn('syncRoleDefinitionsToRemote failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'itShiftHistory') {
                    _hookGuard = true;
                    try { /* no-op */ } catch (e) {}
                    if (isRemoteSyncActive() && !remoteSyncApplying) {
                        try { syncShiftHistoryToRemote(JSON.parse(value || '[]')); } catch (e) { console.warn('syncShiftHistoryToRemote failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'analysisDeleteState') {
                    _hookGuard = true;
                    try { const state = JSON.parse(value || '{}'); restoreAnalysisDeleteState(state); } catch (e) { console.warn('Failed to parse analysis delete state from localStorage', e); }
                    if (isRemoteSyncActive() && !analysisRemoteApplying) {
                        try { pushAnalysisDeleteStateToCloud().catch(() => {}); } catch (e) { console.warn('pushAnalysisDeleteStateToCloud failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
                if (key === 'staffFeedbacks') {
                    _hookGuard = true;
                    let parsed = [];
                    try { parsed = JSON.parse(value || '[]'); } catch (e) { console.warn('Failed to parse staffFeedbacks from localStorage', e); }
                    if (isRemoteSyncActive() && !staffFeedbackRemoteApplying) {
                        try { syncStaffFeedbacksToRemote(parsed); } catch (e) { console.warn('syncStaffFeedbacksToRemote failed from hook', e); }
                    }
                    _hookGuard = false;
                    return;
                }
            } catch (e) { console.warn('localStorage hook error', e); _hookGuard = false; }
        };
    } catch (e) { console.warn('Failed to install localStorage sync hook', e); }
})();

// BroadcastChannel fallback for cross-tab sync when Firestore is unavailable
let bhfBroadcast = null;
try {
    bhfBroadcast = new BroadcastChannel('bhf-sync');
    bhfBroadcast.onmessage = (ev) => {
        try {
            const msg = ev.data || {};
            if (msg.type === 'profiles-updated' && msg.profiles) {
                // avoid overwriting if we're currently applying remote sync or the data is unchanged
                const currentRaw = localStorage.getItem('itStaffProfiles');
                const incomingRaw = JSON.stringify(msg.profiles || {});
                if (!remoteSyncApplying && currentRaw !== incomingRaw) {
                    persistStaffProfiles(msg.profiles, { skipRemote: true });
                    renderITStaffProfileGrid();
                    updateBHFMapStaffMarkers();
                } else if (!remoteSyncApplying) {
                    renderITStaffProfileGrid();
                    updateBHFMapStaffMarkers();
                }
            }
            if (msg.type === 'announcements-updated' && msg.announcements) {
                if (!remoteAnnouncementsApplying) {
                    persistAnnouncements(msg.announcements);
                    renderItTrackerAnnouncements();
                    displayAnnouncementsOnHome();
                }
            }
            if (msg.type === 'status') {
                updateRemoteSyncStatusDisplay(msg.status, msg.info || '');
            }
        } catch (e) { console.error('BroadcastChannel handler error', e); }
    };
} catch (e) {
    bhfBroadcast = null;
}

async function initializeRemoteSync() {
    console.debug('[RemoteSync] initializeRemoteSync() start', { firebaseConfig: window.firebaseConfig });
    if (!isFirebaseConfigured() || typeof firebase === 'undefined') {
        console.warn('Firebase not configured or library missing.');
        updateRemoteSyncStatusDisplay('offline', 'Firebase not loaded');
        return;
    }

    try {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(window.firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }
        firestoreDb = firebase.firestore();

        const docRef = firestoreDb.collection(FIREBASE_REMOTE_DOC.collection).doc(FIREBASE_REMOTE_DOC.doc);
        docRef.onSnapshot((snapshot) => {
            console.debug('[RemoteSync] onSnapshot received', { exists: snapshot.exists });
            if (!snapshot.exists) return;
            const remoteData = snapshot.data();
            if (!remoteData || typeof remoteData.profiles !== 'object') return;

            const remoteRevision = Number(remoteData.profilesRevision || 0);
            const currentLocal = localStorage.getItem("itStaffProfiles");
            const remoteString = JSON.stringify(remoteData.profiles);

            if (currentLocal !== remoteString) {
                remoteSyncApplying = true;
                try {
                    syncLocalStaffProfiles(remoteData.profiles, { revision: remoteRevision, updatedBy: remoteData.profilesUpdatedBy || 'remote' });
                    
                    // Smoothly refresh the UI view structures
                    if (typeof updateITProfilesDisplay === 'function') updateITProfilesDisplay();
                    
                    // Check if currently logged-in user is still valid and enabled
                    if (adminAuthenticated && adminUserKey) {
                        const currentUserProfile = remoteData.profiles[adminUserKey];
                        if (!currentUserProfile || !currentUserProfile.id || currentUserProfile.disabled === true) {
                            // Current user was deleted or disabled, force logout
                            const reason = !currentUserProfile ? 'Your account has been deleted.' : 'Your account has been disabled.';
                            if (typeof forceLogoutDueToStatusChange === 'function') {
                                forceLogoutDueToStatusChange(reason);
                            }
                        }
                    }
                } finally {
                    remoteSyncApplying = false;
                }
            }
        }, (error) => {
            console.error('Firebase shift sync error:', error);
            updateRemoteSyncStatusDisplay('error', error.message || String(error));
        });

        const snapshot = await docRef.get();
        console.debug('[RemoteSync] initial doc get', { exists: snapshot.exists, id: FIREBASE_REMOTE_DOC.doc });
        const localProfilesRaw = localStorage.getItem('itStaffProfiles');
        let localProfiles = {};
        try { localProfiles = JSON.parse(localProfilesRaw || '{}'); } catch (e) { localProfiles = {}; }

        if (snapshot.exists) {
            const remoteData = snapshot.data();
            console.debug('[RemoteSync] initial remoteData', remoteData);
            if (remoteData && typeof remoteData.profiles === 'object') {
                remoteSyncApplying = true;
                try {
                    syncLocalStaffProfiles(remoteData.profiles, {
                        revision: Number(remoteData.profilesRevision || 0),
                        updatedBy: remoteData.profilesUpdatedBy || 'remote'
                    });
                } finally {
                    remoteSyncApplying = false;
                }
            } else if (localProfiles && Object.keys(localProfiles).length > 0) {
                try {
                    await docRef.set({ profiles: localProfiles }, { merge: true });
                    console.info('Migrated local itStaffProfiles → Firestore sharedState/itStaffProfiles');
                } catch (e) {
                    console.warn('Failed to migrate local itStaffProfiles to Firestore:', e);
                }
            }
        } else {
            if (localProfiles && Object.keys(localProfiles).length > 0) {
                try {
                    await docRef.set({ profiles: localProfiles }, { merge: true });
                    console.info('Initialized Firestore sharedState/itStaffProfiles from local staff profiles');
                } catch (e) {
                    console.warn('Failed to initialize remote staff profiles:', e);
                }
            }
        }
        // ------------------------------------------------------------------
        // Ensure pcData is sourced from Firestore. If remote exists use it;
        // otherwise migrate any existing local `pcData` into Firestore so data is real.
        // ------------------------------------------------------------------
        try {
            const pcRefInit = firestoreDb.collection(FIREBASE_PCDATA_DOC.collection).doc(FIREBASE_PCDATA_DOC.doc);
            const pcSnap = await pcRefInit.get();
            if (pcSnap.exists) {
                const data = pcSnap.data();
                if (data && data.pcData) {
                    pcData = data.pcData;
                    try { localStorage.setItem('pcData', JSON.stringify(pcData)); } catch (e) {}
                    try { if (typeof scheduleRefreshAllViews === 'function') scheduleRefreshAllViews(200); } catch (e) {}
                }
            } else {
                try {
                    const localRaw = localStorage.getItem('pcData');
                    if (localRaw) {
                        const localObj = JSON.parse(localRaw || '{}');
                        if (localObj && Object.keys(localObj).length > 0) {
                            await pcRefInit.set({ pcData: localObj }, { merge: true });
                            console.info('Migrated local pcData → Firestore sharedState/pcDatabase');
                        }
                    }
                } catch (e) { console.warn('pcData migration failed', e); }
            }
        } catch (e) { console.warn('pcData initial sync check failed', e); }
            // ------------------------------------------------------------------
            // Migrate announcements and modification history if remote missing
            // ------------------------------------------------------------------
            try {
                const annRefInit = firestoreDb.collection(FIREBASE_ANNOUNCEMENTS_DOC.collection).doc(FIREBASE_ANNOUNCEMENTS_DOC.doc);
                const annSnap = await annRefInit.get();
                if (annSnap.exists) {
                    const data = annSnap.data();
                    if (data && Array.isArray(data.announcements)) {
                        persistAnnouncements(data.announcements || []);
                        renderItTrackerAnnouncements();
                        displayAnnouncementsOnHome();
                    }
                } else {
                    try {
                        const localList = getStoredAnnouncements();
                        if (Array.isArray(localList) && localList.length > 0) {
                            await annRefInit.set({ announcements: localList }, { merge: true });
                            console.info('Migrated local announcements → Firestore');
                        }
                    } catch (e) { console.warn('announcements migration failed', e); }
                }
            } catch (e) { console.warn('announcements initial sync check failed', e); }

            try {
                const historyRefInit = firestoreDb.collection(FIREBASE_HISTORY_DOC.collection).doc(FIREBASE_HISTORY_DOC.doc);
                const historySnap = await historyRefInit.get();
                if (historySnap.exists) {
                    const data = historySnap.data();
                    if (data && Array.isArray(data.history)) {
                        modificationHistory = data.history;
                        try { localStorage.setItem('modificationHistory', JSON.stringify(modificationHistory)); } catch (e) {}
                        try { if (typeof loadAdminBranchData === 'function') loadAdminBranchData(); } catch (e) {}
                    }
                } else {
                    try {
                        const localHist = JSON.parse(localStorage.getItem('modificationHistory') || '[]');
                        if (Array.isArray(localHist) && localHist.length > 0) {
                            await historyRefInit.set({ history: localHist }, { merge: true });
                            console.info('Migrated local modificationHistory → Firestore');
                        }
                    } catch (e) { console.warn('modificationHistory migration failed', e); }
                }
            } catch (e) { console.warn('history initial sync check failed', e); }

            try {
                const analysisRefInit = firestoreDb.collection(FIREBASE_ANALYSIS_DOC.collection).doc(FIREBASE_ANALYSIS_DOC.doc);
                const analysisSnap = await analysisRefInit.get();
                if (analysisSnap.exists) {
                    const data = analysisSnap.data();
                    if (data && typeof data.analysisDeleteState === 'object') {
                        analysisRemoteApplying = true;
                        try {
                            restoreAnalysisDeleteState(data.analysisDeleteState);
                            localStorage.setItem('analysisDeleteState', JSON.stringify(data.analysisDeleteState));
                        } finally {
                            analysisRemoteApplying = false;
                        }
                    }
                } else {
                    const stored = localStorage.getItem('analysisDeleteState');
                    if (stored) {
                        try {
                            const localState = JSON.parse(stored);
                            if (localState && typeof localState === 'object') {
                                await analysisRefInit.set({ analysisDeleteState: localState }, { merge: false });
                                console.info('Migrated local analysis delete state → Firestore sharedState/analysisDeleteState');
                            }
                        } catch (e) { console.warn('analysis delete state migration failed', e); }
                    }
                }
            } catch (e) { console.warn('analysis delete state initial sync check failed', e); }

            try {
                const feedbackRefInit = firestoreDb.collection(FIREBASE_FEEDBACK_DOC.collection).doc(FIREBASE_FEEDBACK_DOC.doc);
                const feedbackSnap = await feedbackRefInit.get();
                if (feedbackSnap.exists) {
                    const data = feedbackSnap.data();
                    if (data && Array.isArray(data.staffFeedbacks)) {
                        staffFeedbackRemoteApplying = true;
                        try {
                            localStorage.setItem('staffFeedbacks', JSON.stringify(data.staffFeedbacks));
                        } finally {
                            staffFeedbackRemoteApplying = false;
                        }
                    }
                } else {
                    try {
                        const localList = JSON.parse(localStorage.getItem('staffFeedbacks') || '[]');
                        if (Array.isArray(localList) && localList.length > 0) {
                            await feedbackRefInit.set({ staffFeedbacks: localList }, { merge: false });
                            console.info('Migrated local staff feedbacks → Firestore sharedState/staffFeedbacks');
                        }
                    } catch (e) { console.warn('staff feedback migration failed', e); }
                }
            } catch (e) { console.warn('staffFeedbacks initial sync check failed', e); }

            try {
                const roleRefInit = firestoreDb.collection(FIREBASE_ROLE_DOC.collection).doc(FIREBASE_ROLE_DOC.doc);
                const roleSnap = await roleRefInit.get();
                if (roleSnap.exists) {
                    const data = roleSnap.data();
                    if (data && typeof data.roles === 'object') {
                        const remoteRoles = ensureDefaultRoleDefinitions(data.roles);
                        try { localStorage.setItem('itStaffRoleDefinitions', JSON.stringify(remoteRoles)); } catch (e) {}
                        populateAddStaffRoleOptions();
                    }
                } else {
                    try {
                        const localRawRoles = localStorage.getItem('itStaffRoleDefinitions');
                        if (localRawRoles) {
                            const localRoles = JSON.parse(localRawRoles || '{}');
                            if (localRoles && Object.keys(localRoles).length > 0) {
                                await roleRefInit.set({ roles: localRoles }, { merge: true });
                                console.info('Migrated local role definitions → Firestore sharedState/itRoleDefinitions');
                            }
                        }
                    } catch (e) { console.warn('role definitions migration failed', e); }
                }
            } catch (e) { console.warn('role definitions initial sync check failed', e); }

            try {
                const shiftRefInit = firestoreDb.collection(FIREBASE_SHIFT_DOC.collection).doc(FIREBASE_SHIFT_DOC.doc);
                const shiftSnap = await shiftRefInit.get();
                if (shiftSnap.exists) {
                    const data = shiftSnap.data();
                    if (data && Array.isArray(data.shiftHistory)) {
                        itShiftHistory = data.shiftHistory;
                        try { localStorage.setItem('itShiftHistory', JSON.stringify(itShiftHistory)); } catch (e) {}
                        try { if (typeof loadAdminBranchData === 'function') loadAdminBranchData(); } catch (e) {}
                    }
                } else {
                    try {
                        const localHist = JSON.parse(localStorage.getItem('itShiftHistory') || '[]');
                        if (Array.isArray(localHist) && localHist.length > 0) {
                            await shiftRefInit.set({ shiftHistory: localHist }, { merge: true });
                            console.info('Migrated local shift history → Firestore sharedState/itShiftHistory');
                        }
                    } catch (e) { console.warn('shift history migration failed', e); }
                }
            } catch (e) { console.warn('shift history initial sync check failed', e); }

        // Listen for announcements doc changes as well
        try {
            const annRef = firestoreDb.collection(FIREBASE_ANNOUNCEMENTS_DOC.collection).doc(FIREBASE_ANNOUNCEMENTS_DOC.doc);
            annRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !Array.isArray(data.announcements)) return;
                remoteAnnouncementsApplying = true;
                try {
                    persistAnnouncements(data.announcements || []);
                    renderItTrackerAnnouncements();
                    displayAnnouncementsOnHome();
                } finally {
                    remoteAnnouncementsApplying = false;
                }
            }, (err) => console.error('Announcements sync error', err));
        } catch (e) { console.warn('Announcements listener not attached', e); }

        // Listen for home edit content updates so clients reflect shared edits
        try {
            const homeEditRef = firestoreDb.collection('sharedState').doc('homeEditContent');
            homeEditRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !data.homeEdit) return;
                homeEditRemoteApplying = true;
                try {
                    applyHomeEditContent(data.homeEdit || {});
                } finally {
                    // Small delay to ensure local persistence completes before re-enabling pushes
                    setTimeout(() => { homeEditRemoteApplying = false; }, 150);
                }
            }, (err) => console.error('Home edit sync error', err));
        } catch (e) { console.warn('Home edit listener not attached', e); }
        // ------------------------------------------------------------------
        // NEW: Real-Time Sync Streams for All User Dashboard Windows (pcData)
        // ------------------------------------------------------------------
        try {
            const pcRef = firestoreDb.collection(FIREBASE_PCDATA_DOC.collection).doc(FIREBASE_PCDATA_DOC.doc);
            pcRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !data.pcData) return;

                // Write the synchronized remote snapshot data to local cache memory
                pcData = data.pcData;
                localStorage.setItem("pcData", JSON.stringify(pcData));

                // Debounced UI refresh to avoid rapid reflows/visual blinking
                if (typeof scheduleRefreshAllViews === 'function') scheduleRefreshAllViews();
            }, (err) => console.error('PC remote pipeline subscription error:', err));
        } catch (e) { console.warn('PC dynamic registration hook blocked:', e); }

        // ------------------------------------------------------------------
        // NEW: Real-Time Sync Streams for All Active Admin History Modules
        // ------------------------------------------------------------------
        try {
            const historyRef = firestoreDb.collection(FIREBASE_HISTORY_DOC.collection).doc(FIREBASE_HISTORY_DOC.doc);
            historyRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !Array.isArray(data.history)) return;
                
                // Synchronize global ledgers locally
                remoteSyncApplying = true;
                try {
                    modificationHistory = data.history;
                    localStorage.setItem("modificationHistory", JSON.stringify(modificationHistory));
                    if (typeof loadAdminBranchData === 'function') loadAdminBranchData();
                } finally {
                    remoteSyncApplying = false;
                }
            }, (err) => console.error('History pipeline subscription error:', err));
        } catch (e) { console.warn('History dynamic registration hook blocked:', e); }

        try {
            const analysisRef = firestoreDb.collection(FIREBASE_ANALYSIS_DOC.collection).doc(FIREBASE_ANALYSIS_DOC.doc);
            analysisRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || typeof data.analysisDeleteState !== 'object') return;
                analysisRemoteApplying = true;
                try {
                    restoreAnalysisDeleteState(data.analysisDeleteState);
                    localStorage.setItem('analysisDeleteState', JSON.stringify(data.analysisDeleteState));
                    if (typeof renderAnalysisView === 'function') renderAnalysisView();
                } finally {
                    analysisRemoteApplying = false;
                }
            }, (err) => console.error('Analysis delete state snapshot subscription error:', err));
        } catch (e) { console.warn('Analysis delete state listener not attached:', e); }

        try {
            const feedbackRef = firestoreDb.collection(FIREBASE_FEEDBACK_DOC.collection).doc(FIREBASE_FEEDBACK_DOC.doc);
            feedbackRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !Array.isArray(data.staffFeedbacks)) return;
                staffFeedbackRemoteApplying = true;
                try {
                    localStorage.setItem('staffFeedbacks', JSON.stringify(data.staffFeedbacks));
                    try { renderStaffFeedbackHistoryPage(); } catch (e) {}
                } finally {
                    staffFeedbackRemoteApplying = false;
                }
            }, (err) => console.error('Staff feedback snapshot subscription error:', err));
        } catch (e) { console.warn('Staff feedback listener not attached:', e); }

        try {
            const roleRef = firestoreDb.collection(FIREBASE_ROLE_DOC.collection).doc(FIREBASE_ROLE_DOC.doc);
            roleRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || typeof data.roles !== 'object') return;
                remoteSyncApplying = true;
                try {
                    const remoteRoles = ensureDefaultRoleDefinitions(data.roles);
                    localStorage.setItem('itStaffRoleDefinitions', JSON.stringify(remoteRoles));
                    populateAddStaffRoleOptions();
                } finally {
                    remoteSyncApplying = false;
                }
            }, (err) => console.error('Role definitions pipeline subscription error:', err));
        } catch (e) { console.warn('Role definitions listener not attached:', e); }

        try {
            const shiftRef = firestoreDb.collection(FIREBASE_SHIFT_DOC.collection).doc(FIREBASE_SHIFT_DOC.doc);
            shiftRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !Array.isArray(data.shiftHistory)) return;
                remoteSyncApplying = true;
                try {
                    itShiftHistory = data.shiftHistory;
                    localStorage.setItem('itShiftHistory', JSON.stringify(itShiftHistory));
                    if (typeof loadAdminBranchData === 'function') loadAdminBranchData();
                } finally {
                    remoteSyncApplying = false;
                }
            }, (err) => console.error('Shift history pipeline subscription error:', err));
        } catch (e) { console.warn('Shift history listener not attached:', e); }
        // ------------------------------------------------------------------
        // NEW: Real-Time Sync Streams for Workstation Data Matrix (pcData)
        // ------------------------------------------------------------------
        try {
            const pcRef = firestoreDb.collection(FIREBASE_PCDATA_DOC.collection).doc(FIREBASE_PCDATA_DOC.doc);
            pcRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();
                if (!data || !data.pcData) return;
                
                // Overwrite local dataset memory with the global database cloud truth
                pcData = data.pcData;
                localStorage.setItem("pcData", JSON.stringify(pcData));
                
                // INSTANT FIX: Re-renders tables, grid, metrics, and Immediate Action panels globally
                if (typeof refreshAllViews === 'function') {
                    refreshAllViews();
                } else {
                    // Fallbacks to manually force update layout modules if nested
                    if (typeof renderBranchGridDashboard === 'function') renderBranchGridDashboard();
                    if (typeof updateOverallSummaryMetrics === 'function') updateOverallSummaryMetrics();
                }
            }, (err) => console.error('PC remote snapshot subscription failed:', err));
        } catch (e) { console.warn('PC live listener attachment blocked:', e); }

        updateRemoteSyncStatusDisplay('ok', 'Connected to Firestore');
    } catch (e) {
        console.error('Failed to initialize remote sync:', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}

    // Start a periodic fetch to ensure remote announcements are pulled even if onSnapshot is blocked
    try {
        if (announcementsPollIntervalId) clearInterval(announcementsPollIntervalId);
        announcementsPollIntervalId = setInterval(() => {
            try { fetchAnnouncementsFromRemote(); } catch (e) {}
        }, 8000);
    } catch (e) { /* ignore */ }

    // Debounced UI refresh helper to reduce visual blinking
    let _pcRefreshTimer = null;
    function scheduleRefreshAllViews(delay = 700) {
        try {
            if (_pcRefreshTimer) clearTimeout(_pcRefreshTimer);
            _pcRefreshTimer = setTimeout(() => {
                try {
                    if (typeof refreshAllViews === 'function') refreshAllViews();
                    else {
                        if (typeof renderBranchGridDashboard === 'function') renderBranchGridDashboard();
                        if (typeof updateOverallSummaryMetrics === 'function') updateOverallSummaryMetrics();
                    }
                } catch (e) { console.warn('scheduleRefreshAllViews error', e); }
            }, delay);
        } catch (e) { console.warn('scheduleRefreshAllViews scheduling failed', e); }
    }

    // Fallback polling for pcData: helps clients that miss onSnapshot updates
    let pcDataPollIntervalId = null;
    async function fetchPcDataFromRemote() {
        if (!firestoreDb) return;
        try {
            const pcRef = firestoreDb.collection(FIREBASE_PCDATA_DOC.collection).doc(FIREBASE_PCDATA_DOC.doc);
            const snap = await pcRef.get();
            if (!snap.exists) return;
            const data = snap.data();
            if (!data || !data.pcData) return;

            const remotePcJson = JSON.stringify(data.pcData || {});
            const localPcJson = JSON.stringify(pcData || {});
            if (remotePcJson !== localPcJson) {
                pcData = data.pcData;
                localStorage.setItem('pcData', remotePcJson);
                // Use debounced refresh to avoid UI flicker across clients
                scheduleRefreshAllViews();
                try { if (bhfBroadcast) bhfBroadcast.postMessage({ type: 'pc-updated', pcData }); } catch (e) {}
            }
        } catch (e) {
            console.warn('fetchPcDataFromRemote failed', e);
            // If permission errors occur, surface status for debugging
            updateRemoteSyncStatusDisplay('error', e.message || String(e));
        }
    }

    try {
        if (pcDataPollIntervalId) clearInterval(pcDataPollIntervalId);
        pcDataPollIntervalId = setInterval(() => {
            try { fetchPcDataFromRemote(); } catch (e) {}
        }, 10000);
    } catch (e) { /* ignore */ }

async function fetchAnnouncementsFromRemote() {
    if (!firestoreDb) return;
    try {
        const annRef = firestoreDb.collection(FIREBASE_ANNOUNCEMENTS_DOC.collection).doc(FIREBASE_ANNOUNCEMENTS_DOC.doc);
        const snap = await annRef.get();
        if (!snap.exists) return;
        const data = snap.data();
        if (!data || !Array.isArray(data.announcements)) return;
        const remoteList = data.announcements || [];
        // Only apply if different
        const localJson = JSON.stringify(getStoredAnnouncements() || []);
        const remoteJson = JSON.stringify(remoteList || []);
        if (localJson !== remoteJson) {
            remoteAnnouncementsApplying = true;
            try {
                persistAnnouncements(remoteList);
                renderItTrackerAnnouncements();
                displayAnnouncementsOnHome();
                try { if (bhfBroadcast) bhfBroadcast.postMessage({ type: 'announcements-updated', announcements: remoteList }); } catch (e) {}
            } finally { remoteAnnouncementsApplying = false; }
        }
    } catch (e) {
        console.warn('fetchAnnouncementsFromRemote failed', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}
function getProfileSyncRevision() {
    const raw = localStorage.getItem('itStaffProfilesRevision');
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
}

function bumpProfileSyncRevision(updatedBy = null) {
    const revision = Date.now();
    profileSyncRevision = revision;
    profileSyncLastUpdatedBy = updatedBy || profileSyncLastUpdatedBy || 'local';
    try {
        localStorage.setItem('itStaffProfilesRevision', String(revision));
    } catch (e) {
        console.warn('Failed to persist profile sync revision', e);
    }
    return revision;
}

function shouldApplyRemoteProfiles(remoteData) {
    const remoteRevision = Number(remoteData?.profilesRevision || 0);
    const localRevision = getProfileSyncRevision();
    const remoteUpdatedAt = remoteData?.profilesUpdatedAt ? Date.parse(remoteData.profilesUpdatedAt) : NaN;
    const localUpdatedAt = Number(localStorage.getItem('itStaffProfilesRevision') || 0);

    if (remoteRevision && localRevision > remoteRevision) {
        console.debug('[RemoteSync] skipping stale profile snapshot', { remoteRevision, localRevision });
        return false;
    }

    if (!remoteRevision && Number.isFinite(localRevision) && localRevision > 0) {
        if (Number.isFinite(remoteUpdatedAt) && remoteUpdatedAt <= localUpdatedAt) {
            console.debug('[RemoteSync] skipping remote snapshot with missing revision because local state is newer', { remoteUpdatedAt, localUpdatedAt });
            return false;
        }
        if (!Number.isFinite(remoteUpdatedAt)) {
            console.debug('[RemoteSync] skipping remote snapshot with no revision and no timestamp because local state exists', { localRevision });
            return false;
        }
    }

    return true;
}

function syncLocalStaffProfiles(remoteProfiles, options = {}) {
    if (!remoteProfiles || typeof remoteProfiles !== 'object') {
        return;
    }

    const currentProfiles = getStoredStaffProfiles();
    const remoteAsJson = JSON.stringify(remoteProfiles || {});
    const currentAsJson = JSON.stringify(currentProfiles || {});
    if (remoteAsJson === currentAsJson) {
        return;
    }

    if (!shouldApplyRemoteProfiles({ profilesRevision: options.revision || 0 })) {
        return;
    }

    persistStaffProfiles(remoteProfiles, { skipRemote: true, force: true, revision: options.revision || bumpProfileSyncRevision(options.updatedBy || 'remote') });
    renderITStaffProfileGrid();
    updateBHFMapStaffMarkers();
    populateITTrackerControls();
    updateITTrackerFields();
    if (typeof renderUserListsTable === 'function') {
        renderUserListsTable();
    }
    toastNotice('success', 'Live sync active', 'Staff and shift data were updated from shared state.');
}

async function syncProfilesToRemote(profiles, options = {}) {
    if (!firestoreDb || !profiles || typeof profiles !== 'object') {
        console.warn('[RemoteSync] syncProfilesToRemote skipped', { firestoreDbExists: !!firestoreDb, profilesType: typeof profiles });
        return;
    }

    try {
        const revision = options.revision || bumpProfileSyncRevision(options.updatedBy || profileSyncLastUpdatedBy || 'local');
        console.debug('[RemoteSync] syncProfilesToRemote()', { revision, profiles });
        const docRef = firestoreDb.collection(FIREBASE_REMOTE_DOC.collection).doc(FIREBASE_REMOTE_DOC.doc);
        // Overwrite the shared profiles map so deleted profile keys are removed from Firestore.
        await docRef.set({ profiles, profilesRevision: revision, profilesUpdatedAt: new Date().toISOString(), profilesUpdatedBy: options.updatedBy || profileSyncLastUpdatedBy || 'local' }, { merge: false });
        console.debug('[RemoteSync] syncProfilesToRemote complete', { revision });
    } catch (e) {
        console.error('Failed to sync profiles to remote:', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}

async function syncRoleDefinitionsToRemote(definitions) {
    if (!firestoreDb || !definitions || typeof definitions !== 'object') {
        console.warn('[RemoteSync] syncRoleDefinitionsToRemote skipped', { firestoreDbExists: !!firestoreDb, definitionsType: typeof definitions });
        return;
    }
    try {
        const docRef = firestoreDb.collection(FIREBASE_ROLE_DOC.collection).doc(FIREBASE_ROLE_DOC.doc);
        await docRef.set({ roles: definitions }, { merge: true });
    } catch (e) {
        console.error('Failed to sync role definitions to remote:', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}

async function syncShiftHistoryToRemote(history) {
    if (!firestoreDb || !Array.isArray(history)) {
        console.warn('[RemoteSync] syncShiftHistoryToRemote skipped', { firestoreDbExists: !!firestoreDb, historyType: typeof history });
        return;
    }
    try {
        const docRef = firestoreDb.collection(FIREBASE_SHIFT_DOC.collection).doc(FIREBASE_SHIFT_DOC.doc);
        await docRef.set({ shiftHistory: history }, { merge: true });
    } catch (e) {
        console.error('Failed to sync shift history to remote:', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}

function serializeAnalysisDeleteState() {
    return {
        years: Array.from(deletedAnalysisYears),
        branches: Object.fromEntries(Object.entries(deletedAnalysisBranches).map(([year, set]) => [year, Array.from(set)])),
        monthRemovals: Object.fromEntries(Object.entries(deletedAnalysisMonthRemovals).map(([year, entry]) => [year, {
            all: Array.from(entry.all || []),
            branches: Object.fromEntries(Object.entries(entry.branches || {}).map(([branch, set]) => [branch, Array.from(set)]))
        }]))
    };
}

function restoreAnalysisDeleteState(state) {
    deletedAnalysisYears = new Set(Array.isArray(state?.years) ? state.years : []);
    deletedAnalysisBranches = {};
    deletedAnalysisMonthRemovals = {};
    if (state?.branches && typeof state.branches === 'object') {
        Object.entries(state.branches).forEach(([year, branchList]) => {
            deletedAnalysisBranches[year] = new Set(Array.isArray(branchList) ? branchList : []);
        });
    }
    if (state?.monthRemovals && typeof state.monthRemovals === 'object') {
        Object.entries(state.monthRemovals).forEach(([year, entry]) => {
            deletedAnalysisMonthRemovals[year] = {
                all: new Set(Array.isArray(entry?.all) ? entry.all : []),
                branches: {}
            };
            if (entry?.branches && typeof entry.branches === 'object') {
                Object.entries(entry.branches).forEach(([branch, months]) => {
                    deletedAnalysisMonthRemovals[year].branches[branch] = new Set(Array.isArray(months) ? months : []);
                });
            }
        });
    }
}

function persistAnalysisDeleteState() {
    const state = serializeAnalysisDeleteState();
    try {
        localStorage.setItem('analysisDeleteState', JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to persist analysis delete state to localStorage', e);
    }
    if (isRemoteSyncActive() && !analysisRemoteApplying) {
        pushAnalysisDeleteStateToCloud().catch(e => console.warn('Failed to push analysis delete state to Firestore', e));
    }
}

async function pushAnalysisDeleteStateToCloud() {
    if (!isRemoteSyncActive()) return;
    try {
        await firestoreDb.collection(FIREBASE_ANALYSIS_DOC.collection).doc(FIREBASE_ANALYSIS_DOC.doc).set({ analysisDeleteState: serializeAnalysisDeleteState() }, { merge: false });
    } catch (e) {
        console.error('Failed to sync analysis delete state to remote:', e);
    }
}

function loadAnalysisDeleteStateFromLocal() {
    try {
        const raw = localStorage.getItem('analysisDeleteState');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
            restoreAnalysisDeleteState(data);
        }
    } catch (e) {
        console.warn('Failed to load analysis delete state from localStorage', e);
    }
}

async function syncStaffFeedbacksToRemote(feedbacks) {
    if (!firestoreDb || !Array.isArray(feedbacks)) {
        console.warn('[RemoteSync] syncStaffFeedbacksToRemote skipped', { firestoreDbExists: !!firestoreDb, feedbacksType: typeof feedbacks });
        return;
    }

    try {
        const docRef = firestoreDb.collection(FIREBASE_FEEDBACK_DOC.collection).doc(FIREBASE_FEEDBACK_DOC.doc);
        await docRef.set({ staffFeedbacks: feedbacks }, { merge: false });
    } catch (e) {
        console.error('Failed to sync staff feedbacks to remote:', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}

function persistStaffFeedbacks(feedbacks) {
    try {
        localStorage.setItem('staffFeedbacks', JSON.stringify(feedbacks));
    } catch (e) {
        console.warn('Failed to persist staff feedbacks locally', e);
    }
    if (isRemoteSyncActive() && !staffFeedbackRemoteApplying) {
        syncStaffFeedbacksToRemote(feedbacks).catch(e => console.warn('Failed to push staff feedbacks to Firestore', e));
    }
}

function syncLocalRoleDefinitions(remoteDefinitions) {
    if (!remoteDefinitions || typeof remoteDefinitions !== 'object') return;
    persistRoleDefinitions(remoteDefinitions);
    populateAddStaffRoleOptions();
}

function syncLocalShiftHistory(remoteHistory) {
    if (!Array.isArray(remoteHistory)) return;
    itShiftHistory = remoteHistory;
    persistItShiftHistory();
}

function broadcastProfilesUpdate(profiles) {
    try {
        if (bhfBroadcast) bhfBroadcast.postMessage({ type: 'profiles-updated', profiles });
    } catch (e) { /* ignore */ }
}

function updateRemoteSyncStatusDisplay(status, info) {
    try {
        const el = document.getElementById('remoteSyncStatus');
        if (!el) return;
        el.classList.remove('sync-ok', 'sync-error', 'sync-offline');
        // Hide when status is unknown or OK (connected) to reduce UI noise.
        if (status === 'unknown' || status === 'ok') {
            el.style.display = 'none';
            return;
        }
        // For other states (error/offline) show the indicator.
        el.style.display = 'inline-flex';
        if (status === 'error') el.classList.add('sync-error');
        else el.classList.add('sync-offline');
        el.textContent = `Sync: ${status}` + (info ? ` · ${info}` : '');
    } catch (e) { console.warn(e); }
}

function populateHomeBranchSelect() {
    const select = document.getElementById('homeBranchSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Select branch to view...</option>' +
        Object.keys(BRANCH_LOCATIONS)
            .map(branch => `<option value="${escapeHtml(branch)}">${escapeHtml(branch)}</option>`)
            .join('');
}

function handleHomeBranchSelection(branchName) {
    if (!branchName) return;
    focusBranchOnMap(branchName);
}

function resetHomeBranchSelection() {
    const select = document.getElementById('homeBranchSelect');
    if (select) {
        select.value = '';
    }
    if (!bhfMap) return;
    const bounds = L.latLngBounds(Object.values(BRANCH_LOCATIONS).map(location => [location.lat, location.lng]));
    if (bounds.isValid()) {
        bhfMap.fitBounds(bounds.pad(0.15));
    }
}
const DEFAULT_FEEDBACK_QUESTIONS = [
    "How satisfied are you with the assistance provided by the IT Support Specialist?",
    "Was your IT concern resolved in a timely and efficient manner?",
    "How would you rate the professionalism, courtesy, and communication of the IT Support Specialist?"
];

const DEFAULT_FEEDBACK_CHOICES = [
    ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
    ["Yes", "Partially", "No"],
    ["Excellent", "Good", "Fair", "Poor"]
];

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getStoredFeedbackQuestions() {
    const raw = localStorage.getItem('feedbackQuestions');
    if (raw) {
        try {
            const stored = JSON.parse(raw);
            if (Array.isArray(stored) && stored.length === 3 && stored.every(q => typeof q === 'string')) {
                return stored;
            }
        } catch (e) {
            console.warn('Invalid stored feedback questions:', e);
        }
    }
    localStorage.setItem('feedbackQuestions', JSON.stringify(DEFAULT_FEEDBACK_QUESTIONS));
    return [...DEFAULT_FEEDBACK_QUESTIONS];
}

function getStoredFeedbackChoices() {
    const raw = localStorage.getItem('feedbackChoices');
    if (raw) {
        try {
            const stored = JSON.parse(raw);
            if (Array.isArray(stored) && stored.length === 3 && stored.every(arr => Array.isArray(arr) && arr.every(choice => typeof choice === 'string'))) {
                return stored.map(arr => arr.length ? arr : []);
            }
        } catch (e) {
            console.warn('Invalid stored feedback choices:', e);
        }
    }
    localStorage.setItem('feedbackChoices', JSON.stringify(DEFAULT_FEEDBACK_CHOICES));
    return JSON.parse(JSON.stringify(DEFAULT_FEEDBACK_CHOICES));
}

function saveFeedbackQuestions() {
    const questionItems = Array.from(document.querySelectorAll('.feedback-question-setting'));
    const questions = [];
    const choices = [];

    questionItems.forEach((item) => {
        const textInput = item.querySelector('.feedback-question-text');
        const choiceInputs = Array.from(item.querySelectorAll('.feedback-choice-input'));
        const questionText = textInput?.value.trim();
        const parsedChoices = choiceInputs.map(input => input.value.trim()).filter(line => line);

        if (questionText) {
            questions.push(questionText);
            choices.push(parsedChoices.length ? parsedChoices : ["Yes", "No"]);
        }
    });

    if (questions.length === 0) {
        toastNotice('warning', 'No Questions', 'Please add at least one feedback question before saving.');
        return;
    }

    localStorage.setItem('feedbackQuestions', JSON.stringify(questions));
    localStorage.setItem('feedbackChoices', JSON.stringify(choices));
    renderFeedbackQuestionChoices();
    toastNotice('success', 'Feedback Settings Saved', 'Feedback questions and answer choices were updated successfully.');
}

function parseFeedbackChoices(elementId) {
    const input = document.getElementById(elementId);
    if (!input) return [];
    return input.value.split('\n').map(line => line.trim()).filter(line => line);
}

function updateFeedbackQuestionLabels() {
    // No-op for dynamic question rendering.
}

function setFeedbackStarRating(value) {
    const stars = document.querySelectorAll('#feedbackStarRating .star');
    stars.forEach(star => {
        const starValue = Number(star.getAttribute('data-value'));
        if (starValue <= value) {
            star.classList.add('star-selected');
            star.setAttribute('aria-checked', 'true');
        } else {
            star.classList.remove('star-selected');
            star.setAttribute('aria-checked', 'false');
        }
    });
    const ratingInput = document.getElementById('feedbackRatingInput');
    if (ratingInput) {
        ratingInput.value = value;
    }
}

function getStoredFeedbackBranchOptions() {
    return branches.map(branch => ({ value: branch, label: branch }));
}

function populateFeedbackBranchOptions() {
    const branchSelect = document.getElementById('feedbackBranchSelect');
    if (!branchSelect) return;
    branchSelect.innerHTML = '<option value="">Select branch giving feedback...</option>' + branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
}

function loadFeedbackQuestionSettings() {
    renderFeedbackQuestionSettings();
}

function renderFeedbackQuestionSettings() {
    const questions = getStoredFeedbackQuestions();
    const choices = getStoredFeedbackChoices();
    const container = document.getElementById('feedbackQuestionList');
    if (!container) return;

    container.innerHTML = questions.map((question, index) => {
        const choiceList = choices[index] && choices[index].length ? choices[index] : ['Yes', 'No'];
        const choiceRows = choiceList.map((choice, choiceIndex) => `
            <div class="feedback-choice-row">
                <input class="feedback-choice-input" type="text" value="${escapeHtml(choice)}" placeholder="Enter answer choice" />
                <button type="button" class="btn-secondary" onclick="removeFeedbackChoice(${index}, ${choiceIndex})">Remove</button>
            </div>`).join('');

        return `
            <div class="feedback-question-setting" data-index="${index}" style="border:1px solid #cbd5e1; border-radius:12px; padding:18px; margin-bottom:16px; position:relative; background: #f8fbff;">
                <button type="button" class="btn-secondary" style="position:absolute; top:14px; right:14px; padding:6px 10px;" onclick="removeFeedbackQuestionSetting(${index})">Delete</button>
                <div class="form-element">
                    <label>Question</label>
                    <input class="feedback-question-text" type="text" value="${escapeHtml(question)}" placeholder="Enter the feedback question" />
                </div>
                <div class="form-element">
                    <label>Answer choices</label>
                    <div class="feedback-choice-list">${choiceRows}</div>
                    <button type="button" class="add-btn" style="margin-top: 10px; background: #2563eb; color: white;" onclick="addFeedbackChoice(${index})">+ Add Choice</button>
                    <small style="color:#64748b; display:block; margin-top:8px;">Use one row per answer choice. At least one choice is required.</small>
                </div>
            </div>`;
    }).join('');
}

function addFeedbackQuestionSetting() {
    const questions = getStoredFeedbackQuestions();
    const choices = getStoredFeedbackChoices();
    questions.push('New question');
    choices.push(['Yes', 'No']);
    localStorage.setItem('feedbackQuestions', JSON.stringify(questions));
    localStorage.setItem('feedbackChoices', JSON.stringify(choices));
    renderFeedbackQuestionSettings();
}

function addFeedbackChoice(questionIndex) {
    const questions = getStoredFeedbackQuestions();
    const choices = getStoredFeedbackChoices();
    if (!choices[questionIndex]) {
        choices[questionIndex] = [''];
    } else {
        choices[questionIndex].push('');
    }
    localStorage.setItem('feedbackQuestions', JSON.stringify(questions));
    localStorage.setItem('feedbackChoices', JSON.stringify(choices));
    renderFeedbackQuestionSettings();
}

function removeFeedbackChoice(questionIndex, choiceIndex) {
    const questions = getStoredFeedbackQuestions();
    const choices = getStoredFeedbackChoices();
    if (!choices[questionIndex] || choices[questionIndex].length <= 1) {
        toastNotice('warning', 'Cannot remove', 'At least one answer choice must remain.');
        return;
    }
    choices[questionIndex].splice(choiceIndex, 1);
    localStorage.setItem('feedbackQuestions', JSON.stringify(questions));
    localStorage.setItem('feedbackChoices', JSON.stringify(choices));
    renderFeedbackQuestionSettings();
}

function removeFeedbackQuestionSetting(index) {
    const questions = getStoredFeedbackQuestions();
    const choices = getStoredFeedbackChoices();
    if (questions.length <= 1) {
        toastNotice('warning', 'Cannot remove', 'At least one feedback question must remain.');
        return;
    }
    questions.splice(index, 1);
    choices.splice(index, 1);
    localStorage.setItem('feedbackQuestions', JSON.stringify(questions));
    localStorage.setItem('feedbackChoices', JSON.stringify(choices));
    renderFeedbackQuestionSettings();
}

function renderFeedbackQuestionChoices() {
    const questions = getStoredFeedbackQuestions();
    const choices = getStoredFeedbackChoices();
    const container = document.getElementById('feedbackQuestionsRenderContainer');
    if (!container) return;

    container.innerHTML = questions.map((question, index) => {
        const choiceList = choices[index] && choices[index].length ? choices[index] : DEFAULT_FEEDBACK_CHOICES[index] || ['Yes', 'No'];
        const choiceHtml = choiceList.map(choice => {
            const escaped = escapeHtml(choice);
            return `
                <label class="feedback-option">
                    <input type="radio" name="feedbackQuestion${index}" value="${escaped}" />
                    <span>☐ ${escaped}</span>
                </label>`;
        }).join('');
        return `
            <div class="form-element">
                <label>${escapeHtml(question)}</label>
                <div class="feedback-radio-group">${choiceHtml}</div>
            </div>`;
    }).join('');
}

function initializeFeedbackControls() {
    populateFeedbackBranchOptions();
    loadFeedbackQuestionSettings();
    seedMockStaffFeedbacks();
}

function sanitizeStaffFeedbacks(rawFeedbacks) {
    if (!Array.isArray(rawFeedbacks)) {
        return [];
    }
    return rawFeedbacks.filter(fb => fb && typeof fb.staffKey === 'string' && fb.staffKey.trim().length > 0 && fb.questions && Array.isArray(fb.questions) && fb.answers && Array.isArray(fb.answers) && fb.rating != null);
}

function seedMockStaffFeedbacks() {
    let stored = [];
    try {
        stored = sanitizeStaffFeedbacks(JSON.parse(localStorage.getItem('staffFeedbacks') || '[]'));
    } catch (e) {
        stored = [];
    }

    if (stored.length > 0) {
        localStorage.setItem('staffFeedbacks', JSON.stringify(stored));
        return;
    }

    const profiles = getStoredStaffProfiles();
    const questions = getStoredFeedbackQuestions();
    const now = Date.now();
    const sample = [
        {
            id: 'feedback-sample-1',
            staffKey: 'ali',
            branch: 'SDC',
            department: 'Network Operations',
            rating: 5,
            answers: [
                'Issue was resolved in one visit.',
                'Ali communicated every step clearly.',
                'Yes, I would request Ali again.'
            ],
            questions: questions,
            comment: 'Ali was prompt, professional, and kept us updated at every stage.',
            submittedAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
            submittedBy: 'Branch IT Admin'
        },
        {
            id: 'feedback-sample-2',
            staffKey: 'marc_benson',
            branch: 'Pawnshop Bonifacio',
            department: 'Customer Service',
            rating: 4,
            answers: [
                'Marc finished the task efficiently.',
                'Communication was clear and accurate.',
                'I would request Marc again for similar issues.'
            ],
            questions: questions,
            comment: 'Good work overall, especially on the system upgrade.',
            submittedAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
            submittedBy: 'Branch Manager'
        },
        {
            id: 'feedback-sample-3',
            staffKey: 'franz_renze',
            branch: 'Patch Cafe',
            department: 'Retail Operations',
            rating: 3,
            answers: [
                'Franz solved the issue but needed a follow-up visit.',
                'He was courteous and explained the steps well.',
                'Yes, if needed again.'
            ],
            questions: questions,
            comment: 'The repair was effective but required a second visit.',
            submittedAt: new Date(now - 1000 * 60 * 60 * 24 * 18).toISOString(),
            submittedBy: 'Store Supervisor'
        },
        {
            id: 'feedback-sample-4',
            staffKey: 'ali',
            branch: 'Gemline SM',
            department: 'Sales',
            rating: 5,
            answers: [
                'Ali fixed the printer issue quickly.',
                'He gave clear instructions and timelines.',
                'Absolutely, Ali is my go-to technician.'
            ],
            questions: questions,
            comment: 'Great service with minimal downtime.',
            submittedAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
            submittedBy: 'Sales Lead'
        }
    ];
    localStorage.setItem('staffFeedbacks', JSON.stringify(sample));
}

function generateMockDatabase() {
    const defaultData = {};
    const processors = ["Intel Core i7-12700", "Intel Core i5-12400", "AMD Ryzen 5 5600G"];
    const brands = ["Dell OptiPlex", "HP ProDesk", "Lenovo ThinkCentre"];
    const storages = ["NVMe M.2 SSD", "SATA SSD", "SATA HDD"];
    const usernames = [
        "jsmith", "mjones", "alee", "rgarcia", "kpatel", 
        "dchen", "fwilson", "sproctor", "mmartinez", "blawrence", 
        "crodriguez", "jkelly", "tcampbell", "mhenderson", "rthompson",
        "aparker", "jdavis", "lbrown", "rwhite", "jmiller",
        "rwilson", "amoore", "gtaylor", "jtaylor", "janders",
        "dthomas", "sjackson", "emartin", "alee", "blee"
    ];
    
    branches.forEach(branch => {
        defaultData[branch] = [];
        const terminalCount = branch === "SDC" ? 8 : 5; 

        for (let i = 1; i <= terminalCount; i++) {
            let freeGB = 120;
            let temp = 42;

            if (i === 2) { freeGB = 45; temp = 72; }
            if (i === 4) { freeGB = 12; temp = 88; }
            if (i === 5 && branch.includes("Main")) { freeGB = 8; temp = 38; }

            let health = "Healthy";
            if (freeGB <= 15 || temp >= 85) {
                health = "Critical";
            } else if (freeGB <= 50 || temp >= 70) {
                health = "Warning";
            }

            const storageType = storages[Math.floor(Math.random() * storages.length)];
            const storageWear = getStorageWearForType(storageType);

            const assetInfo = buildAssetWarrantyInfo();
            defaultData[branch].push({
                pcName: `${branch === "SDC" ? "SDC" : branch.substring(0,3).toUpperCase()}-PC-0${i}`,
                state: "Active",
                health: health,
                pcProcessor: processors[Math.floor(Math.random() * processors.length)],
                brand: brands[Math.floor(Math.random() * brands.length)],
                storage: storageType,
                capacity: "512GB",
                freeSpace: `${freeGB}GB`,
                pcTemp: temp,
                processorTemp: temp + 5,
                storageWear: storageWear,
                username: usernames[Math.floor(Math.random() * usernames.length)],
                assetAgeMonths: assetInfo.assetAgeMonths,
                lastService: assetInfo.lastService,
                warrantyExpiresAt: assetInfo.warrantyExpiresAt,
                warrantyDaysRemaining: assetInfo.warrantyDaysRemaining
            });
        }
    });
    return defaultData;
}

// Load pcData from localStorage if present. Do NOT generate mock data by default.
let pcData = null;
try { pcData = JSON.parse(localStorage.getItem('pcData') || 'null'); } catch (e) { pcData = null; }
if (!pcData) pcData = {};
let modificationHistory = JSON.parse(localStorage.getItem("modificationHistory")) || [];
let broadcastRemarks = JSON.parse(localStorage.getItem("broadcastRemarks")) || [];
let announcementBranchSelection = [];

// Ensure all modification history entries have proper user tracking
function ensureModificationHistoryHasUserTracking() {
    modificationHistory = modificationHistory.filter(entry => {
        // Keep entries that have user field, remove legacy ones without it
        return entry.user && entry.userKey;
    });
    persistModificationHistory();
}

// Helper to persist modification history and notify admin UI immediately
// MODIFIED: Saves logging statements to local memory and broadcasts to Cloud Firestore
function persistModificationHistory() {
    pushHistoryToCloud(); // NEW: Triggers cloud snapshot syncing
    try { loadAdminBranchData(); } catch (e) {}
    try { window.dispatchEvent(new Event('modHistoryUpdated')); } catch(e) {}
}
// Listen for internal notifications and cross-tab storage events to refresh admin history
window.addEventListener('modHistoryUpdated', () => { try { loadAdminBranchData(); } catch(e) {} try { refreshITTrackerActivitiesModal(); } catch(e) {} });
window.addEventListener('storage', (e) => {
    if (e.key === 'modificationHistory') {
        modificationHistory = JSON.parse(e.newValue || '[]');
        try { loadAdminBranchData(); } catch (err) { console.error(err); }
        try { refreshITTrackerActivitiesModal(); } catch (err) { console.error(err); }
    }
    if (e.key === 'staffFeedbacks') {
        try { renderStaffFeedbackHistoryPage(); } catch (err) { /* ignore if page not ready */ }
    }
});
// NEW: Uploads updated PC states to the cloud database for all connected users
// NEW: Uploads the primary computer registry data globally to Firestore
async function pushPcDataToCloud() {
    // 1. Keep local storage updated
    localStorage.setItem("pcData", JSON.stringify(pcData));
    
    // 2. Upload to Firestore so all other users/admins instantly receive it
    if (isRemoteSyncActive()) {
        try {
            await firestoreDb.collection(FIREBASE_PCDATA_DOC.collection)
                             .doc(FIREBASE_PCDATA_DOC.doc)
                             .set({ pcData: pcData }, { merge: true });
        } catch (e) { 
            console.error("Cloud snapshot upload failed for pcData:", e); 
        }
    }
}

// NEW: Uploads updated system logs to the cloud database for all connected admins
async function pushHistoryToCloud() {
    localStorage.setItem("modificationHistory", JSON.stringify(modificationHistory));
    if (isRemoteSyncActive()) {
        try {
            await firestoreDb.collection(FIREBASE_HISTORY_DOC.collection)
                             .doc(FIREBASE_HISTORY_DOC.doc)
                             .set({ history: modificationHistory });
        } catch (e) { console.error("Cloud logging save exception:", e); }
    }
}

let selectedBranchGlobal = branches[0];
let activeMetricSummaryKey = null;
let adminAuthenticated = false;
let analysisProblemHistoryEntries = [];
let pendingStaffRemoval = null;

const DEFAULT_IT_STAFF_PROFILES = {
    ali: {
        id: 'ali',
        idNumber: '001',
        name: 'Ali',
        role: 'IT Manager',
        username: 'BHF-Ali',
        password: '123456',
        image: 'images/IT1.jpg',
        phone: '+63 917 000 00s01',
        email: '',
        link: '',
        location: '',
        remarks: ''
    },
    marc_benson: {
        id: 'marc_benson',
        idNumber: '002',
        name: 'Marc Benson',
        role: 'IT Support Specialist',
        username: 'BHF-Benson',
        password: '123456',
        image: 'images/IT2.jpg',
        phone: '+63 917 000 0002',
        email: '',
        link: '',
        location: '',
        remarks: ''
    },
    franz_renze: {
        id: 'franz_renze',
        idNumber: '003',
        name: 'Franz Renze',
        role: 'IT Support Specialist',
        username: 'BHF-Franz',
        password: '123456',
        image: 'images/IT3.jpg',
        phone: '+63 917 000 0003',
        email: '',
        link: '',
        location: '',
        remarks: ''
    }
    ,
    superadmin: {
        id: 'superadmin',
        idNumber: '000',
        name: 'Super Admin',
        role: 'IT Support Specialist',
        username: 'superadminbhf',
        password: '123456',
        image: 'images/IT0.jpg',
        phone: '',
        email: '',
        link: '',
        location: '',
        remarks: '',
        superAdmin: true
    }
};

const DEFAULT_IT_ROLE_DEFINITIONS = {
    'it manager': {
        name: 'IT Manager',
        rank: 1,
        access: {
            view: true,
            editPcs: true,
            editProfiles: true,
            disable: true,
            enable: true,
            delete: true,
            addStaff: true
        }
    },
    'it support specialist': {
        name: 'IT Support Specialist',
        rank: 3,
        access: {
            view: true,
            editPcs: false,
            editProfiles: false,
            disable: true,
            enable: true,
            delete: false,
            addStaff: true
        }
    }
};

function getStoredRoleDefinitions() {
    const raw = localStorage.getItem('itStaffRoleDefinitions');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            const sanitized = sanitizeRoleDefinitions(parsed);
            if (JSON.stringify(sanitized) !== JSON.stringify(parsed)) {
                localStorage.setItem('itStaffRoleDefinitions', JSON.stringify(sanitized));
            }
            return ensureDefaultRoleDefinitions(sanitized);
        } catch (e) {
            console.warn('Failed to parse stored role definitions:', e);
        }
    }
    const copy = JSON.parse(JSON.stringify(DEFAULT_IT_ROLE_DEFINITIONS));
    localStorage.setItem('itStaffRoleDefinitions', JSON.stringify(copy));
    return copy;
}

function sanitizeRoleDefinitions(definitions) {
    const sanitized = { ...definitions };
    Object.keys(sanitized).forEach((key) => {
        if (normalizeRole(key) === 'super administrator' || normalizeRole(sanitized[key]?.name) === 'super administrator') {
            delete sanitized[key];
        }
    });
    return sanitized;
}

function ensureDefaultRoleDefinitions(storedDefinitions) {
    const repaired = sanitizeRoleDefinitions({ ...storedDefinitions });
    let changed = false;
    Object.entries(DEFAULT_IT_ROLE_DEFINITIONS).forEach(([norm, def]) => {
        if (!repaired[norm]) {
            repaired[norm] = JSON.parse(JSON.stringify(def));
            changed = true;
            return;
        }

        const existing = repaired[norm];
        if (existing.name !== def.name) {
            repaired[norm].name = def.name;
            changed = true;
        }

        if (!existing.rank || existing.rank !== def.rank) {
            repaired[norm].rank = def.rank;
            changed = true;
        }

        if (!existing.access || typeof existing.access !== 'object') {
            repaired[norm].access = JSON.parse(JSON.stringify(def.access));
            changed = true;
        } else {
            Object.entries(def.access).forEach(([perm, value]) => {
                if (existing.access[perm] === undefined) {
                    existing.access[perm] = value;
                    changed = true;
                }
            });
        }
    });
    if (changed) {
        localStorage.setItem('itStaffRoleDefinitions', JSON.stringify(repaired));
    }
    return repaired;
}

function persistRoleDefinitions(definitions) {
    localStorage.setItem('itStaffRoleDefinitions', JSON.stringify(definitions));
    if (isRemoteSyncActive() && !remoteSyncApplying) {
        syncRoleDefinitionsToRemote(definitions).catch((e) => console.warn('Remote role sync error', e));
    }
}

function persistItShiftHistory() {
    localStorage.setItem('itShiftHistory', JSON.stringify(itShiftHistory || []));
    if (isRemoteSyncActive() && !remoteSyncApplying) {
        syncShiftHistoryToRemote(itShiftHistory || []).catch((e) => console.warn('Remote shift history sync error', e));
    }
}

function getAvailableStaffRoleNames(includeManager = false) {
    const definitions = getStoredRoleDefinitions();
    return Object.values(definitions)
        .filter(def => normalizeRole(def.name) !== 'super administrator')
        .filter(def => includeManager || normalizeRole(def.name) !== 'it manager')
        .sort((a, b) => (a.rank || 999) - (b.rank || 999))
        .map(def => def.name);
}

function getRoleRank(roleName) {
    const definitions = getStoredRoleDefinitions();
    return definitions[normalizeRole(roleName)]?.rank || 999;
}

function isActorHigherRankThanTarget(actorRole, targetRole) {
    const actorRank = getRoleRank(actorRole);
    const targetRank = getRoleRank(targetRole);
    return normalizeRole(actorRole) === 'it manager' || actorRank < targetRank;
}

function getRoleRankOptions() {
    const definitions = getStoredRoleDefinitions();
    const assigned = Object.values(definitions).map(def => def.rank || 999);
    const maxRank = Math.max(5, ...assigned.filter(rank => rank < 999));
    const options = [{ value: '', label: 'Select a role position' }];

    for (let rank = 2; rank <= maxRank + 1; rank += 1) {
        const existing = Object.values(definitions).find(def => def.rank === rank);
        const label = existing
            ? `${rank} - ${existing.name}`
            : `${rank} - available position`;
        options.push({ value: rank, label });
    }

    return options;
}

function populateRoleRankOptions() {
    const rankSelect = document.getElementById('newRoleRank');
    if (!rankSelect) return;
    const options = getRoleRankOptions();
    rankSelect.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
}

function populateAddStaffRoleOptions() {
    const select = document.getElementById('newStaffRole');
    if (!select) return;
    const currentRole = getCurrentAdminProfile()?.role || '';
    const includeManager = canAssignITManagerRole(currentRole);
    const roles = getAvailableStaffRoleNames(includeManager);
    if (!roles.length) {
        select.innerHTML = '<option value="">No staff roles available</option>';
        return;
    }
    select.innerHTML = '<option value="">Select role</option>' + roles.map(role => `<option value="${role}">${role}</option>`).join('');
}

function openAddRoleModal() {
    const currentRole = getCurrentAdminProfile()?.role || '';
    if (normalizeRole(currentRole) !== 'it manager') {
        toastNotice('warning', 'Access denied', 'Only IT Manager may add custom roles.');
        return;
    }
    populateRoleRankOptions();
    const overlay = document.getElementById('addRoleModalOverlay');
    if (!overlay) return;
    document.getElementById('newRoleName').value = '';
    const rankSelect = document.getElementById('newRoleRank');
    if (rankSelect) rankSelect.value = '';
    ['roleAccessView', 'roleAccessEditPcs', 'roleAccessEditProfiles', 'roleAccessDisable', 'roleAccessEnable', 'roleAccessDelete', 'roleAccessAddStaff'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = id === 'roleAccessView';
    });
    overlay.classList.remove('hidden');
}

function closeAddRoleModal() {
    const overlay = document.getElementById('addRoleModalOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function saveNewRole() {
    const nameInput = document.getElementById('newRoleName');
    const roleName = nameInput?.value.trim();
    const rankSelect = document.getElementById('newRoleRank');
    const rankValue = rankSelect?.value || '';
    const rank = parseInt(rankValue, 10);
    if (!roleName) {
        toastNotice('warning', 'Role Name Required', 'Please enter a name for the new role.');
        return;
    }
    if (!rankValue) {
        toastNotice('warning', 'Position Required', 'Please choose a role position in the role map first.');
        return;
    }
    if (rank === 1) {
        toastNotice('warning', 'Invalid Role Position', 'Position 1 is reserved for IT Manager and cannot be assigned.');
        return;
    }
    const normalizedRoleName = normalizeRole(roleName);
    if (normalizedRoleName === 'it manager') {
        toastNotice('warning', 'Invalid Role', 'IT Manager may not be created as a new role.');
        return;
    }
    const definitions = getStoredRoleDefinitions();
    if (definitions[normalizedRoleName]) {
        toastNotice('warning', 'Duplicate Role', 'A role with that name already exists.');
        return;
    }
    const existingRankOwner = Object.values(definitions).find(def => def.rank === rank);
    if (existingRankOwner) {
        toastNotice('warning', 'Rank Taken', `Position ${rank} is already assigned to ${existingRankOwner.name}. Choose another position.`);
        return;
    }
    definitions[normalizedRoleName] = {
        name: roleName,
        rank,
        access: {
            view: !!document.getElementById('roleAccessView')?.checked,
            editPcs: !!document.getElementById('roleAccessEditPcs')?.checked,
            editProfiles: !!document.getElementById('roleAccessEditProfiles')?.checked,
            disable: !!document.getElementById('roleAccessDisable')?.checked,
            enable: !!document.getElementById('roleAccessEnable')?.checked,
            delete: !!document.getElementById('roleAccessDelete')?.checked,
            addStaff: !!document.getElementById('roleAccessAddStaff')?.checked
        }
    };
    persistRoleDefinitions(definitions);
    closeAddRoleModal();
    populateAddStaffRoleOptions();
    toastNotice('success', 'Role Created', `${roleName} has been added as a new IT staff role.`);
}

// Current authenticated admin username (profile id key)
let adminUserKey = sessionStorage.getItem('adminUserKey') || null;
let currentUserStatusListener = null; // Listener for monitoring current user's profile status
let itShiftHistory = JSON.parse(localStorage.getItem('itShiftHistory') || '[]');

function addShiftHistoryEntry(action, staffKey, details) {
    try {
        const profiles = getStoredStaffProfiles();
        const profile = profiles[staffKey] || {};
        const entry = {
            id: `shift_${Date.now()}`,
            action,
            staffKey,
            staffName: profile.name || staffKey,
            username: profile.username || '',
            details: details || {},
            timestamp: new Date().toISOString()
        };
        itShiftHistory.unshift(entry);
        persistItShiftHistory();
    } catch (e) {
        console.error('Failed to record shift history entry', e);
    }
}

function getStoredStaffProfiles() {
    const raw = localStorage.getItem('itStaffProfiles');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // Auto-repair: ensure all default profiles exist with correct structure
            const repaired = normalizeStoredProfiles(parsed);
            // Ensure superadmin exists for upgraded installs
            if (!repaired.superadmin && DEFAULT_IT_STAFF_PROFILES.superadmin) {
                repaired.superadmin = JSON.parse(JSON.stringify(DEFAULT_IT_STAFF_PROFILES.superadmin));
                // Preserve any existing adminUserKey if present
                console.log('Injected superadmin profile into stored profiles');
            }
            if (JSON.stringify(repaired) !== JSON.stringify(parsed)) {
                localStorage.setItem('itStaffProfiles', JSON.stringify(repaired));
                console.log('Auto-repaired stored profiles: restored missing default values.');
            }
            return repaired;
        } catch (e) {
            console.warn('Failed to parse stored IT staff profiles:', e);
        }
    }

    const legacy = JSON.parse(localStorage.getItem('itStaffData') || '{}');
    const migrated = JSON.parse(JSON.stringify(DEFAULT_IT_STAFF_PROFILES));
    Object.keys(legacy).forEach((key) => {
        if (migrated[key]) {
            migrated[key] = {
                ...migrated[key],
                location: legacy[key].location || '',
                remarks: legacy[key].remarks || ''
            };
        }
    });
    localStorage.setItem('itStaffProfiles', JSON.stringify(migrated));
    return migrated;
}

// Return stored profiles excluding the superadmin ghost account for UI listings
function getVisibleStaffProfiles(includeDisabled = false) {
    try {
        const all = getStoredStaffProfiles() || {};
        const visible = {};
        Object.entries(all).forEach(([k, v]) => {
            if (!v) return;
            const isSuper = (v.superAdmin === true) || k === 'superadmin' || (v.id === 'superadmin');
            if (isSuper) return; // hide superadmin from UI
            if (!includeDisabled && v.disabled) return;
            visible[k] = v;
        });
        return visible;
    } catch (e) {
        return {};
    }
}

function normalizeStoredProfiles(storedProfiles) {
    if (!storedProfiles || typeof storedProfiles !== 'object') return {};
    const normalized = {};
    Object.entries(storedProfiles).forEach(([key, profile]) => {
        const safeProfile = profile && typeof profile === 'object' ? { ...profile } : {};
        safeProfile.id = safeProfile.id || key;
        normalized[key] = safeProfile;
    });
    assignMissingStaffIdNumbers(normalized);
    return normalized;
}

function assignMissingStaffIdNumbers(profiles) {
    const existingIds = Object.values(profiles)
        .map(p => String(p.idNumber || '').trim())
        .filter(Boolean)
        .map(n => Number(n))
        .filter(Number.isFinite);

    let nextId = existingIds.length ? Math.max(...existingIds) + 1 : 1;
    Object.entries(profiles).forEach(([key, profile]) => {
        if (!profile.idNumber) {
            profile.idNumber = String(nextId).padStart(3, '0');
            nextId += 1;
        }
    });
}

function autoRepairStoredProfiles(storedProfiles) {
    // Ensure all default profiles exist with correct usernames
    const repaired = { ...storedProfiles };
    let needsRepair = false;

    ['ali', 'marc_benson', 'franz_renze'].forEach((key) => {
        const defaultProfile = DEFAULT_IT_STAFF_PROFILES[key];
        if (!repaired[key] || repaired[key].username !== defaultProfile.username) {
            // Restore missing or corrupted default profile, but keep location/remarks if they exist
            repaired[key] = {
                ...defaultProfile,
                location: (repaired[key] && repaired[key].location) || '',
                remarks: (repaired[key] && repaired[key].remarks) || ''
            };
            needsRepair = true;
        } else if (!repaired[key].password) {
            // Ensure every profile has the default password if missing
            repaired[key].password = defaultProfile.password;
            needsRepair = true;
        }
    });

    return needsRepair ? repaired : storedProfiles;
}

function persistStaffProfiles(profiles, options = {}) {
    const incomingRaw = JSON.stringify(profiles || {});
    const currentRaw = localStorage.getItem('itStaffProfiles');
    if (currentRaw === incomingRaw && !options.force) {
        if (!options.skipRemote && !remoteSyncApplying && isRemoteSyncActive()) {
            syncProfilesToRemote(profiles, { revision: getProfileSyncRevision(), updatedBy: options.updatedBy || profileSyncLastUpdatedBy || 'local' });
        }
        return;
    }

    const revision = options.revision ?? bumpProfileSyncRevision(options.updatedBy || profileSyncLastUpdatedBy || 'local');
    profileStorageSyncSuppressed = true;
    try {
        localStorage.setItem('itStaffProfiles', incomingRaw);
        localStorage.setItem('itStaffProfilesRevision', String(revision));
    } finally {
        profileStorageSyncSuppressed = false;
    }
    try {
        if (bhfBroadcast) bhfBroadcast.postMessage({ type: 'profiles-updated', profiles });
    } catch (e) { /* ignore */ }
    console.debug('[RemoteSync] persistStaffProfiles', { options, revision, remoteSyncApplying, isRemoteSyncActive: isRemoteSyncActive() });
    if (!options.skipRemote && !remoteSyncApplying && isRemoteSyncActive()) {
        syncProfilesToRemote(profiles, { revision, updatedBy: options.updatedBy || profileSyncLastUpdatedBy || 'local' });
    } else {
        updateRemoteSyncStatusDisplay(isRemoteSyncActive() ? 'ok' : 'offline', isRemoteSyncActive() ? 'Synced' : 'Local only');
    }
}

function getCurrentAdminKey() {
    return adminUserKey || sessionStorage.getItem('adminUserKey') || null;
}

function getCurrentAdminProfile() {
    const currentKey = getCurrentAdminKey();
    if (!currentKey) return null;
    const profiles = getStoredStaffProfiles();
    return profiles[currentKey] || null;
}

function updateAdminProfileMenu() {
    const profileBtnName = document.getElementById('adminProfileName');
    const dropdownName = document.getElementById('adminProfileDropdownName');
    const dropdownRole = document.getElementById('adminProfileDropdownRole');
    const avatar = document.getElementById('adminProfileAvatar');
    const dropdownAvatar = document.getElementById('adminProfileDropdownAvatar');
    const profile = getCurrentAdminProfile();

    if (profileBtnName) profileBtnName.textContent = profile?.name || 'Admin';
    if (dropdownName) dropdownName.textContent = profile?.name || 'Administrator';
    if (dropdownRole) dropdownRole.textContent = profile?.role || 'Administrator';

    const initials = profile?.name ? profile.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() : 'AD';
    if (avatar) {
        if (profile?.image) {
            avatar.innerHTML = `<img src="${profile.image}" alt="${profile.name}" />`;
        } else {
            avatar.textContent = initials;
            avatar.style.backgroundImage = 'none';
        }
    }
    if (dropdownAvatar) {
        if (profile?.image) {
            dropdownAvatar.innerHTML = `<img src="${profile.image}" alt="${profile.name}" />`;
        } else {
            dropdownAvatar.textContent = initials;
            dropdownAvatar.style.backgroundImage = 'none';
        }
    }
    // Show super admin delete button only for super admin users
    try {
        const superBtn = document.getElementById('superAdminDeleteDatasBtn');
        if (superBtn) {
            const isSuper = !!(profile && (profile.superAdmin === true || (profile.id === 'superadmin') || ((profile.username||'').toLowerCase() === 'superadminbhf')));
            superBtn.classList.toggle('hidden', !isSuper);
        }
    } catch (e) { /* ignore */ }
}

function openSuperAdminDeleteModal() {
    initializeSuperAdminDeleteModal();
    document.getElementById('superAdminDeleteModalOverlay')?.classList.remove('hidden');
}

function closeSuperAdminDeleteModal() {
    document.getElementById('superAdminDeleteModalOverlay')?.classList.add('hidden');
}

function initializeSuperAdminDeleteModal() {
    const overlay = document.getElementById('superAdminDeleteModalOverlay');
    if (!overlay) return;

    overlay.querySelectorAll('.superadmin-delete-target').forEach(input => input.checked = false);
    document.getElementById('superAdminDeleteChoicePanel').style.display = 'none';
    const choiceMessage = document.getElementById('superAdminDeleteChoiceMessage');
    if (choiceMessage) choiceMessage.textContent = '';
    document.getElementById('superAdminDeletePcsOptions').style.display = 'none';
    document.getElementById('superAdminDeleteInventoryOptions').style.display = 'none';
    document.getElementById('superAdminDeleteAnalysisOptions').style.display = 'none';
    document.getElementById('superAdminDeleteHistoryOptions').style.display = 'none';
    const allBranchesCheckbox = document.getElementById('superAdminDeletePcsAllBranches');
    if (allBranchesCheckbox) allBranchesCheckbox.checked = false;
    const allHistoryBranchesCheckbox = document.getElementById('superAdminDeleteHistoryAllBranches');
    if (allHistoryBranchesCheckbox) allHistoryBranchesCheckbox.checked = false;
    toggleSuperAdminDeleteHistoryScope('date');

    const branchList = document.getElementById('superAdminDeleteBranchList');
    if (branchList) {
        branchList.innerHTML = branches.map(branch => `
            <label style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px; cursor:pointer;">
                <input type="checkbox" class="superAdminDeleteBranchCheckbox" value="${branch}" />
                ${branch}
            </label>
        `).join('');
    }

    const analysisYearSelect = document.getElementById('superAdminDeleteAnalysisYearSelect');
    if (analysisYearSelect) {
        analysisYearSelect.innerHTML = analysisYears.map(year => `<option value="${year}">${year}</option>`).join('');
        analysisYearSelect.value = String(analysisYears[analysisYears.length - 1] || new Date().getFullYear());
    }

    const analysisBranchList = document.getElementById('superAdminDeleteAnalysisBranchList');
    if (analysisBranchList) {
        analysisBranchList.innerHTML = branches.map(branch => `
            <label style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px; cursor:pointer;">
                <input type="checkbox" class="superAdminDeleteAnalysisBranchCheckbox" value="${branch}" />
                ${branch}
            </label>
        `).join('');
    }
    const allAnalysisBranchesCheckbox = document.getElementById('superAdminDeleteAnalysisAllBranches');
    if (allAnalysisBranchesCheckbox) allAnalysisBranchesCheckbox.checked = false;

    const analysisMonthList = document.getElementById('superAdminDeleteAnalysisMonthList');
    if (analysisMonthList) {
        analysisMonthList.innerHTML = analysisMonths.slice(1).map((month, idx) => `
            <label style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px; cursor:pointer;">
                <input type="checkbox" class="superAdminDeleteAnalysisMonthCheckbox" value="${idx + 1}" />
                ${month}
            </label>
        `).join('');
    }
    const allAnalysisMonthsCheckbox = document.getElementById('superAdminDeleteAnalysisAllMonths');
    if (allAnalysisMonthsCheckbox) allAnalysisMonthsCheckbox.checked = false;

    const inventoryConditionIds = ['warning','critical','offline','highTemp','lowStorage','replacement'];
    inventoryConditionIds.forEach(id => {
        const checkbox = document.getElementById(`superAdminDeleteInventoryCondition_${id}`);
        if (checkbox) checkbox.checked = false;
    });
    const allInv = document.getElementById('superAdminDeleteInventoryAllConditions');
    if (allInv) allInv.checked = false;

    const historyYearSelect = document.getElementById('superAdminDeleteHistoryYearSelect');
    if (historyYearSelect) {
        const now = new Date();
        const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2, now.getFullYear() - 3];
        historyYearSelect.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
        historyYearSelect.value = String(now.getFullYear());
    }

    const historyBranchList = document.getElementById('superAdminDeleteHistoryBranchList');
    if (historyBranchList) {
        historyBranchList.innerHTML = branches.map(branch => `
            <label style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px; cursor:pointer;">
                <input type="checkbox" class="superAdminDeleteHistoryBranchCheckbox" value="${branch}" />
                ${branch}
            </label>
        `).join('');
    }
}

function openSuperAdminDeleteChoice(type) {
    const overlay = document.getElementById('superAdminDeleteModalOverlay');
    if (!overlay) return;
    const checkbox = overlay.querySelector(`.superadmin-delete-target[value="${type}"]`);
    if (checkbox && !checkbox.checked) checkbox.checked = true;
    renderSuperAdminDeleteChoicePanel(type);
    const panel = document.getElementById('superAdminDeleteChoicePanel');
    if (panel) {
        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function closeSuperAdminDeleteChoice() {
    const panel = document.getElementById('superAdminDeleteChoicePanel');
    if (panel) panel.style.display = 'none';
}

function renderSuperAdminDeleteChoicePanel(type) {
    const title = document.getElementById('superAdminDeleteChoiceTitle');
    const subtitle = document.getElementById('superAdminDeleteChoiceSubtitle');
    const message = document.getElementById('superAdminDeleteChoiceMessage');
    const pcsOptions = document.getElementById('superAdminDeletePcsOptions');
    const inventoryOptions = document.getElementById('superAdminDeleteInventoryOptions');
    const analysisOptions = document.getElementById('superAdminDeleteAnalysisOptions');
    const historyOptions = document.getElementById('superAdminDeleteHistoryOptions');

    if (pcsOptions) pcsOptions.style.display = 'none';
    if (inventoryOptions) inventoryOptions.style.display = 'none';
    if (analysisOptions) analysisOptions.style.display = 'none';
    if (historyOptions) historyOptions.style.display = 'none';

    if (title) title.textContent = 'Choice options';
    if (subtitle) subtitle.textContent = 'Configure the selected delete action.';
    if (message) message.textContent = '';

    switch (type) {
        case 'pcs':
            if (title) title.textContent = 'PC Deletion by Branch';
            if (subtitle) subtitle.textContent = 'Select one or more branches to remove PCs from.';
            if (pcsOptions) pcsOptions.style.display = 'block';
            break;
        case 'analysis':
            if (title) title.textContent = 'Analysis Deletion';
            if (subtitle) subtitle.textContent = 'Choose year, branch, and month scope to remove analysis history.';
            if (analysisOptions) analysisOptions.style.display = 'block';
            break;
        case 'inventory':
            if (title) title.textContent = 'Inventory Data Deletion';
            if (subtitle) subtitle.textContent = 'Choose inventory condition groups to remove, or delete all inventory.';
            if (inventoryOptions) inventoryOptions.style.display = 'block';
            break;
        case 'modification_history':
            if (title) title.textContent = 'Modification History Deletion';
            if (subtitle) subtitle.textContent = 'Choose a date, month, or year to clear modification history entries.';
            if (historyOptions) historyOptions.style.display = 'block';
            break;
        case 'it_activities':
            if (title) title.textContent = 'IT Activities Deletion';
            if (subtitle) subtitle.textContent = 'Choose a date, month, or year to clear IT activities entries.';
            if (historyOptions) historyOptions.style.display = 'block';
            break;
        case 'shift_history':
            if (title) title.textContent = 'Shift History Deletion';
            if (subtitle) subtitle.textContent = 'Choose a date, month, or year to clear shift log entries.';
            if (historyOptions) historyOptions.style.display = 'block';
            break;
        case 'staff_feedbacks':
            if (title) title.textContent = 'Feedback History Deletion';
            if (subtitle) subtitle.textContent = 'This removes all stored staff feedback history.';
            break;
        default:
            if (title) title.textContent = 'Choice options';
            if (subtitle) subtitle.textContent = 'Configure the selected delete action.';
            break;
    }
}

function toggleSuperAdminDeletePcsOptions() {
    const show = document.getElementById('superAdminDeletePcsCheckbox')?.checked;
    const options = document.getElementById('superAdminDeletePcsOptions');
    if (options) options.style.display = show ? 'block' : 'none';
}

function toggleSuperAdminDeleteAllBranches(checked) {
    document.querySelectorAll('.superAdminDeleteBranchCheckbox').forEach(cb => { cb.checked = checked; });
}

function toggleSuperAdminDeleteAnalysisAllBranches(checked) {
    document.querySelectorAll('.superAdminDeleteAnalysisBranchCheckbox').forEach(cb => { cb.checked = checked; });
}

function getSelectedSuperAdminDeleteAnalysisBranches() {
    const allBranches = document.getElementById('superAdminDeleteAnalysisAllBranches')?.checked;
    const selected = Array.from(document.querySelectorAll('.superAdminDeleteAnalysisBranchCheckbox:checked')).map(el => el.value);
    if (allBranches || selected.length === branches.length) {
        return [...branches];
    }
    return selected;
}

function toggleSuperAdminDeleteAnalysisAllMonths(checked) {
    document.querySelectorAll('.superAdminDeleteAnalysisMonthCheckbox').forEach(cb => { cb.checked = checked; });
}

function getSelectedSuperAdminDeleteAnalysisMonths() {
    const allMonths = document.getElementById('superAdminDeleteAnalysisAllMonths')?.checked;
    const selected = Array.from(document.querySelectorAll('.superAdminDeleteAnalysisMonthCheckbox:checked')).map(el => Number(el.value));
    if (allMonths || selected.length === analysisMonths.length - 1) {
        return 'all';
    }
    return selected;
}

function toggleSuperAdminDeleteInventoryAllConditions(checked) {
    const conditionIds = ['warning','critical','offline','highTemp','lowStorage','replacement'];
    conditionIds.forEach(id => {
        const checkbox = document.getElementById(`superAdminDeleteInventoryCondition_${id}`);
        if (checkbox) checkbox.checked = checked;
    });
}

function getSelectedInventoryConditions() {
    const allSelected = document.getElementById('superAdminDeleteInventoryAllConditions')?.checked;
    const conditionIds = ['warning','critical','offline','highTemp','lowStorage','replacement'];
    const selected = conditionIds.filter(id => allSelected || document.getElementById(`superAdminDeleteInventoryCondition_${id}`)?.checked);
    return selected;
}

function matchesInventoryDeleteCondition(pc, condition) {
    const health = pc.health || 'Healthy';
    const state = pc.state || pc.stateAtReport || 'Active';
    const temp = Number(pc.temp ?? pc.pcTemp ?? 0);
    const freeSpace = parseGbValue(pc.freeSpace || '0GB');

    switch (condition) {
        case 'warning':
            return health === 'Warning';
        case 'critical':
            return health === 'Critical';
        case 'offline':
            return state === 'Down';
        case 'highTemp':
            return temp >= 70;
        case 'lowStorage':
            return freeSpace <= 50;
        case 'replacement':
            return health === 'Critical' || freeSpace <= 15 || temp >= 85;
        default:
            return false;
    }
}

function deleteAnalysisData(year, selectedBranchValues, selectedMonthValues) {
    const selectedBranches = Array.isArray(selectedBranchValues) ? selectedBranchValues : [selectedBranchValues];
    const useAllBranches = selectedBranches.length === 0 || selectedBranches.length === branches.length || selectedBranches.includes('all');
    const selectedMonths = selectedMonthValues === 'all' ? 'all' : Array.isArray(selectedMonthValues) ? selectedMonthValues : [Number(selectedMonthValues)];
    const useAllMonths = selectedMonths === 'all' || (Array.isArray(selectedMonths) && selectedMonths.length === analysisMonths.length - 1);

    if (useAllMonths) {
        if (useAllBranches) {
            deletedAnalysisYears.add(year);
            return;
        }
        deletedAnalysisBranches[year] = deletedAnalysisBranches[year] || new Set();
        selectedBranches.forEach(branch => deletedAnalysisBranches[year].add(branch));
        return;
    }

    const months = Array.isArray(selectedMonths) ? selectedMonths : [];
    if (!deletedAnalysisMonthRemovals[year]) {
        deletedAnalysisMonthRemovals[year] = { all: new Set(), branches: {} };
    }

    if (useAllBranches) {
        months.forEach(monthValue => deletedAnalysisMonthRemovals[year].all.add(Number(monthValue) - 1));
    } else {
        selectedBranches.forEach(branch => {
            deletedAnalysisMonthRemovals[year].branches[branch] = deletedAnalysisMonthRemovals[year].branches[branch] || new Set();
            months.forEach(monthValue => deletedAnalysisMonthRemovals[year].branches[branch].add(Number(monthValue) - 1));
        });
    }
}

function applyDeletedAnalysisFilters(year, branchData) {
    if (deletedAnalysisYears.has(year)) {
        return [];
    }

    const removals = deletedAnalysisMonthRemovals[year];
    return branchData.map(item => {
        if (deletedAnalysisBranches[year]?.has(item.branch)) {
            return null;
        }

        const copy = { ...item, monthlyScore: Array.isArray(item.monthlyScore) ? [...item.monthlyScore] : [] };

        if (removals) {
            removals.all.forEach(idx => {
                if (copy.monthlyScore[idx] != null) copy.monthlyScore[idx] = 0;
            });
            const branchRemovals = removals.branches[item.branch];
            if (branchRemovals) {
                branchRemovals.forEach(idx => {
                    if (copy.monthlyScore[idx] != null) copy.monthlyScore[idx] = 0;
                });
            }
        }

        return copy;
    }).filter(Boolean);
}

function toggleSuperAdminDeleteAnalysisOptions() {
    const show = document.getElementById('superAdminDeleteAnalysisCheckbox')?.checked;
    const options = document.getElementById('superAdminDeleteAnalysisOptions');
    if (options) options.style.display = show ? 'block' : 'none';
}

function refreshSuperAdminHistoryScopeVisibility() {
    const show = Boolean(
        document.getElementById('superAdminDeleteModificationHistoryCheckbox')?.checked ||
        document.getElementById('superAdminDeleteActivitiesCheckbox')?.checked ||
        document.getElementById('superAdminDeleteShiftHistoryCheckbox')?.checked
    );
    const options = document.getElementById('superAdminDeleteHistoryOptions');
    if (options) options.style.display = show ? 'block' : 'none';
}

function toggleSuperAdminDeleteHistoryScope(scope) {
    const dateContainer = document.getElementById('superAdminDeleteHistoryDate');
    const monthContainer = document.getElementById('superAdminDeleteHistoryMonth');
    const yearContainer = document.getElementById('superAdminDeleteHistoryYear');

    if (dateContainer) dateContainer.style.display = scope === 'date' ? 'block' : 'none';
    if (monthContainer) monthContainer.style.display = scope === 'month' ? 'block' : 'none';
    if (yearContainer) yearContainer.style.display = scope === 'year' ? 'block' : 'none';
}

function getSuperAdminDeleteHistoryFilter() {
    const scopeInput = document.querySelector('input[name="superAdminDeleteHistoryScopeType"]:checked');
    const scope = scopeInput?.value || 'date';
    const selectedBranches = getSelectedSuperAdminDeleteHistoryBranches();
    if (scope === 'date') {
        const value = document.getElementById('superAdminDeleteHistoryDateInput')?.value;
        if (!value) return null;
        const target = new Date(value);
        target.setHours(0, 0, 0, 0);
        return entry => {
            const logDate = new Date(entry.timestamp);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === target.getTime() && isHistoryEntryInSelectedBranches(entry, selectedBranches);
        };
    }

    if (scope === 'month') {
        const value = document.getElementById('superAdminDeleteHistoryMonthInput')?.value;
        if (!value) return null;
        const [year, month] = value.split('-').map(Number);
        return entry => {
            const logDate = new Date(entry.timestamp);
            return logDate.getFullYear() === year && logDate.getMonth() + 1 === month && isHistoryEntryInSelectedBranches(entry, selectedBranches);
        };
    }

    if (scope === 'year') {
        const value = document.getElementById('superAdminDeleteHistoryYearSelect')?.value;
        if (!value) return null;
        const year = Number(value);
        return entry => {
            const logDate = new Date(entry.timestamp);
            return logDate.getFullYear() === year && isHistoryEntryInSelectedBranches(entry, selectedBranches);
        };
    }

    return null;
}

function getSelectedSuperAdminDeleteHistoryBranches() {
    const allBranches = document.getElementById('superAdminDeleteHistoryAllBranches')?.checked;
    if (allBranches) return [...branches];
    const selected = Array.from(document.querySelectorAll('.superAdminDeleteHistoryBranchCheckbox:checked')).map(el => el.value);
    return selected;
}

function toggleSuperAdminDeleteHistoryAllBranches(checked) {
    document.querySelectorAll('.superAdminDeleteHistoryBranchCheckbox').forEach(cb => { cb.checked = checked; });
}

function isHistoryEntryInSelectedBranches(entry, selectedBranches) {
    if (!selectedBranches || selectedBranches.length === 0) return true;
    return selectedBranches.includes(entry.branch || entry.location || entry.targetBranch || '');
}

function getSelectedSuperAdminDeleteBranches() {
    const allBranches = document.getElementById('superAdminDeletePcsAllBranches')?.checked;
    if (allBranches) return [...branches];
    return Array.from(document.querySelectorAll('.superAdminDeleteBranchCheckbox:checked')).map(el => el.value);
}

async function performSuperAdminDelete() {
    const overlay = document.getElementById('superAdminDeleteModalOverlay');
    if (!overlay) return;
    const checked = Array.from(overlay.querySelectorAll('.superadmin-delete-target[type="checkbox"]:checked')).map(i => i.value);
    if (!checked || checked.length === 0) {
        toastNotice('warning', 'No selection', 'Please select at least one dataset to delete.');
        return;
    }

    const requiresBranchSelection = checked.includes('pcs');
    const requiresAnalysisSelection = checked.includes('analysis');
    const requiresHistoryScope = checked.includes('modification_history') || checked.includes('it_activities') || checked.includes('shift_history');
    const selectedBranches = requiresBranchSelection ? getSelectedSuperAdminDeleteBranches() : [];
    const selectedAnalysisBranches = requiresAnalysisSelection ? getSelectedSuperAdminDeleteAnalysisBranches() : [];
    const historyFilter = requiresHistoryScope ? getSuperAdminDeleteHistoryFilter() : () => true;

    if (requiresBranchSelection && (!selectedBranches || selectedBranches.length === 0)) {
        toastNotice('warning', 'No branch selection', 'Please select at least one branch or All branches for PC deletion.');
        return;
    }
    if (requiresAnalysisSelection) {
        const analysisYear = Number(document.getElementById('superAdminDeleteAnalysisYearSelect')?.value);
        if (!analysisYear || Number.isNaN(analysisYear)) {
            toastNotice('warning', 'Year required', 'Please select a year for analysis deletion.');
            return;
        }
        if (!selectedAnalysisBranches || selectedAnalysisBranches.length === 0) {
            toastNotice('warning', 'Branch selection required', 'Please select at least one branch or All branches for analysis deletion.');
            return;
        }
    }
    if (requiresHistoryScope && !historyFilter) {
        toastNotice('warning', 'History scope required', 'Please select a date, month, or year for history deletion.');
        return;
    }

    if (!confirm('Permanently delete selected datasets? This cannot be undone.')) return;

    const currentAdmin = getCurrentAdminKey() || adminUserKey || 'superadmin';

    try {
        // All IT Staffs
        if (checked.includes('it_staffs')) {
            // Preserve current superadmin if present to avoid lockout
            const stored = getStoredStaffProfiles();
            const keepKey = currentAdmin;
            const newProfiles = {};
            if (stored[keepKey]) newProfiles[keepKey] = stored[keepKey];
            persistStaffProfiles(newProfiles, { force: true, updatedBy: currentAdmin });
        }

        // PCs deletion by branch selection
        if (checked.includes('pcs')) {
            const selectedBranches = getSelectedSuperAdminDeleteBranches();
            if (!selectedBranches || selectedBranches.length === 0) {
                toastNotice('warning', 'No branch selection', 'Please select at least one branch for PC deletion.');
                return;
            }
            selectedBranches.forEach(branch => {
                if (pcData[branch]) {
                    delete pcData[branch];
                }
            });
            try { localStorage.setItem('pcData', JSON.stringify(pcData)); } catch (e) {}
            try { pushPcDataToCloud().catch(()=>{}); } catch(e){}
            try { renderInventoryReportView(); } catch(e){}
        }

        // All Inventory
        if (checked.includes('inventory')) {
            const selectedConditions = getSelectedInventoryConditions();
            if (!selectedConditions || selectedConditions.length === 0) {
                toastNotice('warning', 'Inventory selection required', 'Please select at least one inventory condition or choose Delete all inventory condition groups.');
                return;
            }
            const allSelected = document.getElementById('superAdminDeleteInventoryAllConditions')?.checked;
            if (allSelected || selectedConditions.length === 6) {
                pcData = {};
            } else {
                branches.forEach(branch => {
                    const list = pcData[branch] || [];
                    const filtered = list.filter(pc => !selectedConditions.some(condition => matchesInventoryDeleteCondition(pc, condition)));
                    if (filtered.length > 0) {
                        pcData[branch] = filtered;
                    } else {
                        delete pcData[branch];
                    }
                });
            }
            try { localStorage.setItem('pcData', JSON.stringify(pcData)); } catch (e) {}
            try { pushPcDataToCloud().catch(()=>{}); } catch(e){}
            try { renderInventoryReportView(); } catch(e){}
        }

        // Analysis deletion for selected year/branches/month
        if (checked.includes('analysis')) {
            const analysisYear = Number(document.getElementById('superAdminDeleteAnalysisYearSelect')?.value);
            const analysisBranches = getSelectedSuperAdminDeleteAnalysisBranches();
            const analysisMonthSelection = getSelectedSuperAdminDeleteAnalysisMonths();
            if (!analysisYear || Number.isNaN(analysisYear)) {
                toastNotice('warning', 'Year required', 'Please select a year for analysis deletion.');
                return;
            }
            if (!analysisBranches || analysisBranches.length === 0) {
                toastNotice('warning', 'Branch selection required', 'Please select at least one branch or All branches for analysis deletion.');
                return;
            }
            if (analysisMonthSelection === 'all' || (Array.isArray(analysisMonthSelection) && analysisMonthSelection.length > 0)) {
                deleteAnalysisData(analysisYear, analysisBranches, analysisMonthSelection);
                persistAnalysisDeleteState();
            } else {
                toastNotice('warning', 'Month selection required', 'Please select at least one month or All months for analysis deletion.');
                return;
            }
            try { renderAnalysisView(); } catch (e) {}
        }

        // Modification history / IT activities
        const selectedHistoryBranches = getSelectedSuperAdminDeleteHistoryBranches();
        const historyScope = getSuperAdminDeleteHistoryFilter();
        if ((checked.includes('modification_history') || checked.includes('it_activities') || checked.includes('shift_history')) && (!selectedHistoryBranches || selectedHistoryBranches.length === 0)) {
            toastNotice('warning', 'Branch selection required', 'Please choose at least one branch or All branches for history deletion.');
            return;
        }
        if ((checked.includes('modification_history') || checked.includes('it_activities')) && historyScope) {
            modificationHistory = modificationHistory.filter(entry => !historyScope(entry));
            try { persistModificationHistory(); } catch (e) {}
            try { pushHistoryToCloud().catch(()=>{}); } catch(e){}
        } else if ((checked.includes('modification_history') || checked.includes('it_activities')) && !historyScope) {
            toastNotice('warning', 'History scope required', 'Please select a date, month, or year for history deletion.');
            return;
        }

        // Staff feedbacks
        if (checked.includes('staff_feedbacks')) {
            persistStaffFeedbacks([]);
            try { renderStaffFeedbackHistoryPage(); } catch (e) {}
        }

        // Shift history
        if (checked.includes('shift_history')) {
            const historyScope = getSuperAdminDeleteHistoryFilter();
            if (!historyScope) {
                toastNotice('warning', 'History scope required', 'Please select a date, month, or year for shift history deletion.');
                return;
            }
            itShiftHistory = itShiftHistory.filter(entry => !historyScope(entry));
            try { persistItShiftHistory(); } catch (e) {}
        }

        // Ensure remote docs reflect deletions where applicable
        if (isRemoteSyncActive()) {
            try {
                // Clear remote profiles if requested (will keep only current admin)
                if (checked.includes('it_staffs')) {
                    const p = getStoredStaffProfiles();
                    await syncProfilesToRemote(p, { updatedBy: currentAdmin });
                }
                if (checked.includes('pcs') || checked.includes('inventory')) {
                    await firestoreDb.collection(FIREBASE_PCDATA_DOC.collection).doc(FIREBASE_PCDATA_DOC.doc).set({ pcData }, { merge: false });
                }
                if (checked.includes('modification_history') || checked.includes('it_activities')) {
                    await firestoreDb.collection(FIREBASE_HISTORY_DOC.collection).doc(FIREBASE_HISTORY_DOC.doc).set({ history: modificationHistory }, { merge: false });
                }
                if (checked.includes('shift_history')) {
                    await firestoreDb.collection(FIREBASE_SHIFT_DOC.collection).doc(FIREBASE_SHIFT_DOC.doc).set({ shiftHistory: itShiftHistory }, { merge: false });
                }
                if (checked.includes('analysis')) {
                    await firestoreDb.collection(FIREBASE_ANALYSIS_DOC.collection).doc(FIREBASE_ANALYSIS_DOC.doc).set({ analysisDeleteState: serializeAnalysisDeleteState() }, { merge: false });
                }
                if (checked.includes('staff_feedbacks')) {
                    await firestoreDb.collection(FIREBASE_FEEDBACK_DOC.collection).doc(FIREBASE_FEEDBACK_DOC.doc).set({ staffFeedbacks: JSON.parse(localStorage.getItem('staffFeedbacks') || '[]') }, { merge: false });
                }
            } catch (e) { console.error('SuperAdmin delete remote ops failed', e); }
        }

        toastNotice('success', 'Delete complete', 'Selected datasets were cleared.');
    } catch (e) {
        console.error('SuperAdmin delete failed', e);
        toastNotice('error', 'Delete failed', 'An error occurred while deleting datasets. Check console.');
    } finally {
        try { closeSuperAdminDeleteModal(); } catch (e) {}
        try { updateNavVisibility(); } catch (e) {}
        try { renderITStaffProfileGrid(); } catch (e) {}
        try { renderInventoryReportView(); } catch (e) {}
        try { refreshITTrackerActivitiesModal(); } catch (e) {}
    }
}

function showUserListsPage() {
    closeSideMenu();
    hideAllPages();
    const target = document.getElementById('userListsPage');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    updateUserDirectoryActions();
    renderUserListsTable();
    populateAddStaffRoleOptions();
    try { updateHamburgerVisibility(); } catch (e) {}
}

function updateUserDirectoryActions() {
    const currentRole = getCurrentAdminProfile()?.role || '';
    const addRoleButton = document.getElementById('addRoleButton');
    const deleteRoleButton = document.getElementById('deleteRoleButton');
    const isManager = normalizeRole(currentRole) === 'it manager' || isSuperAdminUser(getCurrentAdminKey());
    if (addRoleButton) {
        addRoleButton.style.display = isManager ? 'inline-flex' : 'none';
    }
    if (deleteRoleButton) {
        deleteRoleButton.style.display = isManager ? 'inline-flex' : 'none';
    }
}

function getRoleOptionsForDeletion() {
    const definitions = getStoredRoleDefinitions();
    return Object.values(definitions)
        .filter(def => normalizeRole(def.name) !== 'it manager')
        .sort((a, b) => (a.rank || 999) - (b.rank || 999));
}

function openDeleteRoleModal() {
    const currentRole = getCurrentAdminProfile()?.role || '';
    if (normalizeRole(currentRole) !== 'it manager') {
        toastNotice('warning', 'Access denied', 'Only IT Manager may delete roles.');
        return;
    }
    const select = document.getElementById('deleteRoleSelect');
    if (!select) return;
    const options = getRoleOptionsForDeletion();
    select.innerHTML = '<option value="">Select a role to delete</option>' + options.map(def => `
        <option value="${def.name}">${def.rank} - ${def.name}</option>`).join('');
    const overlay = document.getElementById('deleteRoleModalOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function closeDeleteRoleModal() {
    const overlay = document.getElementById('deleteRoleModalOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function deleteSelectedRole() {
    const select = document.getElementById('deleteRoleSelect');
    const roleName = select?.value || '';
    if (!roleName) {
        toastNotice('warning', 'Role Required', 'Please select a role to delete.');
        return;
    }
    const definitions = getStoredRoleDefinitions();
    const normalizedRoleName = normalizeRole(roleName);
    if (!definitions[normalizedRoleName]) {
        toastNotice('error', 'Not Found', 'The selected role could not be found.');
        return;
    }
    delete definitions[normalizedRoleName];
    persistRoleDefinitions(definitions);
    closeDeleteRoleModal();
    populateAddStaffRoleOptions();
    toastNotice('success', 'Role Deleted', `${roleName} has been removed from the role map.`);
}

function renderUserListsTable() {
    const tableBody = document.getElementById('userListsTableBody');
    if (!tableBody) return;
    const storedProfiles = getVisibleStaffProfiles(true);
    const profiles = Object.entries(storedProfiles)
        .map(([key, profile]) => ({ key, profile }))
        .sort((a, b) => {
            const priority = {
                'IT Manager': 1,
                'IT Support Specialist': 2
            };
            const roleDiff = (priority[a.profile.role] || 999) - (priority[b.profile.role] || 999);
            if (roleDiff !== 0) return roleDiff;
            const aId = Number(a.profile.idNumber || a.key.replace(/[^0-9]/g, ''));
            const bId = Number(b.profile.idNumber || b.key.replace(/[^0-9]/g, ''));
            return Number.isFinite(aId) && Number.isFinite(bId) ? aId - bId : 0;
        });
    const currentProfile = getCurrentAdminProfile();
    const currentRole = currentProfile?.role || '';
    const currentKey = getCurrentAdminKey();

    console.debug('renderUserListsTable: currentKey, currentRole', { currentKey, currentRole });

    // Fallback: if session key/profile not available, try to infer from header name (helps when sessionStorage isn't set)
    let effectiveKey = currentKey;
    let effectiveRole = currentRole;
    if (!effectiveKey || !currentProfile) {
        try {
            const headerName = document.getElementById('adminProfileName')?.textContent?.trim();
            if (headerName) {
                const found = Object.entries(storedProfiles).find(([k, v]) => (v.name || '').trim() === headerName.trim());
                if (found) {
                    effectiveKey = found[0];
                    effectiveRole = found[1].role || effectiveRole;
                    console.debug('renderUserListsTable: inferred current admin from header', { effectiveKey, effectiveRole });
                }
            }
        } catch (e) { /* ignore fallback errors */ }
    }

    tableBody.innerHTML = profiles.map(({ key: profileKey, profile }) => {
        const idNumber = profile.idNumber || profileKey.replace(/[^0-9]/g, '') || '---';
        const isDisabled = profile.disabled;
        const statusLabel = isDisabled ? 'Disabled' : 'Active';
        const isSelf = effectiveKey === profileKey;
        const canDisable = canDisableProfile(effectiveRole, profile.role) && !isDisabled && !isSelf;
        const canEnable = canEnableProfile(effectiveRole, profile.role) && isDisabled && !isSelf;
        const canDelete = canDeleteProfile(effectiveRole, profile.role) && !isSelf;

        console.debug('renderUserListsTable: profile check', { profileKey, profileId: profile.id, profileRole: profile.role, isDisabled, canDisable, canEnable, canDelete, effectiveKey, effectiveRole });

        const actionButtons = [];
        const normalizedEffectiveRole = normalizeRole(effectiveRole);
        const currentIsSuperAdmin = isSuperAdminUser(effectiveKey);
        if (!isSelf) {
            if (normalizedEffectiveRole === 'it manager' || currentIsSuperAdmin) {
                if (!isDisabled) {
                    actionButtons.push(`<button type="button" class="secondary-btn" style="padding:5px 10px; font-size:12px;" data-action="disable" data-staff="${profileKey}" onclick="queueDisableStaff('${profileKey}')" ${canDisable ? '' : 'disabled'}>Disable</button>`);
                    actionButtons.push(`<button type="button" class="delete-btn" style="padding:5px 10px; font-size:12px;" data-action="delete" data-staff="${profileKey}" onclick="deleteStaffProfile('${profileKey}')" ${canDelete ? '' : 'disabled'}>Delete</button>`);
                } else {
                    actionButtons.push(`<button type="button" class="add-btn" style="padding:5px 10px; font-size:12px;" data-action="enable" data-staff="${profileKey}" onclick="enableStaff('${profileKey}')" ${canEnable ? '' : 'disabled'}>Enable</button>`);
                    actionButtons.push(`<button type="button" class="delete-btn" style="padding:5px 10px; font-size:12px;" data-action="delete" data-staff="${profileKey}" onclick="deleteStaffProfile('${profileKey}')" ${canDelete ? '' : 'disabled'}>Delete</button>`);
                }
            } else {
                if (!isDisabled) {
                    if (canDisable) {
                        actionButtons.push(`<button type="button" class="secondary-btn" style="padding:5px 10px; font-size:12px;" data-action="disable" data-staff="${profileKey}">Disable</button>`);
                    }
                } else {
                    if (canEnable) {
                        actionButtons.push(`<button type="button" class="add-btn" style="padding:5px 10px; font-size:12px;" data-action="enable" data-staff="${profileKey}">Enable</button>`);
                    }
                }
            }
            if (normalizedEffectiveRole === 'it manager' || currentIsSuperAdmin) {
                actionButtons.push(`<button type="button" class="add-btn promote-btn" data-staff="${profileKey}" data-action="promote" style="padding:5px 10px; font-size:12px;">Promote</button>`);
                actionButtons.push(`<button type="button" class="secondary-btn demote-btn" data-staff="${profileKey}" data-action="demote" style="padding:5px 10px; font-size:12px;">Demote</button>`);
            }
        }

        if (!actionButtons.length) {
            actionButtons.push('<span style="color:#64748b; font-size:12px;">No actions</span>');
        }

        return `
            <tr>
                <td>${idNumber}</td>
                <td>${profile.name || 'Unknown'}</td>
                <td>${profile.username || 'N/A'}</td>
                <td>${profile.password || 'N/A'}</td>
                <td>${profile.role || 'N/A'}</td>
                <td>${statusLabel}</td>
                <td style="display:flex; gap:8px; flex-wrap:wrap;">${actionButtons.join('')}</td>
            </tr>
        `;
    }).join('');

    // Attach a single delegated handler on the table body so events work despite innerHTML re-renders
    try {
        if (!tableBody._roleChangeDelegated) {
            tableBody.addEventListener('click', (e) => {
                const btn = (e.target instanceof Element ? e.target : e.target.parentElement)?.closest('button');
                if (!btn) return;
                const action = btn.getAttribute('data-action');
                const staffId = btn.getAttribute('data-staff');
                if (!action || !staffId) return;

                if (action === 'promote') {
                    console.log('[RoleChange] promote clicked', { staffId });
                    openStaffRoleChangeModal(staffId, 'promote');
                    return;
                }
                if (action === 'demote') {
                    console.log('[RoleChange] demote clicked', { staffId });
                    openStaffRoleChangeModal(staffId, 'demote');
                    return;
                }
                if (action === 'delete') {
                    if (!btn.disabled) {
                        console.log('[UserList] delete clicked', { staffId, action, eventTarget: e.target });
                        deleteStaffProfile(staffId);
                    }
                    return;
                }
                if (action === 'disable') {
                    if (!btn.disabled) {
                        queueDisableStaff(staffId);
                    }
                    return;
                }
                if (action === 'enable') {
                    if (!btn.disabled) {
                        enableStaff(staffId);
                    }
                    return;
                }
            });
            tableBody._roleChangeDelegated = true;
        }
    } catch (e) { console.warn('Failed to attach delegated promote/demote handler', e); }
}

function normalizeRole(role) {
    return String(role || '').trim().toLowerCase();
}

function getRoleAccess(roleName) {
    const definitions = getStoredRoleDefinitions();
    return definitions[normalizeRole(roleName)]?.access || {};
}

function canDisableProfile(actorRole, targetRole, actorKey = '') {
    const actor = normalizeRole(actorRole);
    const target = normalizeRole(targetRole);
    if (actor === 'it manager' || isSuperAdminUser(actorKey)) return true;
    if (target === 'it manager' && !isSuperAdminUser(actorKey)) return false;
    return getRoleAccess(actorRole).disable === true && isActorHigherRankThanTarget(actorRole, targetRole);
}

function canEnableProfile(actorRole, targetRole, actorKey = '') {
    const actor = normalizeRole(actorRole);
    const target = normalizeRole(targetRole);
    if (actor === 'it manager' || isSuperAdminUser(actorKey)) return true;
    if (target === 'it manager' && !isSuperAdminUser(actorKey)) return false;
    return getRoleAccess(actorRole).enable === true && isActorHigherRankThanTarget(actorRole, targetRole);
}

function canDeleteProfile(actorRole, targetRole, actorKey = '') {
    const actor = normalizeRole(actorRole);
    if (actor === 'it manager' || isSuperAdminUser(actorKey)) return true;
    if (normalizeRole(targetRole) === 'it manager' && !isSuperAdminUser(actorKey)) return false;
    return getRoleAccess(actorRole).delete === true && isActorHigherRankThanTarget(actorRole, targetRole);
}

let pendingRoleChange = null;

function openStaffRoleChangeModal(staffId, actionType) {
    const currentRole = getCurrentAdminProfile()?.role || '';
    if (normalizeRole(currentRole) !== 'it manager' && !isSuperAdminUser(getCurrentAdminKey())) {
        toastNotice('warning', 'Access denied', 'Only IT Manager may change staff roles.');
        return;
    }
    const profiles = getStoredStaffProfiles();
    const profile = profiles[staffId];
    if (!profile) {
        toastNotice('error', 'Not found', 'Selected staff member was not found.');
        return;
    }
    pendingRoleChange = { staffId, actionType };
    const title = actionType === 'promote' ? 'Promote Staff' : 'Demote Staff';
    document.getElementById('staffRoleChangeTitle').textContent = title;
    document.getElementById('staffRoleChangeLabel').textContent = `Choose the role to ${actionType} ${profile.name || 'staff member'} to.`;
    const select = document.getElementById('staffRoleChangeSelect');
    const roles = getAvailableStaffRoleNames(true);
    if (select) {
        select.innerHTML = '<option value="">Select role</option>' + roles.map(role => {
            const selected = role === profile.role ? ' selected' : '';
            return `<option value="${role}"${selected}>${role}</option>`;
        }).join('');
    }
    const overlay = document.getElementById('staffRoleChangeModal');
    if (overlay) {
        overlay.classList.remove('hidden');
        try { overlay.style.display = 'flex'; overlay.style.zIndex = '10050'; } catch (e) {}
    }
}

function closeStaffRoleChangeModal() {
    document.getElementById('staffRoleChangeModal')?.classList.add('hidden');
    pendingRoleChange = null;
}

function confirmStaffRoleChange() {
    if (!pendingRoleChange) return;
    const { staffId, actionType } = pendingRoleChange;
    const select = document.getElementById('staffRoleChangeSelect');
    const selectedRole = select?.value || '';
    if (!selectedRole) {
        toastNotice('warning', 'Select a role', 'Please choose a role before saving.');
        return;
    }
    const profiles = getStoredStaffProfiles();
    const profile = profiles[staffId];
    if (!profile) {
        toastNotice('error', 'Not found', 'Selected staff member was not found.');
        return;
    }
    if (normalizeRole(profile.role) === normalizeRole(selectedRole)) {
        toastNotice('info', 'No change', 'The selected role is already assigned to this staff member.');
        return;
    }
    profile.role = selectedRole;
    persistStaffProfiles(profiles);
    toastNotice('success', 'Role updated', `${profile.name || 'Staff member'} is now ${selectedRole}.`);
    closeStaffRoleChangeModal();
    renderUserListsTable();
}

// Diagnostic helper: shows role-change related info (for troubleshooting without console)
function runRoleChangeDiagnostics() {
    try {
        const adminKey = sessionStorage.getItem('adminUserKey');
        const adminRoleText = document.getElementById('adminProfileDropdownRole')?.textContent?.trim() || '(not visible)';
        const promoteCount = document.querySelectorAll('.promote-btn').length;
        const demoteCount = document.querySelectorAll('.demote-btn').length;
        const tableBody = document.getElementById('userListsTableBody');
        const delegated = !!(tableBody && tableBody._roleChangeDelegated);
        const msg = [
            `adminUserKey: ${adminKey}`,
            `adminRole (header): ${adminRoleText}`,
            `promote buttons found: ${promoteCount}`,
            `demote buttons found: ${demoteCount}`,
            `table delegated handler: ${delegated}`
        ].join('\n');
        console.log('[RoleChangeDiag] ', { adminKey, adminRoleText, promoteCount, demoteCount, delegated });
        alert(msg);
        return { adminKey, adminRoleText, promoteCount, demoteCount, delegated };
    } catch (e) {
        console.error('runRoleChangeDiagnostics failed', e);
        alert('Diagnostics failed - see console for details.');
        return null;
    }
}

function canModifyProfile(actorRole, targetRole, actorKey = '') {
    const actor = normalizeRole(actorRole);
    if (actor === 'it manager' || isSuperAdminUser(actorKey)) return true;
    if (!actorRole || !targetRole) return false;
    if (normalizeRole(targetRole) === 'it manager' && !isSuperAdminUser(actorKey)) return false;
    return getRoleAccess(actorRole).editProfiles === true && isActorHigherRankThanTarget(actorRole, targetRole);
}

function queueDisableStaff(staffKey) {
    pendingStaffRemoval = staffKey;
    const profiles = getStoredStaffProfiles();
    const profile = profiles[staffKey];
    const text = document.getElementById('removeStaffModalText');
    if (text) {
        text.textContent = `Disable ${profile.name}? This will keep their history while removing them from active roster views.`;
    }
    const overlay = document.getElementById('removeStaffModalOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function enableStaff(staffKey) {
    const profiles = getStoredStaffProfiles();
    if (!profiles[staffKey]) return;
    const profileName = profiles[staffKey].name || 'Staff member';
    profiles[staffKey] = {
        ...profiles[staffKey],
        disabled: false
    };
    persistStaffProfiles(profiles);
    recordModification('enable_profile', staffKey, { name: profileName });
    renderUserListsTable();
    populateITTrackerControls();
    renderITStaffProfileGrid();
    toastNotice('success', 'Staff Enabled', `${profileName} is now active again.`);
}

function deleteStaffProfile(staffKey) {
    console.debug('[deleteStaffProfile] called', { staffKey });
    if (!staffKey) {
        console.warn('[deleteStaffProfile] no staffKey supplied');
        return;
    }
    const profiles = getStoredStaffProfiles();
    let profile = profiles[staffKey];
    let resolvedKey = staffKey;

    if (!profile) {
        // Support deletion by name or username when id is missing or invalid
        const normalizedSearch = String(staffKey).trim().toLowerCase();
        const found = Object.entries(profiles).find(([key, candidate]) => {
            return (candidate.name || '').trim().toLowerCase() === normalizedSearch
                || (candidate.username || '').trim().toLowerCase() === normalizedSearch
                || key.trim().toLowerCase() === normalizedSearch;
        });
        if (found) {
            resolvedKey = found[0];
            profile = found[1];
        }
    }

    if (!profile) {
        console.warn('[deleteStaffProfile] profile not found for', staffKey);
        return;
    }
    if (!confirm(`Delete ${profile.name} permanently? This cannot be undone.`)) {
        console.log('[deleteStaffProfile] deletion cancelled by user', { staffKey, profileName: profile.name });
        return;
    }
    delete profiles[resolvedKey];
    persistStaffProfiles(profiles, { force: true, updatedBy: adminUserKey || 'local' });
    console.log('[deleteStaffProfile] deleted profile', { resolvedKey, profileName: profile.name });
    renderUserListsTable();
    populateITTrackerControls();
    renderITStaffProfileGrid();
    toastNotice('success', 'Profile Deleted', `${profile.name} was removed permanently.`);
}

function getNextStaffIdNumber() {
    const profiles = getStoredStaffProfiles();
    const ids = Object.values(profiles)
        .map(p => p.idNumber)
        .filter(Boolean)
        .map(n => Number(n))
        .filter(n => !Number.isNaN(n));
    const nextId = ids.length ? Math.max(...ids) + 1 : 4;
    return String(nextId).padStart(3, '0');
}

function ensureStaffProfileIds() {
    const profiles = getStoredStaffProfiles();
    let updated = false;
    const knownProfiles = {
        ali: '001',
        marc_benson: '002',
        franz_renze: '003'
    };
    Object.entries(knownProfiles).forEach(([key, value]) => {
        if (profiles[key] && profiles[key].idNumber !== value) {
            profiles[key].idNumber = value;
            updated = true;
        }
    });
    if (updated) {
        persistStaffProfiles(profiles);
    }
}

ensureStaffProfileIds();

function toggleAdminProfileMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('adminProfileDropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    closeAdminProfileMenu();
    if (isHidden) {
        dropdown.classList.remove('hidden');
    }
}

function canDeleteAuditHistory() {
    return getCurrentAdminKey() === 'ali';
}

function refreshHistoryDeletionControls() {
    const canDelete = canDeleteAuditHistory();
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.disabled = !canDelete;
        clearBtn.style.opacity = canDelete ? '' : '0.55';
        clearBtn.style.cursor = canDelete ? 'pointer' : 'not-allowed';
        clearBtn.title = canDelete ? 'Clear log history' : 'Only Ali can delete audit history';
    }
}

function resetDefaultStaffProfiles() {
    try {
        localStorage.setItem('itStaffProfiles', JSON.stringify(DEFAULT_IT_STAFF_PROFILES));
        toastNotice('success', 'Defaults Restored', 'Default IT staff profiles restored — reloading.');
        setTimeout(() => location.reload(), 700);
    } catch (e) {
        console.error('Failed to restore defaults', e);
        toastNotice('error', 'Restore Failed', 'Unable to restore default profiles.');
    }
}

// Convenience debug utility: prints stored profiles to console
function debugShowStoredProfiles() {
    const p = JSON.parse(localStorage.getItem('itStaffProfiles')||'{}');
    console.table(Object.entries(p).map(([k,v])=>({key:k, username:v.username, name:v.name, password:v.password})));
    return p;
}

function recordModification(action, target, details) {
    try {
        const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
        const profiles = getStoredStaffProfiles();
        const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;
        const entry = {
            id: `mod_${Date.now()}`,
            user: actor,
            userKey: userKey,
            action,
            target,
            details: details || null,
            timestamp: new Date().toISOString()
        };
        modificationHistory.unshift(entry);
        persistModificationHistory();
    } catch (e) { console.error('Failed to record modification', e); }
}

function buildStaffKey(name) {
    const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return key || `staff_${Date.now()}`;
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
    });
}

function moveProfileCarousel(direction) {
    const grid = document.getElementById('profileGrid');
    if (!grid || !grid.classList.contains('profile-grid-mobile')) return;

    const track = grid.querySelector('.profile-card-track');
    if (!track) return;

    const cardWidth = track.querySelector('.profile-card')?.offsetWidth || 0;
    const gap = 12;
    const scrollAmount = (cardWidth + gap);
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function renderITStaffProfileGrid() {
    const grid = document.getElementById('profileGrid');
    const countEl = document.getElementById('homeStaffCount');
    // Exclude disabled profiles and hide superadmin ghost from the home roster
    const profiles = Object.values(getVisibleStaffProfiles());
    if (!grid) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const layoutClass = isMobile ? 'profile-grid-mobile' : '';
    const profileSignature = profiles.map((profile) => {
        const shiftStatus = profile.shiftStatus || (profile.location ? 'live' : 'offline');
        return `${profile.id}|${profile.name}|${profile.role}|${profile.location || ''}|${profile.phone || ''}|${profile.email || ''}|${profile.remarks || ''}|${shiftStatus}`;
    }).join('::');
    const existingSignature = grid.dataset.profileSignature || '';
    const existingLayout = grid.dataset.profileLayout || '';

    if (existingSignature === profileSignature && existingLayout === layoutClass) {
        if (countEl) {
            const expectedCountText = `${profiles.length} IT Specialists`;
            if (countEl.textContent !== expectedCountText) {
                countEl.textContent = expectedCountText;
            }
        }
        return;
    }

    grid.className = `profile-grid${layoutClass ? ` ${layoutClass}` : ''}`;
    grid.dataset.profileSignature = profileSignature;
    grid.dataset.profileLayout = layoutClass;

    const cardHTML = profiles.map((profile) => {
        const contactLine = profile.email ? `${profile.phone} · ${profile.email}` : `${profile.phone}`;
        const locationText = profile.location ? profile.location : '-';
        const remarksText = profile.remarks ? profile.remarks : '-';
        const shiftStatus = profile.shiftStatus || (profile.location ? 'live' : 'offline');
        let statusClass = 'status-standby';
        let statusText = 'Standby';
        if (shiftStatus === 'live') {
            statusClass = 'status-live';
            statusText = `Live @ ${profile.location}`;
        } else if (shiftStatus === 'offline') {
            statusClass = 'status-oncall';
            statusText = 'On call';
        } else if (shiftStatus === 'onleave') {
            statusClass = 'status-onleave';
            statusText = 'On Leave';
        }
        return `
            <div id="${profile.id}Card" class="profile-card interactive" role="button" tabindex="0" onclick="openStaffProfileModal('${profile.id}')" onkeydown="if(event.key==='Enter'||event.key===' ') openStaffProfileModal('${profile.id}')">
                <div class="profile-header">
                    ${profile.image ? `<img src="${profile.image}" alt="${profile.name}" />` : `<div class="profile-avatar-placeholder"><i class="fas fa-user"></i></div>`}
                    <div>
                        <h3>${profile.name}</h3>
                        <div class="profile-role">${profile.role}</div>
                        <div class="profile-contact">${contactLine}</div>
                    </div>
                </div>
                <div class="profile-status"><span class="status-badge ${statusClass}">${statusText}</span></div>
                <div class="profile-meta">
                    <span><strong>Location:</strong> <span id="${profile.id}Location">${locationText}</span></span>
                    <span><strong>Remarks:</strong> <span id="${profile.id}Remarks">${remarksText}</span></span>
                </div>
            </div>
        `;
    }).join('');

    if (isMobile) {
        // Simple grid layout for mobile - no carousel
        grid.innerHTML = `
            <div class="profile-card-track profile-card-track-carousel">
                ${cardHTML}
            </div>
        `;
    } else {
        // Desktop multi-column layout
        grid.innerHTML = cardHTML;
    }

    if (countEl) {
        countEl.textContent = `${profiles.length} IT Specialists`;
    }
}

function populateITTrackerControls() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const locationSelect = document.getElementById('itTrackerLocationSelect');
    if (staffSelect) {
        const currentUser = adminUserKey || sessionStorage.getItem('adminUserKey');
        // Exclude disabled profiles from tracker selection
        const profiles = Object.values(getStoredStaffProfiles()).filter(p => !p.disabled);
        const previousValue = staffSelect.value || '';

        if (currentUser) {
            if (currentUser === 'ali') {
                const optionHtml = profiles.map(profile => {
                    const status = profile.shiftStatus || (profile.location ? 'live' : 'offline');
                    const isCurrent = profile.id === currentUser;
                    const labelSuffix = isCurrent ? ' (you)' : (status === 'standby' ? ' (standby)' : (status === 'offline' ? ' (inactive)' : ''));
                    return `<option value="${profile.id}">${profile.name}${labelSuffix}</option>`;
                }).join('');
                staffSelect.innerHTML = '<option value="">-- Choose staff --</option>' + optionHtml;
                staffSelect.disabled = false;
                if (previousValue && profiles.some(p => p.id === previousValue)) {
                    staffSelect.value = previousValue;
                } else if (profiles.find(p => p.id === currentUser)) {
                    staffSelect.value = currentUser;
                }
            } else {
                // Other users can always access their own profile and keep it selected.
                const currentProfile = profiles.find(p => p.id === currentUser);
                if (currentProfile) {
                    staffSelect.innerHTML = `<option value="${currentProfile.id}">${currentProfile.name} (Your Profile)</option>`;
                    staffSelect.disabled = false;
                    staffSelect.value = currentProfile.id;
                }
            }
        } else {
            staffSelect.innerHTML = '<option value="">-- Choose a staff member --</option>' + profiles.map(profile => `<option value="${profile.id}">${profile.name}</option>`).join('');
            staffSelect.disabled = false;
            if (previousValue && profiles.some(p => p.id === previousValue)) {
                staffSelect.value = previousValue;
            }
        }
    }
    if (locationSelect) {
        locationSelect.innerHTML = '<option value="">-- Select location --</option>' + branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
    }
    updateITTrackerHistoryAccess();
}

function normalizeSearchKey(value) {
    return String(value || '').trim().toLowerCase();
}

function renderHomeBranchList() {
    const container = document.getElementById('homeBranchList');
    if (!container) return;
    const branchNames = visibleBranchNames.length > 0 ? visibleBranchNames : Object.keys(BRANCH_LOCATIONS);
    const profiles = Object.values(getStoredStaffProfiles());

    if (branchNames.length === 0) {
        container.innerHTML = '<div class="branch-empty-state">No branch matches your search. Try a street name or branch keyword.</div>';
        return;
    }

    container.innerHTML = branchNames.map(branchName => {
        const location = BRANCH_LOCATIONS[branchName];
        const staffAtBranch = profiles.filter(p => p.location === branchName);
        return `
            <button class="branch-search-card" onclick="focusBranchOnMap('${branchName}')" type="button">
                <div>
                    <strong>${branchName}</strong>
                    <div class="branch-location">${location.address}</div>
                </div>
                <span class="branch-search-chip ${staffAtBranch.length > 0 ? 'active' : 'empty'}">
                    ${staffAtBranch.length > 0 ? `${staffAtBranch.length} IT on site` : 'No IT present'}
                </span>
            </button>
        `;
    }).join('');
}

function filterHomeBranches(query) {
    const normalized = normalizeSearchKey(query);
    visibleBranchNames = Object.keys(BRANCH_LOCATIONS).filter(branchName => {
        const location = BRANCH_LOCATIONS[branchName];
        const branchText = `${branchName} ${location.address}`;
        return normalizeSearchKey(branchText).includes(normalized);
    });
    updateBranchMarkerVisibility();
    renderHomeBranchList();
}

function updateBranchMarkerVisibility() {
    if (!bhfMap) return;
    const visibleSet = new Set(visibleBranchNames.length > 0 ? visibleBranchNames : Object.keys(BRANCH_LOCATIONS));
    Object.entries(branchMarkers).forEach(([branchName, marker]) => {
        const visible = visibleSet.has(branchName);
        marker.setStyle({ opacity: visible ? 1 : 0.28, fillOpacity: visible ? 0.85 : 0.16 });
    });
}

function focusBranchOnMap(branchName) {
    if (!bhfMap) return;
    const location = BRANCH_LOCATIONS[branchName];
    if (!location) return;
    bhfMap.setView([location.lat, location.lng], 16, { animate: true });
    const marker = branchMarkers[branchName];
    if (marker) {
        marker.openPopup();
    }
}

function getStaffProfileById(staffId) {
    if (!staffId) return null;
    const profiles = getStoredStaffProfiles() || {};
    if (profiles[staffId]) return profiles[staffId];
    return Object.values(profiles).find(profile => {
        if (!profile || typeof profile !== 'object') return false;
        return profile.id === staffId || profile.username === staffId || profile.name === staffId;
    }) || null;
}

function getStaffMarkerById(staffId) {
    if (!staffId) return null;
    const profile = getStaffProfileById(staffId);
    const lookupKeys = [staffId];
    if (profile) {
        lookupKeys.push(profile.id, profile.username, profile.name);
    }

    for (const key of lookupKeys) {
        if (key && staffMarkers[key]) {
            return staffMarkers[key];
        }
    }
    return null;
}

function renderStaffMapMarkers() {
    Object.values(staffMarkers).forEach(marker => {
        if (marker && marker.remove) {
            marker.remove();
        }
    });
    staffMarkers = {};

    const profiles = Object.values(getStoredStaffProfiles()).filter(profile => {
        const shiftStatus = profile.shiftStatus || (profile.location ? 'live' : 'offline');
        return shiftStatus === 'live' && profile.location && BRANCH_LOCATIONS[profile.location];
    });

    const groupedByLocation = profiles.reduce((acc, profile) => {
        acc[profile.location] = acc[profile.location] || [];
        acc[profile.location].push(profile);
        return acc;
    }, {});

    profiles.forEach(profile => {
        const location = BRANCH_LOCATIONS[profile.location];
        const locationGroup = groupedByLocation[profile.location] || [];
        const index = locationGroup.findIndex(item => item.id === profile.id);
        const angle = (index / Math.max(locationGroup.length, 1)) * Math.PI * 2;
        const offsetDistance = 0.00018;
        const offsetLat = Math.cos(angle) * offsetDistance;
        const offsetLng = Math.sin(angle) * offsetDistance;
        const markerLat = location.lat + offsetLat;
        const markerLng = location.lng + offsetLng;

        const initials = profile.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
        const avatarHtml = profile.image ? `<img src="${profile.image}" alt="${profile.name}" />` : `<div class="staff-marker-fallback">${initials}</div>`;

        const icon = L.divIcon({
            className: 'staff-marker',
            html: avatarHtml,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -24]
        });

        const marker = L.marker([markerLat, markerLng], { icon }).addTo(bhfMap);
        marker.bindPopup(`
            <div style="font-size:13px; font-weight:700; margin-bottom:6px;">${profile.name}</div>
            <div style="font-size:12px; color:#64748b; margin-bottom:6px;">${profile.role}</div>
            <div style="font-size:12px;">Assigned to <strong>${profile.location}</strong></div>
        `, { minWidth: 180, maxWidth: 240 });
        marker.on('click', () => {
            if (bhfMap) {
                focusMapOnLatLng(marker.getLatLng(), 16);
            }
        });

        const staffLookupKeys = [profile.id, profile.username, profile.name].filter(Boolean);
        staffLookupKeys.forEach(staffKey => {
            if (staffKey) {
                staffMarkers[staffKey] = marker;
            }
        });
    });
    renderLiveStaffControl();
}

function focusMapOnLatLng(latLng, zoom = 16) {
    if (!bhfMap || !latLng) return;
    const target = Array.isArray(latLng) ? L.latLng(latLng[0], latLng[1]) : latLng;
    if (!target || typeof target.lat !== 'number' || typeof target.lng !== 'number') return;

    try {
        bhfMap.closePopup();
    } catch (e) {}

    try {
        bhfMap.flyTo(target, zoom, { animate: true, duration: 0.7 });
    } catch (e) {
        bhfMap.setView(target, zoom, { animate: true });
    }
}

function centerOnStaffMarker(staffId) {
    if (!bhfMap) return;
    if (!staffId) return;

    const profile = getStaffProfileById(staffId);
    if (!profile) return;

    const marker = getStaffMarkerById(staffId);
    if (marker && marker.getLatLng) {
        const latLng = marker.getLatLng();
        focusMapOnLatLng(latLng, 16);
        if (marker.openPopup) {
            marker.openPopup();
        }
        return;
    }

    const location = profile.location && BRANCH_LOCATIONS[profile.location] ? BRANCH_LOCATIONS[profile.location] : null;
    if (location) {
        const latLng = [location.lat, location.lng];
        focusMapOnLatLng(latLng, 16);

        if (branchMarkers[profile.location] && branchMarkers[profile.location].openPopup) {
            branchMarkers[profile.location].openPopup();
        }
    }
}

function renderLiveStaffControl() {
    if (!bhfMap) return;
    if (staffControl) {
        bhfMap.removeControl(staffControl);
        staffControl = null;
    }

    staffControl = L.control({ position: 'bottomright' });
    staffControl.onAdd = function () {
        const container = L.DomUtil.create('div', 'live-staff-control');
        L.DomEvent.disableClickPropagation(container);

        const profiles = Object.values(getStoredStaffProfiles());
        const liveStaff = profiles.filter(profile => {
            const shiftStatus = profile.shiftStatus || (profile.location ? 'live' : 'offline');
            return shiftStatus === 'live' && profile.location && BRANCH_LOCATIONS[profile.location];
        });

        if (liveStaff.length === 0) {
            container.innerHTML = `
                <div class="live-staff-control-title">Live IT Staff</div>
                <div class="live-staff-control-empty">No live staff currently available.</div>
            `;
            return container;
        }

        container.innerHTML = `
            <div class="live-staff-control-title">Live IT Staff</div>
            ${liveStaff.map(profile => {
                const initials = profile.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
                const avatar = profile.image
                    ? `<img src="${profile.image}" alt="${profile.name}" class="live-staff-icon" />`
                    : `<span class="live-staff-icon live-staff-initials">${initials}</span>`;
                return `
                    <button type="button" class="live-staff-entry" data-staff-id="${profile.id || profile.username || profile.name}">
                        ${avatar}
                        <span>${profile.name}</span>
                    </button>
                `;
            }).join('')}
        `;

        container.querySelectorAll('.live-staff-entry').forEach(button => {
            button.addEventListener('click', () => {
                const staffId = button.getAttribute('data-staff-id');
                centerOnStaffMarker(staffId);
            });
        });

        return container;
    };
    staffControl.addTo(bhfMap);
}

function initializeBHFMap() {
    if (!document.getElementById('bhfMapContainer')) return;
    
    try {
        if (bhfMap) {
            bhfMap.remove();
            bhfMap = null;
        }
        
        visibleBranchNames = Object.keys(BRANCH_LOCATIONS);
        const baguioCenter = [16.4130, 120.5980];
        bhfMap = L.map('bhfMapContainer').setView(baguioCenter, 14);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CartoDB',
            maxZoom: 19,
            minZoom: 12
        }).addTo(bhfMap);
        
        branchMarkers = {};
        staffMarkers = {};
        
        Object.entries(BRANCH_LOCATIONS).forEach(([branchName, location]) => {
            const staffAtBranch = Object.values(getStoredStaffProfiles()).filter(p => p.location === branchName);
            const markerColor = staffAtBranch.length > 0 ? '#16a34a' : '#2563eb';
            const markerClass = staffAtBranch.length > 0 ? 'branch-marker' : 'branch-marker';
            
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 14,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.85,
                className: markerClass
            }).addTo(bhfMap);
            
            const popupContent = `
                <div style="font-size:13px; font-weight:700; margin-bottom:8px;">${location.icon} ${branchName}</div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">${location.address}</div>
                ${staffAtBranch.length > 0 ? `<div style="border-top:1px solid #e2e8f0; padding-top:8px; margin-top:8px;"><strong style="font-size:12px;">Staff On Site:</strong><div style="font-size:11px; margin-top:4px;">${staffAtBranch.map(s => `• ${s.name} (${s.username})`).join('<br>')}</div></div>` : '<div style="font-size:11px; color:#94a3b8; font-style:italic;">No staff assigned</div>'}
            `;
            
            marker.bindPopup(popupContent, { maxWidth: 260 });
            branchMarkers[branchName] = marker;
        });

        const bounds = L.latLngBounds(Object.values(BRANCH_LOCATIONS).map(location => [location.lat, location.lng]));
        if (bounds.isValid()) {
            bhfMap.fitBounds(bounds.pad(0.15));
        }

        renderStaffMapMarkers();
        renderHomeBranchList();
        populateHomeBranchSelect();
        updateBranchMarkerVisibility();
        bhfMap.invalidateSize();
    } catch (e) {
        console.error('Failed to initialize BHF map:', e);
    }
}

window.addEventListener('load', () => {
    setTimeout(() => initializeBHFMap(), 500);
});

window.addEventListener('load', () => {
    setTimeout(() => {
        if (bhfMap) bhfMap.invalidateSize();
    }, 1000);
});

// Resilient remote-init: repeatedly attempt to initialize remote sync
let _remoteInitIntervalId = null;
function scheduleRemoteInit(retryIntervalMs = 3000, maxAttempts = 40) {
    if (_remoteInitIntervalId) return;
    let attempts = 0;
    _remoteInitIntervalId = setInterval(() => {
        attempts++;
        try {
            if (isFirebaseConfigured() && typeof firebase !== 'undefined' && !firestoreDb) {
                initializeRemoteSync();
            }
            // Once Firebase is ready and user is authenticated, start monitoring
            if (firestoreDb && adminAuthenticated && adminUserKey && !currentUserStatusListener) {
                try { startMonitoringCurrentUserStatus(adminUserKey); } catch (e) { console.warn('Failed to start monitoring after Firebase init:', e); }
            }
        } catch (e) { console.debug('scheduleRemoteInit check failed', e); }
        if (firestoreDb || attempts >= maxAttempts) {
            clearInterval(_remoteInitIntervalId);
            _remoteInitIntervalId = null;
        }
    }, retryIntervalMs);
}

window.addEventListener('load', () => {
    scheduleRemoteInit();
});

window.addEventListener('load', () => {
    homeEditContentState = getStoredHomeEditContent();
    applyHomeEditContent(homeEditContentState);
    setHomeEditableElementsEnabled(false);
    bindHomeInlineEditing();
});

window.addEventListener('load', () => {
    try { displayAnnouncementsOnHome(); } catch (e) {}
    try { renderITStaffProfileGrid(); } catch (e) {}
});

window.addEventListener('load', () => {
    // Initialize user status monitoring if already authenticated
    if (adminAuthenticated && adminUserKey && firestoreDb) {
        try { startMonitoringCurrentUserStatus(adminUserKey); } catch (e) { console.warn('Failed to start user monitoring:', e); }
    }
});

function updateBHFMapStaffMarkers() {
    if (!bhfMap) return;
    
    Object.entries(BRANCH_LOCATIONS).forEach(([branchName, location]) => {
        const staffAtBranch = Object.values(getStoredStaffProfiles()).filter(p => p.location === branchName);
        const marker = branchMarkers[branchName];
        
        if (marker) {
            const markerColor = staffAtBranch.length > 0 ? '#16a34a' : '#2563eb';
            marker.setStyle({ fillColor: markerColor });
            
            const popupContent = `
                <div style="font-size:13px; font-weight:700; margin-bottom:8px;">${location.icon} ${branchName}</div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">${location.address}</div>
                ${staffAtBranch.length > 0 ? `<div style="border-top:1px solid #e2e8f0; padding-top:8px; margin-top:8px;"><strong style="font-size:12px;">Staff On Site:</strong><div style="font-size:11px; margin-top:4px;">${staffAtBranch.map(s => `• ${s.name} (${s.username})`).join('<br>')}</div></div>` : '<div style="font-size:11px; color:#94a3b8; font-style:italic;">No staff assigned</div>'}
            `;
            
            marker.setPopupContent(popupContent);
        }
    });

    renderStaffMapMarkers();
    renderHomeBranchList();
    updateBranchMarkerVisibility();
}



    // Use session auth so password is asked once per session and does not persist across page reloads/new visits.
    try {
        adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === '1';
        if (adminAuthenticated) {
            adminUserKey = sessionStorage.getItem('adminUserKey') || null;
            
            // Validate that the session user still exists and is enabled
            const profiles = getStoredStaffProfiles();
            if (adminUserKey && profiles[adminUserKey]) {
                const userProfile = profiles[adminUserKey];
                if (userProfile.disabled === true || !userProfile.id) {
                    // User was disabled or deleted, clear session
                    adminAuthenticated = false;
                    adminUserKey = null;
                    try { sessionStorage.removeItem('adminAuthenticated'); } catch (e) {}
                    try { sessionStorage.removeItem('adminUserKey'); } catch (e) {}
                }
            } else if (adminUserKey) {
                // User profile not found, clear session
                adminAuthenticated = false;
                adminUserKey = null;
                try { sessionStorage.removeItem('adminAuthenticated'); } catch (e) {}
                try { sessionStorage.removeItem('adminUserKey'); } catch (e) {}
            }
        }
    } catch (e) {
        adminAuthenticated = false;
    }
    refreshHistoryDeletionControls();

    let storageChanged = false;
    if (pcData["SDC (Globe)"] || pcData["SDC (PLDT)"]) {
        const legacyData = [...(pcData["SDC (Globe)"] || []), ...(pcData["SDC (PLDT)"] || [])];
        legacyData.forEach((pc, idx) => { pc.pcName = `SDC-PC-0${idx + 1}`; });
        pcData["SDC"] = legacyData;
        delete pcData["SDC (Globe)"];
        delete pcData["SDC (PLDT)"];
        storageChanged = true;
    }

    modificationHistory.forEach(log => {
        if (log.branch === "SDC (Globe)" || log.branch === "SDC (PLDT)") {
            log.branch = "SDC";
            storageChanged = true;
        }
    });

    broadcastRemarks.forEach(rmk => {
        if (rmk.branch === "SDC (Globe)" || rmk.branch === "SDC (PLDT)") {
            rmk.branch = "SDC";
            storageChanged = true;
        }
    });

    // Migration: Assign usernames to existing PCs that don't have them
    const usernames = [
        "jsmith", "mjones", "alee", "rgarcia", "kpatel", 
        "dchen", "fwilson", "sproctor", "mmartinez", "blawrence", 
        "crodriguez", "jkelly", "tcampbell", "mhenderson", "rthompson",
        "aparker", "jdavis", "lbrown", "rwhite", "jmiller",
        "rwilson", "amoore", "gtaylor", "jtaylor", "janders",
        "dthomas", "sjackson", "emartin", "alee", "blee"
    ];
    
    branches.forEach(branch => {
        if (pcData[branch]) {
            pcData[branch].forEach(pc => {
                if (!pc.username) {
                    pc.username = usernames[Math.floor(Math.random() * usernames.length)];
                    storageChanged = true;
                }
            });
        }
    });

    if (storageChanged) {
        localStorage.setItem("pcData", JSON.stringify(pcData));
        persistModificationHistory();
        localStorage.setItem("broadcastRemarks", JSON.stringify(broadcastRemarks));
    }

    initializeDropdownOptions();
    initializeFeedbackControls();
    populateITTrackerControls();
    renderITStaffProfileGrid();

    const pcForm = document.getElementById("pcForm");
    if (pcForm) {
        pcForm.addEventListener("submit", handleNewPcFormSubmission);
    }

    // Clean up old modification history entries without proper user tracking
    ensureModificationHistoryHasUserTracking();

    // Ensure nav visibility matches authentication state before rendering
    try { setInitialNavVisibility(); } catch (e) {}
    goHome();

    // Force side-nav buttons to be visible (defensive for inline styles)
    try { ensureSideNavButtonsVisible(); } catch (e) {}

    // If the URL contains a hash, route to the requested page immediately
    try {
        const hash = (window.location && window.location.hash) ? window.location.hash.replace('#','') : '';
        if (hash) {
            if (hash === 'overall' || hash === 'home' || hash === 'admin') {
                // Legacy Administration hash should continue to open the consolidated summary.
                showOverallSummary();
            } else if (hash === 'branches') {
                goHome();
                restoreNavVisibility();
            } else if (hash === 'analysis') {
                showAnalysisPage();
                restoreNavVisibility();
            } else if (hash === 'config') {
                if (adminAuthenticated) {
                    openAdminPage();
                } else {
                    promptAdminAccess();
                }
                restoreNavVisibility();
            }
        }
    } catch (e) {}
    // Wire side menu toggle behavior (inline onclick in HTML will handle clicks)
    try {
        const toggle = document.getElementById('sideMenuToggle');
        const menu = document.getElementById('sideMenu');
        if (toggle && menu) {
            // Keyboard support: allow Enter or Space to toggle
            toggle.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    toggleSideMenu();
                }
            });
        }
    } catch (e) {}

    // Observe page activation so hamburger visibility updates reliably
    try {
        const pages = document.querySelectorAll('.page');
        const obs = new MutationObserver(muts => {
            muts.forEach(m => {
                if (m.type === 'attributes' && m.attributeName === 'class') {
                    const el = m.target;
                    if (el.classList && el.classList.contains('active')) {
                        try { updateHamburgerVisibility(); } catch(e) {}
                    }
                }
            });
        });
        pages.forEach(p => obs.observe(p, { attributes: true }));
    } catch (e) { console.error(e); }

// Global click handler: close side menu and profile menu when clicking outside them
    try {
        document.addEventListener('click', (ev) => {
            const t = ev.target;
            if (!t || !t.closest) return;

            const menu = document.getElementById('sideMenu');
            if (menu && menu.classList.contains('open') && !t.closest('#sideMenu') && !t.closest('#sideMenuToggle')) {
                closeSideMenu();
            }

            const dropdown = document.getElementById('adminProfileDropdown');
            const profileBtn = document.getElementById('adminProfileBtn');
            if (dropdown && !dropdown.classList.contains('hidden') && !t.closest('#adminProfileWrapper')) {
                closeAdminProfileMenu();
            }
        });
    } catch (e) { console.error(e); }

function ensureSideNavButtonsVisible() {
    try {
        const ids = ['homeNavBtnSide','branchesNavBtnSide','analysisNavBtnSide','configNavBtnSide'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Remove any inline display style that may be hiding the element
                el.style.display = '';
            }
        });
        // Keep logout hidden when not authenticated
        const logout = document.getElementById('logoutBtnSide');
        if (logout) logout.style.display = adminAuthenticated ? '' : 'none';
    } catch (e) { console.error(e); }
}

function toggleSideMenu() {
    try {
        const menu = document.getElementById('sideMenu');
        if (!menu) return;
        const toggle = document.getElementById('sideMenuToggle');
        const isOpen = menu.classList.contains('open');
        const body = document.body;
        if (!isOpen) {
            menu.classList.add('open');
            menu.classList.remove('hidden');
            menu.setAttribute('aria-hidden', 'false');
            body.classList.add('side-open');
            if (toggle) toggle.classList.add('active');
        } else {
            menu.classList.remove('open');
            menu.classList.add('hidden');
            menu.setAttribute('aria-hidden', 'true');
            body.classList.remove('side-open');
            if (toggle) toggle.classList.remove('active');
        }
    } catch (e) { console.error(e); }
}

function closeSideMenu() {
    try {
        const menu = document.getElementById('sideMenu');
        if (menu) {
            menu.classList.remove('open');
            menu.classList.add('hidden');
            menu.setAttribute('aria-hidden', 'true');
        }
        try { document.body.classList.remove('side-open'); } catch (e) {}
        try { document.getElementById('sideMenuToggle').classList.remove('active'); } catch (e) {}
    } catch (e) {}
}

function closeAdminProfileMenu() {
    const dropdown = document.getElementById('adminProfileDropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

function updateNavVisibility() {
    try {
        const legacyAdminNav = document.getElementById('legacyAdminNavBtn');
        const adminSummaryBtn = document.getElementById('adminSummaryBtn');
        const homeNavSide = document.getElementById('homeNavBtnSide');
        const branchesNavSide = document.getElementById('branchesNavBtnSide');
        const analysisNavSide = document.getElementById('analysisNavBtnSide');
        const configNavSide = document.getElementById('configNavBtnSide');
        const logoutBtnSide = document.getElementById('logoutBtnSide');
        const adminProfileWrapper = document.getElementById('adminProfileWrapper');

        // Hamburger visibility is managed separately by updateHamburgerVisibility().

        // Toggle the header admin controls.
        if (legacyAdminNav) legacyAdminNav.style.display = adminAuthenticated ? 'none' : '';
        if (adminSummaryBtn) adminSummaryBtn.classList.toggle('hidden', !adminAuthenticated);
        if (adminProfileWrapper) {
            if (adminAuthenticated) {
                adminProfileWrapper.classList.remove('hidden');
                updateAdminProfileMenu();
            } else {
                adminProfileWrapper.classList.add('hidden');
                closeAdminProfileMenu();
            }
        }

        // Always expose the primary navigation entries in the side menu.
        if (homeNavSide) homeNavSide.style.display = '';
        if (branchesNavSide) branchesNavSide.style.display = '';
        if (analysisNavSide) analysisNavSide.style.display = '';
        if (configNavSide) configNavSide.style.display = '';

        // Only show logout when an admin is authenticated.
        if (logoutBtnSide) logoutBtnSide.style.display = adminAuthenticated ? '' : 'none';
    } catch (e) { console.error(e); }
}

function setInitialNavVisibility() {
    updateNavVisibility();
    updateHamburgerVisibility();
}

function restoreNavVisibility() {
    updateNavVisibility();
    updateHamburgerVisibility();
}

function updateHamburgerVisibility() {
    try {
        const menuToggle = document.getElementById('sideMenuToggle');
        if (!menuToggle) return;
        const active = document.querySelector('.page.active');
        const isHome = active && active.id === 'homePage';
        const isSideOpen = document.body.classList.contains('side-open');
        const keepVisibleForEdit = homeEditModeActive;
        // Hide only on Home page unless we're in edit mode.
        if (isHome && !isSideOpen && !keepVisibleForEdit) {
            menuToggle.style.display = 'none';
        } else {
            menuToggle.style.display = '';
            menuToggle.style.zIndex = '4000';
            menuToggle.style.pointerEvents = '';
            menuToggle.style.opacity = '';
            menuToggle.style.transform = '';
        }
    } catch (e) { console.error(e); }
}

/* ==========================================================================
   2. VIEW DEPLOYMENT ROUTING PIPELINES
   ========================================================================== */
function hideAllPages() {
    document.body.classList.remove('feedback-history-active');
    document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
}

function showOverallSummary() {
    closeSideMenu();
    hideAllPages();
    const target = document.getElementById("overallPage");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    calculateConsolidatedMetrics();
    renderBroadcastAnnouncementBox();
    setInitialNavVisibility();
}

function goHome() {
    // Navigate to the Home (IT Profiles) page. Hide side menu and update nav.
    closeSideMenu();
    hideAllPages();
    const target = document.getElementById("homePage");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    renderBranchGridDashboard();
    loadHomeRemarks();
    try { displayAnnouncementsOnHome(); } catch (e) {}
    try { displayAnnouncementsOnHome(); } catch (e) {}
    updateITProfilesDisplay();
    if (!bhfMap) {
        initializeBHFMap();
    } else {
        updateBHFMapStaffMarkers();
        setTimeout(() => { if (bhfMap) bhfMap.invalidateSize(); }, 200);
    }
    populateHomeBranchSelect();
    renderHomeBranchList();
    filterHomeBranches(document.getElementById('branchSearchInput')?.value || '');
    // Ensure nav and hamburger visibility reflect the Home view
    try { updateNavVisibility(); updateHamburgerVisibility(); } catch (e) { console.error(e); }
}

function showBranchesPage() {
    closeSideMenu();
    hideAllPages();
    const target = document.getElementById('branchesPage');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    renderBranchGridDashboard();
    try { updateNavVisibility(); updateHamburgerVisibility(); } catch (e) { console.error(e); }
}

function renderTempBadge(temp) {
    const value = Number(temp) || 0;
    const icon = value >= 85 ? 'fa-temperature-high' : value >= 70 ? 'fa-thermometer-half' : 'fa-thermometer-quarter';
    const stateClass = value >= 85 ? 'temp-badge-critical' : value >= 70 ? 'temp-badge-warning' : 'temp-badge-normal';
    return `<span class="temp-badge ${stateClass}"><i class="fas ${icon}" aria-hidden="true"></i>${value}°C</span>`;
}

function getStorageHealthValue(pc) {
    if (!pc || pc.storageHealth == null || pc.storageHealth === '') return undefined;
    const explicitValue = Number(pc.storageHealth);
    if (!Number.isNaN(explicitValue) && explicitValue >= 0 && explicitValue <= 100) {
        return explicitValue;
    }
    return undefined;
}

function renderStorageHealthBadge(valueOrPc) {
    let safeValue;
    if (valueOrPc != null && typeof valueOrPc === 'object') {
        safeValue = getStorageHealthValue(valueOrPc);
    } else if (typeof valueOrPc === 'string' && valueOrPc.trim() === '') {
        safeValue = undefined;
    } else if (valueOrPc == null) {
        safeValue = undefined;
    } else {
        safeValue = Number(valueOrPc);
    }
    if (safeValue === undefined || Number.isNaN(safeValue)) {
        return `<span class="temp-badge temp-badge-gray"><i class="fas fa-question-circle" aria-hidden="true"></i>N/A</span>`;
    }
    const icon = safeValue <= 29 ? 'fa-exclamation-circle' : safeValue <= 49 ? 'fa-exclamation-triangle' : 'fa-check-circle';
    const stateClass = safeValue <= 29 ? 'temp-badge-critical' : safeValue <= 49 ? 'temp-badge-warning' : 'temp-badge-normal';
    return `<span class="temp-badge ${stateClass}"><i class="fas ${icon}" aria-hidden="true"></i>${Math.round(safeValue)}%</span>`;
}


function openAdminPage() {
    hideAllPages();
    const target = document.getElementById("adminPage");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    loadAdminBranchData();
    renderBranchGridDashboard();
    loadRemarksManagementDirectory();
    closeSideMenu();
    updateNavVisibility();
    try { updateHamburgerVisibility(); } catch (e) {}
}

function showAdminPanel() {
    // Show the admin page and allow the hamburger to appear.
    openAdminPage();
}

function promptAdminAccess() {
    if (adminAuthenticated) {
        openAdminPage();
        return;
    }

    window.pendingAdminAction = null;
    window.pendingAdminBranch = null;
    document.getElementById("pinModalOverlay").classList.remove("hidden");
    const userField = document.getElementById('adminUsernameField');
    const passField = document.getElementById('adminPasswordField');
    if (userField) userField.value = '';
    if (passField) passField.value = '';
    if (userField) userField.focus();
}

function handleAdministrationTap() {
    // Administration button: prompt for password to access the consolidated summary
    if (adminAuthenticated) {
        showOverallSummary();
        return;
    }
    promptAdminAccess();
    window.pendingAdminAction = 'showSummary';
}

let inventoryQuickFilter = '';
let inventoryFindingsVisible = false;

const analysisYears = [2023, 2024, 2025, 2026];
const analysisMonths = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let analysisHistory = {};
let deletedAnalysisYears = new Set();
let deletedAnalysisBranches = {};
let deletedAnalysisMonthRemovals = {};
loadAnalysisDeleteStateFromLocal();
let analysisChartInstances = {};
let analysisCompareRequest = null;
let analysisCompareOpenHandler = null;
let staffFeedbackCompareRequest = null;
let staffFeedbackCompareOpenHandler = null;

function openAnalysisCompareModal() {
    if (!analysisCompareOpenHandler) {
        initializeAnalysisControls();
    }
    if (analysisCompareOpenHandler) {
        analysisCompareOpenHandler();
    } else {
        console.warn('Analysis compare modal handler is not ready.');
    }
}

function showAnalysisPage() {
    hideAllPages();
    const target = document.getElementById("analysisPage");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    initializeAnalysisControls();
    renderAnalysisView();
    try { restoreNavVisibility(); } catch(e) {}
}

// IT Tracker Page
function showITTrackerPage() {
    closeSideMenu();
    hideAllPages();
    const target = document.getElementById("itTrackerPage");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    populateITTrackerControls();
    resetITTrackerForm();

    // If logged in, auto-select and load the current user's profile
    const currentUser = getCurrentAdminKey();
    if (currentUser) {
        const staffSelect = document.getElementById('itTrackerStaffSelect');
        if (staffSelect) {
            staffSelect.value = currentUser;
            updateITTrackerFields();
        }
    } else {
        // Make sure the feedback panel shows data for the selected staff after page load
        const staffSelect = document.getElementById('itTrackerStaffSelect');
        if (staffSelect && staffSelect.value) {
            displayStaffFeedback(staffSelect.value);
        }
    }
    updateITTrackerHistoryAccess();
    try { renderItTrackerAnnouncements(); } catch (e) {}
    try { displayAnnouncementsOnHome(); } catch (e) {}
    try { updateHamburgerVisibility(); } catch(e) {}
}

function updateITTrackerHistoryAccess() {
    const logBtn = document.getElementById('itTrackerLogHistoryBtn');
    const activitiesBtn = document.getElementById('itTrackerActivitiesBtn');
    const currentProfile = getCurrentAdminProfile();
    const currentIsSuperAdmin = isSuperAdminUser(getCurrentAdminKey());
    if (logBtn) {
        const isAli = getCurrentAdminKey() === 'ali' || currentProfile?.superAdmin === true || currentIsSuperAdmin;
        logBtn.classList.toggle('hidden', !isAli);
    }
    if (activitiesBtn) {
        const role = normalizeRole(currentProfile?.role || '');
        activitiesBtn.classList.toggle('hidden', !(role === 'it manager' || currentIsSuperAdmin));
    }
}

function openITTrackerActivitiesModal() {
    const currentAdminRole = getCurrentAdminProfile()?.role || '';
    if (normalizeRole(currentAdminRole) !== 'it manager') {
        toastNotice('error', 'Access Denied', 'Only IT Manager may view full activities records.');
        return;
    }
    const overlay = document.getElementById('itTrackerActivitiesModal');
    const content = document.getElementById('itTrackerActivitiesContent');
    if (!overlay || !content) return;
    content.innerHTML = renderITTrackerActivitiesTable();
    overlay.classList.remove('hidden');
}

function closeITTrackerActivitiesModal() {
    const overlay = document.getElementById('itTrackerActivitiesModal');
    if (overlay) overlay.classList.add('hidden');
}

function refreshITTrackerActivitiesModal() {
    const overlay = document.getElementById('itTrackerActivitiesModal');
    const content = document.getElementById('itTrackerActivitiesContent');
    if (overlay && content && !overlay.classList.contains('hidden')) {
        content.innerHTML = renderITTrackerActivitiesTable();
    }
}

function renderITTrackerActivitiesTable() {
    if (!Array.isArray(modificationHistory) || modificationHistory.length === 0) {
        return `<div style="padding:24px; color:#475569; font-style:italic;">No activity history has been recorded yet.</div>`;
    }
    const rows = modificationHistory.map(entry => {
        const time = new Date(entry.timestamp).toLocaleString();
        const targetLabel = entry.target || 'N/A';
        const details = entry.details ? JSON.stringify(entry.details) : '';
        return `<tr>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">${escapeHtml(time)}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">${escapeHtml(entry.user || '')}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">${escapeHtml(entry.action)}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">${escapeHtml(targetLabel)}</td>
            <td style="padding:10px; border-bottom:1px solid #e2e8f0;">${escapeHtml(details)}</td>
        </tr>`;
    }).join('');
    return `
        <div class="activity-history-table-wrapper">
            <div class="activity-history-summary">Showing ${rows.length} activity record${rows.length === 1 ? '' : 's'}. Most recent changes appear first.</div>
            <div class="table-scroll-container">
                <table class="activity-history-table">
                    <thead>
                        <tr>
                            <th>Date / Time</th>
                            <th>Performed By</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showStaffFeedbackHistoryPage() {
    closeSideMenu();
    hideAllPages();
    document.body.classList.add('feedback-history-active');
    const target = document.getElementById('staffFeedbackHistoryPage');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    renderStaffFeedbackHistoryPage();
    try { updateNavVisibility(); updateHamburgerVisibility(); } catch(e) {}
}

function showItTrackerStaffManagementPanel(mode) {
    const wrapper = document.getElementById('itTrackerStaffManagementForms');
    const addSection = document.getElementById('itTrackerAddStaffSection');
    const updateSection = document.getElementById('itTrackerUpdateProfileSection');
    if (!wrapper || !addSection || !updateSection) return;

    wrapper.classList.remove('hidden');
    if (mode === 'add') {
        addSection.classList.remove('hidden');
        updateSection.classList.add('hidden');
    } else {
        addSection.classList.add('hidden');
        updateSection.classList.remove('hidden');
    }
}

function renderStaffFeedbackHistoryPage() {
    const feedbackSelect = document.getElementById('feedbackHistoryStaffSelect');
    const feedbackList = document.getElementById('staffFeedbackHistoryList');
    const feedbackCount = document.getElementById('feedbackSummaryCount');
    const feedbackAvg = document.getElementById('feedbackSummaryAvg');
    const feedbackPositive = document.getElementById('feedbackSummaryPositive');
    const feedbackNegative = document.getElementById('feedbackSummaryNegative');

    const profiles = getStoredStaffProfiles();
    const allFeedbacks = JSON.parse(localStorage.getItem('staffFeedbacks') || '[]');
    const currentUser = getCurrentAdminKey();
    const isAli = currentUser === 'ali';

    if (feedbackSelect) {
        if (isAli) {
            // Preserve any user selection across rebuilds
            const prevValue = feedbackSelect.value;
            // Use the profile object keys as the option values so they match feedback.staffKey
            const profileKeys = Object.keys(profiles || {});
            const profileOptions = ['<option value="all">Overall (All Staff)</option>']
                .concat(profileKeys.map(k => `<option value="${k}">${(profiles[k] && (profiles[k].name || profiles[k].username || k)) || k}</option>`)).join('');
            feedbackSelect.innerHTML = profileOptions;
            feedbackSelect.disabled = false;
            // restore previous selection if it exists and is valid, otherwise default to 'all'
            if (prevValue && Array.from(feedbackSelect.options).some(o => o.value === prevValue)) {
                feedbackSelect.value = prevValue;
            } else {
                feedbackSelect.value = 'all';
            }
        } else {
            // For non-admins, force the select to the current user's profile key
            const profileKeys = Object.keys(profiles || {});
            const userKey = currentUser || profileKeys[0];
            const userProfile = profiles[userKey] || (profileKeys[0] && profiles[profileKeys[0]]);
            const label = (userProfile && (userProfile.name || userProfile.username)) || (userKey || 'User');
            feedbackSelect.innerHTML = `<option value="${userKey}">${label}</option>`;
            feedbackSelect.disabled = true;
            feedbackSelect.value = userKey;
        }

        // Ensure onchange is reliably wired (covers inline and dynamic replacement cases)
        feedbackSelect.onchange = renderStaffFeedbackHistoryPage;
    }
    const selectedStaff = feedbackSelect?.value || (isAli ? 'all' : currentUser || Object.keys(profiles)[0]);
    if (feedbackSelect && feedbackSelect.value === '') {
        feedbackSelect.selectedIndex = 0;
    }

    let visibleFeedbacks = [];
    if (!selectedStaff || selectedStaff === 'all') {
        visibleFeedbacks = allFeedbacks.slice();
    } else {
        // Map selected value to profile id when possible (handles username vs id mismatches)
        const profileMatch = Object.values(profiles).find(p => (p.id === selectedStaff) || (p.username === selectedStaff) || (p.name === selectedStaff));
        const selectedKey = (profileMatch && profileMatch.id) ? profileMatch.id : selectedStaff;
        visibleFeedbacks = allFeedbacks.filter(fb => fb.staffKey === selectedKey);
    }
    const staff = profiles[selectedStaff];

    const summaryFeedbacks = visibleFeedbacks;
    const validRatings = summaryFeedbacks.map(fb => Number(fb.rating)).filter(r => !Number.isNaN(r));
    const total = summaryFeedbacks.length;
    const avgRating = validRatings.length === 0 ? 0 : (validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1);
    const fiveStar = summaryFeedbacks.filter(fb => Number(fb.rating) === 5).length;
    const negative = summaryFeedbacks.filter(fb => Number(fb.rating) <= 2).length;

    if (feedbackCount) feedbackCount.textContent = String(total);
    if (feedbackAvg) feedbackAvg.textContent = avgRating;
    if (feedbackPositive) feedbackPositive.textContent = String(fiveStar);
    if (feedbackNegative) feedbackNegative.textContent = String(negative);

    if (feedbackList) {
        if (summaryFeedbacks.length === 0) {
            feedbackList.innerHTML = `<p style="color: #94a3b8; font-style: italic; text-align: center; padding: 20px;">No feedback history available.</p>`;
        } else {
            // Build a single table with all feedback rows; include question columns dynamically
            const questions = getStoredFeedbackQuestions();
            const headers = ['Date', 'Staff', 'Rating', 'Branch', 'Department'].concat(questions).concat(['Comment', 'Submitted By']);
            const thead = `<thead><tr>${headers.map(h => `<th style="text-align:left; padding:8px;">${h}</th>`).join('')}</tr></thead>`;
            const rows = summaryFeedbacks
                .slice()
                .sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .map(fb => {
                    const created = new Date(fb.submittedAt).toLocaleString();
                    const staffName = (profiles && profiles[fb.staffKey] && (profiles[fb.staffKey].name || profiles[fb.staffKey].username)) || fb.staffKey || fb.submittedBy || 'Unknown';
                    const ratingDisplay = `${fb.rating} / 5`;
                    const answerCells = (fb.questions || questions).map((q, idx) => `<td style="padding:8px; vertical-align:top;">${fb.answers && fb.answers[idx] ? escapeHtml(fb.answers[idx]) : ''}</td>`).join('');
                    return `<tr>${[
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(created)}</td>`,
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(staffName)}</td>`,
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(ratingDisplay)}</td>`,
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(fb.branch || 'N/A')}</td>`,
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(fb.department || 'N/A')}</td>`,
                        answerCells,
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(fb.comment || '')}</td>`,
                        `<td style="padding:8px; vertical-align:top;">${escapeHtml(fb.submittedBy || '')}</td>`
                    ].join('')}</tr>`;
                }).join('');

            feedbackList.innerHTML = `<div class="feedback-history-table" style="overflow:auto; max-height:60vh; border:1px solid var(--border-color); border-radius:8px; background:#fff;">
                <table>
                    ${thead}
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        }
    }

    renderStaffFeedbackCharts(summaryFeedbacks, profiles);
}

function renderStaffFeedbackCharts(feedbacks, profiles) {
    const averageDataset = Object.values(profiles).map(profile => {
        const staffFeedbacks = feedbacks.filter(fb => fb.staffKey === profile.id);
        const ratingSum = staffFeedbacks.reduce((sum, fb) => sum + (Number(fb.rating) || 0), 0);
        const avg = staffFeedbacks.length ? ratingSum / staffFeedbacks.length : 0;
        return { label: profile.name, value: Number(avg.toFixed(1)) };
    });

    const ratingsOverTime = feedbacks
        .slice()
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .map(fb => ({ date: new Date(fb.submittedAt).toLocaleDateString(), rating: Number(fb.rating) || 0 }));

    if (typeof Chart === 'undefined') {
        return;
    }

    updateChart('staffFeedbackAverageChart', 'bar', {
        labels: averageDataset.map(item => item.label),
        datasets: [{ label: 'Average Rating', data: averageDataset.map(item => item.value), backgroundColor: averageDataset.map(item => getColorForLabel(item.label)) }]
    }, { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 5 } } });

    updateChart('staffFeedbackPerformanceChart', 'line', {
        labels: ratingsOverTime.map(item => item.date),
        datasets: [{ label: 'Feedback Rating', data: ratingsOverTime.map(item => item.rating), borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.16)', fill: true, tension: 0.3 }]
    }, { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 5 } } });
}

function updateITTrackerFields() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const locationSelect = document.getElementById('itTrackerLocationSelect');
    const remarksText = document.getElementById('itTrackerRemarksText');
    const phoneInput = document.getElementById('itTrackerPhoneInput');
    const emailInput = document.getElementById('itTrackerEmailInput');
    const linkInput = document.getElementById('itTrackerLinkInput');
    const photoInput = document.getElementById('itTrackerPhotoInput');
    const passwordInput = document.getElementById('itTrackerPasswordInput');
    const nameInput = document.getElementById('itTrackerNameInput');
    const roleInput = document.getElementById('itTrackerRoleInput');
    const ageInput = document.getElementById('itTrackerAgeInput');
    const statusPill = document.getElementById('itTrackerStatusPill');
    const selectedStaff = staffSelect.value;

    if (!selectedStaff) {
        locationSelect.value = '';
        remarksText.value = '';
        phoneInput.value = '';
        emailInput.value = '';
        linkInput.value = '';
        if (nameInput) nameInput.value = '';
        if (roleInput) roleInput.value = '';
        if (ageInput) ageInput.value = '';
        if (photoInput) photoInput.value = '';
        if (statusPill) {
            statusPill.textContent = 'On call';
            statusPill.classList.remove('status-pill-live');
            statusPill.classList.add('status-pill-offline');
        }
        return;
    }

    const profiles = getStoredStaffProfiles();
    const data = profiles[selectedStaff] || {};

    locationSelect.value = data.location || '';
    remarksText.value = data.remarks || '';
    phoneInput.value = data.phone || '';
    emailInput.value = data.email || '';
    linkInput.value = data.link || '';
    if (nameInput) nameInput.value = data.name || '';
    if (roleInput) roleInput.value = data.role || '';
    if (ageInput) ageInput.value = data.age || '';
    if (photoInput) photoInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (statusPill) {
        const shiftStatus = data.shiftStatus || (data.location ? 'live' : 'offline');
        const isLive = shiftStatus === 'live';
        const isOffline = shiftStatus === 'offline';
        const isStandby = shiftStatus === 'standby';
        const isOnLeave = shiftStatus === 'onleave';
        statusPill.textContent = isLive ? `Live @ ${data.location}` : isOffline ? 'On call' : isOnLeave ? 'On Leave' : 'Standby';
        statusPill.classList.toggle('status-pill-live', isLive);
        statusPill.classList.toggle('status-pill-offline', isOffline);
        statusPill.classList.toggle('status-pill-standby', isStandby);
        statusPill.classList.toggle('status-pill-onleave', isOnLeave);
    }
    // Restrict profile editing to the signed-in admin's own profile
    const currentUser = adminUserKey || sessionStorage.getItem('adminUserKey');
    const currentRole = getCurrentAdminProfile()?.role || '';
    const selectedProfile = profiles[selectedStaff] || {};
    const isSelf = currentUser && currentUser === selectedStaff;
    const canEditPeer = selectedProfile && currentUser && currentUser !== selectedStaff && canModifyProfile(currentRole, selectedProfile.role);
    const canEditProfile = isSelf || canEditPeer;
    const canEditRole = (normalizeRole(currentRole) === 'it manager' || isSuperAdminUser(getCurrentAdminKey()));

    if (nameInput) nameInput.disabled = !canEditProfile;
    if (roleInput) roleInput.disabled = !canEditRole;
    if (ageInput) ageInput.disabled = !canEditProfile;
    if (phoneInput) phoneInput.disabled = !canEditProfile;
    if (emailInput) emailInput.disabled = !canEditProfile;
    if (linkInput) linkInput.disabled = !canEditProfile;
    if (photoInput) photoInput.disabled = !canEditProfile;
    if (passwordInput) passwordInput.disabled = !canEditProfile;
    const updateBtn = document.querySelector('.it-tracker-section--profile .add-btn');
    if (updateBtn) {
        updateBtn.disabled = !canEditProfile;
        updateBtn.title = canEditProfile ? 'Save profile changes' : 'You can only update your own profile or a lower-ranked team member';
    }
    
    // Display feedback for the selected staff member
    displayStaffFeedback(selectedStaff);
}

function startShiftForSelectedStaff() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const locationSelect = document.getElementById('itTrackerLocationSelect');
    const remarksText = document.getElementById('itTrackerRemarksText');

    let selectedStaff = (staffSelect && staffSelect.value) ? staffSelect.value : '';
    if (!selectedStaff) {
        const adminKey = getCurrentAdminKey();
        if (adminKey === 'ali') {
            const profiles = Object.values(getStoredStaffProfiles()).filter(p => !p.disabled && p.id !== 'ali');
            if (profiles.length) selectedStaff = profiles[0].id;
        } else if (adminKey) {
            selectedStaff = adminKey;
        }
    }
    if (!selectedStaff) {
        toastNotice('warning', 'Missing Selection', 'Please select an IT staff member first.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    const selectedProfile = profiles[selectedStaff];
    if (!selectedProfile) {
        toastNotice('error', 'Profile Not Found', 'The selected staff member does not exist.');
        return;
    }

    const currentShiftStatus = selectedProfile.shiftStatus || (selectedProfile.location ? 'live' : 'offline');
    if (currentShiftStatus === 'live') {
        toastNotice('info', 'Shift Already Active', 'This staff member is already on shift. End the current shift before starting a new one.');
        return;
    }

    const locationValue = (locationSelect && locationSelect.value) ? locationSelect.value : (selectedProfile.location || '');
    const shiftStatus = locationValue ? 'live' : 'standby';

    profiles[selectedStaff] = {
        ...selectedProfile,
        shiftStatus,
        location: locationValue,
        remarks: (remarksText && remarksText.value) ? remarksText.value.trim() : (selectedProfile.remarks || '')
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    updateBHFMapStaffMarkers();
    populateITTrackerControls();
    updateITTrackerFields();
    addShiftHistoryEntry('start_shift', selectedStaff, { location: locationValue, remarks: remarksText ? remarksText.value.trim() : '' });
    recordModification('start_shift', selectedStaff, { location: locationValue });
    toastNotice('success', 'Shift Started', shiftStatus === 'live' ? 'Staff member is now Live on shift.' : 'Staff member is now Standby.');
}

function openITTrackerLogHistoryModal() {
    if (getCurrentAdminKey() !== 'ali') {
        toastNotice('error', 'Access Denied', 'Only Ali is allowed to view the IT shift log history.');
        return;
    }

    const overlay = document.getElementById('itTrackerLogHistoryModal');
    const content = document.getElementById('itTrackerShiftHistoryContent');
    if (!overlay || !content) return;

    const entries = Array.isArray(itShiftHistory) ? itShiftHistory : [];
    if (entries.length === 0) {
        content.innerHTML = `<div class="feedback-history-card" style="padding: 24px; text-align:center; color:#475569; font-style:italic;">No shift history has been recorded yet.</div>`;
    } else {
        content.innerHTML = entries.map(entry => {
            const eventLabel = entry.action === 'start_shift' ? 'Shift Started' : entry.action === 'end_shift' ? 'Shift Ended' : 'Shift Update';
            const time = new Date(entry.timestamp).toLocaleString();
            const location = entry.details && entry.details.location ? entry.details.location : 'No branch assigned';
            const remarks = entry.details && entry.details.remarks ? entry.details.remarks : '';
            return `
                <div class="feedback-history-card" style="padding: 18px; border-radius: 24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                        <div>
                            <strong style="font-size: 15px;">${eventLabel}</strong>
                            <div style="color:#475569; margin-top:6px;">${entry.staffName} (${entry.username || entry.staffKey})</div>
                        </div>
                        <div style="font-size:13px; color:#64748b; text-align:right; min-width:160px;">${time}</div>
                    </div>
                    <div style="margin-top:12px; display:grid; gap:8px; color:#334155;">
                        <div><strong>Branch:</strong> ${location}</div>
                        ${remarks ? `<div><strong>Remarks:</strong> ${remarks}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    overlay.classList.remove('hidden');
}

function closeITTrackerLogHistoryModal() {
    const overlay = document.getElementById('itTrackerLogHistoryModal');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

async function saveITTrackerDeployment() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const locationSelect = document.getElementById('itTrackerLocationSelect');
    const remarksText = document.getElementById('itTrackerRemarksText');

    if (!staffSelect || !locationSelect || !remarksText) return;

    const selectedStaff = staffSelect.value;
    if (!selectedStaff) {
        toastNotice('warning', 'Missing Selection', 'Please select an IT staff member first.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    const profile = profiles[selectedStaff];
    if (!profile) {
        toastNotice('error', 'Profile Not Found', 'The selected staff member does not exist.');
        return;
    }

    const currentShiftStatus = profile.shiftStatus || (profile.location ? 'live' : 'offline');
    if (currentShiftStatus === 'offline') {
        toastNotice('warning', 'Offline Staff', 'Cannot save a deployment for an offline staff member. Start the shift first.');
        return;
    }

    const hasLocation = Boolean(locationSelect.value);
    if (!hasLocation) {
        toastNotice('warning', 'Missing Location', 'Choose the branch or location for this staff deployment.');
        return;
    }

    const isOffline = false;
    if (!profiles[selectedStaff]) {
        toastNotice('error', 'Profile Not Found', 'The selected staff member does not exist.');
        return;
    }

    const shiftStatus = isOffline ? 'offline' : 'live';
    profiles[selectedStaff] = {
        ...profiles[selectedStaff],
        shiftStatus,
        location: isOffline ? '' : locationSelect.value,
        remarks: remarksText.value.trim()
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    updateBHFMapStaffMarkers();
    populateITTrackerControls();
    updateITTrackerFields();
    recordModification('update_deployment', selectedStaff, { location: locationSelect.value, remarks: remarksText.value.trim() });
    toastNotice('success', 'Deployment Updated', 'Location and remarks have been saved for the selected staff member.');
}

async function saveITProfileDetails() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const nameInput = document.getElementById('itTrackerNameInput');
    const roleInput = document.getElementById('itTrackerRoleInput');
    const ageInput = document.getElementById('itTrackerAgeInput');
    const phoneInput = document.getElementById('itTrackerPhoneInput');
    const emailInput = document.getElementById('itTrackerEmailInput');
    const passwordInput = document.getElementById('itTrackerPasswordInput');
    const linkInput = document.getElementById('itTrackerLinkInput');
    const photoInput = document.getElementById('itTrackerPhotoInput');
    const selectedStaff = staffSelect.value;
    const photoFile = photoInput && photoInput.files && photoInput.files[0];

    if (!selectedStaff) {
        toastNotice('warning', 'Missing Selection', 'Select a staff profile before updating profile details.');
        return;
    }

    const currentUser = adminUserKey || sessionStorage.getItem('adminUserKey');
    const currentRole = getCurrentAdminProfile()?.role || '';
    const profiles = getStoredStaffProfiles();
    const selectedProfile = profiles[selectedStaff] || {};
    const isSelf = currentUser && currentUser === selectedStaff;
    const canEditPeer = selectedProfile && currentUser && currentUser !== selectedStaff && canModifyProfile(currentRole, selectedProfile.role);
    if (!isSelf && !canEditPeer) {
        toastNotice('error', 'Restricted Access', 'You can only edit your own profile or a lower-ranked staff member profile if permitted.');
        return;
    }

    const desiredRole = roleInput.value.trim();
    const updatedRole = (normalizeRole(currentRole) === 'it manager' || isSuperAdminUser(getCurrentAdminKey())) ? desiredRole : selectedProfile.role;

    if (!nameInput.value.trim() || !updatedRole) {
        toastNotice('warning', 'Input Required', 'Name and role are required for profile updates.');
        return;
    }

    const profile = profiles[selectedStaff];
    if (!profile) {
        toastNotice('error', 'Profile Not Found', 'The selected staff profile cannot be found.');
        return;
    }

    let image = profile.image;
    if (photoFile) {
        try {
            image = await readFileAsDataURL(photoFile);
        } catch (err) {
            toastNotice('error', 'Image Error', 'Unable to read the selected profile photo.');
            return;
        }
    }

    profiles[selectedStaff] = {
        ...profile,
        name: nameInput.value.trim(),
        role: updatedRole,
        age: ageInput.value ? parseInt(ageInput.value, 10) : profile.age || '',
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        password: (passwordInput && passwordInput.value) ? passwordInput.value : profile.password,
        link: linkInput.value.trim(),
        image
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    populateITTrackerControls();
    updateITTrackerFields();
    if (photoInput) photoInput.value = '';
    if (passwordInput) passwordInput.value = '';
    const modificationDetails = {
        name: nameInput.value.trim(),
        role: updatedRole,
        age: ageInput.value,
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        link: linkInput.value.trim()
    };
    if (passwordInput && passwordInput.value) {
        modificationDetails.passwordChanged = true;
    }
    recordModification('update_profile', selectedStaff, modificationDetails);
    toastNotice('success', 'Profile Updated', 'Profile details have been saved successfully.');
}

async function saveITTrackerUpdate() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const locationSelect = document.getElementById('itTrackerLocationSelect');
    const remarksText = document.getElementById('itTrackerRemarksText');
    const phoneInput = document.getElementById('itTrackerPhoneInput');
    const emailInput = document.getElementById('itTrackerEmailInput');
    const linkInput = document.getElementById('itTrackerLinkInput');
    const selectedStaff = staffSelect.value;

    const photoInput = document.getElementById('itTrackerPhotoInput');
    const photoFile = photoInput && photoInput.files && photoInput.files[0];

    if (!selectedStaff) {
        toastNotice('warning', 'Missing Information', 'Please select a staff member');
        return;
    }

    if (!locationSelect.value) {
        toastNotice('warning', 'Missing Information', 'Please select a location');
        return;
    }

    const profiles = getStoredStaffProfiles();
    if (!profiles[selectedStaff]) {
        toastNotice('error', 'Unknown Staff', 'Selected staff member cannot be found.');
        return;
    }

    if (photoFile) {
        try {
            profiles[selectedStaff].image = await readFileAsDataURL(photoFile);
        } catch (err) {
            toastNotice('error', 'Image Error', 'Unable to load the selected profile picture.');
            return;
        }
    }

    profiles[selectedStaff] = {
        ...profiles[selectedStaff],
        phone: phoneInput.value.trim() || profiles[selectedStaff].phone,
        email: emailInput.value.trim(),
        link: linkInput.value.trim(),
        location: locationSelect.value,
        remarks: remarksText.value.trim()
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    populateITTrackerControls();
    toastNotice('success', 'Update Saved', 'IT staff details updated.');
    goHome();
}

async function addNewITStaff() {
    const nameInput = document.getElementById('newStaffName');
    const usernameInput = document.getElementById('newStaffUsername');
    const roleInput = document.getElementById('newStaffRole');
    const phoneInput = document.getElementById('newStaffPhone');
    const emailInput = document.getElementById('newStaffEmail');
    const linkInput = document.getElementById('newStaffLink');

    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const role = roleInput.value.trim();
    const imageInput = document.getElementById('newStaffImage');
    const imageFile = imageInput && imageInput.files && imageInput.files[0];

    if (!name || !role) {
        toastNotice('warning', 'Input Required', 'Enter both a full name and a role to add a new staff member.');
        return;
    }

    if (!username) {
        toastNotice('warning', 'Username Required', 'Enter a username (must start with BHF-).');
        return;
    }

    if (!username.toLowerCase().startsWith('bhf-')) {
        toastNotice('warning', 'Invalid Username', 'Username must start with BHF- (e.g., BHF-Ali, BHF-NewStaff).');
        return;
    }

    if (normalizeRole(role) === 'it manager' && !canAssignITManagerRole(getCurrentAdminProfile()?.role || '')) {
        toastNotice('warning', 'Forbidden Role', 'Only Ali or Super Admin can assign the IT Manager role.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    const staffKey = buildStaffKey(name);
    if (profiles[staffKey]) {
        toastNotice('warning', 'Duplicate Staff', 'A profile with this name already exists.');
        return;
    }

    // Check if username already exists
    const usernameLower = username.toLowerCase();
    if (Object.values(profiles).some(p => (p.username || '').toLowerCase() === usernameLower)) {
        toastNotice('warning', 'Username Taken', 'This username is already in use.');
        return;
    }

    let imageUrl = '';
    if (imageFile) {
        try {
            imageUrl = await readFileAsDataURL(imageFile);
        } catch (err) {
            toastNotice('error', 'Image Error', 'Unable to load the selected profile picture.');
            return;
        }
    }

    profiles[staffKey] = {
        id: staffKey,
        idNumber: getNextStaffIdNumber(),
        name,
        role,
        username,
        password: '123456',
        image: imageUrl,
        phone: phoneInput.value.trim() || '+63 917 000 0000',
        email: emailInput.value.trim(),
        link: linkInput.value.trim(),
        location: '',
        remarks: ''
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    populateITTrackerControls();
    nameInput.value = '';
    usernameInput.value = '';
    roleInput.value = '';
    if (imageInput) imageInput.value = '';
    phoneInput.value = '';
    emailInput.value = '';
    linkInput.value = '';
    toastNotice('success', 'Staff Added', 'New IT staff profile has been created.');
    recordModification('create_profile', staffKey, { name, role, username });
}

function removeCurrentITStaff() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const selectedStaff = staffSelect.value;
    if (!selectedStaff) {
        toastNotice('warning', 'No Staff Selected', 'Choose a staff profile to remove first.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    const profile = profiles[selectedStaff];
    if (!profile) {
        toastNotice('error', 'Unknown Staff', 'Selected staff profile cannot be found.');
        return;
    }

    pendingStaffRemoval = selectedStaff;
    const text = document.getElementById('removeStaffModalText');
    if (text) {
        text.textContent = `Delete ${profile.name} from the IT roster? This action cannot be undone.`;
    }
    const overlay = document.getElementById('removeStaffModalOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function closeRemoveStaffModal() {
    pendingStaffRemoval = null;
    const overlay = document.getElementById('removeStaffModalOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function confirmRemoveCurrentITStaff() {
    if (!pendingStaffRemoval) {
        closeRemoveStaffModal();
        return;
    }

    const profiles = getStoredStaffProfiles();
    const profileName = profiles[pendingStaffRemoval]?.name || 'Staff member';
    // Mark the profile as disabled instead of deleting so histories remain intact
    profiles[pendingStaffRemoval] = {
        ...profiles[pendingStaffRemoval],
        disabled: true
    };
    persistStaffProfiles(profiles);
    recordModification('disable_profile', pendingStaffRemoval, { name: profileName });
    renderUserListsTable();
    renderITStaffProfileGrid();
    populateITTrackerControls();
    resetITTrackerForm();
    closeRemoveStaffModal();
    toastNotice('warning', 'Staff Disabled', `${profileName} was disabled and removed from the roster.`);
}

function resetITTrackerForm() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const locationSelect = document.getElementById('itTrackerLocationSelect');
    const remarksText = document.getElementById('itTrackerRemarksText');
    const phoneInput = document.getElementById('itTrackerPhoneInput');
    const emailInput = document.getElementById('itTrackerEmailInput');
    const linkInput = document.getElementById('itTrackerLinkInput');
    const photoInput = document.getElementById('itTrackerPhotoInput');

    if (staffSelect) {
        const currentUser = getCurrentAdminKey();
        const profiles = Object.values(getStoredStaffProfiles()).filter(p => !p.disabled);
        const currentValue = staffSelect.value || '';
        const fallbackValue = currentUser && profiles.some(p => p.id === currentUser) ? currentUser : '';
        if (currentValue && profiles.some(p => p.id === currentValue)) {
            staffSelect.value = currentValue;
        } else if (fallbackValue) {
            staffSelect.value = fallbackValue;
        } else {
            staffSelect.value = '';
        }
    }
    if (locationSelect) locationSelect.value = '';
    if (remarksText) remarksText.value = '';
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
    if (linkInput) linkInput.value = '';
    if (photoInput) photoInput.value = '';
    try { updateITTrackerFields(); } catch (e) {}
}

function updateITProfilesDisplay() {
    const container = document.getElementById('staffProfilesHomeContainer');
    if (!container) return;

    // Fetch live items (exclude superadmin ghost)
    const rawProfiles = getVisibleStaffProfiles(true) || {};
    let profiles = Object.values(rawProfiles);

    // 1. FIXED LAYOUT: Sort profiles so Sir Ali always comes first
    profiles.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA.includes('ali')) return -1;
        if (nameB.includes('ali')) return 1;
        return 0; 
    });

    if (profiles.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:#64748b;">No staff profiles available.</div>';
        return;
    }

    // 2. PREVENT BLINKING: Create the layout markup
    const targetHtml = profiles.map(p => {
        const initials = p.name ? p.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() : 'IT';
        const avatarHtml = p.image ? `<img src="${p.image}" alt="${p.name || 'IT'}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />` : initials;
        const currentStatus = p.status || (p.location ? 'Active' : 'Offline');
        const statusColor = currentStatus === 'Active' ? '#22c55e' : '#ef4444';

        return `
            <div class="staff-card" data-profile-id="${p.id || ''}">
                <div class="staff-avatar">${avatarHtml}</div>
                <div class="staff-info">
                    <div class="staff-name">${p.name || 'Unnamed'}</div>
                    <div class="staff-role">${p.role || 'IT Staff'}</div>
                    <div style="font-size:12px; margin-top:4px; font-weight:600; color:${statusColor};">
                         ● ${currentStatus}
                    </div>
                </div>
            </div>`;
    }).join('');

    // Only update DOM if HTML is genuinely different (stops the blinking/flickering)
    if (container.innerHTML !== targetHtml) {
        container.innerHTML = targetHtml;
    }
}

function openStaffProfileModal(staffKey) {
    const profiles = getStoredStaffProfiles();
    const profile = profiles[staffKey];
    if (!profile) {
        toastNotice('error', 'Profile Not Found', 'The requested staff profile cannot be loaded.');
        return;
    }

    const overlay = document.getElementById('staffProfileModal');
    const title = document.getElementById('staffProfileTitle');
    const roleEl = document.getElementById('staffProfileRole');
    const statusEl = document.getElementById('staffProfileStatus');
    const summaryEl = document.getElementById('staffProfileSummary');
    const phoneEl = document.getElementById('staffProfilePhone');
    const emailEl = document.getElementById('staffProfileEmail');
    const linksContainer = document.getElementById('staffProfileLinks');
    const emailButton = document.getElementById('staffEmailLink');
    const avatarWrapper = document.getElementById('staffProfileAvatar');
    const locationEl = document.getElementById('staffProfileLocation');
    const bioText = profile.remarks ? profile.remarks : 'No bio available yet.';
    const locationText = profile.location ? profile.location : 'Location not assigned';

    if (avatarWrapper) {
        if (profile.image) {
            avatarWrapper.innerHTML = `<img src="${profile.image}" alt="${profile.name}" />`;
        } else {
            avatarWrapper.innerHTML = `<div class="profile-avatar-placeholder profile-avatar-placeholder--large"><i class="fas fa-user"></i></div>`;
        }
    }
    if (title) title.textContent = profile.name;
    if (roleEl) roleEl.textContent = profile.role;
    if (statusEl) {
        const shiftStatus = profile.shiftStatus || (profile.location ? 'live' : 'offline');
        if (shiftStatus === 'live') {
            statusEl.textContent = `Live @ ${profile.location}`;
        } else if (shiftStatus === 'offline') {
            statusEl.textContent = 'On call';
        } else if (shiftStatus === 'onleave') {
            statusEl.textContent = 'On Leave';
        } else {
            statusEl.textContent = 'Standby';
        }
    }
    if (summaryEl) summaryEl.textContent = bioText;
    if (phoneEl) phoneEl.textContent = profile.phone || 'Phone not set';
    if (emailEl) emailEl.textContent = profile.email ? profile.email : 'Email not set';
    if (locationEl) locationEl.textContent = locationText;

    if (linksContainer) {
        if (profile.link) {
            linksContainer.innerHTML = `<a href="${profile.link}" target="_blank" rel="noopener noreferrer" aria-label="Open Facebook profile"><i class="fab fa-facebook-f"></i> Facebook profile</a>`;
            linksContainer.classList.remove('hidden');
        } else {
            linksContainer.innerHTML = '';
            linksContainer.classList.add('hidden');
        }
    }

    if (emailButton) {
        if (profile.email) {
            emailButton.classList.remove('hidden');
            emailButton.href = `mailto:${profile.email}`;
        } else {
            emailButton.classList.add('hidden');
            emailButton.href = '#';
        }
    }

    // Hide the Admin Login button in the modal when already authenticated
    try {
        const adminBtn = document.getElementById('staffAdminLoginBtn');
        if (adminBtn) adminBtn.style.display = adminAuthenticated ? 'none' : '';
    } catch (e) {}

    if (overlay) overlay.classList.remove('hidden');
}

function closeStaffProfileModal() {
    const overlay = document.getElementById('staffProfileModal');
    if (overlay) overlay.classList.add('hidden');
}

function editStaffFromModal() {
    const staffName = document.getElementById('staffProfileTitle').textContent;
    const profiles = getStoredStaffProfiles();
    const selectedKey = Object.keys(profiles).find(key => profiles[key].name === staffName);
    if (!selectedKey) {
        toastNotice('error', 'Not Found', 'Unable to locate the staff profile for editing.');
        return;
    }

    closeStaffProfileModal();
    showITTrackerPage();
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    if (staffSelect) {
        staffSelect.value = selectedKey;
        updateITTrackerFields();
    }
}

function handleStaffEmailClick(event) {
    event.preventDefault();
    const emailButton = document.getElementById('staffEmailLink');
    if (!emailButton) return;
    const href = emailButton.href || '';
    const email = href.replace(/^mailto:/, '');
    if (!email || email === '#') {
        toastNotice('warning', 'No Email', 'This IT staff profile does not have an email address configured.');
        return;
    }
    toastNotice('info', 'Email Action', `Opening your mail client for ${email}.`);
    window.location.href = href;
}

function highlightActiveProfileCard(staffKey = '') {
    const cards = document.querySelectorAll('.profile-card');
    cards.forEach(card => card.classList.toggle('profile-card-active', card.id === `${staffKey}Card`));
}

// Staff feedback management
let currentStaffForFeedback = '';

function openStaffFeedbackForm() {
    const staffName = document.getElementById('staffProfileTitle').textContent;
    const profiles = getStoredStaffProfiles();
    const staffKey = Object.keys(profiles).find(key => profiles[key].name === staffName);
    
    if (!staffKey) {
        toastNotice('error', 'Error', 'Unable to identify the staff member.');
        return;
    }
    
    const loggedInUserKey = getCurrentAdminKey();
    const branchField = document.getElementById('feedbackBranchField');
    const branchSelect = document.getElementById('feedbackBranchSelect');
    const departmentInput = document.getElementById('feedbackDepartmentInput');
    const loggedInProfile = loggedInUserKey ? profiles[loggedInUserKey] : null;

    currentStaffForFeedback = staffKey;
    document.getElementById('feedbackStaffName').textContent = staffName;

    if (branchField && branchSelect) {
        if (loggedInProfile) {
            branchField.style.display = 'none';
            branchSelect.value = loggedInProfile.location || '';
        } else {
            branchField.style.display = 'block';
            branchSelect.value = '';
        }
    }

    departmentInput.value = loggedInProfile?.role || '';
    setFeedbackStarRating(0);
    renderFeedbackQuestionChoices();
    document.querySelectorAll('input[type="radio"][name^="feedbackQuestion"]').forEach(el => { el.checked = false; });
    document.getElementById('feedbackCommentText').value = '';
    
    const feedbackModal = document.getElementById('staffFeedbackModalOverlay');
    if (feedbackModal) feedbackModal.classList.remove('hidden');
}

function closeStaffFeedbackForm() {
    const feedbackModal = document.getElementById('staffFeedbackModalOverlay');
    if (feedbackModal) feedbackModal.classList.add('hidden');
    currentStaffForFeedback = '';
}

function isSuperAdminUser(actorKeyOrProfile) {
    if (typeof actorKeyOrProfile === 'string') {
        return actorKeyOrProfile === 'superadmin';
    }
    const profile = actorKeyOrProfile || getCurrentAdminProfile();
    return !!(profile && (profile.superAdmin === true || profile.id === 'superadmin' || (profile.username || '').toLowerCase() === 'superadminbhf'));
}

function canCreateStaff(actorRole) {
    const currentProfile = getCurrentAdminProfile();
    if (!currentProfile || currentProfile.disabled) return false;
    return true;
}

function canAssignITManagerRole(actorRole) {
    return normalizeRole(actorRole) === 'it manager' || isSuperAdminUser(getCurrentAdminKey());
}

function openAddStaffModal() {
    const currentRole = getCurrentAdminProfile()?.role || '';
    console.debug('[openAddStaffModal] entered', { currentRole, currentKey: getCurrentAdminKey(), currentProfile: getCurrentAdminProfile() });
    if (!canCreateStaff(currentRole)) {
        console.debug('[openAddStaffModal] blocked by canCreateStaff', { currentRole, currentKey: getCurrentAdminKey() });
        toastNotice('warning', 'Access denied', 'You do not have permission to add new staff.');
        return;
    }
    populateAddStaffRoleOptions();
    const overlay = document.getElementById('addStaffModalOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        console.debug('[openAddStaffModal] modal opened');
    } else {
        console.debug('[openAddStaffModal] modal element not found');
    }
}

function closeAddStaffModal() {
    const overlay = document.getElementById('addStaffModalOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function openUpdateProfileModal() {
    const overlay = document.getElementById('updateProfileModalOverlay');
    const profiles = getStoredStaffProfiles();
    const currentUser = getCurrentAdminKey();
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    const selectedStaff = currentUser || (staffSelect ? staffSelect.value : '');
    const profile = profiles[selectedStaff];

    if (!profile) {
        toastNotice('warning', 'No Profile Selected', 'Please select a staff member or log in to edit a profile.');
        return;
    }

    document.getElementById('itTrackerNameInput').value = profile.name || '';
    document.getElementById('itTrackerRoleInput').value = profile.role || '';
    document.getElementById('itTrackerAgeInput').value = profile.age || '';
    document.getElementById('itTrackerPhoneInput').value = profile.phone || '';
    document.getElementById('itTrackerEmailInput').value = profile.email || '';
    document.getElementById('itTrackerLinkInput').value = profile.link || '';
    document.getElementById('itTrackerPasswordInput').value = '';
    const photoInput = document.getElementById('itTrackerPhotoInput');
    if (photoInput) photoInput.value = '';
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function closeUpdateProfileModal() {
    const overlay = document.getElementById('updateProfileModalOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function openFeedbackQuestionModal() {
    const overlay = document.getElementById('feedbackQuestionModalOverlay');
    if (overlay) {
        loadFeedbackQuestionSettings();
        overlay.classList.remove('hidden');
    }
}

function closeFeedbackQuestionModal() {
    const overlay = document.getElementById('feedbackQuestionModalOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function submitStaffFeedback() {
    if (!currentStaffForFeedback) {
        toastNotice('error', 'Error', 'No staff member selected.');
        return;
    }
    
    const branchSelect = document.getElementById('feedbackBranchSelect');
    const branch = branchSelect?.value || '';
    const department = document.getElementById('feedbackDepartmentInput').value.trim();
    const ratingValue = Number(document.getElementById('feedbackRatingInput').value || '0');
    const comment = document.getElementById('feedbackCommentText').value.trim();
    const questions = getStoredFeedbackQuestions();
    const answers = questions.map((_, index) => {
        return (document.querySelector(`input[name="feedbackQuestion${index}"]:checked`)?.value || '').trim();
    });

    const loggedInUserKey = adminUserKey || sessionStorage.getItem('adminUserKey');
    const branchRequired = !loggedInUserKey;
    const missingParts = [];
    if (branchRequired && !branch) missingParts.push('branch');
    if (!department) missingParts.push('department');
    if (ratingValue < 1) missingParts.push('rating');
    if (answers.some(ans => !ans)) missingParts.push('all questions');
    if (!comment) missingParts.push('feedback message');
    if (missingParts.length > 0) {
        toastNotice('warning', 'Incomplete', `Please fill in the ${missingParts.join(', ')}.`);
        return;
    }

    const submittedBy = loggedInUserKey || 'Anonymous';
    const profiles = getStoredStaffProfiles();
    const loggedInProfile = loggedInUserKey ? profiles[loggedInUserKey] : null;
    const storedBranch = branch || loggedInProfile?.location || loggedInProfile?.username || loggedInProfile?.name || '';

    const feedback = {
        id: `feedback-${Date.now()}`,
        staffKey: currentStaffForFeedback,
        branch: storedBranch,
        department: department,
        rating: ratingValue,
        answers: answers,
        questions: questions,
        comment: comment,
        submittedAt: new Date().toISOString(),
        submittedBy: submittedBy
    };
    
    let allFeedbacks = JSON.parse(localStorage.getItem('staffFeedbacks') || '[]');
    allFeedbacks.push(feedback);
    localStorage.setItem('staffFeedbacks', JSON.stringify(allFeedbacks));
    
    toastNotice('success', 'Feedback Submitted', 'Your feedback has been recorded successfully.');
    closeStaffFeedbackForm();
    
    const staffFeedbackPage = document.getElementById('staffFeedbackHistoryPage');
    if (staffFeedbackPage && !staffFeedbackPage.classList.contains('hidden')) {
        renderStaffFeedbackHistoryPage();
    }

    const itTrackerPage = document.getElementById('itTrackerPage');
    if (itTrackerPage && !itTrackerPage.classList.contains('hidden')) {
        updateITTrackerFields();
    }
}

function displayStaffFeedback(staffKey) {
    const feedbackList = document.getElementById('itTrackerFeedbackList');
    if (!feedbackList) return;
    
    let allFeedbacks = JSON.parse(localStorage.getItem('staffFeedbacks') || '[]');
    const staffFeedbacks = allFeedbacks.filter(fb => fb.staffKey === staffKey);
    
    if (staffFeedbacks.length === 0) {
        feedbackList.innerHTML = '<p style="color: #94a3b8; font-style: italic; text-align: center; padding: 20px;">No feedback yet for this staff member.</p>';
        return;
    }
    
    feedbackList.innerHTML = staffFeedbacks.map(fb => {
        const date = new Date(fb.submittedAt).toLocaleDateString();
        const ratingColor = fb.rating >= 4 ? '#22c55e' : fb.rating === 3 ? '#3b82f6' : fb.rating === 2 ? '#f59e0b' : '#ef4444';
        const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
        const questionBlocks = fb.questions && fb.answers ? fb.questions.map((question, idx) => `
                <div style="margin-top: 10px;">
                    <div style="font-size: 12px; color: #475569; font-weight: 700;">${question}</div>
                    <div style="font-size: 12px; color: #334155; margin-top: 4px;">${fb.answers[idx] || ''}</div>
                </div>
            `).join('') : '';
        
        return `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; border-left: 4px solid ${ratingColor};">
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
                        <div>
                            <div style="font-weight: 700; color: #1f2937; font-size: 13px;">Feedback from ${fb.branch ? fb.branch : fb.submittedBy}${fb.department ? ` — ${fb.department}` : ''}</div>
                            <div style="font-size: 11px; color: #64748b;">Submitted ${date} by ${fb.submittedBy}</div>
                        </div>
                        <div style="background: ${ratingColor}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap;">${stars}</div>
                    </div>
                    ${questionBlocks}
                </div>
                <p style="margin: 0; color: #334155; font-size: 12px; line-height: 1.5;">${fb.comment}</p>
            </div>`;
    }).join('');
}

function closeAdvancedHealthDashboard() {
    const overlay = document.getElementById('advancedHealthModalOverlay');
    if (overlay) {
        // If we moved original nodes into the modal, restore them back to the original panel
        if (window._advancedHealthMoved && window._advancedHealthMoved.nodes && window._advancedHealthMoved.panelId) {
            const moved = window._advancedHealthMoved;
            const originalPanel = document.getElementById(moved.panelId);
            if (originalPanel) {
                moved.nodes.forEach(n => originalPanel.appendChild(n));
            }
            delete window._advancedHealthMoved;
        }

        overlay.remove();
        document.body.classList.remove('no-scroll');
        return;
    }

    // Fallback: hide inline panel if present
    const panel = document.getElementById('advancedHealthDashboard');
    if (panel) panel.classList.add('hidden');
}

function showAdvancedHealthDashboard() {
    const panel = document.getElementById('advancedHealthDashboard');
    if (!panel) return;

    const overlay = document.createElement('div');
    overlay.id = 'advancedHealthModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(15, 23, 42, 0.6)';
    overlay.style.zIndex = '9998';
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeAdvancedHealthDashboard();
    });

    const modal = document.createElement('div');
    modal.className = 'modal-panel';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    // Let CSS handle responsive max-width/width so mobile rules can apply
    modal.style.maxHeight = '90vh';
    modal.style.overflow = 'auto';
    modal.style.background = '#ffffff';
    modal.style.borderRadius = '24px';
    modal.style.boxShadow = '0 30px 60px rgba(15, 23, 42, 0.25)';
    modal.style.padding = '24px';
    modal.style.zIndex = '9999';

    const panelClone = panel.cloneNode(true);
    panelClone.classList.remove('hidden');
    panelClone.style.margin = '0';
    panelClone.style.boxShadow = 'none';
    panelClone.style.background = 'transparent';

    modal.appendChild(panelClone);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('no-scroll');
}

function showInventoryReportPage() {
    if (!adminAuthenticated) {
        document.getElementById("pinModalOverlay").classList.remove("hidden");
        const userFieldInv = document.getElementById('adminUsernameField');
        const passFieldInv = document.getElementById('adminPasswordField');
        if (userFieldInv) userFieldInv.value = '';
        if (passFieldInv) passFieldInv.value = '';
        if (userFieldInv) userFieldInv.focus();
        window.pendingAdminBranch = 'inventory';
        return;
    }

    hideAllPages();
    const target = document.getElementById("inventoryReportPage");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    initializeInventoryFilter();
    inventoryQuickFilter = 'all';
    inventoryFindingsVisible = false;
    setInventorySummarySelection(null);
    updateInventoryFindingsSubtitle('all');

    const findingsWrapper = document.getElementById('inventoryFindingsWrapper');
    const overlay = document.getElementById('inventoryOverlay');
    if (findingsWrapper) findingsWrapper.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('no-scroll');

    renderInventoryReportView();
    try { restoreNavVisibility(); } catch(e) {}
}

function restoreNavVisibility() {
    updateNavVisibility();
    updateHamburgerVisibility();
}

function openLegacyAdministration() {
    // Prompt for admin PIN, and on successful verify redirect to legacy-home.html
    window.pendingAdminBranch = 'legacyHome';
    document.getElementById("pinModalOverlay").classList.remove("hidden");
    const userFieldLegacy = document.getElementById('adminUsernameField');
    const passFieldLegacy = document.getElementById('adminPasswordField');
    if (userFieldLegacy) userFieldLegacy.value = '';
    if (passFieldLegacy) passFieldLegacy.value = '';
    if (userFieldLegacy) userFieldLegacy.focus();
}

function setInventoryQuickFilter(filter, refresh = true) {
    inventoryQuickFilter = filter;
    if (refresh) {
        renderInventoryReportView();
    }
}

function applyInventorySummaryFilter(filter) {
    inventoryQuickFilter = filter;
    inventoryFindingsVisible = true;
    setInventorySummarySelection(filter);
    updateInventoryFindingsSubtitle(filter);
    renderInventoryReportView();
}

function setInventorySummarySelection(filter) {
    document.querySelectorAll('.inventory-card.inventory-card-action').forEach(card => card.classList.remove('active'));
    if (!filter) return;
    const card = document.querySelector(`.inventory-card.inventory-card-action[data-filter="${filter}"]`);
    if (card) card.classList.add('active');
}

function updateInventoryFindingsSubtitle(filter) {
    const subtitle = document.getElementById('inventoryFindingsSubtitle');
    if (!subtitle) return;
    const labels = {
        all: 'Showing all systems in the selected branch scope.',
        warning: 'Showing warning-condition systems only.',
        critical: 'Showing critical-alert systems only.',
        offline: 'Showing offline or down systems only.',
        highTemp: 'Showing systems with high temperature flags only.',
        lowStorage: 'Showing systems with low storage flags only.',
        replacement: 'Showing systems recommended for replacement.'
    };
    subtitle.innerText = labels[filter] || 'Tap any row to jump directly to the branch diagnostics view for that workstation.';
}

function toastNotice(type, title, message) {
    const container = document.getElementById('systemNoticeContainer');
    if (!container) return;

    const noticeId = `notice-${Date.now()}`;
    const notice = document.createElement('div');
    notice.className = `system-notice ${type}`;
    notice.id = noticeId;
    notice.innerHTML = `
        <div class="notice-icon"><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i></div>
        <div class="notice-content">
            <div class="notice-title">${title}</div>
            <div class="notice-text">${message}</div>
        </div>`;
    container.appendChild(notice);

    setTimeout(() => {
        if (notice.parentElement) notice.parentElement.removeChild(notice);
    }, 4500);
}

function verifyAdminCredentials() {
    const username = (document.getElementById('adminUsernameField')||{}).value.trim();
    const password = (document.getElementById('adminPasswordField')||{}).value;
    const pendingBranch = window.pendingAdminBranch || null;
    const pendingAction = window.pendingAdminAction || null;

    if (!username || !password) {
        toastNotice('warning', 'Missing Credentials', 'Enter both username and password.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    const usernameLower = username.toLowerCase();
    const matchedKey = Object.keys(profiles).find(k => ((profiles[k].username||'').toLowerCase() === usernameLower) && profiles[k].password === password);
    
    if (matchedKey) {
        const staffProfile = profiles[matchedKey];
        
        // Check if staff is disabled or deleted
        if (staffProfile.disabled === true) {
            toastNotice('error', 'Account Disabled', 'This staff account has been disabled and cannot access the system.');
            return;
        }
        
        // Additional check: ensure the staff profile exists and is valid
        if (!staffProfile || !staffProfile.id) {
            toastNotice('error', 'Invalid Account', 'This staff account is no longer valid.');
            return;
        }
        
        adminAuthenticated = true;
        adminUserKey = matchedKey;
        try { sessionStorage.setItem('adminAuthenticated', '1'); sessionStorage.setItem('adminUserKey', adminUserKey); } catch(e) {}
        
        // Start monitoring this staff member's profile for real-time updates
        startMonitoringCurrentUserStatus(matchedKey);
        
        closeAdminPinModal();
        // If an IT staff profile modal is open, close it when admin signs in
        try { closeStaffProfileModal(); } catch (e) { /* ignore if modal not present */ }
        updateNavVisibility();
        populateITTrackerControls();
        refreshHistoryDeletionControls();
        
        if (pendingAction === 'showSummary') {
            window.pendingAdminAction = null;
            showOverallSummary();
        } else if (pendingBranch) {
            window.pendingAdminBranch = null;
            if (pendingBranch === 'inventory') {
                showInventoryReportPage();
            } else if (pendingBranch === 'legacyHome') {
                window.location.href = 'legacy-home.html';
            } else {
                openBranchIssueEditor(pendingBranch);
            }
        } else {
            openAdminPage();
        }
        toastNotice('success', 'Signed In', `Signed in as ${staffProfile.name}`);
    } else {
        toastNotice('error', 'Sign In Failed', 'Invalid username or password.');
    }
}

function logoutAdmin() {
    adminAuthenticated = false;
    try { sessionStorage.removeItem('adminAuthenticated'); } catch (e) {}
    try { sessionStorage.removeItem('adminUserKey'); } catch (e) {}
    
    // Stop monitoring current user status
    if (currentUserStatusListener) {
        try { currentUserStatusListener(); } catch (e) {}
        currentUserStatusListener = null;
    }
    
    adminUserKey = null;
    closeSideMenu();
    updateNavVisibility();
    populateITTrackerControls();
    refreshHistoryDeletionControls();
    hideAllPages();
    goHome();
    toastNotice('info', 'Signed out', 'Administrator session has been logged out and the home view is restored.');
}

// Monitor the current logged-in user's profile for real-time status changes
// If they get disabled or deleted, automatically log them out
function startMonitoringCurrentUserStatus(staffKey) {
    // Cancel any existing listener first
    if (currentUserStatusListener) {
        try { currentUserStatusListener(); } catch (e) {}
        currentUserStatusListener = null;
    }
    
    // Only set up listener if Firebase is configured and connected
    if (!firestoreDb) {
        console.debug('[Monitor] Firebase not ready, skipping user status monitoring');
        return;
    }
    
    try {
        const docRef = firestoreDb.collection(FIREBASE_REMOTE_DOC.collection).doc(FIREBASE_REMOTE_DOC.doc);
        
        // Set up real-time listener for staff profiles
        currentUserStatusListener = docRef.onSnapshot((snapshot) => {
            if (!snapshot.exists) return;
            
            const remoteData = snapshot.data();
            if (!remoteData || typeof remoteData.profiles !== 'object') return;
            
            const currentUserProfile = remoteData.profiles[staffKey];
            // If user profile doesn't exist remotely, check local copy first to avoid accidental self-logout
            const localProfile = (function(){ try { return getStoredStaffProfiles()[staffKey] || null; } catch(e){ return null; } })();
            if (!currentUserProfile || !currentUserProfile.id) {
                if (localProfile && localProfile.id) {
                    console.debug('[Monitor] Remote profile missing but local exists — preserving session for', staffKey);
                    return;
                }
                console.warn('[Monitor] Current user profile was deleted (remote+local empty), forcing logout');
                forceLogoutDueToStatusChange('Your account has been permanently deleted.');
                return;
            }

            // If user profile is now disabled, avoid forcing logout for a local super admin
            if (currentUserProfile.disabled === true) {
                if (localProfile && localProfile.superAdmin) {
                    console.debug('[Monitor] Remote profile disabled but local is superAdmin — preserving session for', staffKey);
                    return;
                }
                console.warn('[Monitor] Current user profile was disabled, forcing logout');
                forceLogoutDueToStatusChange('Your account has been disabled and you have been logged out.');
                return;
            }
        }, (error) => {
            console.error('[Monitor] Error monitoring user status:', error);
        });
    } catch (e) {
        console.warn('[Monitor] Failed to set up user status monitoring:', e);
    }
}

// Force logout and show a message about why
function forceLogoutDueToStatusChange(reason) {
    if (!adminAuthenticated) return; // Already logged out
    
    // Perform logout
    adminAuthenticated = false;
    try { sessionStorage.removeItem('adminAuthenticated'); } catch (e) {}
    try { sessionStorage.removeItem('adminUserKey'); } catch (e) {}
    
    // Stop monitoring
    if (currentUserStatusListener) {
        try { currentUserStatusListener(); } catch (e) {}
        currentUserStatusListener = null;
    }
    
    adminUserKey = null;
    closeSideMenu();
    updateNavVisibility();
    populateITTrackerControls();
    refreshHistoryDeletionControls();
    hideAllPages();
    goHome();
    
    // Show critical message about the logout reason
    toastNotice('error', 'Session Terminated', reason);
}

// Prompt admin verification specifically for a branch (used by Immediate Action cards)
function promptAdminForBranch(branchName) {
    if (adminAuthenticated) {
        openBranchIssueEditor(branchName);
        return;
    }

    window.pendingAdminBranch = branchName;
    document.getElementById("pinModalOverlay").classList.remove("hidden");
    const userField = document.getElementById('adminUsernameField');
    const passField = document.getElementById('adminPasswordField');
    if (userField) userField.value = '';
    if (passField) passField.value = '';
    if (userField) userField.focus();
}

function closeAdminPinModal() {
    document.getElementById("pinModalOverlay").classList.add("hidden");
    window.pendingAdminBranch = null;
}

function viewBranchDetails(branchName) {
    selectedBranchGlobal = branchName;
    hideAllPages();
    const target = document.getElementById("dashboardPage");
    target.classList.remove("hidden");
    target.classList.add("active");
    
    document.getElementById("selectedBranchTitle").innerText = `${branchName} Workspace Diagnostics`;
    renderBranchTableLog(branchName);
    try { restoreNavVisibility(); } catch(e) {}
}

/* ==========================================================================
   3. DATA RENDERING & TELEMETRY DOM MATRIX LOGS (WITH STORAGE PROGRESS BARS)
   ========================================================================== */
function initializeDropdownOptions() {
    const adminSelect = document.getElementById("adminBranchSelect");
    const remarkSelect = document.getElementById("remarkBranch");
    const formBranchInput = document.getElementById("branchInput");
    const announcementBranchModalList = document.getElementById("announcementBranchModalList");

    const generateOptions = (el, includeDefault = false) => {
        if (!el) return;
        el.innerHTML = "";
        if (includeDefault) {
            el.innerHTML = `<option value="">All Branches</option>`;
        }
        branches.forEach(b => el.innerHTML += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`);
    };

    const generateChecklist = (container) => {
        if (!container) return;
        container.innerHTML = branches.map(branch => `
            <label class="announcement-branch-checkbox">
                <input type="checkbox" name="announcementBranch" value="${escapeHtml(branch)}" />
                <span>${escapeHtml(branch)}</span>
            </label>
        `).join('');
    };

    generateOptions(adminSelect);
    generateOptions(remarkSelect);
    generateOptions(formBranchInput);
    generateChecklist(announcementBranchModalList);
    generateOptions(document.getElementById("inventoryBranchFilter"), true);
    updateAnnouncementBranchSummary();

    if (adminSelect) {
        adminSelect.addEventListener("change", loadAdminBranchData);
    }
}

function initializeAnalysisControls() {
    const yearSelect = document.getElementById('analysisYearSelect');
    const monthSelect = document.getElementById('analysisMonthSelect');
    const branchSelect = document.getElementById('analysisBranchSelect');
    const compareMultiTargetsWrapper = document.getElementById('analysisCompareMultiTargetsWrapper');
    const compareBranchScopeSelect = document.getElementById('analysisCompareBranchScopeSelect');
    const compareBranchTargetsWrapper = document.getElementById('analysisCompareBranchTargetsWrapper');
    const compareOpenButton = document.getElementById('analysisOpenCompareBtn');
    const compareModalGenerateBtn = document.getElementById('analysisModalGenerateBtn');
    const compareModeYears = document.getElementById('analysisCompareModeYears');
    const compareModeMonths = document.getElementById('analysisCompareModeMonths');
    let compareTargetMode = 'years';

    const populateOptions = (select, options, includeBlank = false, blankLabel = 'Select...') => {
        if (!select) return;
        select.innerHTML = '';
        if (includeBlank) {
            select.innerHTML = `<option value="">${blankLabel}</option>`;
        }
        select.innerHTML += options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    };

    if (yearSelect) {
        populateOptions(yearSelect, analysisYears.map(year => ({ value: year, label: year })), false);
        yearSelect.value = analysisYears[analysisYears.length - 1];
        yearSelect.addEventListener('change', renderAnalysisView);
    }

    const updateAdvancedHealthButtonLabel = () => {
        const button = document.getElementById('analysisOpenAdvancedBtn');
        if (!button) return;
        button.innerText = '<Advanced>';
    };

    if (monthSelect) {
        populateOptions(monthSelect, analysisMonths.map((month, idx) => ({ value: idx, label: month })), false);
        monthSelect.value = '0';
        monthSelect.addEventListener('change', renderAnalysisView);
    }

    if (branchSelect) {
        populateOptions(branchSelect, [{ value: '', label: 'All Branches' }].concat(branches.map(branch => ({ value: branch, label: branch }))), false);
        branchSelect.value = '';
        branchSelect.addEventListener('change', renderAnalysisView);
        branchSelect.addEventListener('change', () => updateAdvancedHealthButtonLabel(branchSelect.value));
    }

    if (branchSelect) {
        updateAdvancedHealthButtonLabel(branchSelect.value);
    }

    const buildCompareTargets = () => {
        if (!compareMultiTargetsWrapper) return;
        const items = compareTargetMode === 'years'
            ? analysisYears.map(year => ({ value: year, label: year }))
            : analysisMonths.slice(1).map((month, idx) => ({ value: idx + 1, label: month }));

        compareMultiTargetsWrapper.innerHTML = items.map(item => `
            <label class="compare-checkbox-item">
                <input type="checkbox" value="${item.value}">
                <span>${item.label}</span>
            </label>
        `).join('');
    };

    const switchCompareMode = (mode) => {
        compareTargetMode = mode;
        if (compareModeYears && compareModeMonths) {
            compareModeYears.classList.toggle('active', mode === 'years');
            compareModeMonths.classList.toggle('active', mode === 'months');
        }
        buildCompareTargets();
    };

    const buildBranchTargets = () => {
        if (!compareBranchTargetsWrapper) return;
        compareBranchTargetsWrapper.innerHTML = branches.map(branch => `
            <label class="compare-checkbox-item">
                <input type="checkbox" value="${branch}">
                <span>${branch}</span>
            </label>
        `).join('');
    };

    const toggleBranchTargets = () => {
        if (!compareBranchScopeSelect || !compareBranchTargetsWrapper) return;
        if (compareBranchScopeSelect.value === 'selected') {
            compareBranchTargetsWrapper.classList.remove('hidden');
        } else {
            compareBranchTargetsWrapper.classList.add('hidden');
        }
    };

    const openCompareModal = () => {
        switchCompareMode(compareTargetMode);
        document.getElementById('analysisCompareModalOverlay')?.classList.remove('hidden');
        document.body.classList.add('no-scroll');
    };

    analysisCompareOpenHandler = openCompareModal;
    window.openAnalysisCompareModal = openAnalysisCompareModal;

    const closeCompareModal = () => {
        document.getElementById('analysisCompareModalOverlay')?.classList.add('hidden');
        document.body.classList.remove('no-scroll');
    };

    if (compareOpenButton) {
        compareOpenButton.addEventListener('click', () => {
            openCompareModal();
        });
    }

    if (compareBranchScopeSelect) {
        compareBranchScopeSelect.addEventListener('change', toggleBranchTargets);
    }

    if (compareModeYears) {
        compareModeYears.addEventListener('click', () => switchCompareMode('years'));
    }
    if (compareModeMonths) {
        compareModeMonths.addEventListener('click', () => switchCompareMode('months'));
    }

    const compareDownloadBtn = document.getElementById('analysisCompareDownloadBtn');

    if (compareModalGenerateBtn) {
        compareModalGenerateBtn.addEventListener('click', () => {
            const generated = generateAnalysisComparison();
            if (generated) {
                closeCompareModal();
            }
        });
    }

    if (compareDownloadBtn) {
        compareDownloadBtn.addEventListener('click', downloadAnalysisCompareResultChart);
    }

    buildCompareTargets();
    buildBranchTargets();
    toggleBranchTargets();
}

function closeAnalysisCompareModal() {
    document.getElementById('analysisCompareModalOverlay')?.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

function closeStaffFeedbackCompareModal() {
    document.getElementById('staffFeedbackCompareModalOverlay')?.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

function openStaffFeedbackCompareModal() {
    if (!staffFeedbackCompareOpenHandler) {
        initializeStaffFeedbackCompareControls();
    }
    if (staffFeedbackCompareOpenHandler) {
        staffFeedbackCompareOpenHandler();
    } else {
        console.warn('Staff feedback compare modal handler is not ready.');
    }
}

function initializeStaffFeedbackCompareControls() {
    const compareMultiTargetsWrapper = document.getElementById('staffFeedbackCompareMultiTargetsWrapper');
    const compareModeYears = document.getElementById('staffFeedbackCompareModeYears');
    const compareModeMonths = document.getElementById('staffFeedbackCompareModeMonths');
    const compareScopeSelect = document.getElementById('staffFeedbackCompareScopeSelect');
    const compareTargetsWrapper = document.getElementById('staffFeedbackCompareTargetsWrapper');
    const compareGenerateBtn = document.getElementById('staffFeedbackCompareGenerateBtn');
    const compareDownloadBtn = document.getElementById('staffFeedbackCompareDownloadBtn');
    let compareTargetMode = 'years';

    const buildCompareTargets = () => {
        if (!compareMultiTargetsWrapper) return;
        const items = compareTargetMode === 'years'
            ? analysisYears.map(year => ({ value: year, label: year }))
            : analysisMonths.slice(1).map((month, idx) => ({ value: idx + 1, label: month }));
        compareMultiTargetsWrapper.innerHTML = items.map(item => `
            <label class="compare-checkbox-item">
                <input type="checkbox" value="${item.value}">
                <span>${item.label}</span>
            </label>
        `).join('');
    };

    const buildStaffTargets = () => {
        if (!compareTargetsWrapper) return;
        const profiles = getStoredStaffProfiles();
        const staffOptions = Object.values(profiles).map(profile => ({ value: profile.id, label: profile.name || profile.username || profile.id }));
        compareTargetsWrapper.innerHTML = staffOptions.map(item => `
            <label class="compare-checkbox-item">
                <input type="checkbox" value="${item.value}">
                <span>${item.label}</span>
            </label>
        `).join('');
    };

    const toggleStaffTargets = () => {
        if (!compareScopeSelect || !compareTargetsWrapper) return;
        compareTargetsWrapper.classList.toggle('hidden', compareScopeSelect.value !== 'selected');
    };

    const switchCompareMode = (mode) => {
        compareTargetMode = mode;
        if (compareModeYears && compareModeMonths) {
            compareModeYears.classList.toggle('active', mode === 'years');
            compareModeMonths.classList.toggle('active', mode === 'months');
        }
        buildCompareTargets();
    };

    const openCompareModal = () => {
        buildCompareTargets();
        buildStaffTargets();
        toggleStaffTargets();
        document.getElementById('staffFeedbackCompareModalOverlay')?.classList.remove('hidden');
        document.body.classList.add('no-scroll');
    };

    staffFeedbackCompareOpenHandler = openCompareModal;

    if (compareModeYears) {
        compareModeYears.addEventListener('click', () => switchCompareMode('years'));
    }
    if (compareModeMonths) {
        compareModeMonths.addEventListener('click', () => switchCompareMode('months'));
    }
    if (compareScopeSelect) {
        compareScopeSelect.addEventListener('change', toggleStaffTargets);
    }
    if (compareGenerateBtn) {
        compareGenerateBtn.addEventListener('click', () => {
            const generated = generateStaffFeedbackComparison();
            if (generated) {
                closeStaffFeedbackCompareModal();
            }
        });
    }
    if (compareDownloadBtn) {
        compareDownloadBtn.addEventListener('click', downloadStaffFeedbackCompareResultChart);
    }

    buildCompareTargets();
    buildStaffTargets();
    toggleStaffTargets();
}

function getStaffFeedbackCompareModalSelections() {
    const targets = Array.from(document.querySelectorAll('#staffFeedbackCompareMultiTargetsWrapper input[type="checkbox"]:checked')).map(el => el.value);
    const compareMode = document.getElementById('staffFeedbackCompareModeYears')?.classList.contains('active') ? 'years' : 'months';
    const staffScope = document.getElementById('staffFeedbackCompareScopeSelect')?.value || 'all';
    const staffTargets = Array.from(document.querySelectorAll('#staffFeedbackCompareTargetsWrapper input[type="checkbox"]:checked')).map(el => el.value);
    return { targets, compareMode, staffScope, staffTargets };
}

function generateStaffFeedbackComparison() {
    const { targets, compareMode, staffScope, staffTargets } = getStaffFeedbackCompareModalSelections();
    const messageLabel = document.getElementById('staffFeedbackCompareResultLabel');
    if (!targets || targets.length < 2) {
        if (messageLabel) {
            messageLabel.innerText = compareMode === 'years'
                ? 'Please select at least two years before generating.'
                : 'Please select at least two months before generating.';
        }
        return false;
    }
    if (staffScope === 'selected' && (!staffTargets || staffTargets.length === 0)) {
        if (messageLabel) messageLabel.innerText = 'Choose one or more staff members when "Choose Staff" is selected.';
        return false;
    }

    const profiles = getStoredStaffProfiles();
    staffFeedbackCompareRequest = {
        mode: compareMode,
        targets,
        staffScope,
        staffTargets: staffScope === 'selected' ? staffTargets : Object.keys(profiles)
    };

    openStaffFeedbackCompareResultOverlay();
    renderStaffFeedbackCompareResultChart();
    return true;
}

function renderStaffFeedbackCompareResultChart() {
    if (!staffFeedbackCompareRequest || !staffFeedbackCompareRequest.targets || staffFeedbackCompareRequest.targets.length === 0) return;
    const allFeedbacks = JSON.parse(localStorage.getItem('staffFeedbacks') || '[]');
    const profiles = getStoredStaffProfiles();
    const selectedStaffKeys = staffFeedbackCompareRequest.staffTargets || Object.keys(profiles);
    const filteredFeedbacks = allFeedbacks.filter(fb => selectedStaffKeys.includes(fb.staffKey));
    const mode = staffFeedbackCompareRequest.mode;
    const targets = staffFeedbackCompareRequest.targets;
    const labels = mode === 'years'
        ? targets.map(t => t.toString())
        : targets.map(t => analysisMonths[Number(t)]);

    const averages = targets.map(target => {
        const relevantFeedbacks = filteredFeedbacks.filter(fb => {
            const date = new Date(fb.submittedAt);
            return mode === 'years'
                ? date.getFullYear() === Number(target)
                : date.getFullYear() === new Date().getFullYear() && date.getMonth() + 1 === Number(target);
        });
        return relevantFeedbacks.length
            ? Number((relevantFeedbacks.reduce((sum, fb) => sum + Number(fb.rating || 0), 0) / relevantFeedbacks.length).toFixed(1))
            : 0;
    });

    const groupedByStaff = selectedStaffKeys.map(staffKey => {
        const staffFeedbacks = filteredFeedbacks.filter(fb => fb.staffKey === staffKey);
        const avg = staffFeedbacks.length ? staffFeedbacks.reduce((sum, fb) => sum + Number(fb.rating || 0), 0) / staffFeedbacks.length : 0;
        return {
            staffKey,
            name: (profiles[staffKey] && (profiles[staffKey].name || profiles[staffKey].username)) || staffKey,
            avg: Number(avg.toFixed(1)),
            totalFeedbacks: staffFeedbacks.length
        };
    }).sort((a, b) => b.avg - a.avg);

    const totalFeedbacks = filteredFeedbacks.length;
    const fiveStars = filteredFeedbacks.filter(fb => Number(fb.rating) === 5).length;
    const avgRating = totalFeedbacks
        ? (filteredFeedbacks.reduce((sum, fb) => sum + Number(fb.rating || 0), 0) / totalFeedbacks).toFixed(1)
        : '0.0';
    const branchCounts = filteredFeedbacks.reduce((acc, fb) => {
        const branch = fb.branch || 'Unknown';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
    }, {});
    const mostCommonBranchEntry = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0];
    const topIssueStaff = groupedByStaff.length ? groupedByStaff[groupedByStaff.length - 1] : null;
    const bestStaff = groupedByStaff.length ? groupedByStaff[0] : null;

    document.getElementById('staffFeedbackCompareResultSelectedStaff').innerText = selectedStaffKeys.length.toString();
    document.getElementById('staffFeedbackCompareResultTotalFeedbacks').innerText = totalFeedbacks.toString();
    document.getElementById('staffFeedbackCompareResultFiveStars').innerText = fiveStars.toString();
    document.getElementById('staffFeedbackCompareResultAverageRating').innerText = `${avgRating}`;
    document.getElementById('staffFeedbackCompareTopIssueStaff').innerText = topIssueStaff ? `${topIssueStaff.name} (${topIssueStaff.avg})` : 'N/A';
    document.getElementById('staffFeedbackCompareBestStaff').innerText = bestStaff ? `${bestStaff.name} (${bestStaff.avg})` : 'N/A';
    document.getElementById('staffFeedbackCompareMostCommonBranch').innerText = mostCommonBranchEntry ? `${mostCommonBranchEntry[0]} (${mostCommonBranchEntry[1]})` : 'N/A';
    document.getElementById('staffFeedbackCompareAvgRating').innerText = `${avgRating}`;
    document.getElementById('staffFeedbackCompareTotalReviews').innerText = totalFeedbacks.toString();
    document.getElementById('staffFeedbackCompareGeneratedAt').innerText = new Date().toLocaleString();
    document.getElementById('staffFeedbackCompareResultLabel').innerText = mode === 'years'
        ? `Year comparison: ${labels.join(' vs ')}`
        : `Month comparison: ${labels.join(' vs ')}`;

    updateChart('staffFeedbackCompareResultChart', 'bar', {
        labels,
        datasets: [{ label: 'Average rating', data: averages, backgroundColor: '#16a34a' }]
    }, {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 5 } }
    });

    const ratingBuckets = filteredFeedbacks.reduce((acc, fb) => {
        const rating = Number(fb.rating || 0);
        if (rating <= 2) acc['1-2 stars'] += 1;
        else if (rating <= 4) acc['3-4 stars'] += 1;
        else acc['5 stars'] += 1;
        return acc;
    }, { '1-2 stars': 0, '3-4 stars': 0, '5 stars': 0 });

    updateChart('staffFeedbackCompareRatingDistributionChart', 'doughnut', {
        labels: Object.keys(ratingBuckets),
        datasets: [{ data: Object.values(ratingBuckets), backgroundColor: ['#ef4444', '#f59e0b', '#16a34a'] }]
    }, {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
    });

    updateChart('staffFeedbackCompareStaffRatingChart', 'bar', {
        labels: groupedByStaff.map(item => item.name),
        datasets: [{ label: 'Staff average rating', data: groupedByStaff.map(item => item.avg), backgroundColor: groupedByStaff.map(item => getColorForLabel(item.name)) }]
    }, {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 5 } }
    });
}

function openStaffFeedbackCompareResultOverlay() {
    document.getElementById('staffFeedbackCompareResultOverlay')?.classList.remove('hidden');
    document.body.classList.add('no-scroll');
}

function closeStaffFeedbackCompareResultOverlay() {
    document.getElementById('staffFeedbackCompareResultOverlay')?.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

function exportElementToPdf(element, filename, pdfOptions = {}) {
    if (!element || !window.html2canvas || !window.jspdf?.jsPDF) {
        alert('PDF export is not available right now. Please try again.');
        return Promise.reject(new Error('PDF export unavailable'));
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: pdfOptions.orientation || 'p', unit: 'mm', format: pdfOptions.format || 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    const hideSelectors = Array.isArray(pdfOptions.hideSelectors) ? pdfOptions.hideSelectors : [];
    const wasHidden = element.classList.contains('hidden');
    const modifiedStyles = [];

    const setTempStyle = (el, styles) => {
        const original = {};
        Object.keys(styles).forEach((prop) => {
            original[prop] = el.style[prop] || '';
            el.style[prop] = styles[prop];
        });
        modifiedStyles.push({ el, original });
    };

    if (wasHidden) {
        element.classList.remove('hidden');
    }

    if (hideSelectors.length > 0) {
        const hiddenControls = Array.from(element.querySelectorAll(hideSelectors.join(',')));
        hiddenControls.forEach(control => {
            setTempStyle(control, { visibility: 'hidden', display: 'none' });
        });
    }

    setTempStyle(element, {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        position: 'relative',
        left: '0',
        top: '0',
        zIndex: '999999',
        width: '100%',
        height: 'auto',
        maxWidth: '100%',
        overflow: 'visible'
    });

    Array.from(element.querySelectorAll('*')).forEach((child) => {
        setTempStyle(child, {
            overflow: 'visible',
            maxHeight: 'none',
            height: 'auto',
            minHeight: '0'
        });
    });

    const resizeCharts = () => {
        Array.from(element.querySelectorAll('canvas')).forEach((canvas) => {
            if (!canvas) return;
            const chart = window.Chart && window.Chart.getChart ? window.Chart.getChart(canvas) : null;
            const rect = canvas.getBoundingClientRect();
            const naturalWidth = Math.max(rect.width || canvas.clientWidth || 600, 700);
            const naturalHeight = Math.max(rect.height || canvas.clientHeight || 320, 320);
            canvas.style.width = `${naturalWidth}px`;
            canvas.style.height = `${naturalHeight}px`;
            canvas.width = naturalWidth * 2;
            canvas.height = naturalHeight * 2;
            if (chart) {
                chart.resize();
            }
        });
    };

    const ensureRendered = () => new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resizeCharts();
                window.dispatchEvent(new Event('resize'));
                setTimeout(() => {
                    resizeCharts();
                    resolve();
                }, 250);
            });
        });
    });

    return ensureRendered().then(() => {
        const elementWidth = Math.max(element.scrollWidth || element.offsetWidth || 1400, 1200);
        const elementHeight = Math.max(element.scrollHeight || element.offsetHeight || 1400, 1400);

        return html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
            width: elementWidth,
            height: elementHeight,
            windowWidth: Math.max(elementWidth, window.innerWidth || 1400),
            windowHeight: Math.max(elementHeight, window.innerHeight || 1400),
            scrollX: -window.scrollX,
            scrollY: -window.scrollY
        });
    }).then((canvas) => {
        const imageData = canvas.toDataURL('image/png');
        const imageProps = pdf.getImageProperties(imageData);
        const pdfWidth = pageWidth - margin * 2;
        const pageHeightAvailable = pageHeight - margin * 2;
        const scale = pdfWidth / imageProps.width;
        const pageHeightPx = Math.floor(pageHeightAvailable / scale);
        const pageBreakGapPx = Math.max(12, Math.round(5 / scale));
        const minRowPageHeightPx = Math.max(80, Math.round(pageHeightPx * 0.12));

        const elementScrollHeight = element.scrollHeight || element.offsetHeight || canvas.height;
        const canvasScale = canvas.height / elementScrollHeight;
        const elementRect = element.getBoundingClientRect();
        const rows = Array.from(element.querySelectorAll('tr')).map(row => {
            const rowRect = row.getBoundingClientRect();
            const top = Math.round((rowRect.top - elementRect.top) * canvasScale);
            const bottom = Math.round((rowRect.bottom - elementRect.top) * canvasScale);
            return {
                top: Math.max(0, Math.min(canvas.height, top)),
                bottom: Math.max(0, Math.min(canvas.height, bottom)),
                height: Math.max(1, Math.round((bottom - top)))
            };
        }).filter(row => row.bottom > 0 && row.top < canvas.height).sort((a, b) => a.top - b.top);

        let currentY = 0;
        let pageIndex = 0;

        while (currentY < canvas.height) {
            const remainingHeight = canvas.height - currentY;
            let sliceHeight = Math.min(pageHeightPx, remainingHeight);

            if (remainingHeight > pageHeightPx) {
                const maxBottom = currentY + pageHeightPx - pageBreakGapPx;
                const pageCandidate = rows.filter(row => row.bottom <= maxBottom && row.bottom > currentY).pop();

                if (pageCandidate) {
                    sliceHeight = pageCandidate.bottom - currentY;
                } else {
                    const nextRow = rows.find(row => row.top > currentY);
                    if (nextRow && nextRow.top > currentY && nextRow.top < currentY + pageHeightPx) {
                        sliceHeight = Math.min(nextRow.top - currentY, pageHeightPx - pageBreakGapPx);
                    } else {
                        sliceHeight = pageHeightPx - pageBreakGapPx;
                    }
                }

                if (sliceHeight < minRowPageHeightPx) {
                    sliceHeight = Math.min(pageHeightPx - pageBreakGapPx, remainingHeight);
                }
            }

            if (currentY + sliceHeight > canvas.height) {
                sliceHeight = remainingHeight;
            }

            const sliceEnd = currentY + sliceHeight;
            const intersecting = rows.find(row => row.top < sliceEnd && row.bottom > sliceEnd);
            if (intersecting && intersecting.top > currentY) {
                const safeHeight = intersecting.top - currentY;
                if (safeHeight >= minRowPageHeightPx) {
                    sliceHeight = safeHeight;
                }
            }

            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;
            const pageCtx = pageCanvas.getContext('2d');
            pageCtx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

            const pageData = pageCanvas.toDataURL('image/png');
            const pageDisplayHeight = sliceHeight * scale;

            if (pageIndex > 0) {
                pdf.addPage();
            }
            pdf.addImage(pageData, 'PNG', margin, margin, pdfWidth, pageDisplayHeight);

            currentY += sliceHeight;
            if (canvas.height - currentY < 20 && canvas.height - currentY > 0) {
                currentY = canvas.height;
            }
            pageIndex += 1;
        }

        pdf.save(filename);
    }).finally(() => {
        modifiedStyles.reverse().forEach(({ el, original }) => {
            Object.keys(original).forEach(prop => {
                el.style[prop] = original[prop] || '';
            });
        });
        if (wasHidden) {
            element.classList.add('hidden');
        }
    });
}

function downloadStaffFeedbackCompareResultChart() {
    const modal = document.getElementById('staffFeedbackCompareResultOverlay');
    const card = document.querySelector('#staffFeedbackCompareResultOverlay .compare-modal-card');
    if (!card || !modal) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '1600px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '24px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.fontSize = '12px';
    wrapper.style.lineHeight = '1.4';
    wrapper.style.color = '#0f172a';

    const header = document.createElement('div');
    header.style.marginBottom = '20px';
    header.innerHTML = `
        <div style="font-size: 20px; font-weight: bold; color: #102d6d; margin-bottom: 6px;">Staff Feedback Comparison Report</div>
        <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleString()}</div>
    `;
    wrapper.appendChild(header);

    const cardClone = card.cloneNode(true);
    cardClone.style.maxHeight = 'none';
    cardClone.style.overflow = 'visible';
    wrapper.appendChild(cardClone);
    document.body.appendChild(wrapper);

    exportElementToPdf(wrapper, 'staff-feedback-comparison.pdf')
        .then(() => {
            toastNotice('success', 'Download complete', 'Staff feedback report exported successfully.');
        })
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to export the feedback report.');
            console.warn('Failed to export staff feedback comparison as PDF.');
        })
        .finally(() => {
            if (wrapper.parentNode) {
                document.body.removeChild(wrapper);
            }
        });
}

function getAnalysisFilters() {
    const year = Number(document.getElementById('analysisYearSelect')?.value) || analysisYears[analysisYears.length - 1];
    const month = Number(document.getElementById('analysisMonthSelect')?.value);
    const branch = document.getElementById('analysisBranchSelect')?.value || '';
    return { year, month, branch };
}

function getAnalysisCompareModalSelections() {
    const targets = Array.from(document.querySelectorAll('#analysisCompareMultiTargetsWrapper input[type="checkbox"]:checked')).map(el => el.value);
    const compareMode = document.getElementById('analysisCompareModeYears')?.classList.contains('active') ? 'years' : 'months';
    const branchScope = document.getElementById('analysisCompareBranchScopeSelect')?.value || 'all';
    const branchTargets = Array.from(document.querySelectorAll('#analysisCompareBranchTargetsWrapper input[type="checkbox"]:checked')).map(el => el.value);
    return { targets, compareMode, branchScope, branchTargets };
}

function generateAnalysisHistory() {
    if (Object.keys(analysisHistory).length > 0) return;
    analysisYears.forEach(year => {
        analysisHistory[year] = branches.map(branch => {
            const issues = Math.floor(Math.random() * 95) + 5;
            const breakdowns = Math.max(0, Math.floor(issues * (0.08 + Math.random() * 0.18)));
            const perf = Math.max(50, Math.min(100, 100 - issues * 0.5 + (Math.random() * 6 - 3)));
            const categories = [
                { label: 'Storage', value: Math.floor(issues * (0.2 + Math.random() * 0.18)) },
                { label: 'Temperature', value: Math.floor(issues * (0.16 + Math.random() * 0.15)) },
                { label: 'Network', value: Math.floor(issues * (0.12 + Math.random() * 0.12)) },
                { label: 'Hardware', value: Math.floor(issues * (0.18 + Math.random() * 0.16)) },
                { label: 'User', value: Math.floor(issues * (0.08 + Math.random() * 0.12)) }
            ];
            return {
                branch,
                issues,
                breakdowns,
                performance: perf,
                categories,
                worstCategory: categories.reduce((max, item) => item.value > max.value ? item : max, categories[0]).label,
                monthlyScore: Array.from({ length: 12 }, () => Math.max(45, Math.min(100, perf + Math.floor(Math.random() * 12 - 6))))
            };
        });
    });
}

function getAnalysisDataForYear(year) {
    if (deletedAnalysisYears.has(year)) {
        return [];
    }
    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
        const currentYearData = branches.map(branch => {
            const list = pcData[branch] || [];
            const history = buildHistoricalIssueSummaryForBranch(branch, year);
            const issues = history.issueCount;
            const breakdowns = history.breakdownCount;
            const categoryData = Object.keys(history.categoryCounts).map(label => ({ label, value: history.categoryCounts[label] }));
            const worstCategory = categoryData.reduce((max, item) => item.value > max.value ? item : max, categoryData[0]).label;

            const healthSum = list.reduce((sum, pc) => {
                const healthScore = pc.health === 'Healthy' ? 100 : pc.health === 'Warning' ? 75 : 45;
                return sum + (pc.state === 'Down' ? healthScore - 10 : healthScore);
            }, 0);

            const performance = list.length ? Math.max(35, Math.min(100, Math.round(healthSum / list.length))) : 100;
            const monthlyScore = Array.from({ length: 12 }, (_, idx) => Math.max(35, Math.min(100, performance + Math.round((idx - 5) * 1.5) + (Math.random() * 8 - 4))));

            return {
                branch,
                issues,
                breakdowns,
                performance,
                categories: categoryData,
                worstCategory,
                monthlyScore
            };
        });
        return applyDeletedAnalysisFilters(year, currentYearData);
    }

    generateAnalysisHistory();
    return applyDeletedAnalysisFilters(year, analysisHistory[year] || []);
}

function filterModificationHistoryByYear(year) {
    return modificationHistory.filter(log => {
        const logDate = new Date(log.timestamp);
        return !Number.isNaN(logDate.getTime()) && logDate.getFullYear() === year;
    });
}

function getIssueReason(issue) {
    const health = issue.health || 'Healthy';
    const state = issue.state || 'Active';
    const freeSpace = parseGbValue(issue.freeSpace || '0GB');
    const temp = Number(issue.temp || 0);

    if (state === 'Down') return 'Offline / Down';
    if (health === 'Critical' && freeSpace <= 15) return 'Critical low disk space';
    if (health === 'Critical' && temp >= 85) return 'Critical overheating';
    if (health === 'Critical') return 'Critical hardware fault';
    if (health === 'Warning' && freeSpace <= 50) return 'Low disk space';
    if (health === 'Warning' && temp >= 70) return 'High temperature';
    if (health === 'Warning') return 'Warning condition';
    return 'Issue reported';
}

function normalizeIssueLog(log) {
    const details = log.details || {};
    const prior = log.priorState || {};
    return {
        health: details.health || prior.health || 'Healthy',
        state: details.state || prior.state || 'Active',
        freeSpace: details.freeSpace || prior.freeSpace || 'N/A',
        temp: details.temp ?? details.pcTemp ?? prior.temp ?? prior.pcTemp ?? 0,
        username: details.username || prior.username || 'Unknown',
        reportedBy: log.user || log.userKey || 'Unknown',
        fixedBy: log.user || log.userKey || 'Unknown',
        timestamp: log.timestamp || ''
    };
}

function accumulateIssueSessionsForBranch(branch, year) {
    const logs = filterModificationHistoryByYear(year).filter(log => log.branch === branch).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const sessions = [];
    const activeSessionByPc = {};

    logs.forEach(log => {
        const pcName = log.pcName || 'Unknown Terminal';
        const normalized = normalizeIssueLog(log);
        const priorState = log.priorState || {};
        const priorHealth = priorState.health || 'Healthy';
        const priorStateValue = priorState.state || 'Active';
        const priorIssue = priorHealth !== 'Healthy' || priorStateValue === 'Down';
        const currentIssue = normalized.health !== 'Healthy' || normalized.state === 'Down';
        let session = activeSessionByPc[pcName];

        if (priorIssue && !session) {
            session = {
                branch,
                pcName,
                healthAtReport: priorHealth,
                stateAtReport: priorStateValue,
                reportedAt: log.timestamp || 'Not logged',
                reportedBy: log.user || log.userKey || 'Unknown',
                fixedBy: null,
                reason: getIssueReason({
                    health: priorHealth,
                    state: priorStateValue,
                    freeSpace: priorState.freeSpace || 'N/A',
                    temp: priorState.temp ?? (priorState.pcTemp || 0)
                }),
                fixedAt: null,
                status: 'Not Fixed',
                freeSpace: priorState.freeSpace || 'N/A',
                temp: priorState.temp ?? (priorState.pcTemp || 0),
                username: priorState.username || 'Unknown'
            };
            activeSessionByPc[pcName] = session;
        }

        if (!priorIssue && currentIssue && !session) {
            activeSessionByPc[pcName] = {
                branch,
                pcName,
                healthAtReport: normalized.health,
                stateAtReport: normalized.state,
                reportedAt: normalized.timestamp,
                reportedBy: normalized.reportedBy || 'Unknown',
                fixedBy: null,
                reason: getIssueReason(normalized),
                fixedAt: null,
                status: 'Not Fixed',
                freeSpace: normalized.freeSpace,
                temp: normalized.temp,
                username: normalized.username
            };
            session = activeSessionByPc[pcName];
        }

        if (priorIssue && !currentIssue && session) {
            session.fixedAt = normalized.timestamp;
            session.fixedBy = log.user || log.userKey || 'Unknown';
            session.status = 'Fixed';
            sessions.push(session);
            delete activeSessionByPc[pcName];
            session = null;
        }

        if (currentIssue && session && !session.fixedAt) {
            // if the issue remains active, keep the existing session open
        }

        if (!priorIssue && !currentIssue && session) {
            // if we had an open session and the current state is healthy, keep it open until a fix event
        }
    });

    const currentList = pcData[branch] || [];
    currentList.forEach(pc => {
        const pcName = pc.pcName || 'Unknown Terminal';
        const currentIssue = pc.health !== 'Healthy' || pc.state === 'Down';
        const session = activeSessionByPc[pcName];

        if (session) {
            if (!currentIssue) {
                session.fixedAt = session.fixedAt || session.reportedAt || '';
                session.status = 'Fixed';
                sessions.push(session);
                delete activeSessionByPc[pcName];
            }
        } else if (currentIssue) {
            sessions.push({
                branch,
                pcName,
                healthAtReport: pc.health,
                stateAtReport: pc.state,
                reportedAt: '',
                reportedBy: 'Unknown',
                fixedBy: null,
                reason: getIssueReason(pc),
                fixedAt: null,
                status: 'Not Fixed',
                freeSpace: pc.freeSpace || 'N/A',
                temp: pc.pcTemp || 0,
                username: pc.username || 'Unknown'
            });
        }
    });

    Object.values(activeSessionByPc).forEach(session => {
        sessions.push(session);
    });

    return sessions;
}

function buildHistoricalIssueSummaryForBranch(branch, year) {
    const entries = accumulateIssueSessionsForBranch(branch, year);
    const summary = {
        issueCount: entries.length,
        breakdownCount: 0,
        categoryCounts: { Storage: 0, Temperature: 0, Network: 0, Hardware: 0, User: 0 }
    };

    entries.forEach(entry => {
        const health = entry.healthAtReport || 'Healthy';
        const state = entry.stateAtReport || 'Active';
        const freeSpace = parseGbValue(entry.freeSpace || '0GB');
        const temp = Number(entry.temp || 0);

        if (health === 'Critical' || state === 'Down') summary.breakdownCount += 1;
        if (freeSpace <= 50) summary.categoryCounts.Storage += 1;
        if (temp >= 70) summary.categoryCounts.Temperature += 1;
        if (state === 'Down') summary.categoryCounts.Network += 1;
        if (health === 'Critical' && state === 'Active') summary.categoryCounts.Hardware += 1;
        if (health === 'Warning') summary.categoryCounts.User += 1;
    });

    return summary;
}

function getHistoricalIssueEntries(year, selectedBranch = '') {
    const entries = [];
    branches.forEach(branch => {
        if (selectedBranch && branch !== selectedBranch) return;
        const branchEntries = accumulateIssueSessionsForBranch(branch, year);
        branchEntries.forEach(entry => {
            entries.push({
                branch: entry.branch,
                pcName: entry.pcName,
                healthAtReport: entry.healthAtReport,
                stateAtReport: entry.stateAtReport,
                freeSpace: entry.freeSpace || 'N/A',
                temp: entry.temp || 0,
                username: entry.username || 'Unknown',
                reportedBy: entry.reportedBy || 'Unknown',
                fixedBy: entry.fixedBy || '',
                reportedAt: entry.reportedAt || 'Not logged',
                reason: entry.reason || 'Unknown reason',
                fixedAt: entry.fixedAt || '',
                status: entry.status || 'Not Fixed'
            });
        });
    });

    return entries.sort((a, b) => {
        const aDate = new Date(a.reportedAt);
        const bDate = new Date(b.reportedAt);
        if (Number.isNaN(aDate.getTime()) && Number.isNaN(bDate.getTime())) return a.pcName.localeCompare(b.pcName);
        if (Number.isNaN(aDate.getTime())) return 1;
        if (Number.isNaN(bDate.getTime())) return -1;
        return bDate - aDate;
    });
}

function filterAnalysisProblemHistory() {
    const filter = document.getElementById('analysisProblemHistoryBranchFilter')?.value || '';
    const rowsContainer = document.getElementById('analysisProblemHistoryTableBody');
    const countLabel = document.getElementById('analysisProblemHistoryCount');
    if (!rowsContainer || !countLabel) return;

    const filtered = filter ? analysisProblemHistoryEntries.filter(entry => entry.branch === filter) : analysisProblemHistoryEntries;
    countLabel.innerText = filtered.length;
    rowsContainer.innerHTML = filtered.length ? filtered.map(entry => `
        <tr>
            <td>${entry.reportedAt || 'Unknown'}</td>
            <td>${entry.branch}</td>
            <td>${entry.pcName}</td>
            <td>${entry.username || 'Unknown'}</td>
            <td>${entry.reportedBy || 'Unknown'}</td>
            <td>${entry.fixedBy || '—'}</td>
            <td>${entry.reason || 'Unknown'}</td>
            <td>${entry.status || 'Not Fixed'}</td>
            <td>${entry.fixedAt || '—'}</td>
        </tr>
    `).join('') : `<tr><td colspan="9" style="text-align:center; color:#64748b;">No issue reports found for this branch.</td></tr>`;
}

function renderAnalysisView() {
    const { year, month, branch } = getAnalysisFilters();
    const branchData = getAnalysisDataForYear(year);
    const selectedBranchData = branch ? branchData.filter(item => item.branch === branch) : branchData;

    const totalIssues = selectedBranchData.reduce((sum, item) => sum + item.issues, 0);
    const totalBreakdowns = selectedBranchData.reduce((sum, item) => sum + item.breakdowns, 0);
    const avgPerformance = selectedBranchData.length > 0 ? Math.round(selectedBranchData.reduce((sum, item) => sum + item.performance, 0) / selectedBranchData.length) : 0;
    const topBranch = selectedBranchData.sort((a, b) => b.issues - a.issues)[0];
    const commonProblems = {};

    selectedBranchData.forEach(item => {
        item.categories.forEach(cat => {
            commonProblems[cat.label] = (commonProblems[cat.label] || 0) + cat.value;
        });
    });

    const worstCategory = Object.keys(commonProblems).length > 0 ? Object.entries(commonProblems).sort((a, b) => b[1] - a[1])[0][0] : 'N/A';
    document.getElementById('analysisTopBranch').innerText = topBranch ? topBranch.branch : 'N/A';
    document.getElementById('analysisProblemCount').innerText = totalIssues;
    document.getElementById('analysisPerformanceScore').innerText = `${avgPerformance}%`;
    document.getElementById('analysisBreakdowns').innerText = totalBreakdowns;
    document.getElementById('analysisWorstCategory').innerText = worstCategory;

    renderAnalysisBranchIssuesChart(branchData, branch);
    renderAnalysisPerformanceChart(branchData, year, month, branch);
    renderAnalysisProblemCategoryChart(selectedBranchData);
    renderAnalysisSummaryTable(branchData);
    renderAnalysisInsights(year, branch, branchData);
}

function renderAnalysisCompareResultChart() {
    if (!analysisCompareRequest || !analysisCompareRequest.targets || analysisCompareRequest.targets.length === 0) {
        return;
    }

    const targets = analysisCompareRequest.targets;
    const currentYear = Number(document.getElementById('analysisYearSelect')?.value) || new Date().getFullYear();
    const branchTargets = analysisCompareRequest.branchTargets;
    let labels = [];
    let averages = [];
    let title = '';
    let branchData = [];
    let summaryCandidates = [];

    if (analysisCompareRequest.mode === 'years') {
        labels = targets.map(t => t.toString());
        title = `Year comparison: ${labels.join(' vs ')}`;
        const yearlyMetrics = targets.map(targetYear => {
            const yearData = getAnalysisDataForYear(Number(targetYear)).filter(item => branchTargets.includes(item.branch));
            const averagePerf = yearData.length ? Math.round(yearData.reduce((sum, item) => sum + item.performance, 0) / yearData.length) : 0;
            const totalIssues = yearData.reduce((sum, item) => sum + item.issues, 0);
            return { averagePerf, totalIssues, yearData };
        });

        averages = yearlyMetrics.map(metric => metric.averagePerf);
        branchData = yearlyMetrics.flatMap(metric => metric.yearData);
        summaryCandidates = yearlyMetrics.flatMap(metric => metric.yearData);
    } else {
        branchData = getAnalysisDataForYear(currentYear).filter(item => branchTargets.includes(item.branch));
        labels = targets.map(t => analysisMonths[Number(t)]);
        title = `Month comparison: ${labels.join(' vs ')}`;
        averages = targets.map(target => {
            const monthIndex = Number(target) - 1;
            const values = branchData.map(item => item.monthlyScore[monthIndex] || 0);
            return branchData.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        });
        summaryCandidates = branchData;
    }

    const resultLabel = document.getElementById('analysisCompareResultLabel');
    if (resultLabel) resultLabel.innerText = `${title} - ${analysisCompareRequest.branchScope === 'selected' ? 'Selected branches' : 'All branches'}`;

    const totalBreakdowns = summaryCandidates.reduce((sum, item) => sum + (item.breakdowns || 0), 0);
    const totalIssues = summaryCandidates.reduce((sum, item) => sum + (item.issues || 0), 0);
    const avgPerformance = summaryCandidates.length ? Math.round(summaryCandidates.reduce((sum, item) => sum + (item.performance || 0), 0) / summaryCandidates.length) : 0;
    const healthyPCs = summaryCandidates.reduce((sum, item) => {
        const branchList = pcData[item.branch] || [];
        return sum + branchList.filter(pc => pc.health === 'Healthy').length;
    }, 0);

    const topIssueBranch = branchData.reduce((best, item) => {
        if (!best || item.issues > best.issues) return item;
        return best;
    }, null);
    const bestPerfBranch = branchData.reduce((best, item) => {
        if (!best || item.performance > best.performance) return item;
        return best;
    }, null);
    const totalPcs = branchData.reduce((sum, item) => {
        const branchList = pcData[item.branch] || [];
        return sum + branchList.length;
    }, 0);

    const categoryCounts = branchData.reduce((acc, item) => {
        item.categories.forEach(cat => {
            acc[cat.label] = (acc[cat.label] || 0) + cat.value;
        });
        return acc;
    }, {});
    const mostCommonCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    const freeSpaceTotals = branchData.reduce((acc, item) => {
        const branchList = pcData[item.branch] || [];
        branchList.forEach(pc => {
            const freeAmount = Number((pc.freeSpace || '').replace(/[^0-9]/g, '')) || 0;
            acc.total += freeAmount;
            acc.count += 1;
        });
        return acc;
    }, { total: 0, count: 0 });

    const tempTotals = branchData.reduce((acc, item) => {
        const branchList = pcData[item.branch] || [];
        branchList.forEach(pc => {
            const tempValue = Number(pc.pcTemp) || 0;
            acc.total += tempValue;
            acc.count += 1;
        });
        return acc;
    }, { total: 0, count: 0 });

    const avgFreeSpace = freeSpaceTotals.count ? Math.round(freeSpaceTotals.total / freeSpaceTotals.count) : 0;
    const avgTemp = tempTotals.count ? Math.round(tempTotals.total / tempTotals.count) : 0;

    const selectedLabel = document.getElementById('analysisCompareResultSelectedBranches');
    const breakdownsLabel = document.getElementById('analysisCompareResultBreakdowns');
    const healthyLabel = document.getElementById('analysisCompareResultHealthyPcs');
    const performanceLabel = document.getElementById('analysisCompareResultAveragePerformance');
    const topBranchLabel = document.getElementById('analysisCompareTopIssueBranch');
    const bestBranchLabel = document.getElementById('analysisCompareBestBranch');
    const categoryLabel = document.getElementById('analysisCompareMostCommonCategory');
    const avgFreeSpaceLabel = document.getElementById('analysisCompareAvgFreeSpace');
    const avgTempLabel = document.getElementById('analysisCompareAvgTemp');
    const totalPcsLabel = document.getElementById('analysisCompareTotalPcs');
    const generatedAtLabel = document.getElementById('analysisCompareGeneratedAt');

    if (selectedLabel) selectedLabel.innerText = branchData.length.toString();
    if (breakdownsLabel) breakdownsLabel.innerText = totalBreakdowns.toString();
    if (healthyLabel) healthyLabel.innerText = healthyPCs.toString();
    if (performanceLabel) performanceLabel.innerText = `${avgPerformance}%`;
    if (topBranchLabel) topBranchLabel.innerText = topIssueBranch ? `${topIssueBranch.branch} (${topIssueBranch.issues} issues)` : 'N/A';
    if (bestBranchLabel) bestBranchLabel.innerText = bestPerfBranch ? `${bestPerfBranch.branch} (${bestPerfBranch.performance}%)` : 'N/A';
    if (categoryLabel) categoryLabel.innerText = mostCommonCategory ? `${mostCommonCategory[0]} (${mostCommonCategory[1]})` : 'N/A';
    if (avgFreeSpaceLabel) avgFreeSpaceLabel.innerText = `${avgFreeSpace} GB`;
    if (avgTempLabel) avgTempLabel.innerText = `${avgTemp}°C`;
    if (totalPcsLabel) totalPcsLabel.innerText = totalPcs.toString();
    if (generatedAtLabel) generatedAtLabel.innerText = new Date().toLocaleString();

    const healthCounts = branchData.reduce((acc, item) => {
        const branchList = pcData[item.branch] || [];
        branchList.forEach(pc => {
            const health = pc.health || 'Unknown';
            if (health === 'Healthy') acc.healthy += 1;
            else if (health === 'Warning') acc.warning += 1;
            else if (health === 'Critical') acc.critical += 1;
            else acc.unknown += 1;
        });
        return acc;
    }, { healthy: 0, warning: 0, critical: 0, unknown: 0 });

    const healthLabels = ['Healthy', 'Warning', 'Critical'];
    const healthData = [healthCounts.healthy, healthCounts.warning, healthCounts.critical];

    updateChart('analysisCompareResultChart', 'bar', {
        labels,
        datasets: [{
            label: analysisCompareRequest.branchScope === 'selected' ? 'Average performance for selected branches (%)' : 'Average performance for all branches (%)',
            data: averages,
            backgroundColor: '#16a34a'
        }]
    }, {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { suggestedMin: 0, suggestedMax: 100 } }
    });

    updateChart('analysisCompareHealthChart', 'doughnut', {
        labels: healthLabels,
        datasets: [{ data: healthData, backgroundColor: ['#16a34a', '#f59e0b', '#ef4444'] }]
    }, {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
    });

    const branchIssueLabels = branchData.map(item => item.branch);
    const branchIssueValues = branchData.map(item => item.issues);
    updateChart('analysisCompareBranchIssueChart', 'bar', {
        labels: branchIssueLabels,
        datasets: [{ label: 'Branch issue count', data: branchIssueValues, backgroundColor: '#2563eb' }]
    }, {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { suggestedMin: 0, suggestedMax: Math.max(...branchIssueValues, 10) + 5 } }
    });
}

function openAnalysisCompareResultOverlay() {
    document.getElementById('analysisCompareResultOverlay')?.classList.remove('hidden');
    document.body.classList.add('no-scroll');
}

function closeAnalysisCompareResultOverlay() {
    document.getElementById('analysisCompareResultOverlay')?.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

function downloadAnalysisCompareResultChart() {
    const modal = document.getElementById('analysisCompareResultOverlay');
    const card = document.querySelector('#analysisCompareResultOverlay .compare-modal-card');
    if (!card || !modal) {
        return;
    }

    modal.classList.remove('hidden');
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';

    exportElementToPdf(card, 'branch-comparison.pdf', {
        hideSelectors: ['.btn-cancel', '.modal-close-button', '.delete-btn']
    })
        .then(() => {
            toastNotice('success', 'Download complete', 'Branch comparison report exported successfully.');
        })
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to export the comparison report.');
            console.warn('Failed to export analysis comparison as PDF.');
        });
}

function downloadAnalysisPagePdf() {
    const analysisPage = document.getElementById('analysisPage');
    if (!analysisPage) {
        toastNotice('error', 'Export failed', 'Analysis content is not available for export.');
        return;
    }

    exportElementToPdf(analysisPage, 'analysis-report.pdf', {
        hideSelectors: ['.btn-cancel', '.modal-close-button', '.delete-btn', '.close-inventory-btn']
    })
        .then(() => {
            toastNotice('success', 'Export complete', 'Analysis report exported as PDF.');
        })
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to generate the analysis PDF.');
        });
}

function exportAnalysisMetricToPdf(elementId, title) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const wrapper = document.createElement('div');
    wrapper.style.width = '1400px';
    wrapper.style.padding = '24px';
    wrapper.style.background = '#ffffff';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.color = '#0f172a';

    const header = document.createElement('div');
    header.innerHTML = `
        <div style="font-size:20px; font-weight:700; color:#102d6d; margin-bottom:6px;">${title}</div>
        <div style="font-size:11px; color:#64748b; margin-bottom:20px;">Generated: ${new Date().toLocaleString()}</div>
    `;
    wrapper.appendChild(header);

    const metricContainer = document.createElement('div');
    metricContainer.style.marginBottom = '24px';
    metricContainer.style.display = 'flex';
    metricContainer.style.alignItems = 'center';
    metricContainer.style.gap = '20px';
    metricContainer.style.padding = '16px';
    metricContainer.style.backgroundColor = '#f8fafc';
    metricContainer.style.borderRadius = '6px';

    const metricIcon = document.createElement('div');
    metricIcon.style.fontSize = '48px';
    metricIcon.style.color = '#102d6d';
    metricIcon.innerHTML = '<i class="fas fa-chart-bar"></i>';

    const metricValue = document.createElement('div');
    metricValue.innerHTML = `
        <div style="font-size:32px; font-weight:700; color:#102d6d;">${element.textContent || '0'}</div>
        <div style="font-size:13px; color:#64748b; margin-top:4px;">${title}</div>
    `;

    metricContainer.appendChild(metricIcon);
    metricContainer.appendChild(metricValue);
    wrapper.appendChild(metricContainer);

    const summaryTable = document.querySelector('#analysisPage .table-frame-panel table');
    if (summaryTable) {
        const tableClone = summaryTable.cloneNode(true);
        tableClone.style.width = '100%';
        tableClone.style.borderCollapse = 'collapse';
        
        const rows = tableClone.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.style.padding = '10px';
                cell.style.border = '1px solid #e2e8f0';
                cell.style.textAlign = 'left';
            });
            const headerCells = row.querySelectorAll('th');
            if (headerCells.length > 0) {
                row.style.backgroundColor = '#f1f5f9';
                headerCells.forEach(th => {
                    th.style.fontWeight = '700';
                    th.style.color = '#0f172a';
                });
            }
        });

        const tableWrapper = document.createElement('div');
        tableWrapper.style.marginTop = '16px';
        const tableLabel = document.createElement('div');
        tableLabel.innerHTML = '<div style="font-size:14px; font-weight:700; color:#102d6d; margin-bottom:12px;">Branch Performance Data</div>';
        tableWrapper.appendChild(tableLabel);
        tableWrapper.appendChild(tableClone);
        wrapper.appendChild(tableWrapper);
    }

    document.body.appendChild(wrapper);
    exportElementToPdf(wrapper, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`)
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to export the selected metric.');
        })
        .finally(() => {
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        });
}

function exportAnalysisSectionToPdf(canvasId, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const chartBox = canvas.closest('.chart-box');
    const exportTarget = chartBox || canvas;

    exportElementToPdf(exportTarget, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`)
        .then(() => {
            toastNotice('success', 'Export complete', `${title} exported as PDF.`);
        })
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to export the selected chart.');
        });
}

function exportAnalysisTableToPdf() {
    const panel = document.querySelector('#analysisPage .table-frame-panel');
    if (!panel) return;

    exportElementToPdf(panel, 'average-branch-performance.pdf')
        .then(() => {
            toastNotice('success', 'Export complete', 'Branch performance table exported as PDF.');
        })
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to export the performance table.');
        });
}
function downloadInventoryFindings() {
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
        alert('PDF export feature is not available right now. Please try again.');
        return;
    }

    const findingsWrapper = document.getElementById('inventoryFindingsWrapper');
    if (!findingsWrapper) return;

    const originalTable = findingsWrapper.querySelector('table');
    if (!originalTable) return;

    // Create a clean, simple wrapper for downloading
    const wrapper = document.createElement('div');
    wrapper.id = 'inventoryFindingsDownloadClone';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '1600px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '40px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.fontSize = '12px';
    wrapper.style.lineHeight = '1.4';
    
    // Add header
    const header = document.createElement('div');
    header.style.marginBottom = '30px';
    header.innerHTML = `
        <div style="font-size: 22px; font-weight: bold; color: #102d6d; margin-bottom: 8px;">Inventory Findings Report</div>
        <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleString()}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
            <span style="display: inline-block; margin-right: 20px;"><span style="display: inline-block; width: 12px; height: 12px; background: #fee2e2; border: 1px solid #fecaca; margin-right: 4px;"></span> Critical</span>
            <span style="display: inline-block; margin-right: 20px;"><span style="display: inline-block; width: 12px; height: 12px; background: #fff7ed; border: 1px solid #fed7aa; margin-right: 4px;"></span> Warning</span>
            <span style="display: inline-block;"><span style="display: inline-block; width: 12px; height: 12px; background: #ecfdf5; border: 1px solid #86efac; margin-right: 4px;"></span> Healthy</span>
        </div>
    `;
    wrapper.appendChild(header);
    
    // Clone and clean the table
    const tableClone = originalTable.cloneNode(true);
    
    // Reset table styles
    tableClone.style.width = '100%';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.style.border = '1px solid #cbd5e1';
    tableClone.style.tableLayout = 'fixed';
    
    // Define column widths (proportional)
    const colWidths = ['80px', '140px', '80px', '80px', '70px', '80px', '70px', '100px', '180px', '200px'];
    
    // Add colgroup for width control
    const colgroup = document.createElement('colgroup');
    colWidths.forEach(width => {
        const col = document.createElement('col');
        col.style.width = width;
        colgroup.appendChild(col);
    });
    tableClone.insertBefore(colgroup, tableClone.querySelector('thead'));
    
    // Clean up headers
    Array.from(tableClone.querySelectorAll('thead th')).forEach((th, idx) => {
        th.style.backgroundColor = '#f0f4f8';
        th.style.color = '#1f2937';
        th.style.fontWeight = 'bold';
        th.style.padding = '12px 8px';
        th.style.textAlign = 'left';
        th.style.borderBottom = '2px solid #cbd5e1';
        th.style.fontSize = '11px';
        th.style.whiteSpace = 'nowrap';
        th.style.overflow = 'hidden';
        th.style.textOverflow = 'ellipsis';
    });
    
    // Clean up and color-code rows and cells
    Array.from(tableClone.querySelectorAll('tbody tr')).forEach(tr => {
        tr.style.cursor = 'default';
        tr.onclick = null;
        
        // Get health status from row to determine row color
        const healthCell = tr.querySelector('td:nth-child(4)');
        const healthText = healthCell?.innerText?.toUpperCase() || '';
        
        let rowBackgroundColor = '#ffffff';
        if (healthText.includes('CRITICAL')) {
            rowBackgroundColor = '#fef2f2';
        } else if (healthText.includes('WARNING')) {
            rowBackgroundColor = '#fff7ed';
        } else if (healthText.includes('HEALTHY')) {
            rowBackgroundColor = '#ecfdf5';
        }
        
        Array.from(tr.querySelectorAll('td')).forEach((td, idx) => {
            td.style.padding = '10px 8px';
            td.style.borderBottom = '1px solid #e5e7eb';
            td.style.color = '#1f2937';
            td.style.whiteSpace = 'normal';
            td.style.wordWrap = 'break-word';
            td.style.overflow = 'hidden';
            td.style.verticalAlign = 'top';
            td.style.backgroundColor = rowBackgroundColor;
            
            // Extract and style badges
            const badgeElements = td.querySelectorAll('[class*="pill"], [class*="chip"]');
            badgeElements.forEach(el => {
                const text = el.innerText || el.textContent;
                const classList = el.className;
                
                let bgColor = '#f1f5f9';
                let textColor = '#1f2937';
                
                // Color based on badge type
                if (classList.includes('red') || text.includes('CRITICAL')) {
                    bgColor = '#fee2e2';
                    textColor = '#b91c1c';
                } else if (classList.includes('orange') || text.includes('WARNING')) {
                    bgColor = '#fff7ed';
                    textColor = '#b45309';
                } else if (classList.includes('green')) {
                    bgColor = '#ecfdf5';
                    textColor = '#166534';
                }
                
                const span = document.createElement('span');
                span.textContent = text;
                span.style.display = 'inline-block';
                span.style.padding = '4px 6px';
                span.style.backgroundColor = bgColor;
                span.style.color = textColor;
                span.style.borderRadius = '3px';
                span.style.fontSize = 'inherit';
                span.style.fontWeight = '500';
                span.style.whiteSpace = 'normal';
                span.style.wordWrap = 'break-word';
                
                el.parentElement.replaceChild(span, el);
            });
        });
    });
    
    // Remove bar-track and other progress elements
    Array.from(tableClone.querySelectorAll('.bar-track')).forEach(el => {
        el.remove();
    });
    
    wrapper.appendChild(tableClone);
    document.body.appendChild(wrapper);

    // Render to PDF with a slight delay
    setTimeout(() => {
        exportElementToPdf(wrapper, `inventory-findings-${new Date().toISOString().slice(0, 10)}.pdf`)
            .then(() => {
                toastNotice('success', 'Download Complete', 'Inventory findings exported as PDF successfully');
            })
            .catch(err => {
                console.error('Error downloading inventory findings:', err);
                alert('Failed to export inventory findings as PDF. Please try again.');
            })
            .finally(() => {
                const clone = document.getElementById('inventoryFindingsDownloadClone');
                if (clone && clone.parentNode) {
                    document.body.removeChild(clone);
                }
            });
    }, 100);
}

function renderAnalysisBranchIssuesChart(branchData, selectedBranch) {
    const sortedBranches = branchData.slice().sort((a, b) => b.issues - a.issues);
    const labels = sortedBranches.map(item => item.branch);
    const values = sortedBranches.map(item => item.issues);
    const background = labels.map(branch => branch === selectedBranch ? '#2563eb' : '#7c3aed');
    updateChart('analysisBranchIssuesChart', 'bar', {
        labels,
        datasets: [{
            label: 'Issue Count',
            data: values,
            backgroundColor: background
        }]
    }, {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    });
}

function renderAnalysisPerformanceChart(branchData, year, month, selectedBranch) {
    const labels = analysisMonths.slice(1);
    const averageLine = labels.map((_, idx) => {
        const values = branchData.map(item => item.monthlyScore[idx]);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    });
    updateChart('analysisPerformanceChart', 'line', { labels, datasets: [{ label: 'Average Performance', data: averageLine, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.15)', tension: 0.35, fill: true }] }, { responsive: true, plugins: { legend: { display: false } }, scales: { y: { suggestedMin: 40, suggestedMax: 100 } } });
}

function renderAnalysisProblemCategoryChart(selectedBranchData) {
    const categoryTotals = selectedBranchData.reduce((acc, item) => {
        item.categories.forEach(cat => {
            acc[cat.label] = (acc[cat.label] || 0) + cat.value;
        });
        return acc;
    }, {});
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    updateChart('analysisProblemCategoryChart', 'doughnut', {
        labels,
        datasets: [{
            data,
            backgroundColor: ['#f97316', '#2563eb', '#22c55e', '#8b5cf6', '#f59e0b'],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 14,
                    boxWidth: 12,
                    font: { size: 12 }
                }
            }
        },
        layout: { padding: 12 }
    });
}


function renderAnalysisSummaryTable(branchData) {
    const body = document.getElementById('analysisSummaryTable');
    if (!body) return;
    body.innerHTML = branchData.map(item => `
        <tr>
            <td>${item.branch}</td>
            <td>${item.issues}</td>
            <td>${item.performance}%</td>
            <td>${item.breakdowns}</td>
            <td>${item.worstCategory}</td>
        </tr>
    `).join('');
}

function openAnalysisComparisonPrompt() {
    const compareMode = document.getElementById('analysisCompareMode');
    if (compareMode) {
        compareMode.focus();
    }
}

const analysisDoughnutLabelPlugin = {
    id: 'analysisDoughnutLabelPlugin',
    afterDatasetsDraw(chart) {
        if (chart.config.type !== 'doughnut') return;

        const { ctx, data, chartArea } = chart;
        if (!chartArea) return;

        const dataset = data.datasets[0];
        if (!dataset?.data?.length) return;

        const total = dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
        if (total <= 0) return;

        const { left, top, right, bottom } = chartArea;
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        const radius = Math.min((right - left) / 2, (bottom - top) / 2) * 0.72;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const canvasId = chart.canvas && chart.canvas.id ? String(chart.canvas.id) : '';
        const hidePercentageFor = (id) => id.startsWith('mini-') || id.includes('inventory');

        chart.getDatasetMeta(0).data.forEach((arc, index) => {
            const value = Number(dataset.data[index] || 0);
            if (value <= 0) return;

            const angle = arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
            const x = centerX + Math.cos(angle) * radius * 0.76;
            const y = centerY + Math.sin(angle) * radius * 0.76;
            const percentage = ((value / total) * 100).toFixed(0);

            ctx.fillStyle = '#0f172a';
            ctx.font = '600 12px Inter, system-ui, sans-serif';
            ctx.fillText(`${value}`, x, y - 6);
            // Only draw the percentage label on non-inventory/mini charts
            if (!hidePercentageFor(canvasId)) {
                ctx.fillStyle = '#64748b';
                ctx.font = '500 10px Inter, system-ui, sans-serif';
                ctx.fillText(`${percentage}%`, x, y + 10);
            }
        });

        ctx.restore();
    }
};

if (!window.__analysisDoughnutLabelPluginRegistered) {
    Chart.register(analysisDoughnutLabelPlugin);
    window.__analysisDoughnutLabelPluginRegistered = true;
}

function updateChart(canvasId, type, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (analysisChartInstances[canvasId]) {
        analysisChartInstances[canvasId].data = data;
        analysisChartInstances[canvasId].options = options;
        analysisChartInstances[canvasId].update();
        return;
    }
    analysisChartInstances[canvasId] = new Chart(ctx, { type, data, options });
}

function getColorForLabel(label) {
    const palette = ['#2563eb', '#f97316', '#16a34a', '#8b5cf6', '#0ea5e9', '#e11d48', '#a3e635', '#facc15'];
    const hash = Array.from(label.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
}

function generateAnalysisComparison() {
    const { targets, compareMode, branchScope, branchTargets } = getAnalysisCompareModalSelections();
    if (!targets || targets.length < 2) {
        const summary = document.getElementById('analysisCompareSummary');
        if (summary) summary.innerText = compareMode === 'years' ? 'Please select at least two years before generating.' : 'Please select at least two months before generating.';
        return;
    }

    if (branchScope === 'selected' && (!branchTargets || branchTargets.length === 0)) {
        const summary = document.getElementById('analysisCompareSummary');
        if (summary) summary.innerText = 'Choose one or more branches when "Choose Branches" is selected.';
        return;
    }

    analysisCompareRequest = {
        mode: compareMode,
        targets,
        branchScope,
        branchTargets: branchScope === 'selected' ? branchTargets : branches.slice()
    };
    closeAnalysisCompareModal();
    openAnalysisCompareResultOverlay();
    renderAnalysisCompareResultChart();
    return true;
}

function initializeInventoryFilter() {
    const inventorySelect = document.getElementById("inventoryBranchFilter");
    if (!inventorySelect) return;
    inventorySelect.innerHTML = `<option value="">All Branches</option>`;
    branches.forEach(branch => {
        inventorySelect.innerHTML += `<option value="${branch}">${branch}</option>`;
    });
    inventorySelect.value = "";
}

function getInventoryScopeBranch() {
    const inventorySelect = document.getElementById("inventoryBranchFilter");
    return inventorySelect ? inventorySelect.value : "";
}

function deriveInventoryAlertInfo(pc) {
    const freeSpaceNum = parseInt(pc.freeSpace) || 0;
    const tempValue = parseInt(pc.processorTemp || pc.pcTemp) || 0;
    const storageType = normalizeStorageType(pc.storage);
    const storageWear = normalizeStorageWear(pc.storageWear, storageType);
    const storageHealthValue = getStorageHealthValue(pc);
    const hasStorageHealthValue = typeof storageHealthValue === 'number' && !Number.isNaN(storageHealthValue);
    const storageHealthLabel = hasStorageHealthValue ? getStorageHealthLabel(storageType, storageHealthValue) : 'Storage health N/A';

    const highTemp = tempValue >= 75 || (pc.processorTemp && tempValue >= 85);
    const lowStorage = freeSpaceNum <= 50;
    const replacementRecommended = pc.health === 'Critical' || freeSpaceNum <= 15 || tempValue >= 85 || (hasStorageHealthValue && storageHealthValue <= 29) || (isStorageSSD(storageType) ? storageWear <= 20 : isStorageHDD(storageType) ? storageWear <= 30 : storageWear <= 25);

    const alertPieces = [];
    const fixes = [];

    if (hasStorageHealthValue && (storageHealthValue <= 60 || lowStorage || tempValue >= 70 || replacementRecommended)) {
        alertPieces.push(storageHealthLabel);
    }

    if (isStorageSSD(storageType)) {
        if (hasStorageHealthValue && storageHealthValue <= 29) {
            fixes.push('Replace SSD immediately');
        } else if (hasStorageHealthValue && storageHealthValue <= 49) {
            fixes.push('Plan SSD replacement soon');
        } else if (freeSpaceNum <= 15) {
            fixes.push('Free disk space or upgrade SSD');
        }
    } else if (isStorageHDD(storageType)) {
        if (hasStorageHealthValue && storageHealthValue <= 29) {
            fixes.push('Backup data and replace HDD');
        } else if (freeSpaceNum <= 15) {
            fixes.push('Free disk space or upgrade HDD');
        }
    } else {
        if (hasStorageHealthValue && storageHealthValue <= 29) {
            fixes.push('Inspect storage health');
        } else if (freeSpaceNum <= 15) {
            fixes.push('Free disk space or upgrade storage');
        }
    }

    if (freeSpaceNum <= 15) {
        alertPieces.push(`Free space ${pc.freeSpace}`);
    } else if (freeSpaceNum <= 50) {
        alertPieces.push(`Free space low (${pc.freeSpace})`);
        if (fixes.length === 0) fixes.push('Clean up files or add storage');
    }

    if (tempValue >= 85) {
        alertPieces.push(`CPU temp ${tempValue}°C`);
        fixes.push('Replace thermal paste and inspect cooling');
    } else if (tempValue >= 70) {
        alertPieces.push(`High temp ${tempValue}°C`);
        fixes.push('Clean dust and verify fans');
    }

    if (pc.health === 'Critical' && fixes.length === 0) {
        fixes.push('Perform urgent hardware inspection');
    }

    const alertDetails = alertPieces.join(' · ') || 'No active alerts';
    const recommendation = fixes.length > 0 ? fixes.join(' / ') : 'No immediate action needed';

    return {
        highTemp,
        lowStorage,
        replacementRecommended,
        storageWear,
        alertDetails,
        recommendation
    };
}

function renderInventoryReportView() {
    const branchFilter = getInventoryScopeBranch();
    const rows = [];
    let totalCount = 0;
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let downCount = 0;
    let highTempCount = 0;
    let lowStorageCount = 0;
    let replacementCount = 0;

    const branchList = branchFilter ? [branchFilter] : branches;

    branchList.forEach(branch => {
        const list = pcData[branch] || [];
        list.forEach(pc => {
            totalCount++;
            if (pc.health === "Healthy") healthyCount++;
            if (pc.health === "Warning") warningCount++;
            if (pc.health === "Critical") criticalCount++;
            if (pc.state === "Down") downCount++;

            const alertInfo = deriveInventoryAlertInfo(pc);
            if (alertInfo.highTemp) highTempCount++;
            if (alertInfo.lowStorage) lowStorageCount++;
            if (alertInfo.replacementRecommended) replacementCount++;

            const freeSpaceNum = parseInt(pc.freeSpace) || 0;
            const reasons = [];
            if (pc.health === "Critical") reasons.push("Critical health");
            if (pc.health === "Warning") reasons.push("Warning status");
            if (pc.state === "Down") reasons.push("Offline");
            if (freeSpaceNum <= 15) reasons.push("Low storage");
            if (pc.pcTemp >= 85) reasons.push("High temp");
            if (pc.state === "Active" && pc.health === "Healthy" && reasons.length === 0) reasons.push("Stable");

            rows.push({
                branch,
                pc,
                state: pc.state,
                health: pc.health,
                freeSpace: pc.freeSpace,
                user: pc.username || 'Unknown',
                cpuTemp: `${pc.processorTemp || pc.pcTemp}°C`,
                reason: reasons.join(', '),
                alertInfo
            });
        });
    });

    const filteredRows = rows.filter(row => {
        if (inventoryQuickFilter === 'warning') return row.health === 'Warning';
        if (inventoryQuickFilter === 'critical') return row.health === 'Critical';
        if (inventoryQuickFilter === 'offline') return row.state === 'Down';
        if (inventoryQuickFilter === 'stable') return row.health === 'Healthy' && row.state === 'Active';
        if (inventoryQuickFilter === 'highTemp') return row.alertInfo?.highTemp;
        if (inventoryQuickFilter === 'lowStorage') return row.alertInfo?.lowStorage;
        if (inventoryQuickFilter === 'replacement') return row.alertInfo?.replacementRecommended;
        return true;
    });

    const overallHealthcare = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;
    document.getElementById("inventoryTotalPcsCount").innerText = totalCount;
    document.getElementById("inventoryOverallHealthcare").innerText = `${overallHealthcare}%`;
    document.getElementById("inventoryWarningCount").innerText = warningCount;
    document.getElementById("inventoryCriticalCount").innerText = criticalCount;
    document.getElementById("inventoryDownCount").innerText = downCount;
    document.getElementById("inventoryHighTempCount").innerText = highTempCount;
    document.getElementById("inventoryLowStorageCount").innerText = lowStorageCount;
    document.getElementById("inventoryReplacementCount").innerText = replacementCount;

    // Render analogue doughnut for overall healthcare using Chart.js (updates if already created)
    try {
        if (typeof Chart !== 'undefined') {
            if (!window.inventoryHealthcareChartInstance) {
                const ctx = document.getElementById('inventoryHealthcareChart');
                if (ctx) {
                    window.inventoryHealthcareChartInstance = new Chart(ctx, {
                        type: 'doughnut',
                        data: { datasets: [{ data: [overallHealthcare, 100 - overallHealthcare], backgroundColor: ['#16a34a', '#e6eef9'], borderWidth: 0 }] },
                        options: { cutout: '80%', responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
                    });
                }
            } else {
                window.inventoryHealthcareChartInstance.data.datasets[0].data = [overallHealthcare, 100 - overallHealthcare];
                window.inventoryHealthcareChartInstance.update();
            }

            // mini pie charts for each summary card
            const miniMappings = {
                all: totalCount,
                warning: warningCount,
                critical: criticalCount,
                offline: downCount,
                highTemp: highTempCount,
                lowStorage: lowStorageCount,
                replacement: replacementCount
            };

            window._miniCharts = window._miniCharts || {};
            Object.keys(miniMappings).forEach(key => {
                const el = document.getElementById(`mini-${key}`);
                if (!el) return;
                const val = miniMappings[key] || 0;
                const other = Math.max(0, totalCount - val);
                if (!window._miniCharts[key]) {
                    window._miniCharts[key] = new Chart(el, {
                        type: 'doughnut',
                        data: { datasets: [{ data: [val, other], backgroundColor: ['#2563eb', '#f1f5f9'], borderWidth: 0 }] },
                        options: { cutout: '70%', responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
                    });
                } else {
                    window._miniCharts[key].data.datasets[0].data = [val, other];
                    window._miniCharts[key].update();
                }
            });
        }
    } catch (e) { console.warn('Chart render failed', e); }

    const findingsWrapper = document.getElementById('inventoryFindingsWrapper');
    const overlay = document.getElementById('inventoryOverlay');
    if (findingsWrapper) {
        if (inventoryFindingsVisible) {
            findingsWrapper.classList.remove('hidden');
            if (overlay) overlay.classList.remove('hidden');
            document.body.classList.add('no-scroll');
            try { findingsWrapper.setAttribute('tabindex','-1'); findingsWrapper.focus(); } catch(e) {}
        } else {
            findingsWrapper.classList.add('hidden');
            if (overlay) overlay.classList.add('hidden');
            document.body.classList.remove('no-scroll');
        }
    }

    const body = document.getElementById("inventoryReportBody");
    if (!body) return;
    body.innerHTML = "";

    if (filteredRows.length === 0) {
        body.innerHTML = `<tr><td colspan="11" style="text-align:center; color:#94a3b8; padding:28px;">No systems match the current filter.</td></tr>`;
        return;
    }

    filteredRows.forEach(row => {
        const healthBadge = row.health === "Healthy"
            ? `<span class="inventory-pill green"><i class="fas fa-check-circle"></i>${row.health}</span>`
            : row.health === "Warning"
                ? `<span class="inventory-pill orange"><i class="fas fa-exclamation-triangle"></i>${row.health}</span>`
                : `<span class="inventory-pill red"><i class="fas fa-radiation"></i>${row.health}</span>`;

        const statusBadge = row.state === "Active"
            ? `<span class="state-chip active"><i class="fas fa-signal"></i> Active</span>`
            : `<span class="state-chip down"><i class="fas fa-power-off"></i> Down</span>`;

        const freeSpaceNum = parseInt(row.pc.freeSpace) || 0;
        const storageHealthPct = getStorageHealthValue(row.pc);
        const storageColor = freeSpaceNum <= 15 ? 'red' : freeSpaceNum <= 50 ? 'orange' : 'green';
        const storageLabel = freeSpaceNum <= 15 ? 'Critical' : freeSpaceNum <= 50 ? 'Low' : 'Healthy';
        const storageBarWidth = Math.min(100, Math.max(0, freeSpaceNum));

        const cpuTempNum = parseInt(row.pc.processorTemp || row.pc.pcTemp) || 0;
        const tempClass = cpuTempNum >= 85 ? 'red' : cpuTempNum >= 70 ? 'orange' : 'green';
        const alertSummary = row.alertInfo ? row.alertInfo.alertDetails : 'N/A';
        const recommendation = row.alertInfo ? row.alertInfo.recommendation : 'N/A';

        body.innerHTML += `
            <tr onclick="viewBranchDetails('${row.branch}')">
                <td>
                    <div class="inventory-data-pill"><i class="fas fa-building"></i>${row.branch}</div>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <strong style="color:#0f172a;">${row.pc.pcName}${row.pc.replacementRemarks ? ` <i class="fas fa-sticky-note" title="${escapeHtml(row.pc.replacementRemarks)}" style="color:#64748b; font-size:12px; margin-left:6px;"></i>` : ''}</strong>
                        <span style="font-size:12px; color:#64748b;">${row.pc.brand || 'Generic'} • ${row.pc.storage}</span>
                    </div>
                </td>
                <td>
                    <span class="inventory-pill gray"><i class="fas fa-user"></i> ${row.user}</span>
                </td>
                <td>${healthBadge}</td>
                <td>${renderStorageHealthBadge(storageHealthPct)}</td>
                <td>${renderStorageHealthBadge(storageHealthPct)}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <span class="inventory-pill ${storageColor}"><i class="fas fa-hdd"></i>${row.freeSpace}</span>
                        <div class="bar-track" title="${row.freeSpace} free">
                            <div class="bar-fill ${storageColor}" style="width:${storageBarWidth}%;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <span class="inventory-pill ${tempClass}"><i class="fas fa-thermometer-half"></i>${row.cpuTemp}</span>
                        <span style="font-size:11px; color:#64748b;">${cpuTempNum >= 85 ? 'Overheat' : cpuTempNum >= 70 ? 'High' : 'Normal'}</span>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>${row.reason ? `<span class="inventory-pill ${row.reason.includes('Critical') ? 'red' : row.reason.includes('Warning') ? 'orange' : row.reason.includes('Offline') ? 'blue' : 'gray'}">${row.reason}</span>` : '<span class="inventory-pill gray">None</span>'}</td>
                <td><span class="inventory-pill ${row.alertInfo?.replacementRecommended ? 'red' : row.alertInfo?.highTemp || row.alertInfo?.lowStorage ? 'orange' : 'green'}" style="font-size:12px;">${alertSummary}</span></td>
                <td><span class="inventory-pill ${row.alertInfo?.replacementRecommended ? 'red' : row.alertInfo?.highTemp || row.alertInfo?.lowStorage ? 'orange' : 'green'}" style="font-size:12px; white-space:normal;">${recommendation}</span></td>
            </tr>`;
    });
}

function refreshAllViews() {
    // Update consolidated metrics and home widgets
    calculateConsolidatedMetrics();
    renderBranchGridDashboard();
    loadHomeRemarks();

    // If dashboard page is visible, re-render its table
    const dashboard = document.getElementById('dashboardPage');
    if (dashboard && !dashboard.classList.contains('hidden')) {
        renderBranchTableLog(selectedBranchGlobal);
    }

    // If inventory report page is visible, refresh it too
    const inventoryPage = document.getElementById('inventoryReportPage');
    if (inventoryPage && !inventoryPage.classList.contains('hidden')) {
        renderInventoryReportView();
    }

    // If analysis page is visible, refresh issue report metrics immediately
    const analysisPage = document.getElementById('analysisPage');
    if (analysisPage && !analysisPage.classList.contains('hidden')) {
        renderAnalysisView();
    }

    // dispatch an event for other potential UI hooks
    try { window.dispatchEvent(new CustomEvent('pcDataUpdated')); } catch (e) {}
}

function calculateConsolidatedMetrics() {
    let totalPcs = 0, healthy = 0, warning = 0, critical = 0;
    const branchIssues = {};

    branches.forEach(b => {
        (pcData[b] || []).forEach(pc => {
            totalPcs++;
            if (pc.health === "Healthy") healthy++;
            
            if (pc.health === "Warning" || pc.health === "Critical") {
                if (pc.health === "Warning") warning++;
                if (pc.health === "Critical") critical++;

                if (!branchIssues[b]) {
                    branchIssues[b] = [];
                }
                branchIssues[b].push(pc);
            }
        });
    });

    const overallBranchesEl = document.getElementById("overallBranches");
    const overallPCsEl = document.getElementById("overallPCs");
    const overallHealthyEl = document.getElementById("overallHealthy");
    const overallMaintenanceEl = document.getElementById("overallMaintenance");
    const overallIssuesEl = document.getElementById("overallIssues");

    if (overallBranchesEl) overallBranchesEl.innerText = branches.length;
    if (overallPCsEl) overallPCsEl.innerText = totalPcs;
    if (overallHealthyEl) overallHealthyEl.innerText = healthy;
    if (overallMaintenanceEl) overallMaintenanceEl.innerText = warning;
    if (overallIssuesEl) overallIssuesEl.innerText = critical;
    // render the immediate actions summary separately so it can be refreshed independently
    renderImmediateActionSummary();
}

function closeMetricSummary() {
    const overlay = document.getElementById('metricSummaryOverlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    activeMetricSummaryKey = null;
}

function downloadCurrentMetricSummary() {
    if (!activeMetricSummaryKey) return;

    const metricTitles = {
        'analysisProblemCount': 'Total Reported Issues',
        'analysisPerformanceScore': 'Average Branch Performance',
        'analysisBreakdowns': 'Branch Breakdowns',
        'analysisWorstCategory': 'Most Common Problem',
        'analysisTopBranch': 'Branch With Most Problems',
        'branches': 'Monitored Properties',
        'pcs': 'Aggregated Global Terminals',
        'healthy': 'Healthy Systems',
        'maintenance': 'Maintenance Status',
        'issues': 'Reported Issues'
    };

    const title = metricTitles[activeMetricSummaryKey] || 'Metric Summary';
    const modal = document.querySelector('.metric-summary-modal');
    if (!modal) return;

    exportElementToPdf(modal, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, {
        orientation: 'p',
        format: 'a4',
        hideSelectors: ['.delete-btn', '.btn-cancel', '.modal-close-button']
    })
        .then(() => {
            toastNotice('success', 'Download complete', `${title} exported as PDF.`);
        })
        .catch(() => {
            toastNotice('error', 'Export failed', 'Unable to export the metric summary.');
        });
}

function closeInventoryFindings() {
    // robustly hide the floating findings panel and overlay, and restore page state
    inventoryFindingsVisible = false;
    const findingsWrapper = document.getElementById('inventoryFindingsWrapper');
    const overlay = document.getElementById('inventoryOverlay');
    if (findingsWrapper) findingsWrapper.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    try { document.body.classList.remove('no-scroll'); } catch(e) {}
    try { setInventorySummarySelection(null); } catch(e) {}
}


function toggleBranchSummary(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.toggle('hidden');
}

function renderImmediateActionSummary() {
    const branchIssues = {};
    branches.forEach(b => {
        (pcData[b] || []).forEach(pc => {
            if (pc.health === 'Warning' || pc.health === 'Critical') {
                if (!branchIssues[b]) branchIssues[b] = [];
                branchIssues[b].push(pc);
            }
        });
    });

    const summaryListContainer = document.getElementById('immediateActionContent');
    if (!summaryListContainer) return;

    if (Object.keys(branchIssues).length === 0) {
        summaryListContainer.innerHTML = `
            <div style="color: #94a3b8; font-style: italic; text-align: center; padding: 40px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 14px; width: 100%;">
                <i class="fas fa-check-circle" style="color: #2ebd59; margin-right: 6px;"></i> No terminals currently flagging warnings or critical hardware issues.
            </div>`;
        return;
    }

    let gridHTML = `<div class="immediate-grid">`;
    Object.keys(branchIssues).forEach(branchKey => {
        const issuesArray = branchIssues[branchKey];
        const hasCritical = issuesArray.some(p => p.health === 'Critical');
        const cardBorderColor = hasCritical ? '#dc2626' : '#ea580c';
        const cardBgTint = hasCritical ? '#fef2f2' : '#fff7ed';

        const replacementPCs = issuesArray.filter(pc => pc.health === 'Critical');
        const inspectionPCs = issuesArray.filter(pc => pc.health === 'Warning');

        let cardBodyItems = '';
        if (replacementPCs.length > 0) {
            cardBodyItems += `<div style="margin-bottom:12px;"><div style="font-size:12px; font-weight:700; color:#dc2626; text-transform:uppercase; border-bottom:2px solid #fecaca; padding-bottom:4px; margin-bottom:6px;">CRITICAL ACTION ITEMS</div>`;
            replacementPCs.forEach(pc => {
                const spaceVal = parseInt(pc.freeSpace) || 0;
                let contextualLabel = renderTempBadge(pc.pcTemp);
                if (spaceVal <= 15) contextualLabel = `<span class="temp-badge temp-badge-critical"><i class="fas fa-hdd" aria-hidden="true"></i>Low: ${pc.freeSpace}</span>`;
                cardBodyItems += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed #e2e8f0; font-size:13px;"><span><i class="fas fa-radiation" style="color:#dc2626; margin-right:6px;"></i><b>${pc.pcName}</b></span><span>${contextualLabel}</span></div>`;
            });
            cardBodyItems += `</div>`;
        }

        if (inspectionPCs.length > 0) {
            cardBodyItems += `<div><div style="font-size:12px; font-weight:700; color:#ea580c; text-transform:uppercase; border-bottom:2px solid #fed7aa; padding-bottom:4px; margin-bottom:6px;">WARNING INSPECTIONS</div>`;
            inspectionPCs.forEach(pc => {
                const spaceVal = parseInt(pc.freeSpace) || 0;
                let contextualLabel = renderTempBadge(pc.pcTemp);
                if (spaceVal <= 50 && spaceVal > 15) contextualLabel = `<span class="temp-badge temp-badge-warning"><i class="fas fa-hdd" aria-hidden="true"></i>Space: ${pc.freeSpace}</span>`;
                cardBodyItems += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed #e2e8f0; font-size:13px;"><span><i class="fas fa-exclamation-triangle" style="color:#ea580c; margin-right:6px;"></i><b>${pc.pcName}</b></span><span>${contextualLabel}</span></div>`;
            });
            cardBodyItems += `</div>`;
        }

        gridHTML += `<div class="immediate-action-card" onclick="promptAdminForBranch('${branchKey}')"><div class="action-card-header" style="border-top: 4px solid ${cardBorderColor}; background: ${cardBgTint};"><strong style="font-size: 14px; color: #1e293b;"><i class="fas fa-building" style="color: #64748b; margin-right: 8px;"></i>${branchKey}</strong><span style="font-size: 11px; font-weight: 700; background: #64748b; color: #ffffff; min-width: 20px; height: 20px; padding: 0 6px; display: flex; align-items: center; justify-content: center; border-radius: 10px;">${issuesArray.length}</span></div><div class="action-card-body">${cardBodyItems}</div></div>`;
    });
    gridHTML += `</div>`;
    summaryListContainer.innerHTML = `<h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 10px 0 0 0;"><i class="fas fa-exclamation-circle" style="color: #dc2626; margin-right: 8px;"></i>Immediate Operational Actions Grouped By Branch</h3>${gridHTML}`;
}

function renderBranchTableLog(branchName) {
    const tbody = document.getElementById("branchTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let tCount = 0, hCount = 0, wCount = 0, cCount = 0;
    const list = pcData[branchName] || [];

    list.forEach(pc => {
        tCount++;
        let badgeColor = "#2ebd59";
        if (pc.health === "Warning") { wCount++; badgeColor = "#ea580c"; }
        if (pc.health === "Critical") { cCount++; badgeColor = "#dc2626"; }
        if (pc.health === "Healthy") hCount++;

        // DYNAMIC STORAGE MATH ENGINE
        const parsedFree = parseInt(pc.freeSpace) || 0;
        const parsedCapacity = parseInt(pc.capacity) || 512;
        const usedSpace = Math.max(0, parsedCapacity - parsedFree);
        
        // Calculate fill percentage line
        let usePercentage = Math.round((usedSpace / parsedCapacity) * 100);
        if (usePercentage > 100) usePercentage = 100;

        // Visual alert tracking boundary parameters
        let barColor = "#2ebd59"; // Healthy
        if (parsedFree <= 15) {
            barColor = "#dc2626"; // Critical
        } else if (parsedFree <= 50) {
            barColor = "#ea580c"; // Warning
        }

        tbody.innerHTML += `
            <tr>
                <td style="font-weight:700;">
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <span style="font-weight:700;">${pc.pcName}</span>
                        ${pc.replacementRemarks ? `<small style="color:#64748b; font-style:italic;">${escapeHtml(pc.replacementRemarks)}</small>` : ''}
                    </div>
                </td>
                <td><span class="state-indicator ${pc.state === 'Active' ? 'online' : 'offline'}"></span> ${pc.state}</td>
                <td><span style="background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">${pc.health}</span></td>
                <td>${pc.pcProcessor}</td>
                <td>${pc.brand || 'Generic'}</td>
                <td>${pc.storage || 'SSD'}</td>
                <td>${pc.capacity || '512GB'}</td>
                
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px; min-width:110px;">
                        <span style="font-weight:700; font-size:13px; color:#1e293b;">${pc.freeSpace}</span>
                        <div style="width:100%; height:6px; background:#e2e8f0; border-radius:10px; overflow:hidden;" title="Disk Space Used: ${usePercentage}%">
                            <div style="width: ${usePercentage}%; height:100%; background:${barColor}; border-radius:10px; transition: width 0.4s ease-out;"></div>
                        </div>
                    </div>
                </td>
                
                <td>${renderStorageHealthBadge(pc.storageHealth)}</td>
                <td>${renderTempBadge(pc.pcTemp)}</td>
                <td>${renderTempBadge(pc.processorTemp || pc.pcTemp)}</td>
                <td><span style="display:inline-flex; align-items:center; gap:4px; background:#e8f3ff; color:#0d47a1; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600;"><i class="fas fa-user"></i>${pc.username || 'N/A'}</span></td>
                <td style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                    <button class="edit-btn" type="button" onclick="openFloatingUpdateOverlay('${String(branchName).replace(/'/g, "\\'")}', ${tCount - 1})">Update</button>
                    <button class="delete-btn" type="button" onclick="openDeletePcOverlay('${String(branchName).replace(/'/g, "\\'")}', ${tCount - 1})">Delete</button>
                </td>
            </tr>`;
    });

    document.getElementById("totalPCs").innerText = tCount;
    document.getElementById("healthyPCs").innerText = hCount;
    document.getElementById("warningPCs").innerText = wCount;
    document.getElementById("criticalPCs").innerText = cCount;
    
    if (typeof renderBranchChartEngine === "function") {
        renderBranchChartEngine(hCount, wCount, cCount);
    }
}

/* ==========================================================================
   4. INTERACTIVE GRID DIRECTION & STATUS BADGES
   ========================================================================== */
function renderBranchGridDashboard() {
    const grid = document.getElementById("branchGrid");
    if (!grid) return;
    grid.innerHTML = "";

    branches.forEach(branch => {
        const branchPcs = pcData[branch] || [];
        let warnCount = 0;
        let critCount = 0;

        branchPcs.forEach(pc => {
            if (pc.health === "Warning") warnCount++;
            if (pc.health === "Critical") critCount++;
        });

        let statusIndicatorsHTML = "";
        if (critCount > 0) {
            statusIndicatorsHTML += `<span style="background:#dc2626; color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-exclamation-circle"></i>${critCount}</span>`;
        }
        if (warnCount > 0) {
            statusIndicatorsHTML += `<span style="background:#ea580c; color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-exclamation-triangle"></i>${warnCount}</span>`;
        }
        if (critCount === 0 && warnCount === 0) {
            statusIndicatorsHTML += `<span style="background:#16a34a; color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-check"></i>OK</span>`;
        }

        grid.innerHTML += `
            <div class="branch-list-item" onclick="viewBranchDetails('${branch}')" style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:6px; cursor:pointer;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-building" style="color:#64748b;"></i>
                    <span class="branch-name" style="font-weight:600; color:#1e293b;">${branch}</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px; margin-left:auto; margin-right:10px;">
                    ${statusIndicatorsHTML}
                </div>
                <i class="fas fa-chevron-right" style="color:#cbd5e1; font-size:12px;"></i>
            </div>`;
    });
}

/* ==========================================================================
   5. ADMINISTRATIVE UPDATE CONTROLS (WITH FORCE BIOMETRIC CORRECTION)
   ========================================================================== */
function openAddPcForm() {
    const formPanel = document.getElementById("pcFormContainer");
    if (!formPanel) return;

    formPanel.classList.remove("hidden");
    document.getElementById("formTitleHeader").innerText = "Register New Machine Asset Parameters";
    document.getElementById("pcForm").reset();

    const branchInput = document.getElementById("branchInput");
    const adminBranch = document.getElementById("adminBranchSelect").value;
    if (branchInput && adminBranch) {
        branchInput.value = adminBranch;
    }
}

function computeHealthStatus(freeSpaceGb, tempC, storageHealthPct) {
    const freeValue = Number(freeSpaceGb) || 0;
    const tempValue = Number(tempC) || 0;
    const storageHealthValue = storageHealthPct === '' || storageHealthPct == null ? undefined : Number(storageHealthPct);
    const hasStorageHealthValue = storageHealthValue !== undefined && !Number.isNaN(storageHealthValue);
    if (freeValue <= 15 || tempValue >= 85 || (hasStorageHealthValue && storageHealthValue <= 29)) return "Critical";
    if (freeValue <= 50 || tempValue >= 70 || (hasStorageHealthValue && storageHealthValue <= 49)) return "Warning";
    return "Healthy";
}

function handleNewPcFormSubmission(event) {
    event.preventDefault();

    const branch = document.getElementById("branchInput").value;
    const pcName = document.getElementById("pcName").value.trim();
    const state = document.getElementById("pcState").value;
    const manualHealth = document.getElementById("health").value;
    const pcProcessor = document.getElementById("pcProcessor").value.trim();
    const brand = document.getElementById("brand").value.trim();
    const storage = document.getElementById("storage").value.trim();
    const capacityNum = Number(document.getElementById("capacity").value);
    const freeSpaceNum = Number(document.getElementById("freeSpace").value);
    const storageHealthRaw = document.getElementById("storageHealth").value;
    const storageHealthValue = Number(storageHealthRaw);
    const pcTemp = Number(document.getElementById("pcTemp").value);
    const processorTemp = Number(document.getElementById("processorTemp").value);
    const username = document.getElementById("username").value.trim();
    const replacementRemarks = (document.getElementById("replacementRemarks")?.value || '').trim();

    // Validation: require these 5 fields specifically
    if (!username) {
        toastNotice('warning', 'Input Required', "Primary User is required.");
        return;
    }
    if (Number.isNaN(pcTemp)) {
        toastNotice('warning', 'Input Required', "Chassis Temp is required.");
        return;
    }
    if (Number.isNaN(processorTemp)) {
        toastNotice('warning', 'Input Required', "CPU Temp is required.");
        return;
    }
    if (Number.isNaN(freeSpaceNum)) {
        toastNotice('warning', 'Input Required', "Free Space is required.");
        return;
    }
    if (Number.isNaN(capacityNum)) {
        toastNotice('warning', 'Input Required', "Disk Capacity is required.");
        return;
    }
    if (storageHealthRaw.trim() === '' || Number.isNaN(storageHealthValue) || storageHealthValue < 0 || storageHealthValue > 100) {
        toastNotice('warning', 'Input Required', "Storage Health must be a percentage from 0 to 100.");
        return;
    }
    if (!storage) {
        toastNotice('warning', 'Input Required', "Storage Type is required.");
        return;
    }
    
    if (!branch) {
        toastNotice('warning', 'Input Required', "Branch selection is required.");
        return;
    }

    const evaluatedHealth = computeHealthStatus(freeSpaceNum, pcTemp, storageHealthValue);
    const severityRank = { Healthy: 0, Warning: 1, Critical: 2 };
    let health = evaluatedHealth;
    if (severityRank[manualHealth] > severityRank[evaluatedHealth]) {
        health = manualHealth;
    }

    const assetInfo = buildAssetWarrantyInfo();
    const newPc = {
        pcName: pcName,
        state: state,
        health: health,
        pcProcessor: pcProcessor,
        brand: brand,
        storage: storage,
        capacity: `${capacityNum}GB`,
        freeSpace: `${freeSpaceNum}GB`,
        storageHealth: storageHealthValue,
        pcTemp: pcTemp,
        processorTemp: !Number.isNaN(processorTemp) && processorTemp > 0 ? processorTemp : pcTemp + 5,
        storageWear: getStorageWearForType(storage),
        username: username,
        assetAgeMonths: assetInfo.assetAgeMonths,
        lastService: assetInfo.lastService,
        warrantyExpiresAt: assetInfo.warrantyExpiresAt,
        warrantyDaysRemaining: assetInfo.warrantyDaysRemaining
    };

    if (replacementRemarks) newPc.replacementRemarks = replacementRemarks;

    pcData[branch] = pcData[branch] || [];
    pcData[branch].push(newPc);

    const profiles = getStoredStaffProfiles();
    const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
    const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;

    modificationHistory.push({
        id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
        action: "New PC Registration",
        branch: branch,
        pcName: pcName,
        user: actor,
        userKey: userKey,
        timestamp: new Date().toLocaleString(),
        priorState: null,
        details: {
            state: state,
            health: health,
            processor: pcProcessor,
            brand: brand,
            storage: storage,
            capacity: `${capacityNum}GB`,
            freeSpace: `${freeSpaceNum}GB`,
            storageHealth: storageHealthValue,
            temp: pcTemp,
            username: username
            , replacementRemarks: replacementRemarks || undefined
        }
    });

    localStorage.setItem("pcData", JSON.stringify(pcData));
    try { pushPcDataToCloud().catch(() => {}); } catch (e) {}
    persistModificationHistory();

    document.getElementById("pcFormContainer").classList.add("hidden");
    refreshAllViews();
    toastNotice('success', 'PC Added', `PC ${pcName} was added to ${branch} with ${health} status.`);
}

function openFloatingUpdateOverlay(branchName = null, pcIndex = null) {
    const overlay = document.getElementById("floatingUpdateModalOverlay");
    overlay.classList.remove("hidden");
    
    const mBranch = document.getElementById("modalBranchSelect");
    mBranch.innerHTML = `<option value="" disabled selected>-- Select Location --</option>`;
    branches.forEach(b => mBranch.innerHTML += `<option value="${b}">${b}</option>`);
    
    const defaultBranch = branchName || document.getElementById("adminBranchSelect")?.value || branches[0];
    if (defaultBranch) {
        mBranch.value = defaultBranch;
        populateModalPcSelect();
    }

    if (pcIndex !== null && pcIndex !== undefined) {
        const pcSelect = document.getElementById("modalPcSelect");
        if (pcSelect) {
            pcSelect.value = String(pcIndex);
            loadSelectedPcDetailsForEditing();
        }
    }
}

function closeFloatingUpdateOverlay() {
    document.getElementById("floatingUpdateModalOverlay").classList.add("hidden");
}

function commitFloatingPcUpdate() {
    const branch = document.getElementById("modalBranchSelect").value;
    const idx = document.getElementById("modalPcSelect").value;
    
    if (!branch || idx === "") {
        toastNotice('warning', 'Selection Required', "Please select a branch and PC before updating.");
        return;
    }

    const pcList = pcData[branch] || [];
    if (idx < 0 || idx >= pcList.length) {
        toastNotice('error', 'Update Failed', "Target PC not found.");
        return;
    }

    const pc = pcList[idx];
    const priorSnapshot = { ...pc };
    const timestamp = new Date().toLocaleString();

    // Gather updated values from modal fields
    const updatedState = document.getElementById("modalPcState").value || pc.state;
    const updatedHealth = document.getElementById("modalHealth").value || pc.health;
    const updatedProcessor = document.getElementById("modalProcessor").value || pc.pcProcessor;
    const updatedBrand = document.getElementById("modalBrand").value || pc.brand;
    const updatedStorage = document.getElementById("modalStorage").value || pc.storage;
    const updatedCapacityRaw = document.getElementById("modalCapacity").value;
    const updatedFreeSpaceRaw = document.getElementById("modalFreeSpace").value;
    const updatedCapacity = normalizeGbString(updatedCapacityRaw || pc.capacity, 256);
    const updatedFreeSpace = normalizeGbString(updatedFreeSpaceRaw || pc.freeSpace, 100);
    const updatedStorageHealthRaw = document.getElementById("modalStorageHealth").value;
    const updatedStorageHealth = Number(updatedStorageHealthRaw);
    const updatedTemp = Number(document.getElementById("modalPcTemp").value) || pc.pcTemp;

    const hasUpdatedStorageHealth = updatedStorageHealthRaw.trim() !== '' && !Number.isNaN(updatedStorageHealth);
    const spaceNum = parseGbValue(updatedFreeSpace) || 0;
    let evaluatedHealth = 'Healthy';
    if (spaceNum <= 15 || updatedTemp >= 85 || (hasUpdatedStorageHealth && updatedStorageHealth <= 29)) {
        evaluatedHealth = 'Critical';
    } else if (spaceNum <= 50 || updatedTemp >= 70 || (hasUpdatedStorageHealth && updatedStorageHealth <= 49)) {
        evaluatedHealth = 'Warning';
    }

    // Check if admin manually selected health
    const severityRank = { 'Healthy': 0, 'Warning': 1, 'Critical': 2 };
    let finalHealth = evaluatedHealth;
    if (updatedHealth && severityRank[updatedHealth] >= severityRank[evaluatedHealth]) {
        finalHealth = updatedHealth;
    }

    // Create modification history entry with current admin info
    const profiles = getStoredStaffProfiles();
    const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
    const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;

    modificationHistory.push({
        id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
        action: 'Admin PC Update',
        branch: branch,
        pcName: pc.pcName,
        user: actor,
        userKey: userKey,
        timestamp: timestamp,
        priorState: priorSnapshot,
        details: {
            state: updatedState,
            health: finalHealth,
            processor: updatedProcessor,
            brand: updatedBrand,
            storage: updatedStorage,
            capacity: updatedCapacity,
            freeSpace: updatedFreeSpace,
            storageHealth: updatedStorageHealth,
            temp: updatedTemp,
            username: pc.username
            // replacementRemarks will be appended below if provided
        }
    });

    // Update PC record
    pc.state = updatedState;
    pc.health = finalHealth;
    pc.pcProcessor = updatedProcessor;
    pc.brand = updatedBrand;
    pc.storage = updatedStorage;
    pc.capacity = updatedCapacity;
    pc.freeSpace = updatedFreeSpace;
    if (updatedStorageHealthRaw.trim() !== '') {
        pc.storageHealth = updatedStorageHealth;
    } else {
        delete pc.storageHealth;
    }
    pc.pcTemp = updatedTemp;
    pc.processorTemp = updatedTemp + 5;
    // Save replacement remarks if supplied
    const updatedReplacementRemarks = (document.getElementById("modalReplacementRemarks")?.value || '').trim();
    if (updatedReplacementRemarks) {
        // append to modificationHistory last pushed entry details
        try {
            const last = modificationHistory[modificationHistory.length - 1];
            if (last && last.details) last.details.replacementRemarks = updatedReplacementRemarks;
        } catch (e) {}
        pc.replacementRemarks = updatedReplacementRemarks;
    } else {
        // clear existing if blank
        if (pc.replacementRemarks) delete pc.replacementRemarks;
    }

    // Persist changes
    localStorage.setItem("pcData", JSON.stringify(pcData));
    try { pushPcDataToCloud().catch(() => {}); } catch (e) {}
    persistModificationHistory();

    closeFloatingUpdateOverlay();
    refreshAllViews();
    toastNotice('success', 'PC Updated', `PC ${pc.pcName} in ${branch} was successfully updated.`);
}

function openDeletePcOverlay(branchName = null, pcIndex = null) {
    const overlay = document.getElementById("deletePcModalOverlay");
    overlay.classList.remove("hidden");

    const branchSelect = document.getElementById("deleteBranchSelect");
    branchSelect.innerHTML = "";
    branches.forEach(b => branchSelect.innerHTML += `<option value="${b}">${b}</option>`);

    const defaultBranch = branchName || document.getElementById("adminBranchSelect")?.value || branches[0];
    branchSelect.value = defaultBranch;
    populateDeletePcList();

    if (pcIndex !== null && pcIndex !== undefined) {
        const checkbox = document.querySelector(`#deletePcListContainer input[name="deletePcCheckbox"][value="${pcIndex}"]`);
        if (checkbox) checkbox.checked = true;
    }
}

function closeDeletePcOverlay() {
    document.getElementById("deletePcModalOverlay").classList.add("hidden");
}

function populateDeletePcList() {
    const branch = document.getElementById("deleteBranchSelect").value;
    const container = document.getElementById("deletePcListContainer");
    if (!container) return;

    const list = pcData[branch] || [];
    if (list.length === 0) {
        container.innerHTML = `<div style="color:#475569; font-size:13px;">No PCs are currently registered in this branch.</div>`;
        return;
    }

    container.innerHTML = list.map((pc, index) => {
        return `
            <label style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-radius:12px; background:#ffffff; border:1px solid #e2e8f0; margin-bottom:10px; cursor:pointer;">
                <span style="display:flex; flex-direction:column; gap:4px;">
                    <strong style="color:#0f172a;">${pc.pcName}</strong>
                    <small style="color:#64748b;">${pc.username || 'Unknown user'} • ${pc.health} • ${pc.storage} • ${pc.freeSpace}</small>
                </span>
                <input type="checkbox" name="deletePcCheckbox" value="${index}" style="width:18px; height:18px; accent-color:#dc2626;" />
            </label>`;
    }).join('');
}

function toggleSelectAllDeletePcs() {
    const checkboxes = document.querySelectorAll('#deletePcListContainer input[name="deletePcCheckbox"]');
    if (!checkboxes.length) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

function executeDeleteSelectedPcs() {
    const branch = document.getElementById("deleteBranchSelect").value;
    const selectedCheckboxes = Array.from(document.querySelectorAll('#deletePcListContainer input[name="deletePcCheckbox"]:checked'));
    if (selectedCheckboxes.length === 0) {
        toastNotice('warning', 'Delete Required', "Please select one or more PCs to delete.");
        return;
    }

    const list = pcData[branch] || [];
    const indexes = selectedCheckboxes.map(cb => Number(cb.value)).sort((a,b) => b - a);
    const deletedPcNames = [];
    const profiles = getStoredStaffProfiles();
    const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
    const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;

    indexes.forEach(index => {
        if (list[index]) {
            deletedPcNames.push(list[index].pcName);
            modificationHistory.push({
                id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
                action: "PC Deleted",
                branch: branch,
                pcName: list[index].pcName,
                user: actor,
                userKey: userKey,
                timestamp: new Date().toLocaleString(),
                priorState: { ...list[index] },
                details: { ...list[index] }
            });
            list.splice(index, 1);
        }
    });

    pcData[branch] = list;
    localStorage.setItem("pcData", JSON.stringify(pcData));
    persistModificationHistory();

    closeDeletePcOverlay();
    refreshAllViews();
    loadAdminBranchData();
    toastNotice('success', 'Inventory Updated', `Deleted ${deletedPcNames.length} PC(s): ${deletedPcNames.join(', ')}`);
}

function populateModalPcSelect() {
    const selectedBranch = document.getElementById("modalBranchSelect").value;
    const pcSelect = document.getElementById("modalPcSelect");
    pcSelect.innerHTML = `<option value="" disabled selected>-- Select Target PC --</option>`;

    const list = pcData[selectedBranch] || [];
    list.forEach((pc, index) => {
        pcSelect.innerHTML += `<option value="${index}">${pc.pcName}</option>`;
    });
}

function loadSelectedPcDetailsForEditing() {
    const branch = document.getElementById("modalBranchSelect").value;
    const idx = document.getElementById("modalPcSelect").value;
    if (idx === "" || !pcData[branch]) return;

    const pc = pcData[branch][idx];
    document.getElementById("modalPcState").value = pc.state || "Active";
    document.getElementById("modalHealth").value = pc.health || "Healthy";
    document.getElementById("modalProcessor").value = pc.pcProcessor || "";
    document.getElementById("modalPcTemp").value = pc.pcTemp || 35;
    
    document.getElementById("modalBrand").value = pc.brand || "";
    document.getElementById("modalStorage").value = pc.storage || "";
    document.getElementById("modalCapacity").value = parseInt(pc.capacity) || "";
    document.getElementById("modalFreeSpace").value = parseInt(pc.freeSpace) || "";
    document.getElementById("modalStorageHealth").value = pc.storageHealth ?? "";
    document.getElementById("modalReplacementRemarks").value = pc.replacementRemarks || "";
}

function normalizeGbString(rawValue, fallback) {
    const numeric = parseInt(String(rawValue || "").trim().replace(/[^0-9]/g, ""));
    const value = Number.isNaN(numeric) ? (fallback || 0) : numeric;
    return `${value}GB`;
}

function parseGbValue(rawValue, fallback) {
    const numeric = parseInt(String(rawValue || "").trim().replace(/[^0-9]/g, ""));
    return Number.isNaN(numeric) ? (fallback || 0) : numeric;
}

function normalizeStorageType(storage) {
    return String(storage || '').trim();
}

function isStorageSSD(storage) {
    const normalized = normalizeStorageType(storage).toLowerCase();
    return normalized.includes('ssd') || normalized.includes('nvme');
}

function isStorageHDD(storage) {
    const normalized = normalizeStorageType(storage).toLowerCase();
    return normalized.includes('hdd');
}

function getStorageWearForType(storage) {
    const type = normalizeStorageType(storage);
    if (isStorageSSD(type)) {
        return Math.max(5, Math.min(100, 10 + Math.floor(Math.random() * 80)));
    }
    if (isStorageHDD(type)) {
        return Math.max(15, Math.min(100, 20 + Math.floor(Math.random() * 70)));
    }
    return Math.max(20, Math.min(100, 25 + Math.floor(Math.random() * 60)));
}

function normalizeStorageWear(value, storage) {
    const numeric = parseInt(String(value || '').trim().replace(/[^0-9]/g, ''));
    if (!Number.isNaN(numeric)) {
        return Math.max(0, Math.min(100, numeric));
    }
    return isStorageSSD(storage) ? 65 : isStorageHDD(storage) ? 80 : 75;
}

function getStorageHealthLabel(storage, storageWear) {
    const value = Number(storageWear);
    if (Number.isNaN(value)) {
        return 'Storage health N/A';
    }
    if (isStorageSSD(storage)) return `SSD health ${value}%`;
    if (isStorageHDD(storage)) return `HDD health ${value}%`;
    return `Storage health ${value}%`;
}

function buildAssetWarrantyInfo() {
    const now = new Date();
    const ageMonths = Math.max(1, Math.floor(Math.random() * 42) + 6);
    const lastService = new Date(now);
    lastService.setMonth(now.getMonth() - Math.floor(Math.random() * 6) - 1);
    const warrantyExpiry = new Date(now);
    warrantyExpiry.setMonth(now.getMonth() + Math.floor(Math.random() * 24) + 6);
    return {
        assetAgeMonths: ageMonths,
        lastService: lastService.toLocaleDateString(),
        warrantyExpiresAt: warrantyExpiry.toLocaleDateString(),
        warrantyDaysRemaining: Math.max(0, Math.ceil((warrantyExpiry - now) / 86400000))
    };
}

function getWarrantyStatusByDate(warrantyExpiresAt) {
    if (!warrantyExpiresAt) return 'Unknown';
    const expiry = new Date(warrantyExpiresAt);
    if (Number.isNaN(expiry.getTime())) return 'Unknown';
    const days = Math.max(0, Math.ceil((expiry - new Date()) / 86400000));
    if (days <= 30) return 'Expiring Soon';
    if (days <= 120) return 'Under Warranty';
    return 'Warranty OK';
}

function formatCurrencyPh(value) {
    return `₱${Number(value).toLocaleString('en-PH')}`;
}

function computeAnalysisInsightData(year, branch, branchData) {
    const branchScope = branch ? [branch] : branches;
    const pcList = branchScope.flatMap(b => (pcData[b] || []).map(pc => ({ ...pc, branch: b })));
    const replacementCandidates = pcList.filter(pc => {
        const wear = Number(pc.storageWear) || 0;
        const freeSpace = parseGbValue(pc.freeSpace || '0GB');
        const temp = Number(pc.pcTemp || 0);
        return wear <= 30 || freeSpace <= 15 || temp >= 85 || pc.health === 'Critical';
    }).sort((a, b) => {
        const aScore = (a.health === 'Critical' ? 3 : a.health === 'Warning' ? 1 : 0) + (parseGbValue(a.freeSpace || '0GB') <= 15 ? 2 : 0) + (Number(a.storageWear) <= 30 ? 2 : 0);
        const bScore = (b.health === 'Critical' ? 3 : b.health === 'Warning' ? 1 : 0) + (parseGbValue(b.freeSpace || '0GB') <= 15 ? 2 : 0) + (Number(b.storageWear) <= 30 ? 2 : 0);
        return bScore - aScore;
    });

    const storageGroups = pcList.reduce((map, pc) => {
        const type = isStorageHDD(pc.storage) ? 'HDD' : isStorageSSD(pc.storage) ? 'SSD' : 'Other';
        map[type] = map[type] || { totalWear: 0, count: 0 };
        map[type].totalWear += Number(pc.storageWear) || 0;
        map[type].count += 1;
        return map;
    }, {});

    const tempData = pcList.map(pc => Number(pc.pcTemp || 0));
    const avgTemp = tempData.length ? Math.round(tempData.reduce((sum, value) => sum + value, 0) / tempData.length) : 0;
    const avgWear = pcList.length ? Math.round(pcList.reduce((sum, pc) => sum + (Number(pc.storageWear) || 0), 0) / pcList.length) : 0;
    const warrantyExpiringCount = pcList.filter(pc => Number(pc.warrantyDaysRemaining) <= 120).length;
    const totalPcs = pcList.length;

    const issueRanking = branchData.slice().sort((a, b) => b.issues - a.issues);
    const topBranch = issueRanking[0] || null;
    const riskValue = pcList.reduce((sum, pc) => {
        const freeSpace = parseGbValue(pc.freeSpace || '0GB');
        const wear = Number(pc.storageWear) || 0;
        const temp = Number(pc.pcTemp || 0);
        let score = 0;
        score += pc.health === 'Critical' ? 30 : pc.health === 'Warning' ? 15 : 5;
        score += pc.state === 'Down' ? 25 : 0;
        score += freeSpace <= 15 ? 20 : freeSpace <= 50 ? 10 : 0;
        score += temp >= 85 ? 20 : temp >= 70 ? 10 : 0;
        score += wear <= 30 ? 15 : wear <= 60 ? 8 : 0;
        return sum + score;
    }, 0);

    const predictiveScore = totalPcs ? Math.min(100, Math.round(riskValue / totalPcs)) : 0;
    const predictiveLabel = predictiveScore >= 70 ? 'Critical' : predictiveScore >= 45 ? 'Medium' : 'Low';
    const maintenanceCostEstimate = replacementCandidates.length * 19000 + Math.round(totalPcs * 320) + warrantyExpiringCount * 650;

    return {
        pcList,
        replacementCandidates,
        storageGroups,
        avgTemp,
        avgWear,
        warrantyExpiringCount,
        totalPcs,
        topBranch,
        predictiveScore,
        predictiveLabel,
        maintenanceCost: maintenanceCostEstimate,
        issueRanking
    };
}

function renderAnalysisInsights(year, branch, branchData) {
    const insightData = computeAnalysisInsightData(year, branch, branchData);
    document.getElementById('insightTotalDevices').innerText = insightData.totalPcs;
    document.getElementById('insightTopBranch').innerText = insightData.topBranch ? insightData.topBranch.branch : 'N/A';
    document.getElementById('insightReplacementCandidates').innerText = insightData.replacementCandidates.length;
    document.getElementById('insightAvgDiskHealth').innerText = `${insightData.avgWear}%`;
    document.getElementById('insightAvgTemp').innerText = `${insightData.avgTemp}°C`;
    document.getElementById('insightMaintenanceRisk').innerText = insightData.predictiveLabel;
    document.getElementById('insightWarrantyExpiring').innerText = insightData.warrantyExpiringCount;
    document.getElementById('insightCostEstimate').innerText = formatCurrencyPh(insightData.maintenanceCost);

    renderAnalysisDiskHealthChart(insightData.storageGroups);
    renderAnalysisTempChart(insightData.pcList);
    renderAnalysisMaintenanceRiskChart(insightData.pcList);
    renderAnalysisMaintenanceCostChart(insightData.issueRanking, insightData.pcList);
    renderAnalysisAssetTables(insightData.pcList);
    renderAnalysisReplacementTable(insightData.replacementCandidates);
}

function renderAnalysisDiskHealthChart(storageGroups) {
    const labels = Object.keys(storageGroups);
    const data = labels.map(type => Math.round(storageGroups[type].totalWear / Math.max(1, storageGroups[type].count)));
    updateChart('analysisDiskHealthChart', 'bar', {
        labels,
        datasets: [{ label: 'Average Storage Health', data, backgroundColor: labels.map(label => label === 'HDD' ? '#2563eb' : label === 'SSD' ? '#16a34a' : '#f97316') }]
    }, {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { suggestedMin: 0, suggestedMax: 100 } }
    });
}

function renderAnalysisTempChart(pcList) {
    const branchTemps = branches.map(branch => {
        const items = pcData[branch] || [];
        const count = items.length;
        const total = items.reduce((sum, pc) => sum + (Number(pc.pcTemp || 0)), 0);
        return count ? Math.round(total / count) : 0;
    });
    updateChart('analysisTempChart', 'line', {
        labels: branches,
        datasets: [{ label: 'Avg Chassis Temperature', data: branchTemps, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.18)', tension: 0.4, fill: true }]
    }, {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { suggestedMin: 20, suggestedMax: 100 } }
    });
}

function renderAnalysisMaintenanceRiskChart(pcList) {
    const riskCounts = { Low: 0, Medium: 0, Critical: 0 };
    pcList.forEach(pc => {
        const temp = Number(pc.pcTemp || 0);
        const freeSpace = parseGbValue(pc.freeSpace || '0GB');
        const wear = Number(pc.storageWear) || 0;
        let score = 0;
        score += pc.health === 'Critical' ? 30 : pc.health === 'Warning' ? 15 : 5;
        score += pc.state === 'Down' ? 25 : 0;
        score += freeSpace <= 15 ? 20 : freeSpace <= 50 ? 10 : 0;
        score += temp >= 85 ? 20 : temp >= 70 ? 10 : 0;
        score += wear <= 30 ? 15 : wear <= 60 ? 8 : 0;
        const label = score >= 70 ? 'Critical' : score >= 45 ? 'Medium' : 'Low';
        riskCounts[label] += 1;
    });
    updateChart('analysisMaintenanceRiskChart', 'doughnut', {
        labels: Object.keys(riskCounts),
        datasets: [{ data: Object.values(riskCounts), backgroundColor: ['#16a34a', '#f59e0b', '#ef4444'] }]
    }, { responsive: true, plugins: { legend: { position: 'bottom' } } });
}

function renderAnalysisMaintenanceCostChart(issueRanking, pcList) {
    const labels = issueRanking.slice(0, 8).map(item => item.branch);
    const data = labels.map(branch => {
        const branchPcs = pcData[branch] || [];
        const replacements = branchPcs.filter(pc => {
            const wear = Number(pc.storageWear) || 0;
            const freeSpace = parseGbValue(pc.freeSpace || '0GB');
            const temp = Number(pc.pcTemp || 0);
            return wear <= 30 || freeSpace <= 15 || temp >= 85 || pc.health === 'Critical';
        }).length;
        return replacements * 18000 + Math.round(branchPcs.length * 280);
    });
    updateChart('analysisMaintenanceCostChart', 'bar', {
        labels,
        datasets: [{ label: 'Estimated Maintenance Cost', data, backgroundColor: '#2563eb' }]
    }, {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { suggestedMin: 0, suggestedMax: Math.max(...data, 20000) + 10000 } }
    });
}

function renderAnalysisAssetTables(pcList) {
    const ageRows = pcList.slice(0, 12).map(pc => {
        return `
            <tr>
                <td>${pc.pcName}</td>
                <td>${pc.assetAgeMonths || 'N/A'} mo</td>
                <td>${pc.warrantyExpiresAt || 'N/A'}</td>
            </tr>`;
    }).join('');
    document.getElementById('analysisAssetAgeBody').innerHTML = ageRows || `<tr><td colspan="3" style="text-align:center; color:#64748b;">No asset age data available.</td></tr>`;
}

function renderAnalysisReplacementTable(replacementCandidates) {
    const rows = replacementCandidates.slice(0, 10).map(pc => {
        const temp = `${pc.pcTemp || 0}°C`;
        const storageHealth = getStorageHealthLabel(pc.storage, pc.storageWear || 0);
        const action = pc.health === 'Critical' || parseGbValue(pc.freeSpace || '0GB') <= 15 || Number(pc.storageWear) <= 30 ? 'Replace immediately' : 'Review during next cycle';
        return `
            <tr>
                <td>${pc.pcName}</td>
                <td>${pc.health}</td>
                <td>${storageHealth}</td>
                <td>${temp}</td>
                <td>${action}</td>
            </tr>`;
    }).join('');
    document.getElementById('analysisReplacementBody').innerHTML = rows || `<tr><td colspan="5" style="text-align:center; color:#64748b;">No replacement candidates found.</td></tr>`;
}

function showMetricSummary(metricKey) {
    const overlay = document.getElementById('metricSummaryOverlay');
    const title = document.getElementById('metricSummaryTitle');
    const subtitle = document.getElementById('metricSummarySubtitle');
    const content = document.getElementById('metricSummaryContent');
    if (!overlay || !title || !subtitle || !content) return;

    if (activeMetricSummaryKey === metricKey && !overlay.classList.contains('hidden')) {
        closeMetricSummary();
        return;
    }

    activeMetricSummaryKey = metricKey;
    overlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    const { year, branch: selectedBranch } = getAnalysisFilters();
    const branchData = getAnalysisDataForYear(year).filter(item => !selectedBranch || item.branch === selectedBranch);
    const insightData = computeAnalysisInsightData(year, selectedBranch, branchData);
    const allPcs = branches.flatMap(branch => (pcData[branch] || []).map(pc => ({ ...pc, branch })));
    const pcList = insightData.pcList;
    let heading = 'Summary';
    let subtext = '';
    let detailHtml = '';

    const categoryTotals = branchData.reduce((map, item) => {
        (item.categories || []).forEach(cat => {
            map[cat.label] = (map[cat.label] || 0) + (cat.value || 0);
        });
        return map;
    }, {});

    const worstCategory = Object.keys(categoryTotals).length > 0
        ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    switch (metricKey) {
        case 'branches': {
            const totalBranches = branches.length;
            heading = 'Monitored Properties';
            subtext = 'Group branches under active monitoring.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${totalBranches}</strong><span>Branches</span></div>
                    <div class="summary-kpi"><strong>${branchData.length}</strong><span>Analyzed</span></div>
                    <div class="summary-kpi"><strong>${allPcs.length}</strong><span>Total PCs</span></div>
                    <div class="summary-kpi"><strong>${Object.keys(pcData).length}</strong><span>Data sources</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Branch</th><th>Terminals</th></tr></thead>
                        <tbody>${branches.map(b => `<tr><td>${b}</td><td>${(pcData[b]||[]).length}</td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
            break;
        }
        case 'pcs': {
            const totalPcs = branches.reduce((sum, b) => sum + ((pcData[b]||[]).length), 0);
            heading = 'Aggregated Global Terminals';
            subtext = 'Total monitored PCs across all branches.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${totalPcs}</strong><span>Total terminals</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(p=>p.health==='Healthy').length}</strong><span>Healthy</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(p=>p.health==='Warning').length}</strong><span>Warning</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(p=>p.health==='Critical').length}</strong><span>Critical</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table"><thead><tr><th>Branch</th><th>Terminals</th></tr></thead><tbody>
                        ${branches.map(b=>`<tr><td>${b}</td><td>${(pcData[b]||[]).length}</td></tr>`).join('')}
                    </tbody></table>
                </div>`;
            break;
        }
        case 'healthy': {
            const healthyCount = allPcs.filter(p=>p.health==='Healthy').length;
            heading = 'Stable Fleet Operations';
            subtext = 'Devices currently reporting healthy telemetry.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${healthyCount}</strong><span>Healthy devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.length}</strong><span>Total devices</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table"><thead><tr><th>Device</th><th>Branch</th><th>Health</th></tr></thead><tbody>
                        ${allPcs.filter(p=>p.health==='Healthy').slice(0,12).map(p=>`<tr><td>${p.pcName}</td><td>${p.branch}</td><td>${p.health}</td></tr>`).join('')}
                    </tbody></table>
                </div>`;
            break;
        }
        case 'maintenance': {
            const warnCount = allPcs.filter(p=>p.health==='Warning').length;
            heading = 'Needs Maintenance';
            subtext = 'Devices flagged for maintenance or warnings.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${warnCount}</strong><span>Warning devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(p=>p.health==='Critical').length}</strong><span>Critical devices</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table"><thead><tr><th>Device</th><th>Branch</th><th>Health</th></tr></thead><tbody>
                        ${allPcs.filter(p=>p.health==='Warning' || p.health==='Critical').slice(0,12).map(p=>`<tr><td>${p.pcName}</td><td>${p.branch}</td><td>${p.health}</td></tr>`).join('')}
                    </tbody></table>
                </div>`;
            break;
        }
        case 'issues': {
            const critCount = allPcs.filter(p=>p.health==='Critical').length;
            heading = 'Total Flagged Incidents';
            subtext = 'Devices currently reporting critical issues.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${critCount}</strong><span>Critical devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.length}</strong><span>Total devices</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table"><thead><tr><th>Device</th><th>Branch</th><th>Health</th></tr></thead><tbody>
                        ${allPcs.filter(p=>p.health==='Critical').slice(0,12).map(p=>`<tr><td>${p.pcName}</td><td>${p.branch}</td><td>${p.health}</td></tr>`).join('')}
                    </tbody></table>
                </div>`;
            break;
        }
        case 'analysisTopBranch':
            heading = 'Branch With Most Problems';
            subtext = `Highest issue volume for ${selectedBranch || 'all branches'}.`;
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[0].branch : 'N/A'}</strong><span>Top problem branch</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[0].issues : 0}</strong><span>Reported issues</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[0].breakdowns : 0}</strong><span>Breakdowns</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[0].performance : 0}%</strong><span>Performance score</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Rank</th><th>Branch</th><th>Issues</th><th>Breakdowns</th><th>Performance</th></tr></thead>
                        <tbody>${insightData.issueRanking.slice(0, 8).map((item, index) => `
                            <tr><td>${index + 1}</td><td>${item.branch}</td><td>${item.issues}</td><td>${item.breakdowns}</td><td>${item.performance}%</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'analysisProblemCount': {
            const historyEntries = getHistoricalIssueEntries(year, selectedBranch);
            analysisProblemHistoryEntries = historyEntries;
            const totalIssues = historyEntries.length;
            const totalBreakdowns = historyEntries.filter(entry => entry.status === 'Fixed' || entry.healthAtReport === 'Critical' || entry.stateAtReport === 'Down').length;
            const openIssues = historyEntries.filter(entry => entry.status !== 'Fixed').length;

            const branchFilterOptions = [`
                <option value="">All Branches</option>
                ${branches.map(branch => `<option value="${branch}">${branch}</option>`).join('')}
            `].join('');

            heading = 'Total Reported Issues';
            subtext = `Historical issue log for ${selectedBranch || 'all branches'}.`;
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${totalIssues}</strong><span>Reported issues</span></div>
                    <div class="summary-kpi"><strong>${openIssues}</strong><span>Open issues</span></div>
                    <div class="summary-kpi"><strong>${totalBreakdowns}</strong><span>Breakdowns / fixes</span></div>
                    <div class="summary-kpi"><strong>${historyEntries.length ? historyEntries[0].reportedAt : 'N/A'}</strong><span>Latest report</span></div>
                </div>
                <div class="analysis-detail-toolbar" style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin:16px 0; flex-wrap:wrap;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <label for="analysisProblemHistoryBranchFilter" style="font-weight:700; color:#334155;">Filter branch:</label>
                        <select id="analysisProblemHistoryBranchFilter" onchange="filterAnalysisProblemHistory()" style="padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; min-width:240px;">
                            ${branchFilterOptions}
                        </select>
                    </div>
                    <div style="font-size:13px; color:#475569;">Showing <span id="analysisProblemHistoryCount">${historyEntries.length}</span> report(s)</div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead>
                            <tr>
                                <th>Date / Time</th>
                                <th>Branch</th>
                                <th>PC</th>
                                <th>User</th>
                                <th>Reported By</th>
                                <th>Fixed By</th>
                                <th>Problem</th>
                                <th>Status</th>
                                <th>Fixed At</th>
                            </tr>
                        </thead>
                        <tbody id="analysisProblemHistoryTableBody">
                            ${historyEntries.map(entry => `
                                <tr>
                                    <td>${entry.reportedAt || 'Unknown'}</td>
                                    <td>${entry.branch}</td>
                                    <td>${entry.pcName}</td>
                                    <td>${entry.username || 'Unknown'}</td>
                                    <td>${entry.reportedBy || 'Unknown'}</td>
                                    <td>${entry.fixedBy || '—'}</td>
                                    <td>${entry.reason || 'Unknown'}</td>
                                    <td>${entry.status || 'Not Fixed'}</td>
                                    <td>${entry.fixedAt || '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
            break;
        }
        case 'analysisPerformanceScore':
            heading = 'Average Branch Performance';
            subtext = `Performance summary for ${selectedBranch || 'all branches'}.`;
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${Math.round(insightData.issueRanking.reduce((sum, item) => sum + item.performance, 0) / Math.max(1, insightData.issueRanking.length))}%</strong><span>Average performance</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length}</strong><span>Branches scored</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[0].performance : 0}%</strong><span>Best branch</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[insightData.issueRanking.length - 1].performance : 0}%</strong><span>Lowest branch</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Branch</th><th>Performance</th><th>Issues</th></tr></thead>
                        <tbody>${insightData.issueRanking.map(item => `
                            <tr><td>${item.branch}</td><td>${item.performance}%</td><td>${item.issues}</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'analysisBreakdowns':
            heading = 'Branch Breakdowns';
            subtext = `Branch breakdown frequency for ${selectedBranch || 'all branches'}.`;
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${insightData.issueRanking.reduce((sum, item) => sum + item.breakdowns, 0)}</strong><span>Total breakdowns</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length}</strong><span>Branches reported</span></div>
                    <div class="summary-kpi"><strong>${insightData.issueRanking.length ? insightData.issueRanking[0].breakdowns : 0}</strong><span>Highest branch</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Branch</th><th>Breakdowns</th><th>Issues</th><th>Performance</th></tr></thead>
                        <tbody>${insightData.issueRanking.map(item => `
                            <tr><td>${item.branch}</td><td>${item.breakdowns}</td><td>${item.issues}</td><td>${item.performance}%</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'analysisWorstCategory':
            heading = 'Most Common Problem';
            subtext = `Problem category breakdown for ${selectedBranch || 'all branches'}.`;
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${worstCategory}</strong><span>Most common problem</span></div>
                    <div class="summary-kpi"><strong>${categoryTotals[worstCategory] || 0}</strong><span>Problem occurrences</span></div>
                    <div class="summary-kpi"><strong>${Object.keys(categoryTotals).length}</strong><span>Problem categories</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Problem Category</th><th>Occurrence</th></tr></thead>
                        <tbody>${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([label, value]) => `
                            <tr><td>${label}</td><td>${value}</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'deviceHealthSummary':
            heading = 'Device Health Summary';
            subtext = 'Fleet totals by health state and active issue profile.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${insightData.totalPcs}</strong><span>Total devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(pc => pc.health === 'Healthy').length}</strong><span>Healthy devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(pc => pc.health === 'Warning').length}</strong><span>Warning devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(pc => pc.health === 'Critical').length}</strong><span>Critical devices</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Branch</th><th>Device</th><th>Status</th><th>Health</th><th>Free Space</th><th>Temp</th></tr></thead>
                        <tbody>${allPcs.slice(0, 12).map(pc => `
                            <tr><td>${pc.branch}</td><td>${pc.pcName}</td><td>${pc.state}</td><td>${pc.health}</td><td>${pc.freeSpace}</td><td>${pc.pcTemp || 0}°C</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'branchProblemRanking':
            heading = 'Branch Problem Ranking';
            subtext = 'Branches ordered by reported issue volume and breakdown risk.';
            detailHtml = `
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Rank</th><th>Branch</th><th>Issues</th><th>Breakdowns</th><th>Performance</th></tr></thead>
                        <tbody>${insightData.issueRanking.slice(0, 8).map((item, index) => `
                            <tr><td>${index + 1}</td><td>${item.branch}</td><td>${item.issues}</td><td>${item.breakdowns}</td><td>${item.performance}%</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'hardwareReplacementAnalysis':
            heading = 'Hardware Replacement Analysis';
            subtext = 'Risk-ranked hardware that should be replaced or reviewed first.';
            detailHtml = `
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Device</th><th>Branch</th><th>Health</th><th>Storage Health</th><th>Recommended Action</th></tr></thead>
                        <tbody>${insightData.replacementCandidates.slice(0, 12).map(pc => `
                            <tr><td>${pc.pcName}</td><td>${pc.branch}</td><td>${pc.health}</td><td>${getStorageHealthLabel(pc.storage, pc.storageWear || 0)}</td><td>${pc.health === 'Critical' || Number(pc.storageWear) <= 30 ? 'Replace immediately' : 'Inspect soon'}</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'diskHealthMonitoring':
            heading = 'Disk Health Monitoring';
            subtext = 'Storage health distributions across SSD and HDD assets.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    ${Object.keys(insightData.storageGroups).map(type => `
                        <div class="summary-kpi"><strong>${type}</strong><span>Avg health ${Math.round(insightData.storageGroups[type].totalWear / Math.max(1, insightData.storageGroups[type].count))}%</span></div>
                    `).join('')}
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Storage Type</th><th>Average Health</th><th>Device Count</th></tr></thead>
                        <tbody>${Object.keys(insightData.storageGroups).map(type => `
                            <tr><td>${type}</td><td>${Math.round(insightData.storageGroups[type].totalWear / Math.max(1, insightData.storageGroups[type].count))}%</td><td>${insightData.storageGroups[type].count}</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'temperatureAnalysis':
            heading = 'Temperature Analysis';
            subtext = 'Current thermal load across monitored workstations.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${insightData.avgTemp}°C</strong><span>Average chassis temperature</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(pc => Number(pc.pcTemp || 0) >= 85).length}</strong><span>Critical overheat devices</span></div>
                    <div class="summary-kpi"><strong>${allPcs.filter(pc => Number(pc.pcTemp || 0) >= 70).length}</strong><span>High temp warnings</span></div>
                </div>`;
            break;
        case 'predictiveMaintenance':
            heading = 'Predictive Maintenance Dashboard';
            subtext = 'Calculated maintenance risk based on temperature, wear, and active issues.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${insightData.predictiveLabel}</strong><span>Current risk tier</span></div>
                    <div class="summary-kpi"><strong>${insightData.predictiveScore}%</strong><span>Average risk score</span></div>
                    <div class="summary-kpi"><strong>${insightData.replacementCandidates.length}</strong><span>High priority candidates</span></div>
                </div>`;
            break;
        case 'assetAgeWarranty':
            heading = 'Asset Age & Warranty Tracking';
            subtext = 'Warranty expirations and asset age positions for monitored hardware.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${insightData.warrantyExpiringCount}</strong><span>Assets expiring within 120 days</span></div>
                    <div class="summary-kpi"><strong>${pcList.length}</strong><span>Total monitored devices</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Device</th><th>Branch</th><th>Age</th><th>Warranty Expires</th><th>Status</th></tr></thead>
                        <tbody>${insightData.pcList.slice(0, 10).map(pc => `
                            <tr><td>${pc.pcName}</td><td>${pc.branch}</td><td>${pc.assetAgeMonths || 'N/A'} mo</td><td>${pc.warrantyExpiresAt || 'N/A'}</td><td>${getWarrantyStatusByDate(pc.warrantyExpiresAt)}</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
        case 'maintenanceCostReport':
            heading = 'Maintenance Cost Report';
            subtext = 'Forecasted budget estimates for the current maintenance cycle.';
            detailHtml = `
                <div class="analysis-detail-grid">
                    <div class="summary-kpi"><strong>${formatCurrencyPh(insightData.maintenanceCost)}</strong><span>Estimated cycle spend</span></div>
                    <div class="summary-kpi"><strong>${insightData.replacementCandidates.length}</strong><span>Replacement forecast</span></div>
                    <div class="summary-kpi"><strong>${insightData.warrantyExpiringCount}</strong><span>Warranty review cases</span></div>
                </div>
                <div class="analysis-detail-table-wrapper">
                    <table class="analysis-detail-table">
                        <thead><tr><th>Branch</th><th>Estimated Cost</th><th>Issue Count</th><th>Breakdowns</th></tr></thead>
                        <tbody>${insightData.issueRanking.slice(0, 8).map(item => `
                            <tr><td>${item.branch}</td><td>${formatCurrencyPh((pcData[item.branch] || []).filter(pc => pc.health !== 'Healthy').length * 18000 + Math.round((pcData[item.branch] || []).length * 280))}</td><td>${item.issues}</td><td>${item.breakdowns}</td></tr>
                        `).join('')}</tbody>
                    </table>
                </div>`;
            break;
    }

    title.innerText = heading;
    subtitle.innerText = subtext;
    content.innerHTML = detailHtml;
}

function getAnalysisFilters() {
    const year = Number(document.getElementById('analysisYearSelect')?.value) || analysisYears[analysisYears.length - 1];
    const month = Number(document.getElementById('analysisMonthSelect')?.value);
    const branch = document.getElementById('analysisBranchSelect')?.value || '';
    return { year, month, branch };
}

function deleteSelectedPc() {
    const branch = document.getElementById("modalBranchSelect").value;
    const idx = document.getElementById("modalPcSelect").value;
    if (!branch || idx === "") {
        toastNotice('warning', 'Delete Required', "Please select a branch and PC before deleting.");
        return;
    }

    const pcList = pcData[branch] || [];
    const pc = pcList[idx];
    if (!pc) {
        toastNotice('error', 'Delete Failed', "Target PC not found.");
        return;
    }

    const confirmDelete = confirm(`Delete PC ${pc.pcName} from ${branch}? This will not remove its audit history.`);
    if (!confirmDelete) return;

    pcList.splice(idx, 1);
    pcData[branch] = pcList;

    const profiles = getStoredStaffProfiles();
    const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
    const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;

    modificationHistory.push({
        id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
        action: "PC Deleted",
        branch: branch,
        pcName: pc.pcName,
        user: actor,
        userKey: userKey,
        timestamp: new Date().toLocaleString(),
        priorState: pc,
        details: {
            state: pc.state,
            health: pc.health,
            processor: pc.pcProcessor,
            brand: pc.brand,
            storage: pc.storage,
            capacity: pc.capacity,
            freeSpace: pc.freeSpace,
            temp: pc.pcTemp,
            username: pc.username
        }
    });

    localStorage.setItem("pcData", JSON.stringify(pcData));
    persistModificationHistory();

    closeFloatingUpdateOverlay();
    refreshAllViews();
    loadAdminBranchData();
    toastNotice('info', 'PC Deleted', `PC ${pc.pcName} was removed from ${branch}. Audit history preserved.`);
}

/* ==========================================================================
   6. AUDIT HISTORY & COMPARATIVE DELTA DETECTOR
   ========================================================================== */
function loadAdminBranchData() {
    const selectedBranch = document.getElementById("adminBranchSelect").value;
    const branchLogs = modificationHistory.filter(log => log.branch === selectedBranch);
    const canDeleteHistory = canDeleteAuditHistory();

    const tbody = document.getElementById("historyLogBody");
    if (tbody) {
        tbody.innerHTML = "";
        if (branchLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; font-style:italic; padding:15px;">No structural entries found for this branch.</td></tr>`;
        } else {
            branchLogs.slice().reverse().forEach(log => {
                const deleteButton = canDeleteHistory
                    ? `<button class="delete-btn" style="padding:4px 8px; font-size:11px;" onclick="purgeSingleLog('${log.id}')">Delete</button>`
                    : `<button class="delete-btn" style="padding:4px 8px; font-size:11px; opacity:0.55; cursor:not-allowed;" disabled title="Only Ali can delete audit history">Delete</button>`;

                tbody.innerHTML += `
                    <tr>
                        <td style="font-family:monospace; font-weight:700;">${log.id}</td>
                        <td><span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:12px;">${log.action}</span></td>
                        <td style="font-size:13px; color:#334155;">Updated terminal [${log.pcName}] at (${log.branch})</td>
                        <td style="text-align:center;">${deleteButton}</td>
                    </tr>`;
            });
        }
    }

    const containerLedger = document.getElementById("adminHistoryLedgerContainer");
    if (containerLedger) {
        containerLedger.innerHTML = "";
        
        if (branchLogs.length === 0) {
            containerLedger.innerHTML = `<div style="text-align:center; color:#94a3b8; font-style:italic; padding:20px; background:#fff; border-radius:8px; border:1px solid #cbd5e1;">No historical update entries registered for this branch.</div>`;
            return;
        }

        branchLogs.slice().reverse().forEach((log, index) => {
            const prior = log.priorState || {};
            const current = log.details || {};
            const deleteButton = canDeleteHistory
                ? `<button class="delete-btn" style="padding:5px 12px; font-size:12px; border-radius:4px; background:#ef4444; color:white; border:none; cursor:pointer; font-weight:600;" onclick="purgeSingleLog('${log.id}')"><i class="fas fa-trash-alt"></i> Delete</button>`
                : `<button class="delete-btn" style="padding:5px 12px; font-size:12px; border-radius:4px; background:#ef4444; color:white; border:none; opacity:0.55; cursor:not-allowed; font-weight:600;" disabled title="Only Ali can delete audit history"><i class="fas fa-trash-alt"></i> Delete</button>`;

            const fieldChanged = (field) => current[field] !== undefined && current[field] !== prior[field];
            const getDeltaTag = (isChanged) => isChanged ? ` <span style="color:#ef4444; font-size:10px; font-weight:700; background:#fee2e2; padding:1px 4px; border-radius:3px; margin-left:4px;">(Modified)</span>` : '';

            const displayValue = (field, fallback) => current[field] !== undefined ? current[field] : (prior[field] !== undefined ? prior[field] : fallback);
            const currentHealth = displayValue('health', 'Healthy');
            const currentState = displayValue('state', 'Active');
            const currentBrand = displayValue('brand', 'Generic');
            const currentTemp = displayValue('temp', 0);
            const currentStorage = displayValue('storage', 'SSD');
            const currentProcessor = displayValue('processor', 'N/A');
            const currentCapacity = displayValue('capacity', 'N/A');
            const currentFreeSpace = displayValue('freeSpace', 'N/A');

            containerLedger.innerHTML += `
                <div style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; margin-bottom:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <div style="padding:14px; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                        <div onclick="toggleLedgerDropdown('dropdown-${index}')" style="display:flex; align-items:center; gap:12px; cursor:pointer; flex-grow:1;">
                            <i class="fas fa-chevron-down" id="icon-dropdown-${index}" style="color:#64748b; font-size:12px; transition: transform 0.2s;"></i>
                            <span style="font-size:13px; color:#94a3b8; font-family:monospace;">[${log.id}]</span>
                            <strong style="color:#1e293b; font-size:14px;">${log.branch} &mdash; ${log.pcName}</strong>
                            <span style="font-size:12px; background:#dbeafe; color:#1e40af; padding:3px 8px; border-radius:3px; font-weight:600;"><i class="fas fa-user-circle" style="margin-right:4px;"></i>${log.user || log.userKey || 'Unknown'}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <span style="font-size:12px; color:#64748b;">${log.timestamp}</span>
                            <span style="font-size:11px; font-weight:700; background:#2563eb; color:white; padding:2px 6px; border-radius:4px;">${log.action}</span>
                            ${deleteButton}
                        </div>
                    </div>
                    
                    <div id="dropdown-${index}" style="display:none; padding:15px; background:#ffffff; border-top:1px dashed #cbd5e1; font-size:13px; color:#475569;">
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:15px; border-radius:4px; background:#f1f5f9; padding:12px; margin-bottom:10px;">
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Operational State</span> <strong style="color:#0f172a;">${currentState}</strong>${getDeltaTag(fieldChanged('state'))}</div>
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Health Status</span> <span style="font-weight:700; color:${currentHealth === 'Critical' ? '#dc2626' : currentHealth === 'Warning' ? '#ea580c' : '#16a34a'}">${currentHealth}</span>${getDeltaTag(fieldChanged('health'))}</div>
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Hardware Vendor</span> <strong style="color:#0f172a;">${currentBrand}</strong>${getDeltaTag(fieldChanged('brand'))}</div>
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Chassis Core Temp</span> <strong style="color:#0f172a;">${currentTemp}°C</strong>${getDeltaTag(fieldChanged('temp'))}</div>
                        </div>
                        
                        <div style="display:grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap:15px; border-radius:4px; background:#f8fafc; padding:12px; border:1px solid #e2e8f0;">
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Storage Type</span> <strong style="color:#334155;">${currentStorage}</strong>${getDeltaTag(fieldChanged('storage'))}</div>
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Processor Model</span> <strong style="color:#334155;">${currentProcessor}</strong>${getDeltaTag(fieldChanged('processor'))}</div>
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Total Capacity</span> <strong style="color:#334155;">${currentCapacity}</strong>${getDeltaTag(fieldChanged('capacity'))}</div>
                            <div><span style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Remaining Free Space</span> <span style="font-weight:700; color:#0369a1;">${currentFreeSpace}</span>${getDeltaTag(fieldChanged('freeSpace'))}</div>
                        </div>
                        ${current.replacementRemarks ? `
                        <div style="margin-top:10px; padding:12px; background:#f8fafc; border:1px solid #e6eef8; border-radius:6px;">
                            <div style="font-size:12px; color:#64748b; font-weight:700; margin-bottom:6px;">Replacement Remarks</div>
                            <div style="font-size:13px; color:#334155;">${escapeHtml(String(current.replacementRemarks || ''))}</div>
                        </div>` : ''}
                    </div>
                </div>`;
        });
    }
}

function toggleLedgerDropdown(elementId) {
    const pane = document.getElementById(elementId);
    const arrowIcon = document.getElementById(`icon-${elementId}`);
    
    if (pane.style.display === "none" || pane.style.display === "") {
        pane.style.display = "block";
        if (arrowIcon) arrowIcon.style.transform = "rotate(180deg)";
    } else {
        pane.style.display = "none";
        if (arrowIcon) arrowIcon.style.transform = "rotate(0deg)";
    }
}

function purgeSingleLog(id) {
    if (!canDeleteAuditHistory()) {
        toastNotice('error', 'Permission Denied', 'Only Ali may delete audit history entries.');
        return;
    }

    modificationHistory = modificationHistory.filter(l => l.id !== id);
    persistModificationHistory();
    loadAdminBranchData();
}

function clearAllAuditLogs() {
    if (!canDeleteAuditHistory()) {
        toastNotice('error', 'Permission Denied', 'Only Ali may clear audit history.');
        return;
    }

    if (confirm("Purge global infrastructure system logging ledgers for all departments?")) {
        modificationHistory = [];
        persistModificationHistory();
        loadAdminBranchData();
    }
}

function toggleHistoryPane() {
    document.getElementById("historyContainer").classList.toggle("hidden");
}

/* ==========================================================================
   7. INCIDENT REPORT & HOME BROADCAST OPERATIONS
   ========================================================================== */
function syncBroadcastPCSelection() {
    const branch = document.getElementById("remarkBranch").value;
    const container = document.getElementById("broadcastPcCheckboxContainer");
    if (!container) return;
    container.innerHTML = "";

    const list = pcData[branch] || [];
    list.forEach(pc => {
        container.innerHTML += `
            <label style="display:inline-flex; align-items:center; gap:6px; margin-right:12px; font-size:13px; background:#fff; padding:4px 8px; border-radius:4px; border:1px solid #e2e8f0; margin-bottom:6px; cursor:pointer;">
                <input type="checkbox" name="broadcastTerminalTags" value="${pc.pcName}"> ${pc.pcName}
            </label>`;
    });
}

function saveRemark() {
    const branch = document.getElementById("remarkBranch").value;
    const category = document.getElementById("remarkCategory").value;
    const message = document.getElementById("remarkText").value.trim();

    if (!message) {
        alert("Please write a dispatch notice description baseline before publishing.");
        return;
    }

    const checkedBoxes = document.querySelectorAll('input[name="broadcastTerminalTags"]:checked');
    let scopeSelection = [];
    checkedBoxes.forEach(cb => scopeSelection.push(cb.value));

    const scopeTitle = scopeSelection.length > 0 ? `(${scopeSelection.join(', ')})` : `[General Announcement]`;

    // Get current admin user info
    const profiles = getStoredStaffProfiles();
    const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
    const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;

    broadcastRemarks.push({
        branch: branch,
        scope: scopeTitle,
        category: category,
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: actor,
        userKey: userKey,
        timestamp: new Date().toLocaleString()
    });

    localStorage.setItem("broadcastRemarks", JSON.stringify(broadcastRemarks));
    document.getElementById("remarkText").value = "";
    
    loadRemarksManagementDirectory();
    syncBroadcastPCSelection();
    renderBroadcastAnnouncementBox();
    alert("System notification payload has been actively routed.");
}

function renderBroadcastAnnouncementBox() {
    const boxContent = document.getElementById("broadcastAnnouncementContent");
    if (!boxContent) return;

    if (!broadcastRemarks || broadcastRemarks.length === 0) {
        boxContent.innerHTML = `<div class="broadcast-announcement-empty">No global broadcasts available yet.</div>`;
        return;
    }

    const items = broadcastRemarks.slice().reverse().slice(0, 3);
    boxContent.innerHTML = items.map(rmk => {
        const categoryClass = rmk.category === 'Critical' ? 'broadcast-category-critical' : rmk.category === 'Warning' ? 'broadcast-category-warning' : 'broadcast-category-info';
        return `
            <div class="broadcast-entry">
                <div class="broadcast-entry-header">
                    <span class="broadcast-branch">${rmk.branch} ${rmk.scope}</span>
                    <span class="broadcast-category ${categoryClass}">${rmk.category}</span>
                </div>
                <p class="broadcast-message">${rmk.message}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#64748b;">
                    <div class="broadcast-time">${rmk.time}</div>
                    <div style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:3px; font-weight:600;"><i class="fas fa-user-circle" style="margin-right:2px;"></i>${rmk.user || 'Anonymous'}</div>
                </div>
            </div>`;
    }).join('');
}

function loadRemarksManagementDirectory() {
    const listContainer = document.getElementById("remarksList");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (broadcastRemarks.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; font-style:italic; padding:20px;">No administrative network briefs recorded.</p>`;
        return;
    }

    broadcastRemarks.slice().reverse().forEach((rmk, index) => {
        const actualIdx = broadcastRemarks.length - 1 - index;
        listContainer.innerHTML += `
            <div style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:6px; margin-bottom:10px; border-left:4px solid ${rmk.category === 'Critical' ? '#dc2626' : rmk.category === 'Warning' ? '#ea580c' : '#2ebd59'}">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <strong style="font-size:13px;">${rmk.branch} ${rmk.scope}</strong>
                        <span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:3px; font-weight:600;"><i class="fas fa-user-circle" style="margin-right:2px;"></i>${rmk.user || 'Anonymous'}</span>
                    </div>
                    <span style="font-size:11px; color:#64748b;">${rmk.time}</span>
                </div>
                <p style="font-size:13px; margin:6px 0; color:#334155;">${rmk.message}</p>
                <button class="delete-btn" style="padding:2px 6px; font-size:10px; background:transparent; color:#ef4444; border:none; cursor:pointer;" onclick="deleteRemark(${actualIdx})"><i class="fas fa-trash-alt"></i> Remove Notice</button>
            </div>`;
    });
}

function deleteRemark(idx) {
    broadcastRemarks.splice(idx, 1);
    localStorage.setItem("broadcastRemarks", JSON.stringify(broadcastRemarks));
    loadRemarksManagementDirectory();
}

function loadHomeRemarks() {
    const homeRemarksContainer = document.getElementById("homeRemarks");
    if (!homeRemarksContainer) return;
    homeRemarksContainer.innerHTML = "";

    const branchAlerts = {};

    if (typeof pcData !== 'undefined') {
        for (const branch in pcData) {
            pcData[branch].forEach(pc => {
                const spaceValue = pc.freeSpace ? parseInt(pc.freeSpace) : 100;
                
                const needsInspection = pc.health === "Warning" || pc.pcTemp >= 70;
                const needsReplacement = pc.health === "Critical" || spaceValue <= 15;

                if (needsInspection || needsReplacement) {
                    if (!branchAlerts[branch]) {
                        branchAlerts[branch] = { inspection: [], replacement: [] };
                    }
                    if (needsInspection) branchAlerts[branch].inspection.push(pc);
                    if (needsReplacement) branchAlerts[branch].replacement.push(pc);
                }
            });
        }
    }

    if (Object.keys(branchAlerts).length === 0) {
        homeRemarksContainer.innerHTML = `
            <div style="grid-column: 1 / -1; color: #64748b; font-style: italic; text-align: center; padding: 40px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 14px; width: 100%;">
                <i class="fas fa-check-circle" style="color: #16a34a; margin-right: 8px; font-size: 16px;"></i> All network facility branches are currently operational and stable.
            </div>`;
        return;
    }

    for (const branchName in branchAlerts) {
        const alerts = branchAlerts[branchName];
        const totalIssuesCount = alerts.inspection.length + alerts.replacement.length;
        
        let inspectionHTML = "";
        let replacementHTML = "";

        if (alerts.inspection.length === 0) {
            inspectionHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 12px; margin: 4px 0;">No diagnostic anomalies.</p>`;
        } else {
            alerts.inspection.forEach(pc => {
                inspectionHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #334155; padding: 4px 0;">
                        <span><i class="fas fa-exclamation-triangle" style="color: #ea580c; margin-right: 6px; font-size: 12px;"></i> <b>${pc.pcName}</b></span>
                        <span>${renderTempBadge(pc.pcTemp)}</span>
                    </div>`;
            });
        }

        if (alerts.replacement.length === 0) {
            replacementHTML = `<p style="color: #94a3b8; font-style: italic; font-size: 12px; margin: 4px 0;">No critical volumes flagged.</p>`;
        } else {
            alerts.replacement.forEach(pc => {
                replacementHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #334155; padding: 4px 0;">
                        <span><i class="fas fa-hdd" style="color: #dc2626; margin-right: 6px; font-size: 12px;"></i> <b>${pc.pcName}</b></span>
                        <span style="font-size: 11px; color: #b91c1c; background: #fef2f2; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Free: ${pc.freeSpace}</span>
                    </div>`;
            });
        }

        const hasCritical = alerts.replacement.length > 0;
        const bannerBorderColor = hasCritical ? "#dc2626" : "#ea580c";

        homeRemarksContainer.innerHTML += `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-top: 4px solid ${bannerBorderColor}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; overflow: hidden; height: 100%;">
                <div style="padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-building" style="color: #64748b;"></i> ${branchName}
                    </span>
                    <span style="font-size: 11px; font-weight: 700; background: ${bannerBorderColor}; color: #ffffff; padding: 2px 8px; border-radius: 12px;">
                        ${totalIssuesCount} ${totalIssuesCount === 1 ? 'Issue' : 'Issues'}
                    </span>
                </div>
                
                <div style="padding: 14px; flex-grow: 1; display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <h4 style="color: #ea580c; font-size: 11px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-search"></i> For Inspection (Warning)
                        </h4>
                        <div>${inspectionHTML}</div>
                    </div>
                    <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 4px 0 0 0;">
                    <div>
                        <h4 style="color: #dc2626; font-size: 11px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-sync-alt"></i> For Urgent Action (Critical)
                        </h4>
                        <div>${replacementHTML}</div>
                    </div>
                </div>
            </div>`;
    }
}

function loadBranchDetails(branchName) {
    const pcs = pcData[branchName] || [];
    let inspectionItemsHTML = "";
    let replacementItemsHTML = "";
    
    pcs.forEach(pc => {
        if (pc.health === "Warning") {
            inspectionItemsHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px;">
                    <span style="color: #334155;"><i class="fas fa-exclamation-triangle" style="color: #ea580c; margin-right: 6px;"></i><b>${pc.pcName}</b></span>
                    <span>${renderTempBadge(pc.pcTemp)}</span>
                </div>`;
        } else if (pc.health === "Critical") {
            replacementItemsHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px;">
                    <span style="color: #334155;"><i class="fas fa-exclamation-circle" style="color: #dc2626; margin-right: 6px;"></i><b>${pc.pcName}</b></span>
                    <span>${renderTempBadge(pc.pcTemp)}</span>
                </div>`;
        }
    });

    if (!inspectionItemsHTML) inspectionItemsHTML = `<div style="color: #94a3b8; font-style: italic; font-size: 12px; padding: 4px 0;">No conditions flagged.</div>`;
    if (!replacementItemsHTML) replacementItemsHTML = `<div style="color: #94a3b8; font-style: italic; font-size: 12px; padding: 4px 0;">No storage volumes flagged.</div>`;

    const branchCardMarkup = `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 14px;">
            <div>
                <div style="font-size: 11px; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                    <i class="fas fa-search" style="margin-right: 4px;"></i> For Inspection
                </div>
                <div>${inspectionItemsHTML}</div>
            </div>
            <div style="border-top: 1px dashed #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px; margin-bottom: 8px;">
                    <i class="fas fa-sync" style="margin-right: 4px;"></i> For Replacement
                </div>
                <div>${replacementItemsHTML}</div>
            </div>
        </div>`;

    const targetGridContainer = document.getElementById("branchWorkstationGrid");
    if (targetGridContainer) {
        targetGridContainer.innerHTML = branchCardMarkup;
    }
}

// --- Branch Issue Editor Modal ---
function openBranchIssueEditor(branchName) {
    const overlay = document.getElementById('branchIssueEditorOverlay');
    const title = document.getElementById('branchIssueEditorTitle');
    overlay.classList.remove('hidden');
    title.innerText = `Branch Issue Editor — ${branchName}`;
    populateBranchIssueEditor(branchName);
}

function closeBranchIssueEditor() {
    document.getElementById('branchIssueEditorOverlay').classList.add('hidden');
}

function populateBranchIssueEditor(branchName) {
    const container = document.getElementById('branchIssueEditorContent');
    if (!container) return;
    container.innerHTML = '';

    const list = pcData[branchName] || [];
    const problemPcs = list.map((pc, idx) => ({...pc, __idx: idx})).filter(p => p.health === 'Warning' || p.health === 'Critical');

    if (problemPcs.length === 0) {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#94a3b8;">No problematic PCs found for ${branchName}.</div>`;
        return;
    }

    problemPcs.forEach(pc => {
        const causes = [];
        const spaceVal = parseInt(pc.freeSpace) || 0;
        const storageHealthVal = getStorageHealthValue(pc);
        const hasStorageHealthValue = typeof storageHealthVal === 'number' && !Number.isNaN(storageHealthVal);
        if (spaceVal <= 15) causes.push({type:'critical', label:`Low Disk (${pc.freeSpace})`} );
        else if (spaceVal <= 50) causes.push({type:'warning', label:`Low Disk (${pc.freeSpace})`} );
        if (pc.pcTemp >= 85) causes.push({type:'critical', label:`High Temp (${pc.pcTemp}°C)`});
        else if (pc.pcTemp >= 70) causes.push({type:'warning', label:`High Temp (${pc.pcTemp}°C)`});
        if (hasStorageHealthValue) {
            if (storageHealthVal <= 29) {
                causes.push({type:'critical', label:`Storage Health ${storageHealthVal}%`});
            } else if (storageHealthVal <= 49) {
                causes.push({type:'warning', label:`Storage Health ${storageHealthVal}%`});
            }
        }

        const card = document.createElement('div');
        card.className = 'issue-editor-card';
        card.innerHTML = `
            <div class="issue-editor-header">
                <div>
                    <div class="issue-editor-title">${pc.pcName}</div>
                    <div class="issue-editor-meta">${pc.brand || 'Generic'} • ${pc.pcProcessor || ''}</div>
                </div>
                <div class="issue-controls">
                    <div class="issue-badges" id="issue-badges-${pc.__idx}"></div>
                </div>
            </div>
            <div class="issue-row">
                <div class="issue-column">
                    <label style="font-weight:700; font-size:13px;">Station ID</label>
                    <input id="issue-name-${pc.__idx}" class="issue-input" value="${pc.pcName}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Processor</label>
                    <input id="issue-processor-${pc.__idx}" class="issue-input" value="${pc.pcProcessor || ''}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Brand</label>
                    <input id="issue-brand-${pc.__idx}" class="issue-input" value="${pc.brand || ''}" />
                </div>
                <div class="issue-column">
                    <label style="font-weight:700; font-size:13px;">Storage</label>
                    <input id="issue-storage-${pc.__idx}" class="issue-input" value="${pc.storage || ''}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Capacity (GB)</label>
                    <input id="issue-capacity-${pc.__idx}" type="number" min="0" class="issue-input" value="${parseInt(pc.capacity) || ''}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Free Space (GB)</label>
                    <input id="issue-free-${pc.__idx}" type="number" min="0" class="issue-input" value="${parseInt(pc.freeSpace) || ''}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Storage Health (%)</label>
                    <input id="issue-storage-health-${pc.__idx}" type="number" min="0" max="100" class="issue-input" value="${pc.storageHealth ?? ''}" placeholder="0-100" />
                </div>
                <div style="width:240px; display:flex; flex-direction:column; gap:8px;">
                    <label style="font-weight:700; font-size:13px;">Operational State</label>
                    <select id="issue-state-${pc.__idx}" class="issue-input"><option value="Active">Active</option><option value="Down">Down</option></select>
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Health (editable)</label>
                    <select id="issue-health-${pc.__idx}" class="issue-input"><option value="Healthy">Healthy</option><option value="Warning">Warning</option><option value="Critical">Critical</option></select>
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Chassis Temp (°C)</label>
                    <input id="issue-temp-${pc.__idx}" type="number" class="issue-input" value="${pc.pcTemp}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;"><i class="fas fa-user" style="color:#2563eb; margin-right:4px;"></i>Primary User</label>
                    <input id="issue-username-${pc.__idx}" class="issue-input" value="${pc.username || ''}" />
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Storage Replacement</label>
                    <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:13px; color:#334155;">
                        <input id="issue-storage-replaced-${pc.__idx}" type="checkbox" ${pc.storageReplaced ? 'checked' : ''} />
                        Storage Replaced
                    </label>
                    <label style="font-weight:700; font-size:13px; margin-top:6px;">Replacement Storage Model</label>
                    <input id="issue-replacement-storage-model-${pc.__idx}" class="issue-input" value="${escapeHtml(pc.replacementStorageModel || '')}" placeholder="Required when storage was replaced" />
                </div>
            </div>
            <div class="editor-action-row">
                <button class="btn-cancel" onclick="populateBranchIssueEditor('${branchName}')">Reset</button>
                <button class="add-btn" onclick="saveBranchPcEdit('${branchName}', ${pc.__idx})">Save</button>
            </div>
            <div id="issue-note-${pc.__idx}" class="editor-note" style="display:none;"></div>
        `;

        container.appendChild(card);

        // populate badges
        const badgeContainer = document.getElementById(`issue-badges-${pc.__idx}`);
        if (badgeContainer) {
            badgeContainer.innerHTML = '';
            causes.forEach(c => {
                const span = document.createElement('span');
                span.className = 'cause-badge ' + (c.type === 'critical' ? 'cause-critical' : c.type === 'warning' ? 'cause-warning' : 'cause-info');
                span.innerHTML = `<i class=\"fas fa-exclamation-circle\"></i> ${c.label}`;
                badgeContainer.appendChild(span);
            });
        }

        // set selects to current values after injecting HTML
        const sEl = document.getElementById(`issue-state-${pc.__idx}`);
        const hEl = document.getElementById(`issue-health-${pc.__idx}`);
        if (sEl) sEl.value = pc.state || 'Active';
        if (hEl) hEl.value = pc.health || 'Healthy';
    });
}

function saveBranchPcEdit(branchName, idx) {
    const pc = pcData[branchName][idx];
    if (!pc) {
        toastNotice('error', 'Not Found', 'Target PC not found.');
        return;
    }

    const newName = document.getElementById(`issue-name-${idx}`).value || pc.pcName;
    const newProcessor = document.getElementById(`issue-processor-${idx}`).value || pc.pcProcessor;
    const newBrand = document.getElementById(`issue-brand-${idx}`).value || pc.brand;
    const newStorage = document.getElementById(`issue-storage-${idx}`).value || pc.storage;
    const newCapacityRaw = document.getElementById(`issue-capacity-${idx}`).value;
    const newFreeRaw = document.getElementById(`issue-free-${idx}`).value;
    const newCapacity = normalizeGbString(newCapacityRaw || pc.capacity, parseGbValue(pc.capacity, 256));
    const newState = document.getElementById(`issue-state-${idx}`).value;
    const newHealth = document.getElementById(`issue-health-${idx}`).value;
    const newFree = normalizeGbString(newFreeRaw || pc.freeSpace, parseGbValue(pc.freeSpace, 100));
    const newTemp = Number(document.getElementById(`issue-temp-${idx}`).value) || pc.pcTemp;
    const newUsername = document.getElementById(`issue-username-${idx}`).value.trim() || pc.username;
    const newStorageHealthRaw = document.getElementById(`issue-storage-health-${idx}`)?.value || '';
    const newStorageHealth = Number(newStorageHealthRaw);
    const newStorageReplaced = document.getElementById(`issue-storage-replaced-${idx}`)?.checked || false;
    const newReplacementStorageModel = document.getElementById(`issue-replacement-storage-model-${idx}`)?.value.trim() || '';
    const hasStorageHealthValue = newStorageHealthRaw.trim() !== '' && !Number.isNaN(newStorageHealth);

    if (newStorageReplaced && !newReplacementStorageModel) {
        toastNotice('warning', 'Storage Replacement Required', 'Please enter the replacement storage model when the storage replacement checkbox is selected.');
        return;
    }

    if (newStorageHealthRaw.trim() !== '' && (Number.isNaN(newStorageHealth) || newStorageHealth < 0 || newStorageHealth > 100)) {
        toastNotice('warning', 'Invalid Storage Health', 'Storage Health must be a percentage between 0 and 100.');
        return;
    }

    const prior = { ...pc };

    // apply changes
    pc.pcName = newName;
    pc.pcProcessor = newProcessor;
    pc.brand = newBrand;
    pc.storage = newStorage;
    pc.capacity = newCapacity;
    pc.state = newState;
    pc.freeSpace = newFree;
    pc.pcTemp = newTemp;
    pc.processorTemp = newTemp + 5;
    pc.username = newUsername;
    if (hasStorageHealthValue) {
        pc.storageHealth = newStorageHealth;
    } else {
        delete pc.storageHealth;
    }
    pc.storageReplaced = newStorageReplaced;
    if (newStorageReplaced) {
        pc.replacementStorageModel = newReplacementStorageModel;
    } else {
        delete pc.replacementStorageModel;
        delete pc.storageReplaced;
    }

    // re-evaluate health based on thresholds to preserve system rules
    const spaceNum = parseGbValue(newFree) || 0;
    let evaluated = 'Healthy';
    if (spaceNum <= 15 || newTemp >= 85 || (hasStorageHealthValue && newStorageHealth <= 29)) evaluated = 'Critical';
    else if (spaceNum <= 50 || newTemp >= 70 || (hasStorageHealthValue && newStorageHealth <= 49)) evaluated = 'Warning';

    const noteEl = document.getElementById(`issue-note-${idx}`);
    const severityRank = { 'Healthy': 0, 'Warning': 1, 'Critical': 2 };

    const adminChangedHealth = (newHealth !== (prior.health || 'Healthy'));
    if (!adminChangedHealth) {
        // admin did not explicitly change health: auto-detect from telemetry
        pc.health = evaluated;
        if (noteEl) {
            noteEl.style.display = 'block';
            noteEl.innerText = `Auto-detected health: ${evaluated} (telemetry: ${spaceNum}GB free, ${newTemp}°C).`;
        }
    } else {
        // admin changed it: allow their choice but don't permit downgrades below telemetry
        if (severityRank[newHealth] < severityRank[evaluated]) {
            pc.health = evaluated;
            if (noteEl) {
                noteEl.style.display = 'block';
                noteEl.innerText = `System override: health set to ${evaluated} because of telemetry (${spaceNum}GB free, ${newTemp}°C).`;
            }
        } else {
            pc.health = newHealth || evaluated;
            if (noteEl) { noteEl.style.display = 'none'; noteEl.innerText = ''; }
        }
    }

    const profiles = getStoredStaffProfiles();
    const userKey = adminUserKey || sessionStorage.getItem('adminUserKey') || 'anonymous';
    const actor = profiles[userKey] ? (profiles[userKey].username || profiles[userKey].name) : userKey;

    modificationHistory.push({
        id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
        action: 'Branch Issue Edit',
        branch: branchName,
        pcName: pc.pcName,
        user: actor,
        userKey: userKey,
        timestamp: new Date().toLocaleString(),
        priorState: prior,
        details: {
            state: pc.state,
            health: pc.health,
            freeSpace: pc.freeSpace,
            temp: pc.pcTemp,
            username: pc.username,
            storageHealth: pc.storageHealth,
            storageReplaced: Boolean(pc.storageReplaced),
            replacementStorageModel: pc.replacementStorageModel || undefined
        }
    });

    localStorage.setItem('pcData', JSON.stringify(pcData));
    try { pushPcDataToCloud().catch(() => {}); } catch (e) {}
    persistModificationHistory();

    // refresh lists and metrics
    populateBranchIssueEditor(branchName);
    refreshAllViews();
}

function refreshAllViews() {
    // Update consolidated metrics and home widgets
    calculateConsolidatedMetrics();
    renderBranchGridDashboard();
    loadHomeRemarks();

    // Refresh admin/history related views so changes appear immediately
    try { loadAdminBranchData(); } catch (e) {}
    try { loadRemarksManagementDirectory(); } catch (e) {}
    try { renderBroadcastAnnouncementBox(); } catch (e) {}

    // If dashboard page is visible, re-render its table
    const dashboard = document.getElementById('dashboardPage');
    if (dashboard && !dashboard.classList.contains('hidden')) {
        renderBranchTableLog(selectedBranchGlobal);
    }

    // If analysis page is visible, re-render live analysis metrics
    const analysisPage = document.getElementById('analysisPage');
    if (analysisPage && !analysisPage.classList.contains('hidden')) {
        renderAnalysisView();
    }

    // dispatch an event for other potential UI hooks
    try { window.dispatchEvent(new CustomEvent('pcDataUpdated')); } catch (e) {}
}

function endShiftForSelectedStaff() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    let selectedStaff = (staffSelect && staffSelect.value) ? staffSelect.value : '';
    if (!selectedStaff) {
        const adminKey = getCurrentAdminKey();
        if (adminKey === 'ali') {
            const profiles = Object.values(getStoredStaffProfiles()).filter(p => !p.disabled && p.id !== 'ali');
            if (profiles.length) selectedStaff = profiles[0].id;
        } else if (adminKey) {
            selectedStaff = adminKey;
        }
    }
    if (!selectedStaff) {
        toastNotice('warning', 'Missing Selection', 'Please select an IT staff member first.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    if (!profiles[selectedStaff]) {
        toastNotice('error', 'Profile Not Found', 'The selected staff member does not exist.');
        return;
    }

    profiles[selectedStaff] = {
        ...profiles[selectedStaff],
        shiftStatus: 'offline',
        location: ''
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    updateBHFMapStaffMarkers();
    populateITTrackerControls();
    updateITTrackerFields();
    addShiftHistoryEntry('end_shift', selectedStaff, { location: '', remarks: profiles[selectedStaff].remarks || '' });
    recordModification('end_shift', selectedStaff, {});
    toastNotice('success', 'Shift Ended', 'Staff member shifted to Offline.');
}

function setOnLeaveForSelectedStaff() {
    const staffSelect = document.getElementById('itTrackerStaffSelect');
    let selectedStaff = (staffSelect && staffSelect.value) ? staffSelect.value : '';
    if (!selectedStaff) {
        const adminKey = getCurrentAdminKey();
        if (adminKey === 'ali') {
            const profiles = Object.values(getStoredStaffProfiles()).filter(p => !p.disabled && p.id !== 'ali');
            if (profiles.length) selectedStaff = profiles[0].id;
        } else if (adminKey) {
            selectedStaff = adminKey;
        }
    }
    if (!selectedStaff) {
        toastNotice('warning', 'Missing Selection', 'Please select an IT staff member first.');
        return;
    }

    const profiles = getStoredStaffProfiles();
    const selectedProfile = profiles[selectedStaff];
    if (!selectedProfile) {
        toastNotice('error', 'Profile Not Found', 'The selected staff member does not exist.');
        return;
    }

    profiles[selectedStaff] = {
        ...selectedProfile,
        shiftStatus: 'onleave',
        location: '',
        remarks: selectedProfile.remarks || ''
    };

    persistStaffProfiles(profiles);
    renderITStaffProfileGrid();
    updateBHFMapStaffMarkers();
    populateITTrackerControls();
    updateITTrackerFields();
    addShiftHistoryEntry('on_leave', selectedStaff, { remarks: profiles[selectedStaff].remarks || '' });
    recordModification('on_leave', selectedStaff, {});
    toastNotice('success', 'On Leave', 'Staff member marked as On Leave.');
}

// Announcements management (admins)
function getStoredAnnouncements() {
    try {
        return JSON.parse(localStorage.getItem('adminAnnouncements') || '[]');
    } catch (e) { return []; }
}

function persistAnnouncements(list) {
    localStorage.setItem('adminAnnouncements', JSON.stringify(list || []));
}

async function syncAnnouncementsToRemote(list) {
    if (!firestoreDb || !Array.isArray(list)) return;
    if (remoteAnnouncementsApplying) return;
    try {
        const docRef = firestoreDb.collection(FIREBASE_ANNOUNCEMENTS_DOC.collection).doc(FIREBASE_ANNOUNCEMENTS_DOC.doc);
        await docRef.set({ announcements: list }, { merge: true });
    } catch (e) {
        console.error('Failed to sync announcements to remote:', e);
        updateRemoteSyncStatusDisplay('error', e.message || String(e));
    }
}

function saveAdminAnnouncement() {
    const textEl = document.getElementById('announcementText');
    if (!textEl) return;
    const message = (textEl.value || '').trim();
    if (!message) {
        toastNotice('warning', 'Empty Announcement', 'Please type an announcement before saving.');
        return;
    }
    const adminKey = getCurrentAdminKey();
    if (!adminKey) {
        toastNotice('error', 'Admin Required', 'Only signed-in administrators can post announcements.');
        document.getElementById('pinModalOverlay')?.classList.remove('hidden');
        return;
    }

    const branchesSelected = announcementBranchSelection.slice();
    const scheduledDate = (document.getElementById('announcementDate')?.value || '').trim();
    const scheduledTime = (document.getElementById('announcementTime')?.value || '').trim();
    const scheduledAt = scheduledDate ? `${scheduledDate}${scheduledTime ? ' ' + scheduledTime : ''}` : '';

    const list = getStoredAnnouncements();
    const entry = {
        id: `ann_${Date.now()}`,
        message,
        branches: branchesSelected,
        scheduledAt: scheduledAt || '',
        createdBy: adminKey,
        createdAt: new Date().toISOString()
    };
    list.push(entry);
    persistAnnouncements(list);
    try { if (bhfBroadcast) bhfBroadcast.postMessage({ type: 'announcements-updated', announcements: list }); } catch (e) {}
    try { syncAnnouncementsToRemote(list); } catch (e) {}
    textEl.value = '';
    announcementBranchSelection = [];
    updateAnnouncementBranchSummary();
    const allBranchCheckboxes = document.querySelectorAll('#announcementBranchModalList input[type="checkbox"]');
    allBranchCheckboxes.forEach(input => input.checked = false);
    const dateInput = document.getElementById('announcementDate');
    if (dateInput) dateInput.value = '';
    const timeInput = document.getElementById('announcementTime');
    if (timeInput) timeInput.value = '';
    renderItTrackerAnnouncements();
    displayAnnouncementsOnHome();
    toastNotice('success', 'Saved', 'Announcement saved.');
}

function deleteAdminAnnouncement(id) {
    const adminKey = getCurrentAdminKey();
    if (!adminKey) {
        toastNotice('error', 'Admin Required', 'Only signed-in administrators can delete announcements.');
        return;
    }
    let list = getStoredAnnouncements();
    list = list.filter(a => a.id !== id);
    persistAnnouncements(list);
    try { if (bhfBroadcast) bhfBroadcast.postMessage({ type: 'announcements-updated', announcements: list }); } catch (e) {}
    try { syncAnnouncementsToRemote(list); } catch (e) {}
    renderItTrackerAnnouncements();
    displayAnnouncementsOnHome();
    toastNotice('success', 'Deleted', 'Announcement deleted.');
}

function renderItTrackerAnnouncements() {
    const container = document.getElementById('itTrackerAnnouncementList');
    if (!container) return;
    const list = getStoredAnnouncements();
    if (!list || list.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; font-style:italic;">No announcements yet.</p>';
        return;
    }
    container.innerHTML = list.slice().reverse().map(a => {
        const time = new Date(a.createdAt).toLocaleString();
        const branchValues = Array.isArray(a.branches) ? a.branches.filter(Boolean) : a.branch ? [a.branch] : [];
        const branchLine = branchValues.length ? `<div class="announcement-detail"><i class="fas fa-map-marker-alt"></i><strong>Branch:</strong> ${escapeHtml(branchValues.join(', '))}</div>` : '';
        const scheduleLine = a.scheduledAt ? `<div class="announcement-detail"><i class="fas fa-calendar-alt"></i><strong>Date & Time:</strong> ${escapeHtml(a.scheduledAt)}</div>` : '';
        return `
            <div class="announcement-card">
                <div class="announcement-message">${escapeHtml(a.message)}</div>
                <div class="announcement-details">${branchLine}${scheduleLine}</div>
                <div class="meta" style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:8px;">
                    <div style="font-size:12px; color:#64748b;">${time}${a.createdBy ? ' • ' + escapeHtml(a.createdBy) : ''}</div>
                    <div style="text-align:right;"><button class="btn-cancel" style="padding:6px 10px; margin-left:8px;" onclick="deleteAdminAnnouncement('${a.id}')">Delete</button></div>
                </div>
            </div>`;
    }).join('');
}

function displayAnnouncementsOnHome() {
    const container = document.getElementById('homeAnnouncementList');
    if (!container) return;
    const list = getStoredAnnouncements();
    if (!list || list.length === 0) {
        container.innerHTML = '<div style="padding:18px; color:#64748b; font-style:italic;">No announcements at this time.</div>';
        return;
    }
    container.innerHTML = list.slice().reverse().map(a => {
        const time = new Date(a.createdAt).toLocaleString();
        const branchValues = Array.isArray(a.branches) ? a.branches.filter(Boolean) : a.branch ? [a.branch] : [];
        const branchLine = branchValues.length ? `<div class="announcement-detail"><i class="fas fa-map-marker-alt"></i><strong>Branch:</strong> ${escapeHtml(branchValues.join(', '))}</div>` : '';
        const scheduleLine = a.scheduledAt ? `<div class="announcement-detail"><i class="fas fa-calendar-alt"></i><strong>Date & Time:</strong> ${escapeHtml(a.scheduledAt)}</div>` : '';
        return `
            <div class="announcement-card">
                <div class="announcement-message">${escapeHtml(a.message)}</div>
                <div class="announcement-details">${branchLine}${scheduleLine}</div>
                <div class="meta">${time}${a.createdBy ? ' • ' + escapeHtml(a.createdBy) : ''}</div>
            </div>`;
    }).join('');
}

function clearAnnouncementDraft() {
    const el = document.getElementById('announcementText');
    if (el) el.value = '';
    announcementBranchSelection = [];
    updateAnnouncementBranchSummary();
    const checkboxes = document.querySelectorAll('#announcementBranchModalList input[type="checkbox"]');
    checkboxes.forEach(input => input.checked = false);
    const dateInput = document.getElementById('announcementDate');
    if (dateInput) dateInput.value = '';
    const timeInput = document.getElementById('announcementTime');
    if (timeInput) timeInput.value = '';
}

function openAnnouncementBranchModal() {
    const overlay = document.getElementById('announcementBranchModalOverlay');
    if (!overlay) return;
    renderAnnouncementBranchModalList();
    overlay.classList.remove('hidden');
}

function closeAnnouncementBranchModal() {
    const overlay = document.getElementById('announcementBranchModalOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
}

function renderAnnouncementBranchModalList() {
    const container = document.getElementById('announcementBranchModalList');
    if (!container) return;
    const selected = new Set(announcementBranchSelection);
    container.innerHTML = branches.map(branch => `
        <label class="announcement-branch-checkbox ${selected.has(branch) ? 'checked' : ''}">
            <input type="checkbox" value="${escapeHtml(branch)}" ${selected.has(branch) ? 'checked' : ''} />
            <span>${escapeHtml(branch)}</span>
        </label>
    `).join('');
}

function updateAnnouncementBranchSummary() {
    const summary = document.getElementById('announcementBranchSummary');
    if (!summary) return;
    if (!announcementBranchSelection || announcementBranchSelection.length === 0) {
        summary.innerHTML = 'No branches selected. Tap to choose.';
        return;
    }
    summary.innerHTML = announcementBranchSelection.map(branch => `<span class="announcement-branch-pill">${escapeHtml(branch)}</span>`).join(' ');
}

function saveAnnouncementBranchSelection() {
    const checkboxes = document.querySelectorAll('#announcementBranchModalList input[type="checkbox"]');
    announcementBranchSelection = Array.from(checkboxes).filter(input => input.checked).map(input => input.value.trim()).filter(Boolean);
    updateAnnouncementBranchSummary();
    closeAnnouncementBranchModal();
}

pushPcDataToCloud(); // Syncs the deletion instantly to all monitoring windows
