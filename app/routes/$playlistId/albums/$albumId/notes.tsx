import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import * as React from "react";
import invariant from "tiny-invariant";
import { marked } from "marked";

import { upsertNote, getNote } from "~/models/note.server";
import { spotifyStrategy } from "~/services/auth.server";
import { requireUserId } from "~/session.server";

export async function action({ request, params }: ActionArgs) {
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

  const note = await upsertNote({
    rating,
    body,
    spotifyUserId,
    spotifyAlbumId,
  });

  return redirect(`/${params.playlistId}/albums/${params.albumId}`);
}

export async function loader({ params, request }) {
  const spotifyUserId = await requireUserId(request);
  const spotifyAlbumId = params.albumId;
  invariant(spotifyAlbumId, "Album not found");

  const note = await getNote({
    spotifyUserId,
    spotifyAlbumId,
  });

  return json(
    note
      ? { ...note, noteHTML: marked(note.body) }
      : { rating: null, body: null, noteHTML: null }
  );
}

export default function NewNotePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const ratingRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const isEditing = false;

  React.useEffect(() => {
    if (actionData?.errors?.rating) {
      ratingRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    }
  }, [actionData]);

  return isEditing ? (
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
            defaultValue={data.rating || ""}
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
    <article
      className="prose lg:prose-xl"
      dangerouslySetInnerHTML={{ __html: data.noteHTML }}
    />
  );
}
