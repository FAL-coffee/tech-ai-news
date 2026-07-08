"use client";

import { useState } from "react";

export function ArticleImage({
  src,
  className,
  lazy = true,
}: {
  src: string;
  className: string;
  lazy?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} no-image-placeholder`}>
        <span>tech/ai news</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      loading={lazy ? "lazy" : undefined}
      onError={() => setFailed(true)}
    />
  );
}
