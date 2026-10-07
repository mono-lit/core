<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';

const DEFAULT_CONFIG = {
    baseUrl: 'https://dev-ppl-project.phoenix-squad.eu.org',
    endpointPath: '/odata/DTO_MasterUser',
    adminUser: 'superadmin@eji.co.id',
    adminPassword: 'eJ!-123',
    defaultPassword: 'eJ!-123',
    companyDb: 'EJI',
    autoRefresh: true,
    maxFetch: 30
};

const FAVORITES_MAP_KEY = 'favoritesMap';
const SEARCH_DEBOUNCE_DELAY = 300;

// Inline styles
const styles = {
    container: {
        width: '100%',
        height: '100%',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
        fontSize: '14px',
        color: '#333',
        minWidth: '800px',
        minHeight: '600px'
    },
    tabsHeader: {
        display: 'flex',
        backgroundColor: '#f5f5f5',
        borderBottom: '2px solid #ddd'
    },
    tabButton: {
        flex: 1,
        padding: '12px 20px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        color: '#666',
        transition: 'all 0.3s'
    },
    tabButtonActive: {
        color: '#007bff',
        borderBottom: '3px solid #007bff',
        backgroundColor: '#fff'
    },
    tabContent: {
        display: 'none',
        padding: '20px'
    },
    tabContentActive: {
        display: 'block'
    },
    searchContainer: {
        display: 'flex',
        gap: '10px',
        marginBottom: '15px'
    },
    searchInput: {
        flex: 1,
        padding: '10px 15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    },
    btn: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.3s'
    },
    btnPrimary: {
        backgroundColor: '#007bff',
        color: 'white'
    },
    btnSecondary: {
        backgroundColor: '#6c757d',
        color: 'white'
    },
    btnSuccess: {
        backgroundColor: '#28a745',
        color: 'white',
        padding: '6px 12px',
        fontSize: '12px'
    },
    statusMessage: {
        padding: '10px 15px',
        borderRadius: '4px',
        marginBottom: '15px',
        display: 'none'
    },
    statusMessageSuccess: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        display: 'block'
    },
    statusMessageError: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        display: 'block'
    },
    statusMessageInfo: {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb',
        display: 'block'
    },
    loading: {
        display: 'none',
        textAlign: 'center',
        padding: '40px'
    },
    loadingActive: {
        display: 'block',
        textAlign: 'center',
        padding: '40px'
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px'
    },
    tableContainer: {
        maxHeight: '450px',
        overflowY: 'auto',
        overflowX: 'auto',     // ✅ add this
        maxWidth: '100%',      // ✅ add this
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: 'white'
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed' // ✅ add
    },

    thead: {
        position: 'sticky',
        top: 0,
        backgroundColor: '#f8f9fa',
        zIndex: 10
    },
    th: {
        padding: '12px',
        textAlign: 'left',
        fontWeight: 600,
        color: '#495057',
        borderBottom: '2px solid #dee2e6',
        whiteSpace: 'nowrap'
    },
    td: {
        padding: '10px 12px',
        borderBottom: '1px solid #dee2e6',
        whiteSpace: 'normal',        // ✅ add
        overflowWrap: 'anywhere',    // ✅ add (best for long JWT)
        wordBreak: 'break-word'      // ✅ add
    },

    tbodyRow: {
        backgroundColor: 'transparent'
    },
    badge: {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 500
    },
    badgeSuccess: {
        backgroundColor: '#d4edda',
        color: '#155724'
    },
    badgeDanger: {
        backgroundColor: '#f8d7da',
        color: '#721c24'
    },
    starBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        lineHeight: 1
    },
    starBtnFavorited: {
        color: '#f5a623'
    },
    starBtnNotFavorited: {
        color: '#ccc'
    },
    noUsers: {
        textAlign: 'center',
        padding: '40px',
        color: '#6c757d'
    },
    settingsForm: {
        maxWidth: '100%'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 500,
        color: '#495057'
    },
    formInput: {
        width: '100%',
        padding: '10px 15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    },
    checkboxGroup: {
        display: 'flex',
        alignItems: 'center'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        margin: 0
    },
    checkboxInput: {
        width: '18px',
        height: '18px',
        marginRight: '10px',
        cursor: 'pointer'
    },
    formActions: {
        display: 'flex',
        gap: '10px',
        marginTop: '30px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: '#6c757d'
    },
    tokenFilterBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
    },
    permissionsToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500,
        color: '#495057'
    }
};

