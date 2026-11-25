/**
 * Owner mode gates the add / edit / delete place controls.
 *
 * This is a VISIBILITY gate, not a security boundary. The app is a static,
 * client-only site with no backend: every visitor only ever mutates their own
 * `localStorage` copy, which reaches no one else and vanishes when they clear
 * site data. Showing them an "Add a place" button therefore promises something
 * the app cannot deliver — hiding it is the point, and there is no shared data
 * behind the gate for anyone to protect.
 *
 * Unlock with `?owner=<OWNER_KEY>`. Any other value (e.g. `?owner=0`) locks it
 * again, which is the escape hatch on a shared machine.
 */

/** Query parameter that toggles owner mode. */
export const OWNER_PARAM = 'owner';

/**
 * Value that `?owner=` must match. Set `NEXT_PUBLIC_OWNER_KEY` in the
 * deployment to use something less guessable than the default.
 *
 * `NEXT_PUBLIC_*` values are inlined into the client bundle, so this is
 * obscurity rather than a secret: treat it as "keeps passers-by out", not
 * "keeps a determined person out".
 */
export const OWNER_KEY = process.env.NEXT_PUBLIC_OWNER_KEY || '1';
