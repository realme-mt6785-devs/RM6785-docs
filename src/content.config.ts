import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { ExtendDocsSchema as LucodeSchema } from 'lucode-starlight/schema';

/**
 * One published build, as recorded in RM6785-ROM-post (`vendor/records`).
 *
 * Deliberately looser than that repo's own `Post` type: the schema there
 * describes what a *contributor* must submit, while these records include 336
 * posts backfilled from the channel by the archiver, which skips the per-kind
 * required fields whenever `banner` is an internal reference. Measured against
 * the current records, only the fields below are guaranteed — `download.fileSize`
 * is absent from 68, `links.sources` from 76 and `links.supportGroup` from 86.
 * Anything optional here has to be conditional in the templates too.
 */
const bullets = z.array(z.string());

const buildSchema = z.object({
	$schema: z.string().optional(),
	postType: z.enum(['rom', 'recovery', 'kernel']),
	name: z.string(),
	tag: z.string(),
	stability: z.enum(['STABLE', 'BETA', 'ALPHA']),
	releaseType: z.enum(['OFFICIAL', 'UNOFFICIAL']).optional(),
	device: z.enum(['RM6785', 'nemo', 'salaa', 'RMX2001', 'RMX2151']),
	androidVersion: z.string().optional(),
	kernelVersion: z.string().optional(),
	ruiVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
	author: z.string(),
	buildDate: z.string(),
	banner: z.string(),
	changelog: bullets,
	bugs: bullets,
	notes: bullets.optional(),
	download: z.object({
		buildType: z.string().optional(),
		fileSize: z.string().optional(),
		url: z.string(),
	}),
	links: z.object({
		sources: z.string().optional(),
		screenshots: z.string().optional(),
		supportGroup: z.string().optional(),
		donate: z.string().optional(),
	}),
});

export type BuildRecord = z.infer<typeof buildSchema>;

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: LucodeSchema }) }),
	builds: defineCollection({
		loader: glob({
			pattern: '**/*.json',
			base: './vendor/records',
			/**
			 * `<tagSlug>/<date>-<device>-<suffix>`, which is also the URL under
			 * /builds/. The suffix comes from the filename because tag, date and
			 * device alone are not unique — LPlus shipped m2154 and m2156 for the
			 * same device on the same day.
			 */
			generateId: ({ entry, data }) => {
				const stem = entry.replace(/\.json$/, '').split('/').pop() ?? entry;
				const suffix = stem.split('-').pop() ?? '';
				const device = String(data.device).toLowerCase();
				return `${String(data.tag).toLowerCase()}/${String(data.buildDate)}-${device}-${suffix}`;
			},
		}),
		schema: buildSchema,
	}),
};
