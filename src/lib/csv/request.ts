// Shared request→CSV extraction for the /api/connect/<agent> routes. All 7
// routes accepted the same three shapes (json {csv}, multipart file, raw text)
// with the same 5 MB cap — duplicated ~25 lines each. This is that logic in one
// tested place; routes keep only their agent-specific run + logging.

export const MAX_CSV_BYTES = 5 * 1024 * 1024; // 5 MB

export type CsvRequestResult =
  | { ok: true; csv: string; filename: string }
  | { ok: false; status: number; error: string };

/**
 * Pull a CSV string out of an incoming request. Accepts:
 *   - `application/json` with `{ csv, filename? }`
 *   - `multipart/form-data` with a `file` field
 *   - anything else → raw request text
 * Enforces the 5 MB cap (413 for an oversize upload, 400 for oversize/empty
 * body). On success returns the csv + filename; otherwise an error + status.
 */
export async function readCsvFromRequest(req: Request): Promise<CsvRequestResult> {
  let csv = '';
  let filename = '';
  const ct = req.headers.get('content-type') || '';

  if (ct.includes('application/json')) {
    const body = await req.json();
    csv = typeof body?.csv === 'string' ? body.csv : '';
    filename = typeof body?.filename === 'string' ? body.filename : '';
  } else if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (file && typeof file !== 'string') {
      if (file.size > MAX_CSV_BYTES) {
        return { ok: false, status: 413, error: 'File too large (5 MB max)' };
      }
      csv = await file.text();
      filename = file.name;
    }
  } else {
    csv = await req.text();
  }

  if (!csv || csv.length > MAX_CSV_BYTES) {
    return { ok: false, status: 400, error: 'Send a CSV in the body (json {csv}, form file, or raw text).' };
  }
  return { ok: true, csv, filename };
}
