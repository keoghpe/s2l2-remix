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
  return await paginatedSpotifyFetch(`me/playlists`, accessToken);
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

  data.playlist = await spotifyFetch(`playlists/${playlistId}`, accessToken)
  data.tracks = await paginatedSpotifyFetch( `playlists/${playlistId}/tracks`, accessToken);

  data.tracks.reverse();

  return data;
}

export async function playThing(
  deviceId: FormDataEntryValue | null,
  accessToken: string,
  thingToPlay: {}
) {
  const resource = `me/player/play?device_id=${deviceId}`

  spotifyFetch(resource, accessToken, "PUT", thingToPlay)
}

export async function fetchAlbum(
  albumId: string,
  accessToken: string,
) {
  const resource = `albums/${albumId}`
  return await spotifyFetch(resource, accessToken);
}

async function paginatedSpotifyFetch(resourceToPaginate: string, accessToken: string) {
  let accumulator = []
  let fetchMore = true
  let offset = 0

  while (fetchMore) {
    const resource = resourceToPaginate + `?limit=50&offset=${offset}`

    let spotifyResponse = await spotifyFetch(resource, accessToken)
    accumulator = [...accumulator, ...spotifyResponse.items]

    fetchMore = spotifyResponse.items.length > 0
    offset += 50
  }
  return accumulator
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

  return await response.json()
}
