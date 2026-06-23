// Helper para obtener timestamp en zona horaria Argentina (UTC-3)
export function argentinaTimestamp() {
    const now = new Date();
    // UTC timestamp in ms
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Argentina offset: UTC-3 hours
    const argMs = utc - (3 * 60 * 60 * 1000);
    const d = new Date(argMs);

    const pad = (n, z = 2) => String(n).padStart(z, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const ms = String(d.getMilliseconds()).padStart(3, '0');

    // Formato: YYYY-MM-DDTHH:mm:ss.sss (sin Z)
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${ms}`;
}
