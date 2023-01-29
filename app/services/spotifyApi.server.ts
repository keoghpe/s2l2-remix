export const fetchPlaylists = async (accessToken: string) => {
  let fetchMore = true;
  let offset = 0;
  let allPlaylists = [];

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