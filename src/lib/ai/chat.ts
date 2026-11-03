import { TreeData, Person } from '@/types/tree';
import {
  getPersonFullName,
  getParents,
  getSpouses,
  getChildren,
  getSiblings,
  getAge,
  isDeceased,
  serializeTreeForAI,
  calculateKinship,
} from '@/lib/tree-utils';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts people mentioned in a natural-language question, sorted by the position
 * where each person's name first appears in the question.
 * Prioritizes full name, firstName, nickname, and maidenName matches so shared
 * family surnames (e.g. "Smith") do not falsely match the entire tree.
 */
export function findMentionedPeople(question: string, people: Person[]): Person[] {
  const q = question.toLowerCase();
  const matched: Array<{ person: Person; index: number }> = [];

  for (const p of people) {
    const fullName = getPersonFullName(p).toLowerCase();
    const first = p.firstName?.trim().toLowerCase() || '';
    const nick = p.nickname?.trim().toLowerCase() || '';
    const maiden = p.maidenName?.trim().toLowerCase() || '';

    let bestIndex = Infinity;

    if (fullName && fullName.includes(' ')) {
      const idx = q.indexOf(fullName);
      if (idx !== -1) bestIndex = Math.min(bestIndex, idx);
    }

    if (first) {
      const re = new RegExp(`\\b${escapeRegExp(first)}(?:'s|s')?\\b`, 'i');
      const m = re.exec(q);
      if (m && m.index !== undefined) {
        bestIndex = Math.min(bestIndex, m.index);
      }
    }

    if (nick) {
      const re = new RegExp(`\\b${escapeRegExp(nick)}(?:'s|s')?\\b`, 'i');
      const m = re.exec(q);
      if (m && m.index !== undefined) {
        bestIndex = Math.min(bestIndex, m.index);
      }
    }

    if (maiden) {
      const re = new RegExp(`\\b${escapeRegExp(maiden)}(?:'s|s')?\\b`, 'i');
      const m = re.exec(q);
      if (m && m.index !== undefined) {
        bestIndex = Math.min(bestIndex, m.index);
      }
    }

    if (bestIndex !== Infinity) {
      matched.push({ person: p, index: bestIndex });
    }
  }

  matched.sort((a, b) => a.index - b.index);
  return matched.map((m) => m.person);
}

/**
 * Pure deterministic kinship, timeline, location, biography, and oral history reasoning engine.
 */
