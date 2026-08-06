// Servicios de Búsqueda para Ubicaciones (Nominatim OSM) y Cine/Teatro (Multi-fuente iTunes & Wikipedia)

/**
 * Buscador de Lugares con autocompletado flexible (Nominatim OpenStreetMap)
 */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const cleanQuery = query.trim();
    const encodedQuery = encodeURIComponent(cleanQuery);
    
    // Probar búsqueda con prioridad en Argentina / Latam y fallback global
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=8&accept-language=es`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CitasApp/1.0'
      }
    });

    if (!response.ok) return [];
    const data = await response.json();

    return data.map((item) => {
      const parts = item.display_name.split(',');
      const name = parts[0].trim();
      const details = parts.slice(1, 3).join(',').trim();
      
      return {
        id: item.place_id || Math.random().toString(),
        name: name,
        fullAddress: item.display_name,
        details: details || name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'place'
      };
    });
  } catch (error) {
    console.error('Error buscando lugares:', error);
    return [];
  }
}

/**
 * Buscador de Películas Multi-Fuente (iTunes API + Wikipedia API + Normalizador de Títulos)
 */
export async function searchMovies(query) {
  if (!query || query.trim().length < 2) return [];

  const results = [];
  const cleanQuery = query.trim();
  
  // Normalizar variaciones populares (ej: "spiderman" -> "Spider-Man")
  const normalizedQuery = cleanQuery.replace(/spiderman/i, 'Spider-Man');

  try {
    // 1. Consulta en iTunes API (Películas)
    const itunesUrl = `https://itunes.apple.com/search?media=movie&term=${encodeURIComponent(normalizedQuery)}&limit=6&lang=es_es`;
    const itunesRes = await fetch(itunesUrl);
    
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      (itunesData.results || []).forEach((item) => {
        results.push({
          id: `movie-${item.trackId}`,
          title: item.trackName,
          genre: item.primaryGenreName || 'Película',
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : '',
          poster: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : '',
          director: item.artistName || '',
          type: 'movie'
        });
      });
    }

    // 2. Consulta de respaldo en iTunes API (General / Todos los medios por si es un especial/show/animación)
    if (results.length < 3) {
      const genUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(normalizedQuery)}&limit=5&lang=es_es`;
      const genRes = await fetch(genUrl);
      if (genRes.ok) {
        const genData = await genRes.json();
        (genData.results || []).forEach((item) => {
          const title = item.trackName || item.collectionName;
          if (title && !results.some((r) => r.title.toLowerCase() === title.toLowerCase())) {
            results.push({
              id: `gen-${item.trackId || Math.random()}`,
              title: title,
              genre: item.primaryGenreName || 'Película / Serie',
              year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : '',
              poster: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : '',
              type: 'movie'
            });
          }
        });
      }
    }

    // 3. Consulta de respaldo en Wikipedia API (Español) para encontrar películas, series o adaptaciones (ej: Spider-Man: Brand New Day)
    if (results.length < 5) {
      const wikiUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery + ' pelicula')}&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const wikiHits = wikiData.query?.search || [];

        wikiHits.slice(0, 4).forEach((hit) => {
          const cleanTitle = hit.title.replace(/<\/?[^>]+(>|$)/g, "");
          if (!results.some((r) => r.title.toLowerCase().includes(cleanTitle.toLowerCase()))) {
            results.push({
              id: `wiki-m-${hit.pageid}`,
              title: cleanTitle,
              genre: 'Película / Cine',
              year: '',
              poster: '',
              type: 'movie'
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error buscando películas:', error);
  }

  return results;
}

/**
 * Buscador de Obras de Teatro en Tiempo Real (iTunes Show & Wikipedia API)
 */
export async function searchTheatre(query) {
  if (!query || query.trim().length < 2) return [];

  const results = [];
  const cleanQuery = query.trim();

  try {
    // 1. Consulta en iTunes (Medios y Espectáculos)
    const itunesUrl = `https://itunes.apple.com/search?media=show&term=${encodeURIComponent(cleanQuery)}&limit=5&lang=es_es`;
    const itunesRes = await fetch(itunesUrl);
    
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      (itunesData.results || []).forEach((item) => {
        results.push({
          id: `theatre-${item.trackId}`,
          title: item.trackName || item.collectionName,
          genre: item.primaryGenreName || 'Teatro',
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : '',
          poster: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : '',
          type: 'theatre'
        });
      });
    }

    // 2. Consulta en Wikipedia API para Obras de Teatro
    const wikiUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery + ' obra de teatro')}&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const wikiHits = wikiData.query?.search || [];

      wikiHits.slice(0, 5).forEach((hit) => {
        const cleanTitle = hit.title.replace(/<\/?[^>]+(>|$)/g, "");
        if (!results.some((r) => r.title.toLowerCase() === cleanTitle.toLowerCase())) {
          results.push({
            id: `wiki-t-${hit.pageid}`,
            title: cleanTitle,
            genre: 'Obra de Teatro',
            year: '',
            poster: '',
            type: 'theatre'
          });
        }
      });
    }
  } catch (error) {
    console.error('Error buscando obras de teatro:', error);
  }

  return results;
}
