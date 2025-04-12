import { clsx } from 'clsx';

interface Props {
  tags: string[];
}

export default function TagList({ tags }: Props) {
  const currentTag = new URLSearchParams(window.location.search).get('tag');

  return (
    <>
      {tags
        .map((tag: string) => (
          <a
            key={tag}
            className={clsx('tag', {
              active: tag === currentTag,
            })}
            // below is to make sure when the user clicks on an active
            // tag it will essentially deselect it
            href={tag === currentTag ? '/blog' : `/blog?tag=${encodeURIComponent(tag)}`}
          >
            {tag}
          </a>
        ))
        .reduce((acc, elem) =>
          acc === null ? (
            elem
          ) : (
            <>
              {acc} {elem}
            </>
          )
        )}
    </>
  );
}
