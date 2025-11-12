import { scanDb } from '@x402scan/scan-db';
import {
  listTags,
  createTag,
  assignTagToResource,
} from '@/services/db/resources/tag';
import type { listResourcesWithPagination } from '@/services/db/resources/resource';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getTracer } from '@lmnr-ai/lmnr';
import { MAIN_TAGS } from './main-tags';

const randomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
};

// Extract the resource type from listResourcesWithPagination return value
type ResourceWithRelations = Awaited<
  ReturnType<typeof listResourcesWithPagination>
>['items'][number];

const labelingSchema = z.object({
  tag: z.string(),
});

const buildLabelingPrompt = () => {
  const tagCategories = Object.entries(MAIN_TAGS)
    .map(([name, description]) => `- ${name}: ${description}`)
    .join('\n');

  return `Your task is to assign reasonable tags to each resource you are given.

_GUIDELINES_FOR_TAG_ASSIGNMENT_:
- The tags should be short and concise, one word only.
- Your goal is to cluster resources into meaningful groups based on the tag they are assigned to.

Tag Categories:

${tagCategories}

_VERY IMPORTANT_:
- Resources will expose a list of "accept bodies". These are different ways the resource can be invoked.
- You must choose from an existing tag. Do not create new tags under any circumstances.

- Most resources will expose a single "default" accept body, which is the main way to invoke the resource.
- Each accept body will have a description of what it is, and what it does.
- The tag should be assigned to the resource, which should consider all of the accept objects provided to you.


To assign tags, you must output the name of the tag you are assigning.

{_RESOURCE_URL_}

{_RESOURCE_DESCRIPTIONS_}

{_CURRENT_AVAILABLE_TAGS_}
`;
};

export const labelingPass = async (
  resource: ResourceWithRelations,
  metadata: {
    sessionId: string;
  }
) => {
  const tags = await listTags({ filterTags: [] });
  const resourceDescription = `
    RESOURCE DESCRIPTIONS:
    ${resource.accepts.map(accept => `- ${accept.description}`).join('\n')}

    RESOURCE INPUT PARAMETERS   (if applicable):
    ${JSON.stringify(resource.accepts.map(accept => JSON.stringify(accept.outputSchema, null, 2)))}
    `;

  const prompt = buildLabelingPrompt()
    .replace('{_RESOURCE_URL_}', resource.resource.toString())
    .replace('{_RESOURCE_DESCRIPTIONS_}', resourceDescription)
    .replace(
      '{_CURRENT_AVAILABLE_TAGS_}',
      tags.map(tag => `- ${tag.name}`).join('\n')
    );

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    prompt,
    schema: labelingSchema,
    temperature: 0.1,
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: {
        resourceId: resource.id,
        sessionId: metadata.sessionId,
      },
    },
  });

  if (!result.object) {
    throw new Error('No tag found');
  }

  const tag = result.object.tag;
  const tagData = await scanDb.tag.findFirst({ where: { name: tag } });
  if (!tagData) {
    const newTag = await createTag({ name: tag, color: randomColor() });
    await assignTagToResource({ resourceId: resource.id, tagId: newTag.id });
    return { resource, tag: newTag };
  } else {
    await assignTagToResource({ resourceId: resource.id, tagId: tagData.id });
    return { resource, tag: tagData };
  }
};
