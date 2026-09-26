import { TreeData, Person, Relationship } from '@/types/tree';
import { getPersonFullName, getParents, getSpouses, getChildren, getSiblings, getAge, isDeceased, serializeTreeForAI } from '@/lib/tree-utils';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export async function answerFamilyTreeQuestion(question: string, treeData: TreeData, history: ChatMessage[] = []): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI family historian for the family tree '${treeData.tree.name}'. You must answer the user's question accurately and strictly based on the following family tree data. If the answer is not in the data, politely say that the information has not been added to the family tree yet. Never hallucinate facts.\n\nFamily Tree Data:\n` + serializeTreeForAI(treeData)
            },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: question }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.error('OpenAI API call failed, falling back to mock responder', e);
    }
  }

  // Simulate natural delay
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

  const q = question.toLowerCase();
  
  const mentionedPeople = treeData.people.filter(p => {
    return (p.firstName && q.includes(p.firstName.toLowerCase())) ||
           (p.lastName && q.includes(p.lastName.toLowerCase())) ||
           (p.nickname && q.includes(p.nickname.toLowerCase()));
  });

  // Heuristic 1: Oldest / Youngest
  if (q.includes('oldest') || q.includes('eldest')) {
    const peopleWithBirth = treeData.people.filter(p => p.birthDate).sort((a, b) => new Date(a.birthDate!).getTime() - new Date(b.birthDate!).getTime());
    if (peopleWithBirth.length > 0) {
      const oldest = peopleWithBirth[0];
      const age = getAge(oldest);
      const ageStr = oldest.deathDate ? 'who passed away' : `who is ${age ?? '?'} years old`;
      return `The oldest person in the tree is ${getPersonFullName(oldest)}, born on ${oldest.birthDate}, ${ageStr}.`;
    }
  }

  if (q.includes('youngest')) {
    const peopleWithBirth = treeData.people.filter(p => p.birthDate).sort((a, b) => new Date(b.birthDate!).getTime() - new Date(a.birthDate!).getTime());
    if (peopleWithBirth.length > 0) {
      const youngest = peopleWithBirth[0];
      const parents = getParents(youngest.id, treeData.people, treeData.relationships);
      const parentNames = parents.map(p => getPersonFullName(p)).join(' and ');
      const parentStr = parentNames ? ` Their parents are ${parentNames}.` : '';
      const age = getAge(youngest);
      return `The youngest person in the tree is ${getPersonFullName(youngest)}, born on ${youngest.birthDate} (age ${age ?? 'under 1'}).${parentStr}`;
    }
  }

  // Heuristic 2: Birth months
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthMatch = months.find(m => q.includes(m));
  if (monthMatch) {
    const monthIndex = (months.indexOf(monthMatch) + 1).toString().padStart(2, '0');
    const matches = treeData.people.filter(p => p.birthDate && p.birthDate.substring(5, 7) === monthIndex);
    if (matches.length > 0) {
      const names = matches.map(p => `${getPersonFullName(p)} (${p.birthDate})`).join(', ');
      return `People born in ${monthMatch.charAt(0).toUpperCase() + monthMatch.slice(1)}: ${names}.`;
    } else {
      return `There is no one recorded as being born in ${monthMatch.charAt(0).toUpperCase() + monthMatch.slice(1)} in this family tree.`;
    }
  }

  // Heuristic 3: Total people / count
  if (q.includes('how many people') || q.includes('how many members') || q.includes('total people') || q.includes('count') || q.includes('size')) {
    const total = treeData.people.length;
    const living = treeData.people.filter(p => !isDeceased(p)).length;
    const deceased = total - living;
    const marriages = treeData.relationships.filter(r => r.type === 'spouse').length;
    return `There are a total of ${total} people in the "${treeData.tree.name}" family tree. Currently, there are ${living} living members and ${deceased} deceased members, with ${marriages} marriages/relationships recorded.`;
  }

  // Heuristic 4 & 5: People mentioned
  if (mentionedPeople.length === 2) {
    const p1 = mentionedPeople[0];
    const p2 = mentionedPeople[1];
    
    if (getSpouses(p1.id, treeData.people, treeData.relationships).some(s => s.id === p2.id)) return `${getPersonFullName(p1)} and ${getPersonFullName(p2)} are spouses.`;
    if (getParents(p1.id, treeData.people, treeData.relationships).some(p => p.id === p2.id)) return `${getPersonFullName(p2)} is the parent of ${getPersonFullName(p1)}.`;
    if (getChildren(p1.id, treeData.people, treeData.relationships).some(c => c.id === p2.id)) return `${getPersonFullName(p2)} is the child of ${getPersonFullName(p1)}.`;
    if (getSiblings(p1.id, treeData.people, treeData.relationships).some(s => s.id === p2.id)) return `${getPersonFullName(p1)} and ${getPersonFullName(p2)} are siblings.`;
    
    return `I can see both ${getPersonFullName(p1)} and ${getPersonFullName(p2)} in the family tree, but their exact relationship requires more complex traversal.`;
  }

  if (mentionedPeople.length === 1) {
    const p = mentionedPeople[0];
    if (q.includes('spouse') || q.includes('married') || q.includes('wife') || q.includes('husband')) {
      const spouses = getSpouses(p.id, treeData.people, treeData.relationships);
      if (spouses.length > 0) return `${getPersonFullName(p)}'s spouse(s): ${spouses.map(s => getPersonFullName(s)).join(', ')}.`;
      return `${getPersonFullName(p)} does not have any recorded spouses.`;
    }
    if (q.includes('children') || q.includes('kids') || q.includes('son') || q.includes('daughter')) {
      const children = getChildren(p.id, treeData.people, treeData.relationships);
      if (children.length > 0) return `${getPersonFullName(p)}'s children: ${children.map(c => getPersonFullName(c)).join(', ')}.`;
      return `${getPersonFullName(p)} does not have any recorded children.`;
    }
    if (q.includes('parents') || q.includes('mother') || q.includes('father')) {
      const parents = getParents(p.id, treeData.people, treeData.relationships);
      if (parents.length > 0) return `${getPersonFullName(p)}'s parents: ${parents.map(c => getPersonFullName(c)).join(', ')}.`;
      return `${getPersonFullName(p)} does not have any recorded parents.`;
    }
    if (q.includes('maiden') || q.includes('nee') || q.includes('née')) {
      if (p.maidenName) return `${getPersonFullName(p)}'s maiden name is ${p.maidenName}.`;
      return `There is no maiden name recorded for ${getPersonFullName(p)}.`;
    }
    
    // Bio / milestones
    const dates = `${p.birthDate || 'Unknown'} to ${p.deathDate || (!isDeceased(p) ? 'Present' : 'Unknown')}`;
    let bioStr = `${getPersonFullName(p)} (${dates}).`;
    if (p.gender) bioStr += ` Gender: ${p.gender === 'male' ? 'Male (♂)' : p.gender === 'female' ? 'Female (♀)' : 'Other'}.`;
    if (p.maidenName) bioStr += ` Maiden name: ${p.maidenName}.`;
    if (p.birthPlace) bioStr += ` Born in ${p.birthPlace}.`;
    
    const occupation = p.customFields ? Object.entries(p.customFields).find(([k, v]) => k.toLowerCase() === 'occupation')?.[1] : undefined;
    if (occupation) bioStr += ` Occupation: ${occupation}.`;
    
    if (p.bio) bioStr += ` Bio: ${p.bio}`;
    
    const milestones = p.milestones;
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      bioStr += ` Milestones: ${milestones.map((m) => `${m.description} (${m.date})`).join(', ')}.`;
    }
    return bioStr;
  }

  // Fallback
  return `I am your family historian for the "${treeData.tree.name}" tree, which currently has ${treeData.people.length} members. You can ask me about specific relatives (like "tell me about John"), relationships ("who is Mary's spouse"), or statistics ("who is the oldest person").`;
}
