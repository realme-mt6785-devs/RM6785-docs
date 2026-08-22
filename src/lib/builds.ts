import { getCollection, type CollectionEntry } from 'astro:content';

import { RENAMED_DEVICE } from '../../vendor/tooling/src/devices';
import { androidMajor, displayDate, hashtags, titleLine } from '../../vendor/tooling/src/fields';
import { inlineSegments, type InlineSegment } from '../../vendor/tooling/src/inline';
import type { Device, Post, PostType } from '../../vendor/tooling/src/types';

export type BuildEntry = CollectionEntry<'builds'>;
export type BuildData = BuildEntry['data'];

/** Public channel username, for deep-linking archived posts back to Telegram. */
const CHANNEL = 'RM6785';

/**
 * Slugs owned by the type-filtered index pages. A tag that normalised to one of
 * these would silently shadow a project, so `assertNoReservedTags` fails the
 * build instead of serving the wrong page.
 */
export const TYPE_SLUGS = { rom: 'roms', recovery: 'recoveries', kernel: 'kernels' } as const;
const RESERVED = new Set<string>(Object.values(TYPE_SLUGS));

/**
 * Projects the channel posted under more than one spelling. Case differences
 * need no entry — lowercasing the tag already folds CRDROID/CrDroid/crDroid.
 * These are the ones lowercasing cannot catch, kept explicit so no two genuinely
 * different ROMs get merged by accident. `PixelExperience` and
 * `PixelExperiencePlus` are deliberately absent: they are different builds.
 */
const TAG_ALIASES: Record<string, string> = {
	blaze: 'projectblaze',
	crdoid: 'crdroid', // typo in the original channel hashtag
	derpfestos: 'derpfest',
	havocos: 'havoc',
	// MATRIX and Matrixx were canonicalised to ProjectMatrixx in the records
	// themselves; these two entries only matter until vendor/records is bumped.
	matrix: 'projectmatrixx',
	matrixx: 'projectmatrixx',
	projectxtended: 'xtended',
	risingtechoss: 'risingos',
	superioros: 'superior',
	voltageos: 'voltage',
};

export const projectSlug = (tag: string): string => {
	const lower = tag.toLowerCase();
	return TAG_ALIASES[lower] ?? lower;
};

/** Folds retired codenames so one phone family is one filter option. */
export const deviceFamily = (device: Device): Device => RENAMED_DEVICE[device] ?? device;

/**
 * Archived records carry `telegram-message:<chatId>:<messageId>` instead of an
 * image URL, because the banner only exists inside Telegram. The message id is
 * still enough to link the original post.
 */
export const originalPostUrl = (banner: string): string | null => {
	const id = banner.match(/^telegram-message:-100\d+:(\d+)$/)?.[1];
	return id ? `https://t.me/${CHANNEL}/${id}` : null;
};

export const bannerImage = (banner: string): string | null =>
	banner.startsWith('https://') ? banner : null;

/** Drops the empty slot `hashtags()` leaves when `releaseType` is absent. */
export const tagsOf = (data: BuildData): string[] =>
	hashtags(data as unknown as Post).filter(Boolean);

export interface Build {
	id: string;
	data: BuildData;
	/** `<projectSlug>/<date>-<device>-<suffix>`, and the path under /builds/. */
	slug: string;
	project: string;
	title: string;
	tags: string[];
	date: string;
	displayDate: string;
	android: string;
	family: Device;
	banner: string | null;
	original: string | null;
}

const toBuild = (entry: BuildEntry): Build => {
	const data = entry.data;
	const project = projectSlug(data.tag);
	// The collection id is keyed on the raw lowercased tag; aliases have to be
	// applied here too or a renamed project would route to a page that has no
	// getStaticPaths entry.
	const slug = `${project}/${entry.id.split('/').slice(1).join('/')}`;

	return {
		id: entry.id,
		data,
		slug,
		project,
		title: titleLine(data as unknown as Post),
		tags: tagsOf(data),
		date: data.buildDate,
		displayDate: displayDate(data as unknown as Post),
		android: androidMajor(data as unknown as Post),
		family: deviceFamily(data.device),
		banner: bannerImage(data.banner),
		original: originalPostUrl(data.banner),
	};
};

const assertNoReservedTags = (builds: Build[]): void => {
	const clash = builds.find((build) => RESERVED.has(build.project));
	if (clash) {
		throw new Error(
			`Build record "${clash.id}" normalises to the reserved slug "${clash.project}", ` +
				`which the type-filtered index pages already own. Add an alias in src/lib/builds.ts.`,
		);
	}
};

/** Every build, newest first. Ties broken by id so the order is deterministic. */
export const loadBuilds = async (type?: PostType): Promise<Build[]> => {
	const all = (await getCollection('builds')).map(toBuild);
	assertNoReservedTags(all);

	return all
		.filter((build) => !type || build.data.postType === type)
		.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
};

export interface Project {
	slug: string;
	/** Casing taken from the newest record, so current branding wins. */
	name: string;
	builds: Build[];
}

export const groupByProject = (builds: Build[]): Project[] => {
	const groups = new Map<string, Build[]>();
	for (const build of builds) {
		const list = groups.get(build.project);
		if (list) list.push(build);
		else groups.set(build.project, [build]);
	}

	return [...groups]
		.map(([slug, list]) => ({ slug, name: list[0]!.data.tag, builds: list }))
		.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
};

export interface Facets {
	devices: Device[];
	androids: string[];
	types: PostType[];
	ruis: number[];
}

const uniqueSorted = <T>(values: T[]): T[] => [...new Set(values)].sort();

export const facetsOf = (builds: Build[]): Facets => ({
	devices: uniqueSorted(builds.map((build) => build.family)),
	androids: uniqueSorted(builds.map((build) => build.android).filter(Boolean)).reverse(),
	types: uniqueSorted(builds.map((build) => build.data.postType)),
	ruis: uniqueSorted(builds.map((build) => build.data.ruiVersion)),
});

/** Joins a /builds/ path onto the configured `base`, with no double slashes. */
export const buildsHref = (...segments: string[]): string => {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	const tail = segments.filter(Boolean).join('/').replace(/^\/+|\/+$/g, '');
	return `${base}/builds${tail ? `/${tail}` : ''}/`;
};

export type { InlineSegment };
export { inlineSegments };
