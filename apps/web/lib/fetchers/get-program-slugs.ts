import { prisma } from "@dub/prisma";
import { cache } from "react";

// Called from `generateStaticParams`. During Docker/CI builds the database
// may be unreachable — swallow the error and skip SSG so the build succeeds.
// Pages then fall back to on-demand rendering at request time.
export const getProgramSlugs = cache(async () => {
  try {
    return await prisma.program.findMany({
      select: {
        slug: true,
      },
      orderBy: {
        applications: {
          _count: "desc",
        },
      },
      take: 250,
    });
  } catch (error) {
    console.warn(
      "[getProgramSlugs] DB unreachable, returning [] (static params skipped):",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
});
