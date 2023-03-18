interface HasImages {
  images: SpotifyImage[]
}

interface Identifyable {
  id: string
  name: string
}

export type SpotifyPlaylist = {
  tracks: SpotifyTrack[]
} & Identifyable & HasImages

export type SpotifyImage = {
  url: string
}

export type SpotifyArtist = Identifyable
export type SpotifyAlbum = Identifyable & HasImages

export type SpotifyTrack = {
  artists: SpotifyArtist[] 
  album: SpotifyAlbum
}

type PlaylistAndTracks = {
  playlist: SpotifyPlaylist
  tracks: SpotifyTrack[]
}

export const fetchPlaylists = async (accessToken: string): Promise<SpotifyPlaylist[]> => {
  return await paginatedSpotifyFetch<SpotifyPlaylist>(`me/playlists`, accessToken);
}

export const fetchPlaylist = async (accessToken: string, playlistId: string): Promise<PlaylistAndTracks> => {
  const playlist = await spotifyFetch(`playlists/${playlistId}`, accessToken)
  const tracks = await paginatedSpotifyFetch<SpotifyTrack>( `playlists/${playlistId}/tracks`, accessToken);
  tracks.reverse();

  return {playlist, tracks};
}

export async function playThing(
  deviceId: FormDataEntryValue | null,
  accessToken: string,
  thingToPlay: {}
) {
  spotifyFetch( `me/player/play?device_id=${deviceId}`, accessToken, "PUT", thingToPlay)
}

export async function fetchAlbum(
  albumId: string,
  accessToken: string,
): Promise<SpotifyAlbum> {
  return await spotifyFetch(`albums/${albumId}`, accessToken);
}

async function paginatedSpotifyFetch<Accumulated>(resourceToPaginate: string, accessToken: string) {
  let accumulator: Accumulated[] = []
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

// HOW CAN I DO NONSENSE LIKE THIS???

// navigate("user/:userId", { userId: "2" });

// // ✅ Looks good! `dashboardId` is optional.
// navigate("user/:userId/dashboard(/:dashboardId)", { userId: "2" });

// // ❌ `userId` is missing. Add one to fix the error!
// navigate("user/:userId/dashboard(/:dashboardId)", { dashboardId: "2" });

// // ❌ `oops` isn't a parameter. Remove it to fix the error!
// navigate("user/:userId/dashboard(/:dashboardId)", { userId: "2", oops: ":(" });

// // 👇 Scroll to see how this works!

// // 🤫 Here are the kind of things you will soon be able to do!
// type ParseUrlParams<Url> =
//   Url extends `${infer Path}(${infer OptionalPath})`
//     ? ParseUrlParams<Path> & Partial<ParseUrlParams<OptionalPath>>
//     : Url extends `${infer Start}/${infer Rest}`
//     ? ParseUrlParams<Start> & ParseUrlParams<Rest>
//     : Url extends `:${infer Param}`
//     ? { [K in Param]: string }
//     : {};

// // navigate to a different route
// function navigate<T extends string>(
//   path: T,
//   params: ParseUrlParams<T>
// ) {
//   // interpolate params
//   let url = Object.entries<string>(params).reduce<string>(
//     (path, [key, value]) => path.replace(`:${key}`, value),
//     path
//   );

//   // clean url
//   url = url.replace(/(\(|\)|\/?:[^\/]+)/g, '')

//   // update url
//   history.pushState({}, '', url);
// }