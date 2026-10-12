// MovieSelection: self-contained TMDB movie browser.
// Usage: <MovieSelection onSelectMovie={(movie) => ...} />
//
// onSelectMovie receives ONE object:
// {
//   id:          number        TMDB movie id
//   title:       string
//   poster:      string|null   full poster image URL, or null if TMDB has none
//   releaseYear: number|null
//   trailerKey:  string|null   YouTube video id of the trailer, or null if none
// }
import { useEffect, useState } from 'react';
import './MovieSelection.css';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGES = 'https://image.tmdb.org/t/p';
// Vite exposes only variables starting with VITE_. Set this in your .env file (see setup notes).
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Each collection is a real TMDB query. Edit the params to tune a collection.
const COLLECTIONS = [
  { id: 'popular', title: 'Popular Movies', path: '/movie/popular', params: {} },
  { id: 'cult', title: 'Cult Classics', path: '/discover/movie',
    params: { sort_by: 'vote_count.desc', 'vote_average.gte': 7.5, 'vote_count.gte': 3000, 'primary_release_date.lte': '1999-12-31' } },
  { id: 'midnight', title: 'Midnight Screenings', path: '/discover/movie',
    params: { with_genres: '27|53|9648', sort_by: 'popularity.desc', 'vote_average.gte': 6.5, 'vote_count.gte': 500 } }, // horror | thriller | mystery
  { id: 'gems', title: 'Hidden Gems', path: '/discover/movie',
    params: { sort_by: 'vote_average.desc', 'vote_average.gte': 7.5, 'vote_count.gte': 300, 'vote_count.lte': 2500 } },
];

// ---------- helpers ----------

