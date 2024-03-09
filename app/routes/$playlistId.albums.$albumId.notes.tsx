import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import * as React from "react";
import invariant from "tiny-invariant";
import { marked } from "marked";

import { upsertNote, getNote } from "~/models/note.server";
import { spotifyStrategy } from "~/services/auth.server";
import { requireUserId } from "~/session.server";
import { getTags, updateTags } from "~/models/hashTag.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const spotifyUserId = await requireUserId(request);
  const spotifyAlbumId = params.albumId;
  invariant(spotifyAlbumId, "Album not found");

  const formData = await request.formData();
  const rating = Number(formData.get("rating"));
  const body = formData.get("body");

  if (typeof rating !== "number" || rating < 0 || rating > 10) {
    return json(
      { errors: { rating: "rating must be between 0 and 10", body: null } },
      { status: 400 }
    );
  }

  if (typeof body !== "string" || body.length === 0) {
    return json(
      { errors: { body: "Body is required", rating: null } },
      { status: 400 }
    );
  }

  const _note = await upsertNote({
    rating,
    body,
    spotifyUserId,
    spotifyAlbumId,
  });

  const _tags = await updateTags({
    body,
    spotifyAlbumId,
    spotifyUserId,
  });

  return redirect(`/${params.playlistId}/albums/${params.albumId}/notes`);
}

export async function loader({ params, request }) {
  const spotifyUserId = await requireUserId(request);
  const spotifyAlbumId = params.albumId;
  invariant(spotifyAlbumId, "Album not found");

  const note = await getNote({
    spotifyUserId,
    spotifyAlbumId,
  });

  const tags = await getTags({
    spotifyAlbumId,
    spotifyUserId,
  });

  return json(
    note
      ? {
          ...note,
          noteHTML: marked(note.body),
          tags: tags,
        }
      : { rating: null, body: null, noteHTML: null, tags: [] }
  );
}

export default function NewNotePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const ratingRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = React.useState(!data.noteHTML);
  const [rating, setRating] = React.useState(data.rating || 0);
  const transition = useNavigation();
  let isSaving = transition.state === "submitting";
  let [wasSaving, setWasSaving] = React.useState(false);

  React.useEffect(() => {
    if (actionData?.errors?.rating) {
      ratingRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    }
  }, [actionData]);

  React.useEffect(() => {
    if (wasSaving && !isSaving) {
      setEditing(false);
    }
    setWasSaving(isSaving);
  }, [isSaving]);

  // console.log(data.rating);

  return editing ? (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      className="p-5"
    >
      <div>
        <label className="flex w-full flex-col gap-1 text-white">
          <span>Rating: </span>
          <div className="text-3xl">
            {Array.from({ length: rating }, (_, i) => (
              <span onClick={() => setRating(i + 1)}>&#9733;</span>
            ))}
            {Array.from({ length: 10 - rating }, (_, i) => (
              <span onClick={() => setRating(rating + i + 1)}>&#9734;</span>
            ))}
          </div>

          <input
            ref={ratingRef}
            name="rating"
            className="flex-1 rounded-md border-2 border-blue-500 bg-gray-900 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.rating ? true : undefined}
            aria-errormessage={
              actionData?.errors?.rating ? "rating-error" : undefined
            }
            type="number"
            min="0"
            max="10"
            value={rating}
            hidden
          />
        </label>
        {actionData?.errors?.rating && (
          <div className="pt-1 text-red-700" id="rating-error">
            {actionData.errors.rating}
          </div>
        )}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1 text-white">
          <span>Body: </span>
          <textarea
            ref={bodyRef}
            name="body"
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 bg-gray-900 py-2 px-3 text-lg leading-6"
            aria-invalid={actionData?.errors?.body ? true : undefined}
            aria-errormessage={
              actionData?.errors?.body ? "body-error" : undefined
            }
            defaultValue={data.body || ""}
          />
        </label>
        {actionData?.errors?.body && (
          <div className="pt-1 text-red-700" id="body-error">
            {actionData.errors.body}
          </div>
        )}
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  ) : (
    <div>
      <div
        className="inline-block rounded  bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        onClick={() => setEditing(true)}
      >
        Edit
      </div>

      <article
        className="prose dark:prose-invert lg:prose-xl"
        dangerouslySetInnerHTML={{ __html: data.noteHTML }}
      />

      <p>
        {data.tags.map(({ id, tag }) => (
          <span className="bg-blue border-blue btn-primary hover:bg-blue-light mr-2 rounded-full py-2 px-4 font-sans text-sm font-semibold text-white no-underline shadow-md hover:text-white focus:outline-none active:shadow-none">
            <Link to={`/tags/${tag}`}>#{tag}</Link>
          </span>
        ))}
      </p>
    </div>
  );
}
