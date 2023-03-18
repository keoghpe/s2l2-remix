export type SpotifyPlaylist = {
  id: string
  name: string
  images: SpotifyImage[]
  tracks: SpotifyTrack[]
}

export type SpotifyImage = {
  url: string
}

export type SpotifyTrack = {
  artists: [{
    name: string
  }]
  album: {
    id: string
    images: SpotifyImage[]
  }
}

export const fetchPlaylists = async (accessToken: string): Promise<SpotifyPlaylist[]> => {
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

type PlaylistAndTracks = {
  playlist: SpotifyPlaylist | null
  tracks: SpotifyTrack[]
}

export const fetchPlaylist = async (accessToken: string, playlistId: string): Promise<PlaylistAndTracks> => {
  let data: PlaylistAndTracks = {
    playlist: null,
    tracks: [],
  }

  const resource = `playlists/${playlistId}`
  data.playlist = await spotifyFetch(resource, accessToken)

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

  spotifyFetch(
    resource, accessToken, "PUT", thingToPlay
  )
}

export async function fetchAlbum(
  albumId: string,
  accessToken: string,
) {
  const resource = `albums/${albumId}`
  return await spotifyFetch(resource, accessToken);
}

async function spotifyFetch(
  resource: string,
  accessToken: string,
  http_method: "GET" | "PUT" = "GET",
  body: Object | null = null
   ) {
  const response = await fetch(
    `https://api.spotify.com/v1/` + resource,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      method: http_method,
      body: body && JSON.stringify(body),
    }
  )
  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const responseJSON = await response.json()
  return responseJSON
}
