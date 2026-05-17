// Minimal Odoo XML-RPC client (server-side only).
// Auth: ODOO_API_KEY is used as the password in the standard authenticate call.

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_API_KEY = process.env.ODOO_API_KEY;
const ODOO_USERNAME = process.env.ODOO_USERNAME || 'admin';

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeValue(v) {
  if (v === null || v === undefined) {
    return '<value><nil/></value>';
  }
  if (typeof v === 'boolean') {
    return `<value><boolean>${v ? 1 : 0}</boolean></value>`;
  }
  if (typeof v === 'number') {
    if (Number.isInteger(v)) {
      return `<value><int>${v}</int></value>`;
    }
    return `<value><double>${v}</double></value>`;
  }
  if (typeof v === 'string') {
    return `<value><string>${xmlEscape(v)}</string></value>`;
  }
  if (Array.isArray(v)) {
    const items = v.map(serializeValue).join('');
    return `<value><array><data>${items}</data></array></value>`;
  }
  if (typeof v === 'object') {
    const members = Object.entries(v)
      .map(([k, val]) => `<member><name>${xmlEscape(k)}</name>${serializeValue(val)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${xmlEscape(String(v))}</string></value>`;
}

function buildRequest(method, params) {
  const paramsXml = params.map((p) => `<param>${serializeValue(p)}</param>`).join('');
  return `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${paramsXml}</params></methodCall>`;
}

// Tiny XML-RPC response parser. Handles the value shapes Odoo returns for read/search.
function parseValue(node) {
  // node is a <value> element (string of XML inside <value>...</value>)
  // We parse recursively from a cursor-based scanner.
  const inner = node.trim();
  if (!inner) return '';
  const tagMatch = inner.match(/^<([a-zA-Z0-9]+)(\s[^>]*)?>([\s\S]*)<\/\1>$/);
  if (!tagMatch) {
    // bare string inside <value>
    return decodeEntities(inner);
  }
  const tag = tagMatch[1];
  const body = tagMatch[3];
  switch (tag) {
    case 'string':
      return decodeEntities(body);
    case 'int':
    case 'i4':
      return parseInt(body, 10);
    case 'double':
      return parseFloat(body);
    case 'boolean':
      return body.trim() === '1';
    case 'nil':
      return null;
    case 'array': {
      const dataMatch = body.match(/<data>([\s\S]*)<\/data>/);
      if (!dataMatch) return [];
      return extractValues(dataMatch[1]).map(parseValue);
    }
    case 'struct': {
      const members = extractMembers(body);
      const out = {};
      for (const m of members) {
        out[m.name] = parseValue(m.value);
      }
      return out;
    }
    default:
      return decodeEntities(body);
  }
}

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractValues(xml) {
  const out = [];
  let depth = 0;
  let start = -1;
  const re = /<\/?value>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[0] === '<value>') {
      if (depth === 0) start = m.index + '<value>'.length;
      depth++;
    } else {
      depth--;
      if (depth === 0 && start !== -1) {
        out.push(xml.slice(start, m.index));
        start = -1;
      }
    }
  }
  return out;
}

function extractMembers(xml) {
  const out = [];
  const re = /<member>([\s\S]*?)<\/member>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const nameMatch = body.match(/<name>([\s\S]*?)<\/name>/);
    const valueMatch = body.match(/<value>([\s\S]*)<\/value>/);
    if (nameMatch && valueMatch) {
      out.push({ name: decodeEntities(nameMatch[1]), value: valueMatch[1] });
    }
  }
  return out;
}

function parseResponse(xml) {
  const faultMatch = xml.match(/<fault>([\s\S]*?)<\/fault>/);
  if (faultMatch) {
    const valueMatch = faultMatch[1].match(/<value>([\s\S]*)<\/value>/);
    const fault = valueMatch ? parseValue(valueMatch[1]) : { faultString: 'Unknown XML-RPC fault' };
    const err = new Error(fault.faultString || 'Odoo XML-RPC fault');
    err.fault = fault;
    throw err;
  }
  const valueMatch = xml.match(/<params>\s*<param>\s*<value>([\s\S]*)<\/value>\s*<\/param>\s*<\/params>/);
  if (!valueMatch) return null;
  return parseValue(valueMatch[1]);
}

async function call(endpoint, method, params) {
  if (!ODOO_URL) throw new Error('ODOO_URL is not configured');
  const body = buildRequest(method, params);
  const res = await fetch(`${ODOO_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseResponse(text);
}

let cachedUid = null;

async function authenticate() {
  if (cachedUid) return cachedUid;
  if (!ODOO_DB || !ODOO_API_KEY) {
    throw new Error('ODOO_DB and ODOO_API_KEY must be set');
  }
  const uid = await call('/xmlrpc/2/common', 'authenticate', [
    ODOO_DB,
    ODOO_USERNAME,
    ODOO_API_KEY,
    {},
  ]);
  if (!uid) throw new Error('Odoo authentication failed');
  cachedUid = uid;
  return uid;
}

export async function executeKw(model, method, args = [], kwargs = {}) {
  const uid = await authenticate();
  return call('/xmlrpc/2/object', 'execute_kw', [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    model,
    method,
    args,
    kwargs,
  ]);
}

export async function searchRead(model, domain = [], fields = [], limit = 80) {
  return executeKw(model, 'search_read', [domain], { fields, limit });
}

export async function version() {
  return call('/xmlrpc/2/common', 'version', []);
}