// ✅ Style aliases used by template (fix: non-existent variables)
const containerStyle = styles.container
const tabsHeaderStyle = styles.tabsHeader
const tabButtonStyle = styles.tabButton
const tabButtonActiveStyle = styles.tabButtonActive

// You already toggle v-show, so no need display:none style.
// But keep your existing style name that template expects:
const tabContentStyle = { ...styles.tabContent, ...styles.tabContentActive }

const searchContainerStyle = styles.searchContainer
const searchInputStyle = styles.searchInput

const btnStyle = styles.btn
const btnPrimaryStyle = styles.btnPrimary
const btnSecondaryStyle = styles.btnSecondary
const btnSuccessStyle = styles.btnSuccess

const statusMessageStyle = styles.statusMessage
const statusMessageSuccessStyle = styles.statusMessageSuccess
const statusMessageErrorStyle = styles.statusMessageError
const statusMessageInfoStyle = styles.statusMessageInfo

const loadingActiveStyle = styles.loadingActive
const spinnerStyle = styles.spinner

const tableContainerStyle = styles.tableContainer
const tableStyle = styles.table
const theadStyle = styles.thead
const thStyle = styles.th
const tdStyle = styles.td
const tbodyRowStyle = styles.tbodyRow

const badgeStyle = styles.badge
const badgeSuccessStyle = styles.badgeSuccess
const badgeDangerStyle = styles.badgeDanger

const starBtnStyle = styles.starBtn
const starBtnFavoritedStyle = styles.starBtnFavorited
// (optional) if you ever use it later:
const starBtnNotFavoritedStyle = styles.starBtnNotFavorited

const noUsersStyle = styles.noUsers

const settingsFormStyle = styles.settingsForm
const formGroupStyle = styles.formGroup
const labelStyle = styles.label
const formInputStyle = styles.formInput
const checkboxGroupStyle = styles.checkboxGroup
const checkboxLabelStyle = styles.checkboxLabel
const checkboxInputStyle = styles.checkboxInput
const formActionsStyle = styles.formActions

const emptyStateStyle = styles.emptyState
const tokenFilterBarStyle = styles.tokenFilterBar
const permissionsToggleStyle = styles.permissionsToggle


// State
const activeTab = ref('replace-session');
const tabs = [
    { id: 'replace-session', label: 'Replace Session' },
    { id: 'settings', label: 'Settings' },
    { id: 'tokens', label: 'Tokens' }
];

const config = reactive({ ...DEFAULT_CONFIG });
const searchInput = ref('');
const searchInputRef = ref(null);
const currentUsers = ref([]);
const favoritesMap = ref({});
const isLoading = ref(false);
const isSearchInProgress = ref(false);
let searchDebounceTimer = null;

const statusMessage = reactive({ message: '', type: '' });
const settingsStatus = reactive({ message: '', type: '' });
const tokensStatus = reactive({ message: '', type: '' });

// Token viewer state
const tokenSearchInput = ref('');
const showPermissions = ref(false);
const currentTokenRows = ref([]);
const tokenData = reactive({ domain: '', accessToken: '', refreshToken: '' });

// Computed
const filteredUsers = computed(() => currentUsers.value);

const filteredTokenRows = computed(() => {
    const query = tokenSearchInput.value.trim().toLowerCase();
    return currentTokenRows.value.filter((row) => {
        const fieldLower = String(row.field || '').toLowerCase();
        if (!showPermissions.value && fieldLower === 'permissions') return false;
        if (!query) return true;
        const tokenLabel = String(row.tokenLabel || '').toLowerCase();
        const valueLower = String(row.value || '').toLowerCase();
        return tokenLabel.includes(query) || fieldLower.includes(query) || valueLower.includes(query);
    });
});

// Tab switching
const switchTab = async (tabId) => {
    activeTab.value = tabId;
    if (tabId === 'replace-session') {
        await nextTick();
        if (searchInputRef.value) searchInputRef.value.focus();
    } else if (tabId === 'tokens') {
        await loadTokenTable();
    }
};

// Favorites management
const isFavorite = (username) => !!favoritesMap.value[username];
const getFavoritesUsernames = () => Object.keys(favoritesMap.value);

