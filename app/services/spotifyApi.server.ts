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
    const response = await fetch(
        `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
        {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
        },
        method: "GET",
        }
    );
    if (!response.ok) {
        throw new Error(response.statusText);
    }

    let playlists = await response.json();
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

  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      method: "GET",
    }
  );
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  let playlist = await response.json();

  data.playlist = {
    id: playlistId,
    name: playlist.name,
  }

  let fetchMore = true;
  let offset = 0;

  while (fetchMore) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&offset=${offset}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    let tracks = await response.json();
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
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
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
  const response = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      method: "GET",
    }
  );
  if (!response.ok) {
    throw new Error(response.statusText);
    //     throw new Response("Not Found", { status: 404 });
  }

  return await response.json();
}