export function answerFamilyTreeQuestionLocal(question: string, treeData: TreeData): string {
  const q = question.toLowerCase().trim();
  const { people, relationships, tree } = treeData;
  const mentionedPeople = findMentionedPeople(question, people);

  // 1. Two (or more) specific people mentioned -> Full LCA Kinship & Lineage Traversal
  if (mentionedPeople.length >= 2) {
    const p1 = mentionedPeople[0];
    const p2 = mentionedPeople[1];
    const name1 = getPersonFullName(p1);
    const name2 = getPersonFullName(p2);

    const kin1to2 = calculateKinship(p1.id, p2.id, treeData);
    const kin2to1 = calculateKinship(p2.id, p1.id, treeData);

    const parents1 = getParents(p1.id, people, relationships);
    const parent1Names = parents1.map((p) => getPersonFullName(p)).join(' and ');
    const childWord =
      p1.gender === 'female' ? 'daughter' : p1.gender === 'male' ? 'son' : 'child';
    const parentClause = parent1Names ? ` (${childWord} of ${parent1Names})` : '';

    const commonAncestorNames = kin1to2.commonAncestorIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is Person => Boolean(p))
      .map((p) => getPersonFullName(p));

    if (kin1to2.relationship !== 'Unknown' && kin1to2.relationship !== 'Unrelated') {
      const relLower = kin1to2.relationship.toLowerCase();
      const reverseRelLower = kin2to1.relationship.toLowerCase();
      let response = `**${name1}** is **${name2}**'s **${relLower}**${parentClause}.`;

      if (
        kin2to1.relationship &&
        kin2to1.relationship !== 'Unknown' &&
        kin2to1.relationship !== 'Unrelated'
      ) {
        response += ` Conversely, **${name2}** is **${name1}**'s **${reverseRelLower}**.`;
      }

      if (
        commonAncestorNames.length > 0 &&
        !kin1to2.isDirectAncestor &&
        !kin1to2.isDirectDescendant
      ) {
        response += ` They share common ancestor${commonAncestorNames.length > 1 ? 's' : ''} **${commonAncestorNames.join(' and ')}**.`;
      }

      return response;
    }

    return `I found both **${name1}** and **${name2}** in the "${tree.name}" family tree, and there is no direct consanguineous or affinity connection recorded between them yet.`;
  }

  // 2. Oldest / Eldest Relative
  if (q.includes('oldest') || q.includes('eldest')) {
    const filterLiving = q.includes('living') || q.includes('alive');
    const candidates = people
      .filter((p) => p.birthDate && (!filterLiving || !isDeceased(p)))
      .sort((a, b) => new Date(a.birthDate!).getTime() - new Date(b.birthDate!).getTime());

    if (candidates.length > 0) {
      const oldest = candidates[0];
      const age = getAge(oldest);
      const placeStr = oldest.birthPlace ? ` in ${oldest.birthPlace}` : '';
      const statusStr = isDeceased(oldest)
        ? `passed away on ${oldest.deathDate}${age !== null ? ` at age ${age}` : ''}`
        : `is ${age ?? '?'} years old`;
      return `The oldest ${filterLiving ? 'living ' : ''}person in the tree is **${getPersonFullName(oldest)}**, born on **${oldest.birthDate}**${placeStr}, who ${statusStr}.`;
    }
  }

  // 3. Youngest Relative
  if (q.includes('youngest')) {
    const peopleWithBirth = people
      .filter((p) => p.birthDate)
      .sort((a, b) => new Date(b.birthDate!).getTime() - new Date(a.birthDate!).getTime());
    if (peopleWithBirth.length > 0) {
      const youngest = peopleWithBirth[0];
      const parents = getParents(youngest.id, people, relationships);
      const parentNames = parents.map((p) => getPersonFullName(p)).join(' and ');
      const parentStr = parentNames ? ` Their parents are **${parentNames}**.` : '';
      const age = getAge(youngest);
      const placeStr = youngest.birthPlace ? ` in ${youngest.birthPlace}` : '';
      return `The youngest person in the tree is **${getPersonFullName(youngest)}**, born on **${youngest.birthDate}**${placeStr} (age ${age ?? 'under 1'}).${parentStr}`;
    }
  }

  // 4. Multi-Month Birthdays (e.g., "Who was born in March or April?")
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const matchedMonths = months.filter((m) => q.includes(m));
  if (matchedMonths.length > 0) {
    const matchedMonthIndices = new Set(
      matchedMonths.map((m) => (months.indexOf(m) + 1).toString().padStart(2, '0'))
    );
    const matches = people.filter(
      (p) => p.birthDate && matchedMonthIndices.has(p.birthDate.substring(5, 7))
    );
    const monthLabels = matchedMonths
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
      .join(' or ');

    if (matches.length > 0) {
      const names = matches
        .map((p) => `**${getPersonFullName(p)}** (${p.birthDate}${p.birthPlace ? `, ${p.birthPlace}` : ''})`)
        .join(', ');
      return `Relatives born in ${monthLabels}: ${names}.`;
    }
    return `There is no one recorded as being born in ${monthLabels} in this family tree.`;
  }

  // 5. Total People, Statistics & Relationship Counts
  if (
    q.includes('how many people') ||
    q.includes('how many members') ||
    q.includes('total people') ||
    q.includes('connections') ||
    q.includes('count') ||
    q.includes('statistics') ||
    q.includes('size')
  ) {
    const total = people.length;
    const living = people.filter((p) => !isDeceased(p)).length;
    const deceased = total - living;
    const totalRels = relationships.length;
    const marriages = relationships.filter((r) => r.type === 'spouse').length;
    const parentChildLinks = relationships.filter((r) => r.type === 'parent_child').length;
    const siblingLinks = relationships.filter((r) => r.type === 'sibling').length;

    return `There are **${total} people** and **${totalRels} total connections** in the **${tree.name}** (${living} living members and ${deceased} deceased members). Connections include **${marriages} marriages**, **${parentChildLinks} parent-child links**, and **${siblingLinks} sibling links**.`;
  }

  // 6. Oral History Audio, Vault Recordings, Transcripts & Documents
  if (
    q.includes('audio') ||
    q.includes('oral') ||
    q.includes('recording') ||
    q.includes('voice') ||
    q.includes('story') ||
    q.includes('stories') ||
    q.includes('vault') ||
    q.includes('transcript') ||
    q.includes('certificate') ||
    q.includes('document') ||
    (q.includes('memories') && mentionedPeople.length === 0)
  ) {
    const targetPeople = mentionedPeople.length === 1 ? [mentionedPeople[0]] : people;
    const entries: string[] = [];

    for (const p of targetPeople) {
      for (const att of p.attachments || []) {
        const desc = att.description ? ` — "${att.description}"` : '';
        const dur = att.durationSeconds ? ` (${att.durationSeconds}s)` : '';
        entries.push(`**${getPersonFullName(p)}**: *${att.title}* [${att.type}]${dur}${desc}`);
      }
    }

    if (entries.length > 0) {
      return `Oral history recordings and vault documents in **${tree.name}**:\n\n${entries.map((e) => `• ${e}`).join('\n\n')}`;
    }
    return `No audio stories or vault documents have been recorded for that query yet.`;
  }

  // 7. Single Person Queries (Career, Relatives, Milestones, Bio, Locations)
  if (mentionedPeople.length === 1) {
    const p = mentionedPeople[0];
    const fullName = getPersonFullName(p);

    if (q.includes('spouse') || q.includes('married') || q.includes('wife') || q.includes('husband')) {
      const spouses = getSpouses(p.id, people, relationships);
      if (spouses.length > 0) {
        return `**${fullName}** is married to **${spouses.map((s) => getPersonFullName(s)).join(', ')}**.`;
      }
      return `**${fullName}** does not have any recorded spouses.`;
    }

    if (q.includes('grandchildren') || q.includes('grandchild') || q.includes('granddaughter') || q.includes('grandson')) {
      const children = getChildren(p.id, people, relationships);
      const grandchildren = children.flatMap((c) => getChildren(c.id, people, relationships));
      const uniqueGrandchildren = Array.from(new Map(grandchildren.map((g) => [g.id, g])).values());
      if (uniqueGrandchildren.length > 0) {
        return `**${fullName}**'s grandchildren are **${uniqueGrandchildren.map((g) => getPersonFullName(g)).join(', ')}**.`;
      }
      return `**${fullName}** does not have any recorded grandchildren.`;
    }

    if (q.includes('grandparent') || q.includes('grandfather') || q.includes('grandmother')) {
      const parents = getParents(p.id, people, relationships);
      const grandparents = parents.flatMap((parent) => getParents(parent.id, people, relationships));
      const uniqueGrandparents = Array.from(new Map(grandparents.map((g) => [g.id, g])).values());
      if (uniqueGrandparents.length > 0) {
        return `**${fullName}**'s grandparents are **${uniqueGrandparents.map((g) => getPersonFullName(g)).join(', ')}**.`;
      }
      return `**${fullName}** does not have any recorded grandparents.`;
    }

    if (q.includes('children') || q.includes('kids') || q.includes('son') || q.includes('daughter')) {
      const children = getChildren(p.id, people, relationships);
      if (children.length > 0) {
        return `**${fullName}**'s children: **${children.map((c) => getPersonFullName(c)).join(', ')}**.`;
      }
      return `**${fullName}** does not have any recorded children.`;
    }

    if (q.includes('parents') || q.includes('mother') || q.includes('father')) {
      const parents = getParents(p.id, people, relationships);
      if (parents.length > 0) {
        return `**${fullName}**'s parents are **${parents.map((c) => getPersonFullName(c)).join(' and ')}**.`;
      }
      return `**${fullName}** does not have any recorded parents.`;
    }

    if (q.includes('sibling') || q.includes('brother') || q.includes('sister')) {
      const siblings = getSiblings(p.id, people, relationships);
      if (siblings.length > 0) {
        return `**${fullName}**'s siblings: **${siblings.map((s) => getPersonFullName(s)).join(', ')}**.`;
      }
      return `**${fullName}** does not have any recorded siblings.`;
    }

    if (q.includes('maiden') || q.includes('nee') || q.includes('née')) {
      if (p.maidenName) {
        return `**${fullName}**'s maiden name is **${p.maidenName}** (née ${p.maidenName}).`;
      }
      return `There is no maiden name recorded for **${fullName}**.`;
    }

    if (q.includes('where') && (q.includes('born') || q.includes('from') || q.includes('birthplace'))) {
      if (p.birthPlace) {
        return `**${fullName}** was born in **${p.birthPlace}**${p.birthDate ? ` on ${p.birthDate}` : ''}.`;
      }
      return `There is no birthplace recorded for **${fullName}** yet.`;
    }

    // Comprehensive Career / Biography / Milestones / Oral History Summary
    const dates = `${p.birthDate || 'Unknown'} to ${p.deathDate || (!isDeceased(p) ? 'Present' : 'Unknown')}`;
    const parts: string[] = [`**${fullName}** (${dates})`];

    if (p.birthPlace) {
      parts.push(`Born in **${p.birthPlace}**.`);
    }
    if (p.maidenName) {
      parts.push(`Maiden name: **${p.maidenName}**.`);
    }

    const occupation = p.customFields
      ? Object.entries(p.customFields).find(([k]) => k.toLowerCase() === 'occupation')?.[1]
      : undefined;
    const hobbies = p.customFields
      ? Object.entries(p.customFields).find(([k]) => k.toLowerCase() === 'hobbies')?.[1]
      : undefined;

    if (occupation) {
      parts.push(`Occupation: **${occupation}**.`);
    }
    if (hobbies) {
      parts.push(`Hobbies: ${hobbies}.`);
    }
    if (p.bio) {
      parts.push(`Bio: ${p.bio}`);
    }
    if (p.milestones && p.milestones.length > 0) {
      parts.push(
        `Milestones: ${p.milestones.map((m) => `${m.description} (${m.date})`).join('; ')}.`
      );
    }
    if (p.attachments && p.attachments.length > 0) {
      parts.push(
        `Vault Memories: ${p.attachments
          .map((a) => `"${a.title}"${a.description ? ` (${a.description})` : ''}`)
          .join('; ')}.`
      );
    }

    const spouses = getSpouses(p.id, people, relationships);
    const children = getChildren(p.id, people, relationships);
    if (spouses.length > 0) {
      parts.push(`Spouse: ${spouses.map((s) => getPersonFullName(s)).join(', ')}.`);
    }
    if (children.length > 0) {
      parts.push(`Children: ${children.map((c) => getPersonFullName(c)).join(', ')}.`);
    }

    return parts.join(' ');
  }

  // 8. Timeline & Milestones across the Tree
  if (
    q.includes('milestone') ||
    q.includes('timeline') ||
    q.includes('retired') ||
    q.includes('retirement') ||
    q.includes('graduated') ||
    q.includes('graduation')
  ) {
    const milestoneItems: string[] = [];
    for (const p of people) {
      for (const m of p.milestones || []) {
        milestoneItems.push(`**${getPersonFullName(p)}** — ${m.description} (${m.date})`);
      }
    }
    if (milestoneItems.length > 0) {
      return `Recorded family milestones in **${tree.name}**:\n\n${milestoneItems.map((item) => `• ${item}`).join('\n')}`;
    }
  }

  // 9. Geographic / Location / City Queries
  const matchingByPlace = people.filter(
    (p) => p.birthPlace && q.includes(p.birthPlace.split(',')[0].trim().toLowerCase())
  );
  if (matchingByPlace.length > 0) {
    const placeName = matchingByPlace[0].birthPlace!;
    const names = matchingByPlace
      .map((p) => `**${getPersonFullName(p)}** (${p.birthDate || 'n.d.'})`)
      .join(', ');
    return `Relatives born in **${placeName}**: ${names}.`;
  }

  if (q.includes('location') || q.includes('birthplace') || q.includes('cities') || q.includes('where')) {
    const placeGroups = new Map<string, string[]>();
    for (const p of people) {
      if (!p.birthPlace) continue;
      const list = placeGroups.get(p.birthPlace) || [];
      list.push(getPersonFullName(p));
      placeGroups.set(p.birthPlace, list);
    }
    if (placeGroups.size > 0) {
      const summary = Array.from(placeGroups.entries())
        .map(([place, names]) => `**${place}**: ${names.join(', ')}`)
        .join(' | ');
      return `Family birthplaces across **${tree.name}**: ${summary}.`;
    }
  }

  // Default Grounded Fallback
  return `I am your AI Family Historian for the **${tree.name}** tree (${people.length} members, ${relationships.length} connections). You can ask me about kinship between any two relatives (e.g., "How is Emily related to Robert?"), career milestones ("Tell me about Robert's career"), birth months ("Who was born in March or April?"), locations ("Who was born in Chicago?"), or recorded audio memories.`;
}

export async function answerFamilyTreeQuestion(
  question: string,
  treeData: TreeData,
  history: ChatMessage[] = []
): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                `You are an AI family historian for the family tree '${treeData.tree.name}'. You must answer the user's question accurately and strictly based on the following family tree data. If the answer is not in the data, politely say that the information has not been added to the family tree yet. Never hallucinate facts.\n\nFamily Tree Data:\n` +
                serializeTreeForAI(treeData),
            },
            ...history.map((msg) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: question },
          ],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.error('OpenAI API call failed, falling back to local kinship historian engine', e);
    }
  }

  return answerFamilyTreeQuestionLocal(question, treeData);
}