const getFavoritesFromCacheSorted = () => {
    const favs = Object.values(favoritesMap.value);
    favs.sort((a, b) => {
        const au = (a.Username || '').toLowerCase();
        const bu = (b.Username || '').toLowerCase();
        if (au < bu) return -1;
        if (au > bu) return 1;
        return 0;
    });
    return favs;
};

const toggleFavorite = async (user) => {
    if (!user || !user.Username) return;

    if (isFavorite(user.Username)) {
        delete favoritesMap.value[user.Username];
    } else {
        favoritesMap.value[user.Username] = {
            Username: user.Username,
            IsDeptHead: !!user.IsDeptHead,
            IsSuperAdmin: !!user.IsSuperAdmin,
            KodeDepartemen: user.KodeDepartemen || '',
            NamaLengkap: user.NamaLengkap || ''
        };
    }

    await saveFavoritesMap();

    // Re-render current view
    if (!searchInput.value.trim()) {
        const favUsers = getFavoritesFromCacheSorted();
        const favSet = new Set(getFavoritesUsernames());
        const nonFav = currentUsers.value.filter((u) => !favSet.has(u.Username));
        currentUsers.value = favUsers.concat(nonFav);
    }
};

const loadFavoritesMap = async () => {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get([FAVORITES_MAP_KEY], (result) => {
                favoritesMap.value =
                    result[FAVORITES_MAP_KEY] && typeof result[FAVORITES_MAP_KEY] === 'object'
                        ? result[FAVORITES_MAP_KEY]
                        : {};
                resolve();
            });
        } else {
            // Fallback for non-browser environments
            const stored = localStorage.getItem(FAVORITES_MAP_KEY);
            favoritesMap.value = stored ? JSON.parse(stored) : {};
            resolve();
        }
    });
};

const saveFavoritesMap = async () => {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ [FAVORITES_MAP_KEY]: favoritesMap.value }, resolve);
        } else {
            localStorage.setItem(FAVORITES_MAP_KEY, JSON.stringify(favoritesMap.value));
            resolve();
        }
    });
};

// Settings management
const loadSettings = async () => {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['config'], (result) => {
                if (result.config) {
                    Object.assign(config, DEFAULT_CONFIG, result.config);
                }
                resolve();
            });
        } else {
            const stored = localStorage.getItem('config');
            if (stored) {
                Object.assign(config, DEFAULT_CONFIG, JSON.parse(stored));
            }
            resolve();
        }
    });
};

const saveSettings = () => {
    const maxFetch = Number.isFinite(config.maxFetch) && config.maxFetch > 0 ? config.maxFetch : 30;
    config.maxFetch = maxFetch;

    const configToSave = { ...config };

    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ config: configToSave }, () => {
            showStatus('settingsStatus', 'Settings saved successfully!', 'success');
            setTimeout(() => clearStatus('settingsStatus'), 3000);
        });
    } else {
        localStorage.setItem('config', JSON.stringify(configToSave));
        showStatus('settingsStatus', 'Settings saved successfully!', 'success');
        setTimeout(() => clearStatus('settingsStatus'), 3000);
    }
};

const resetSettings = () => {
    Object.assign(config, DEFAULT_CONFIG);
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ config: { ...config } }, () => {
            showStatus('settingsStatus', 'Settings reset to default!', 'info');
            setTimeout(() => clearStatus('settingsStatus'), 3000);
        });
    } else {
        localStorage.setItem('config', JSON.stringify(config));
        showStatus('settingsStatus', 'Settings reset to default!', 'info');
        setTimeout(() => clearStatus('settingsStatus'), 3000);
    }
};

// Networking
const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    } finally {
        clearTimeout(timer);
    }
};