// One place for all TMDB requests. Throws Error with a readable message.
async function tmdbFetch(path, params = {}) {
  if (!TMDB_KEY) throw new Error('TMDB key missing. Add VITE_TMDB_API_KEY to your .env file and restart Vite.');
  const url = new URL(TMDB_API + path);
  const headers = {};
  // A v4 "Read Access Token" starts with "eyJ" and goes in a header; a v3 key goes in the URL.
  if (TMDB_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${TMDB_KEY}`;
  else url.searchParams.set('api_key', TMDB_KEY);
  Object.entries({ language: 'en-US', ...params }).forEach(([k, v]) => url.searchParams.set(k, v));

  let res;
  try { res = await fetch(url, { headers }); }
  catch { throw new Error('Could not reach TMDB. Check your internet connection.'); }
  if (res.status === 401) throw new Error('TMDB rejected the API key.');
  if (!res.ok) throw new Error(`TMDB request failed (${res.status}).`);
  return res.json();
}

const imageUrl = (path, size) => (path ? `${TMDB_IMAGES}/${size}${path}` : null);
const yearOf = (date) => (date ? Number(date.slice(0, 4)) : null);

// ---------- small presentational components ----------

function MovieCard({ movie, onOpen }) {
  const poster = imageUrl(movie.poster_path, 'w342');
  return (
    <button className="ms-card" onClick={() => onOpen(movie.id)}>
      {poster
        ? <img className="ms-card-poster" src={poster} alt={`${movie.title} poster`} loading="lazy" />
        : <div className="ms-card-poster ms-card-noposter">{movie.title}</div>}
      <span className="ms-card-title">{movie.title}</span>
      <span className="ms-card-year">{yearOf(movie.release_date) || 'Unknown year'}</span>
    </button>
  );
}

// Shows loading skeletons, an error, an empty message, or the movie cards.
function MovieRow({ state, onOpen }) {
  if (state.loading) return <div className="ms-row">{Array.from({ length: 6 }, (_, i) => <div key={i} className="ms-skeleton" />)}</div>;
  if (state.error) return <p className="ms-error">{state.error}</p>;
  if (state.movies.length === 0) return <p className="ms-muted">No movies found.</p>;
  return <div className="ms-row">{state.movies.map((m) => <MovieCard key={m.id} movie={m} onOpen={onOpen} />)}</div>;
}

// Details popup. Fetches full info, cast and videos for one movie.
function MovieDetails({ movieId, onClose, onSelectMovie }) {
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    let cancelled = false; // ignore the response if the popup closed or changed meanwhile
    tmdbFetch(`/movie/${movieId}`, { append_to_response: 'credits,videos', include_video_language: 'en,null' })
      .then((data) => { if (!cancelled) setMovie(data); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [movieId]);

  useEffect(() => { // Escape closes the popup
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prefer an official YouTube trailer; fall back to any YouTube trailer; else null.
  const trailers = (movie?.videos?.results || []).filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const trailerKey = (trailers.find((v) => v.official) || trailers[0])?.key || null;

  function handleSelect() {
    onSelectMovie({
      id: movie.id,
      title: movie.title,
      poster: imageUrl(movie.poster_path, 'w500'),
      releaseYear: yearOf(movie.release_date),
      trailerKey,
    });
  }

  return (
    <div className="ms-overlay" onClick={onClose}>
      <div className="ms-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="ms-close" onClick={onClose} aria-label="Close">&times;</button>
        {error && <p className="ms-error">{error}</p>}
        {!movie && !error && <p className="ms-muted">Loading...</p>}
        {movie && (
          <div className="ms-details">
            {imageUrl(movie.poster_path, 'w500')
              ? <img className="ms-details-poster" src={imageUrl(movie.poster_path, 'w500')} alt={`${movie.title} poster`} />
              : <div className="ms-details-poster ms-card-noposter">No poster</div>}
            <div className="ms-details-info">
              <h2>{movie.title} <span className="ms-muted">{yearOf(movie.release_date)}</span></h2>
              <p className="ms-meta">
                {movie.vote_count > 0 ? `${movie.vote_average.toFixed(1)} / 10` : 'Not yet rated'}
                {movie.runtime > 0 && ` · ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`}
                {movie.genres.length > 0 && ` · ${movie.genres.map((g) => g.name).join(', ')}`}
              </p>
              <p>{movie.overview || 'No synopsis available.'}</p>
              {movie.credits?.cast?.length > 0 && (
                <p className="ms-muted">Cast: {movie.credits.cast.slice(0, 6).map((c) => c.name).join(', ')}</p>
              )}
              {showTrailer && trailerKey && (
                <div className="ms-trailer">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${trailerKey}`} title="Trailer" allowFullScreen />
                </div>
              )}
              <div className="ms-actions">
                <button className="ms-btn ms-btn-primary" onClick={handleSelect}>Select this movie</button>
                {trailerKey
                  ? <button className="ms-btn" onClick={() => setShowTrailer((s) => !s)}>{showTrailer ? 'Hide trailer' : 'Watch trailer'}</button>
                  : <span className="ms-muted">Trailer unavailable</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- main component ----------

export default function MovieSelection({ onSelectMovie }) {
  const [openId, setOpenId] = useState(null);                       // movie shown in the details popup
  const [featured, setFeatured] = useState({ loading: true, movie: null, error: '' });
  const [rows, setRows] = useState({});                              // collection id -> { loading, movies, error }
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ loading: false, movies: [], error: '' });

  // Featured movie: the top trending movie that has a backdrop image.
  useEffect(() => {
    tmdbFetch('/trending/movie/week')
      .then((d) => setFeatured({ loading: false, movie: d.results.find((m) => m.backdrop_path) || null, error: '' }))
      .catch((e) => setFeatured({ loading: false, movie: null, error: e.message }));
  }, []);

  // Each collection loads independently, so one failure doesn't break the others.
  useEffect(() => {
    COLLECTIONS.forEach((c) => {
      tmdbFetch(c.path, c.params)
        .then((d) => setRows((r) => ({ ...r, [c.id]: { loading: false, movies: d.results.slice(0, 12), error: '' } })))
        .catch((e) => setRows((r) => ({ ...r, [c.id]: { loading: false, movies: [], error: e.message } })));
    });
  }, []);

  // Search with a short delay (debounce) so we don't call TMDB on every keystroke.
  useEffect(() => {
    const text = query.trim();
    if (!text) { setSearch({ loading: false, movies: [], error: '' }); return; }
    let cancelled = false;
    setSearch((s) => ({ ...s, loading: true, error: '' }));
    const timer = setTimeout(() => {
      tmdbFetch('/search/movie', { query: text, include_adult: false })
        .then((d) => { if (!cancelled) setSearch({ loading: false, movies: d.results, error: '' }); })
        .catch((e) => { if (!cancelled) setSearch({ loading: false, movies: [], error: e.message }); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const hero = featured.movie;
  return (
    <section className="ms-root">
      <header className="ms-header">
        <h1 className="ms-title">Choose a Film</h1>
        <input className="ms-search" type="search" placeholder="Search movies" value={query} onChange={(e) => setQuery(e.target.value)} />
      </header>

      {query.trim() ? (
        <div className="ms-section">
          <h2 className="ms-heading">Results</h2>
          <MovieRow state={search} onOpen={setOpenId} />
        </div>
      ) : (
        <>
          {featured.error && <p className="ms-error">{featured.error}</p>}
          {hero && (
            <div className="ms-hero" style={{ backgroundImage: `linear-gradient(to top, #100D0E 5%, rgba(16,13,14,.3)), url(${imageUrl(hero.backdrop_path, 'w1280')})` }}>
              <p className="ms-eyebrow">Featured this week</p>
              <h2 className="ms-hero-title">{hero.title}</h2>
              <p className="ms-hero-text">{hero.overview}</p>
              <button className="ms-btn ms-btn-primary" onClick={() => setOpenId(hero.id)}>View details</button>
            </div>
          )}
          {COLLECTIONS.map((c) => (
            <div className="ms-section" key={c.id}>
              <h2 className="ms-heading">{c.title}</h2>
              <MovieRow state={rows[c.id] || { loading: true, movies: [], error: '' }} onOpen={setOpenId} />
            </div>
          ))}
        </>
      )}

      {/* TMDB requires this notice wherever its data is used. Add the official TMDB logo next to it. */}
      <footer className="ms-attribution">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>

      {openId && <MovieDetails movieId={openId} onClose={() => setOpenId(null)} onSelectMovie={onSelectMovie} />}
    </section>
  );
}
