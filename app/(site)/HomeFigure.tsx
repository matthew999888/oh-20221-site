import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/permissions";
import { toDriveThumbnail } from "@/lib/google-drive";

type Image = {
  url: string;
  alt: string;
  caption: string | null;
};

/**
 * A named photo slot on the homepage.
 *
 * When the slot is filled it renders the image. When it is empty, a
 * public visitor sees nothing at all — an empty dashed box is clutter
 * to someone who cannot act on it — while a signed-in editor sees a
 * placeholder telling them the slot exists and where to fill it.
 */
export default async function HomeFigure({
  image,
  slot,
  label
}: {
  image?: Image;
  slot: string;
  label: string;
}) {
  if (image) {
    return (
      <figure className="pub-figure">
        <div className="pub-figure__frame">
          {/* Alt text is required on the model, so it is always real. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={toDriveThumbnail(image.url, 1200)} alt={image.alt} loading="lazy" />
        </div>
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    );
  }

  const session = await getServerSession(authOptions);
  const isEditor = session ? canEdit(session.user.roles, "website-admin") : false;
  if (!isEditor) return null;

  return (
    <figure className="pub-figure">
      <div className="pub-figure__frame">
        <span className="pub-figure__empty">
          Empty image slot: <strong>{slot}</strong>
          <br />
          {label}
          <br />
          <br />
          Add a Google Drive link under Admin &rarr; Website &rarr; Photos.
        </span>
      </div>
    </figure>
  );
}
