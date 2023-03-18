export type SpotifyPlaylist = {
  id: string
  name: string
  images: Array<{
    url: string
  }>
}

export const fetchPlaylists = async (accessToken: string) => {
  let fetchMore = true;
  let offset = 0;
  let allPlaylists: SpotifyPlaylist[] = [];

  while (fetchMore) {
    const resource = `me/playlists?limit=50&offset=${offset}`

    let playlists = await spotifyFetch(resource, accessToken)
    allPlaylists = [...allPlaylists, ...playlists.items];

    fetchMore = playlists.items.length > 0;
    offset += 50;
  }

  return allPlaylists;
}

export const fetchPlaylist = async (accessToken: string, playlistId: string) => {
  let data = {
    playlist: {},
    tracks: [],
  }

  const resource = `playlists/${playlistId}`
  let playlist = await spotifyFetch(resource, accessToken)

  data.playlist = {
    id: playlistId,
    name: playlist.name,
  }

  let fetchMore = true;
  let offset = 0;

  while (fetchMore) {
    const resource = `playlists/${playlistId}/tracks?limit=50&offset=${offset}`

    let tracks = await spotifyFetch(resource, accessToken);
    data.tracks = [...data.tracks, ...tracks.items];

    fetchMore = tracks.items.length > 0;
    offset += 50;
  }

  data.tracks.reverse();

  return data;
}

export async function playThing(
  deviceId: FormDataEntryValue | null,
  accessToken: string,
  thingToPlay: {}
) {
  const resource = `me/player/play?device_id=${deviceId}`
  const response = await fetch(
    `https://api.spotify.com/v1/` + resource,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      method: "PUT",
      body: JSON.stringify(thingToPlay),
    }
  );
  if (!response.ok) {
    throw new Error(response.statusText);
  }
}

export async function fetchAlbum(
  albumId: string,
  accessToken: string,
) {
  const resource = `albums/${albumId}`
  return await spotifyFetch(resource, accessToken);
}

async function spotifyFetch(resource: string, accessToken: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/` + resource,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      method: "GET",
    }
  )
  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const responseJSON = await response.json()
  return responseJSON
}