const buildUsersUrl = (filter = '', excludeUsernames = []) => {
    const base = config.baseUrl.replace(/\/+$/, '');
    const path = config.endpointPath.startsWith('/') ? config.endpointPath : `/${config.endpointPath}`;
    let url = `${base}${path}`;

    const params = [];
    params.push('$select=Username,IsDeptHead,IsSuperAdmin,KodeDepartemen,NamaLengkap');

    const top = Number.isFinite(config.maxFetch) ? config.maxFetch : 30;
    params.push(`$top=${encodeURIComponent(String(top))}`);

    const filterParts = [];
    if (filter) {
        const esc = filter.replace(/'/g, "''");
        filterParts.push(`(contains(Username,'${esc}') or contains(NamaLengkap,'${esc}'))`);
    }

    if (excludeUsernames.length > 0) {
        const exclusionParts = excludeUsernames.map(
            (username) => `Username ne '${username.replace(/'/g, "''")}'`
        );
        filterParts.push(exclusionParts.join(' and '));
    }

    if (filterParts.length > 0) {
        params.push(`$filter=${filterParts.join(' and ')}`);
    }

    url += `?${params.join('&')}`;
    return url;
};

const loginAsAdmin = async () => {
    const loginUrl = `${config.baseUrl.replace(/\/+$/, '')}/Auth/Login`;
    const payload = {
        username: config.adminUser,
        password: config.adminPassword,
        companydb: config.companyDb
    };

    const response = await fetchWithTimeout(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await safeText(response);
        throw new Error(`Admin login failed: ${response.status} ${response.statusText} - ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    if (!data || !data.Token) throw new Error('Admin login response missing Token');
    return data.Token;
};

const getRefreshToken = async (loginToken, username) => {
    const refreshUrl = `${config.baseUrl.replace(/\/+$/, '')}/Auth/RefreshToken`;
    const response = await fetchWithTimeout(refreshUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${loginToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({ username })
    });

    if (!response.ok) {
        const text = await safeText(response);
        throw new Error(`Refresh token failed: ${response.status} ${response.statusText} - ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    if (!data || !data.RefreshToken) throw new Error('Refresh token response missing RefreshToken');
    return {
        token: data.RefreshToken,
        expiredMs: typeof data.Expired === 'number' ? data.Expired : null
    };
};

const loadUsers = async (filter = '', options = { prependFavorites: false, excludeFavorites: false }) => {
    if (!options.prependFavorites) isLoading.value = true;
    clearStatus('statusMessage');

    try {
        const loginToken = await loginAsAdmin();
        const refreshInfo = await getRefreshToken(loginToken, config.adminUser);
        const refreshToken = refreshInfo.token;

        const excludeUsernames = options.excludeFavorites ? getFavoritesUsernames() : [];
        const url = buildUsersUrl(filter, excludeUsernames);
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${refreshToken}`, Accept: 'application/json' }
        });

        if (!response.ok) {
            const text = await safeText(response);
            throw new Error(`Users fetch failed: ${response.status} ${response.statusText} - ${text.slice(0, 300)}`);
        }

        const data = await response.json();
        const serverUsers = Array.isArray(data.value) ? data.value : [];

        const favSet = new Set(getFavoritesUsernames());
        const serverNonFav = options.excludeFavorites
            ? serverUsers.filter((u) => !favSet.has(u.Username))
            : serverUsers;

        // Update cached favorites
        let favoritesTouched = false;
        for (const u of serverUsers) {
            if (favSet.has(u.Username)) {
                favoritesMap.value[u.Username] = {
                    Username: u.Username,
                    IsDeptHead: !!u.IsDeptHead,
                    IsSuperAdmin: !!u.IsSuperAdmin,
                    KodeDepartemen: u.KodeDepartemen || '',
                    NamaLengkap: u.NamaLengkap || ''
                };
                favoritesTouched = true;
            }
        }
        if (favoritesTouched) await saveFavoritesMap();

        // Merge final list
        const favUsers = options.prependFavorites ? getFavoritesFromCacheSorted() : [];
        const merged = favUsers.concat(serverNonFav);

        currentUsers.value = merged;
        isLoading.value = false;

        if (merged.length === 0) showStatus('statusMessage', 'No users found.', 'info');
    } catch (error) {
        console.error('Error loading users:', error);
        isLoading.value = false;
        showStatus('statusMessage', `Error loading users: ${error.message}`, 'error');
    }
};

const showDefaultView = async () => {
    const searchValue = searchInput.value.trim();
    if (searchValue) {
        await loadUsers(searchValue, { prependFavorites: false, excludeFavorites: false });
        return;
    }

    const favUsers = getFavoritesFromCacheSorted();
    if (favUsers.length > 0) {
        currentUsers.value = favUsers;
        showStatus('statusMessage', 'Showing favorites (cached) while loading...', 'info');
    } else {
        isLoading.value = true;
    }

    await loadUsers('', { prependFavorites: true, excludeFavorites: true });
};

// Search handling
const onSearchInput = () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const value = searchInput.value.trim();
    if (!value) {
        showDefaultView();
        return;
    }
    if (isSearchInProgress.value) return;
    searchDebounceTimer = setTimeout(() => {
        if (isSearchInProgress.value) return;
        handleSearch();
    }, SEARCH_DEBOUNCE_DELAY);
};

const handleSearch = async () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const searchValue = searchInput.value.trim();
    if (!searchValue) {
        await showDefaultView();
        return;
    }

    if (isSearchInProgress.value) return;
    isSearchInProgress.value = true;
    try {
        await loadUsers(searchValue, { prependFavorites: false, excludeFavorites: false });
    } finally {
        isSearchInProgress.value = false;
    }
};

const resetSearch = async () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchInput.value = '';
    await showDefaultView();
};

// Apply session
const applySession = async (username) => {
    showStatus('statusMessage', `Applying session for ${username}...`, 'info');

    try {
        const loginUrl = `${config.baseUrl.replace(/\/+$/, '')}/Auth/Login`;
        const payload = { username, password: config.defaultPassword, companydb: config.companyDb };

        const loginResponse = await fetchWithTimeout(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!loginResponse.ok) {
            const text = await safeText(loginResponse);
            throw new Error(`Login failed - ${loginResponse.status} ${loginResponse.statusText} - ${text.slice(0, 300)}`);
        }

        const loginData = await loginResponse.json();
        const jwtToken = loginData.Token;
        const jwtExpiredMs = typeof loginData.Expired === 'number' ? loginData.Expired : 86400000;
        if (!jwtToken) throw new Error('No token in login response');

        const refreshInfo = await getRefreshToken(jwtToken, username);

        // ✅ Normal JS: set cookies for CURRENT domain
        const domain = location.hostname;

        await clearAuthCookies(domain);
        await setJwtSplitCookies(jwtToken, domain, jwtExpiredMs);
        await setRefreshTokenCookie(refreshInfo.token, domain, refreshInfo.expiredMs);

        showStatus('statusMessage', `Session replaced successfully for ${username}!`, 'success');

        if (config.autoRefresh) {
            setTimeout(() => window.location.reload(), 800);
        }
    } catch (error) {
        console.error('Error applying session:', error);
        showStatus('statusMessage', `Error: ${error.message}`, 'error');
    }
};

const clearAuthCookies = async (domainIgnored) => {
    const cookies = (document.cookie || '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .map(p => {
            const eq = p.indexOf('=');
            return { name: eq >= 0 ? p.slice(0, eq) : p };
        });

    const targets = cookies
        .filter(c => c.name.startsWith('ESW_token_split_') || c.name === 'ESW_tokenRefresh')
        .map(c => c.name);

    const host = location.hostname;

    for (const name of targets) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
        document.cookie = `${name}=; Path=/; Domain=${host}; Max-Age=0; SameSite=Lax`;
        document.cookie = `${name}=; Path=/; Domain=.${host}; Max-Age=0; SameSite=Lax`;
    }
};


const setJwtSplitCookies = async (token, domainIgnored, expiredMs) => {
    const chunkSize = 2000;
    const chunks = [];
    for (let i = 0; i < token.length; i += chunkSize) chunks.push(token.substring(i, i + chunkSize));

    const maxAgeSec = Math.floor(((expiredMs || 86400000) / 1000));
    const secure = location.protocol === 'https:' ? '; Secure' : '';

    // remove existing chunks first
    await clearAuthCookies();

    for (let i = 0; i < chunks.length; i++) {
        const name = `ESW_token_split_${i}`;
        const value = encodeURIComponent(chunks[i]);
        document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
    }
};


const setRefreshTokenCookie = async (refreshToken, domainIgnored, expiredMs) => {
    const maxAgeSec = Math.floor(((expiredMs || 3600000) / 1000));
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    const value = encodeURIComponent(String(refreshToken || ''));
    document.cookie = `ESW_tokenRefresh=${value}; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
};


// Token viewer
const loadTokenTable = async () => {
    showStatus('tokensStatus', 'Memuat token...', 'info');

    try {
        await readTokensFromCookies();   // now uses document.cookie
        renderTokenTable();              // fills currentTokenRows

        // if tokens exist -> clear status
        if (tokenData.accessToken || tokenData.refreshToken) {
            clearStatus('tokensStatus');
        } else {
            showStatus('tokensStatus', 'Token tidak ditemukan pada domain ini.', 'info');
        }
    } catch (error) {
        console.error('Error loading tokens:', error);
        showStatus('tokensStatus', `Gagal memuat token: ${error.message}`, 'error');
    }
};


const readTokensFromCookies = async () => {
    tokenData.domain = location.hostname;

    const pairs = (document.cookie || '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .map(p => {
            const eq = p.indexOf('=');
            const name = eq >= 0 ? p.slice(0, eq) : p;
            const value = eq >= 0 ? decodeURIComponent(p.slice(eq + 1)) : '';
            return { name, value };
        });

    tokenData.accessToken = pairs
        .filter(c => c.name.startsWith('ESW_token_split_'))
        .sort((a, b) => getSplitIndex(a.name) - getSplitIndex(b.name))
        .map(c => c.value)
        .join('');

    tokenData.refreshToken = pairs.find(c => c.name === 'ESW_tokenRefresh')?.value || '';
};


const getSplitIndex = (name) => {
    const match = name.match(/ESW_token_split_(\d+)/);
    if (!match) return 0;
    const parsed = parseInt(match[1], 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const decodeJwt = (token) => {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        return { header, payload };
    } catch (error) {
        console.error('Failed to decode JWT', error);
        return null;
    }
};

const base64UrlDecode = (str) => {
    const normalized = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    // handle UTF-8 safely
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
};

const renderTokenTable = () => {
    currentTokenRows.value = [];
    const accessDecoded = decodeJwt(tokenData.accessToken);
    const refreshDecoded = decodeJwt(tokenData.refreshToken);

    if (!tokenData.accessToken && !tokenData.refreshToken) {
        currentTokenRows.value = [{ tokenLabel: '', field: '', value: 'Token tidak ditemukan', isInfo: true }];
        return;
    }

    appendTokenRows('ESW_token_split_*', tokenData.accessToken, accessDecoded);
    appendTokenRows('ESW_tokenRefresh', tokenData.refreshToken, refreshDecoded);
};

const appendTokenRows = (label, rawToken, decoded) => {
    if (!rawToken) {
        currentTokenRows.value.push({ tokenLabel: label, field: '', value: 'Token tidak ditemukan', isInfo: true });
        return;
    }

    if (!decoded) {
        currentTokenRows.value.push({ tokenLabel: label, field: '', value: 'Gagal decode token', isInfo: true });
        return;
    }

    const addEntries = (obj) => {
        Object.entries(obj || {}).forEach(([key, value]) => {
            const safeValue = typeof value === 'object' ? JSON.stringify(value) : value;
            currentTokenRows.value.push({
                tokenLabel: label,
                field: key,
                value: safeValue ?? '',
                isInfo: false
            });
        });
    };

    addEntries(decoded.payload);
};

// Test connection
const testConnection = async () => {
    try {
        const loginToken = await loginAsAdmin();
        const refreshInfo = await getRefreshToken(loginToken, config.adminUser);
        showStatus('settingsStatus', 'Test connection succeeded ✔', 'success');
        console.log('Test OK', { loginTokenLen: loginToken.length, refreshLen: refreshInfo.token.length });
    } catch (e) {
        showStatus('settingsStatus', 'Test connection failed: ' + e.message, 'error');
    }
};

// UI helpers
const showStatus = (target, message, type) => {
    if (target === 'statusMessage') {
        statusMessage.message = message;
        statusMessage.type = type;
    } else if (target === 'settingsStatus') {
        settingsStatus.message = message;
        settingsStatus.type = type;
    } else if (target === 'tokensStatus') {
        tokensStatus.message = message;
        tokensStatus.type = type;
    }
};

const clearStatus = (target) => {
    if (target === 'statusMessage') {
        statusMessage.message = '';
        statusMessage.type = '';
    } else if (target === 'settingsStatus') {
        settingsStatus.message = '';
        settingsStatus.type = '';
    } else if (target === 'tokensStatus') {
        tokensStatus.message = '';
        tokensStatus.type = '';
    }
};

const escapeHtml = (text) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

const safeText = async (resp) => {
    try {
        const clone = resp.clone();
        return await clone.text();
    } catch {
        return '';
    }
};

// Lifecycle
onMounted(async () => {
    await loadSettings();
    await loadFavoritesMap();
    await showDefaultView();
});

// Add keyframe animation for spinner
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(style);
}

// Watch for token search filter changes
watch([tokenSearchInput, showPermissions], () => {
    // Trigger computed property update
});
</script>
<template>
    <div :style="containerStyle">
        <!-- Tabs Header -->
        <div :style="tabsHeaderStyle">
            <button v-for="tab in tabs" :key="tab.id"
                :style="[tabButtonStyle, activeTab === tab.id && tabButtonActiveStyle]" @click="switchTab(tab.id)">
                {{ tab.label }}
            </button>
        </div>

        <!-- Replace Session Tab -->
        <div v-show="activeTab === 'replace-session'" :style="tabContentStyle">
            <div :style="searchContainerStyle">
                <input v-model="searchInput" type="text" :style="searchInputStyle"
                    placeholder="Search by Username atau Nama Lengkap..." @input="onSearchInput"
                    @keypress.enter="handleSearch" ref="searchInputRef" />
                <button :style="[btnStyle, btnPrimaryStyle]" @click="handleSearch">Search</button>
                <button :style="[btnStyle, btnSecondaryStyle]" @click="resetSearch">Reset</button>
            </div>

            <div v-if="statusMessage.message"
                :style="[statusMessageStyle, statusMessage.type === 'success' && statusMessageSuccessStyle, statusMessage.type === 'error' && statusMessageErrorStyle, statusMessage.type === 'info' && statusMessageInfoStyle]">
                {{ statusMessage.message }}
            </div>

            <div v-show="isLoading" :style="loadingActiveStyle">
                <div :style="spinnerStyle"></div>
                <p style="margin: 0;">Loading users...</p>
            </div>

            <div v-show="!isLoading" :style="tableContainerStyle">
                <table :style="tableStyle">
                    <thead :style="theadStyle">
                        <tr>
                            <th :style="thStyle">Fav</th>
                            <th :style="thStyle">Username</th>
                            <th :style="thStyle">Nama Lengkap</th>
                            <th :style="thStyle">Dept Head</th>
                            <th :style="thStyle">Super Admin</th>
                            <th :style="thStyle">Kode Dept</th>
                            <th :style="thStyle">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredUsers.length === 0">
                            <td colspan="7" :style="noUsersStyle">No users found</td>
                        </tr>
                        <tr v-for="user in filteredUsers" :key="user.Username" :style="tbodyRowStyle">
                            <td :style="tdStyle">
                                <button :style="[starBtnStyle, isFavorite(user.Username) && starBtnFavoritedStyle]"
                                    :title="isFavorite(user.Username) ? 'Unfavorite' : 'Favorite'"
                                    @click="toggleFavorite(user)"
                                    @mouseover="$event.target.style.transform = 'scale(1.1)'"
                                    @mouseout="$event.target.style.transform = 'scale(1)'">
                                    {{ isFavorite(user.Username) ? '★' : '☆' }}
                                </button>
                            </td>
                            <td :style="tdStyle">{{ escapeHtml(user.Username) }}</td>
                            <td :style="tdStyle">{{ escapeHtml(user.NamaLengkap || '-') }}</td>
                            <td :style="tdStyle">
                                <span :style="[badgeStyle, user.IsDeptHead ? badgeSuccessStyle : badgeDangerStyle]">
                                    {{ user.IsDeptHead ? 'Yes' : 'No' }}
                                </span>
                            </td>
                            <td :style="tdStyle">
                                <span :style="[badgeStyle, user.IsSuperAdmin ? badgeSuccessStyle : badgeDangerStyle]">
                                    {{ user.IsSuperAdmin ? 'Yes' : 'No' }}
                                </span>
                            </td>
                            <td :style="tdStyle">{{ escapeHtml(user.KodeDepartemen || '-') }}</td>
                            <td :style="tdStyle">
                                <button :style="[btnStyle, btnSuccessStyle]" @click="applySession(user.Username)">
                                    Apply
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Settings Tab -->
        <div v-show="activeTab === 'settings'" :style="tabContentStyle">
            <div :style="settingsFormStyle">
                <div :style="formGroupStyle">
                    <label for="baseUrl" :style="labelStyle">Base URL API:</label>
                    <input id="baseUrl" v-model="config.baseUrl" type="text" :style="formInputStyle"
                        placeholder="https://dev-ppl-project.phoenix-squad.eu.org" />
                </div>

                <div :style="formGroupStyle">
                    <label for="endpointPath" :style="labelStyle">Endpoint Path Users:</label>
                    <input id="endpointPath" v-model="config.endpointPath" type="text" :style="formInputStyle"
                        placeholder="/odata/DTO_MasterUser" />
                </div>

                <div :style="formGroupStyle">
                    <label for="adminUser" :style="labelStyle">User Admin:</label>
                    <input id="adminUser" v-model="config.adminUser" type="text" :style="formInputStyle"
                        placeholder="superadmin@eji.co.id" />
                </div>

                <div :style="formGroupStyle">
                    <label for="adminPassword" :style="labelStyle">Password Admin:</label>
                    <input id="adminPassword" v-model="config.adminPassword" type="text" :style="formInputStyle"
                        placeholder="123" />
                </div>

                <div :style="formGroupStyle">
                    <label for="defaultPassword" :style="labelStyle">Default Global User Password:</label>
                    <input id="defaultPassword" v-model="config.defaultPassword" type="text" :style="formInputStyle"
                        placeholder="123" />
                </div>

                <div :style="formGroupStyle">
                    <label for="companyDb" :style="labelStyle">Company DB:</label>
                    <input id="companyDb" v-model="config.companyDb" type="text" :style="formInputStyle"
                        placeholder="EJI" />
                </div>

                <div :style="formGroupStyle">
                    <label for="maxFetch" :style="labelStyle">Max data to fetch ($top):</label>
                    <input id="maxFetch" v-model.number="config.maxFetch" type="number" min="1" max="500" step="1"
                        :style="formInputStyle" placeholder="30" />
                </div>

                <div :style="[formGroupStyle, checkboxGroupStyle]">
                    <label :style="checkboxLabelStyle">
                        <input v-model="config.autoRefresh" type="checkbox" :style="checkboxInputStyle" />
                        Auto Refresh After Session Replaced
                    </label>
                </div>

                <div :style="formActionsStyle">
                    <button :style="[btnStyle, btnPrimaryStyle]" @click="saveSettings">Save Settings</button>
                    <button :style="[btnStyle, btnSecondaryStyle]" @click="resetSettings">Reset to Default</button>
                    <button :style="[btnStyle, btnSecondaryStyle]" @click="testConnection">Test Connection</button>
                </div>

                <div v-if="settingsStatus.message"
                    :style="[statusMessageStyle, settingsStatus.type === 'success' && statusMessageSuccessStyle, settingsStatus.type === 'error' && statusMessageErrorStyle, settingsStatus.type === 'info' && statusMessageInfoStyle]">
                    {{ settingsStatus.message }}
                </div>
            </div>
        </div>

        <!-- Tokens Tab -->
        <div v-show="activeTab === 'tokens'" :style="tabContentStyle">
            <div style="width: 100%;">

                <div v-if="tokensStatus.message"
                    :style="[statusMessageStyle, tokensStatus.type === 'success' && statusMessageSuccessStyle, tokensStatus.type === 'error' && statusMessageErrorStyle, tokensStatus.type === 'info' && statusMessageInfoStyle]">
                    {{ tokensStatus.message }}
                </div>

                <div :style="tokenFilterBarStyle">
                    <input v-model="tokenSearchInput" type="text" :style="[searchInputStyle, { flex: 1 }]"
                        placeholder="Cari Token, Field, atau Value..." />
                    <label :style="permissionsToggleStyle">
                        <input v-model="showPermissions" type="checkbox" :style="{ width: '16px', height: '16px' }" />
                        Show Permissions
                    </label>
                </div>

                <div :style="[tableContainerStyle, { maxHeight: '450px' }]">
                    <table :style="tableStyle">
                        <thead :style="theadStyle">
                            <tr>
                                <th :style="thStyle">Token</th>
                                <th :style="thStyle">Field</th>
                                <th :style="thStyle">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="filteredTokenRows.length === 0">
                                <td colspan="3" :style="emptyStateStyle">Token tidak ditemukan</td>
                            </tr>
                            <tr v-for="(row, index) in filteredTokenRows" :key="index" :style="tbodyRowStyle">
                                <td v-if="row.isInfo" colspan="2" :style="tdStyle">{{ escapeHtml(row.tokenLabel) }}</td>
                                <td v-else :style="tdStyle">{{ escapeHtml(row.tokenLabel) }}</td>
                                <td v-if="!row.isInfo" :style="tdStyle">{{ escapeHtml(row.field) }}</td>
                                <td :colspan="row.isInfo ? 2 : 1" :style="tdStyle">{{ escapeHtml(row.value) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>